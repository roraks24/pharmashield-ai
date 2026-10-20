"""Routes for the AI Copilot.

POST /api/copilot/analyze  — Run the full LangGraph intake workflow via ComplaintService.
POST /api/copilot/message   — Conversational copilot with agentic intent routing (Log, Edit, Chat).
"""
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from typing import Optional, Dict, Any
import json
import logging
from sqlalchemy.ext.asyncio import AsyncSession

from models import AnalyzeResponse, CopilotMessageResponse
from services.document_parser import parse_document
from services.complaint_service import ComplaintService
from graph.nodes import _call_groq
from utils.helpers import parse_json_from_llm
from database import get_db

logger = logging.getLogger(__name__)
router = APIRouter()


# ── Analyze endpoint ──────────────────────────────────────────────

@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_complaint(
    text: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db),
):
    """Analyze complaint text or uploaded document through the centralized LangGraph pipeline.

    Accepts either raw text via form field or a file upload (.pdf, .txt).
    Returns extracted complaint fields plus AI analysis (risk, completeness,
    summary, root-cause hypotheses, CAPA recommendations).
    """
    if not text and not file:
        raise HTTPException(
            status_code=400,
            detail="Provide either complaint text or a file upload.",
        )

    raw_text = text
    if file:
        raw_text = await parse_document(file)

    if not raw_text or not raw_text.strip():
        raise HTTPException(
            status_code=400,
            detail="Could not extract any text from the provided input.",
        )

    try:
        extracted_data, analysis = await ComplaintService.execute_intake_pipeline(db, raw_text)
        return AnalyzeResponse(complaint=extracted_data, analysis=analysis)
    except Exception as exc:
        logger.error("AI analysis pipeline failed: %s", exc)
        raise HTTPException(
            status_code=500,
            detail=f"AI analysis pipeline failed: {exc}",
        )


# ── Copilot Agentic Intent Router System Prompt ───────────────────

COPILOT_ROUTER_SYSTEM = """\
You are the AI Assistant for PharmaShield AI, an autonomous pharmaceutical complaint management and pharmacovigilance intelligence system.
Your job is to analyze the user's message and the current complaint context, and decide which action to take:

1. "UPDATE_COMPLAINT": The user is updating, correcting, or providing specific values for fields in the current complaint form.
Examples:
- "Sorry, the batch number is BMX24602 and the affected quantity is 48 capsules."
- "Sorry, the batch number is CHG260712A and affected quantity is 50 kg 2 HDPE drums."
- "The customer email is qa@apollo.com and set priority to High."
- "Actually the expiry date is 2026-12-31."
- "Change severity to Critical."
Extract the updated fields into the "updated_fields" object.
Valid field names:
- "complaint_source": one of ("Email", "Portal", "Phone", "Document", "Other")
- "customer_name": string
- "customer_contact": string
- "product_name": string
- "product_strength_grade": string
- "batch_number": string
- "manufacturing_date": "YYYY-MM-DD" or null
- "expiry_date": "YYYY-MM-DD" or null
- "quantity_affected": string
- "complaint_type": one of ("Product Quality / Physical Appearance", "Foreign Matter", "Contamination", "Packaging/Labeling", "Potency/Efficacy", "Stability", "Adverse Reaction", "Documentation", "Other")
- "complaint_date": "YYYY-MM-DD" or null
- "description": string
- "severity": one of ("LOW", "MEDIUM", "HIGH", "CRITICAL")
- "priority": one of ("LOW", "MEDIUM", "HIGH", "URGENT")
- "status": one of ("Draft", "Open", "Under Review", "Closed")

2. "LOG_COMPLAINT": The user is reporting, describing, or logging a customer complaint narrative.
Examples:
- "Apollo Pharmacy reported discolored capsules in Amoxicillin capsules 500 mg."
- "Received an email from Apex Healthcare about leaking vials in Ceftriaxone 1g injection, batch CF2024."
- "Customer found black particles in Metformin API."

3. "GENERAL_CHAT": The user is asking a question about QA procedures, root cause analysis, CAPA guidelines, risk classification, or general pharma quality topics without modifying form fields.

Return ONLY a JSON object with this exact structure:
{
  "action": "UPDATE_COMPLAINT" | "LOG_COMPLAINT" | "GENERAL_CHAT",
  "updated_fields": { ... },
  "response": "Clear, professional assistant confirmation or answer to the user."
}
"""


# ── Modular Action Handlers ───────────────────────────────────────

def _handle_update_complaint(
    updated_fields: Dict[str, Any], assistant_response: str
) -> CopilotMessageResponse:
    """Handle Tool 2: partial natural language form field updates."""
    logger.info("Copilot updating fields: %s", list(updated_fields.keys()))
    if not assistant_response:
        field_summary = ", ".join(f"{k.replace('_', ' ').title()}: {v}" for k, v in updated_fields.items())
        assistant_response = (
            f"I have updated the complaint form with: {field_summary}. "
            "All other complaint details and risk assessment have been preserved."
        )
    return CopilotMessageResponse(
        action="UPDATE_COMPLAINT",
        response=assistant_response,
        updated_fields=updated_fields,
    )


async def _handle_log_complaint(
    clean_message: str, assistant_response: str, db: AsyncSession
) -> CopilotMessageResponse:
    """Handle Tool 1: full narrative extraction via LangGraph intake pipeline."""
    logger.info("Copilot logging new complaint from chat message")
    try:
        extracted_data, analysis = await ComplaintService.execute_intake_pipeline(db, clean_message)
        customer = extracted_data.get("customer_name") or "customer"
        product = extracted_data.get("product_name") or "the specified product"
        if not assistant_response:
            assistant_response = (
                f"I have extracted the complaint details from {customer} regarding {product} "
                "and populated the form. AI Risk Assessment and completeness checks are ready for review."
            )
        return CopilotMessageResponse(
            action="LOG_COMPLAINT",
            response=assistant_response,
            complaint=extracted_data,
            analysis=analysis.model_dump(),
        )
    except Exception as exc:
        logger.error("LangGraph complaint extraction failed: %s", exc)
        return CopilotMessageResponse(
            action="GENERAL_CHAT",
            response=f"I attempted to log the complaint but encountered an error: {exc}. Please verify the input.",
        )


def _handle_general_chat(assistant_response: str) -> CopilotMessageResponse:
    """Handle general pharmaceutical QA advisory queries."""
    return CopilotMessageResponse(
        action="GENERAL_CHAT",
        response=assistant_response or "I am here to assist with your complaint management workflow.",
    )


# ── Copilot chat endpoint with Agentic Intent Router ─────────────

@router.post("/message", response_model=CopilotMessageResponse)
async def copilot_message(
    message: str = Form(...),
    complaint_context: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db),
):
    """Conversational AI Assistant with Agentic Intent Routing.

    Supports:
    - Tool 1 (Log Complaint): Parses complaint narrative, runs LangGraph pipeline, populates form + analysis.
    - Tool 2 (Edit Complaint): Natural language updates to specific form fields while preserving existing data.
    - General QA Chat: Expert quality guidance grounded in complaint context.
    """
    if not message or not message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    clean_message = message.strip()

    # Parse existing complaint context if provided
    context_dict = {}
    if complaint_context:
        try:
            context_dict = json.loads(complaint_context) if isinstance(complaint_context, str) else complaint_context
        except Exception:
            context_dict = {}

    router_user_prompt = f"""\
CURRENT COMPLAINT CONTEXT:
{json.dumps(context_dict, indent=2, default=str) if context_dict else "None (form is empty)"}

USER MESSAGE:
"{clean_message}"
"""

    try:
        raw_router_response = _call_groq(
            system_prompt=COPILOT_ROUTER_SYSTEM,
            user_prompt=router_user_prompt,
            json_mode=True,
            temperature=0.1,
        )
        router_result = parse_json_from_llm(raw_router_response)
    except Exception as exc:
        logger.error("Intent router failed: %s", exc)
        router_result = {"action": "GENERAL_CHAT", "response": "I encountered an error analyzing your request."}

    action = router_result.get("action", "GENERAL_CHAT")
    updated_fields = router_result.get("updated_fields") or {}
    assistant_response = router_result.get("response") or ""

    # Dispatch to dedicated modular handlers
    if action == "UPDATE_COMPLAINT" and updated_fields:
        return _handle_update_complaint(updated_fields, assistant_response)

    if action == "LOG_COMPLAINT":
        return await _handle_log_complaint(clean_message, assistant_response, db)

    return _handle_general_chat(assistant_response)


