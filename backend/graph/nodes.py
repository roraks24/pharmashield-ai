"""LangGraph processing nodes for the complaint intake workflow.

Each node is a pure function that receives the shared graph state,
performs one well-defined responsibility, and returns a partial state
update.  This design makes the workflow easy to test, explain, and
extend — a key interview talking point.

Node pipeline:
  extract → validate → completeness → risk → summarize
"""
import json
import logging
from typing import Dict, Any

from groq import Groq

from config import settings
from graph.state import ComplaintGraphState
from utils.helpers import parse_json_from_llm

logger = logging.getLogger(__name__)

# Lazy-initialised Groq client
_client: Groq | None = None


def _get_client() -> Groq:
    """Return a shared Groq client, raising clearly if the key is missing."""
    global _client
    if _client is None:
        if not settings.groq_api_key:
            raise RuntimeError(
                "GROQ_API_KEY is not set. Add it to your .env file."
            )
        _client = Groq(api_key=settings.groq_api_key)
    return _client


import time

def _call_groq(
    system_prompt: str,
    user_prompt: str,
    *,
    json_mode: bool = True,
    temperature: float = 0.1,
    max_tokens: int = 600,
) -> str:
    """Centralised helper for Groq API calls with rate-limit backoff and automatic model failover."""
    client = _get_client()
    kwargs: Dict[str, Any] = dict(
        model=settings.model_name,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=temperature,
        max_tokens=max_tokens,
    )
    if json_mode:
        kwargs["response_format"] = {"type": "json_object"}

    # Candidate models for failover
    candidates = [settings.model_name, "qwen/qwen3.8-27b", "openai/gpt-oss-20b"]
    # Preserve order while eliminating duplicates
    unique_candidates = []
    for c in candidates:
        if c not in unique_candidates:
            unique_candidates.append(c)

    last_exception = None
    for model_name in unique_candidates:
        kwargs["model"] = model_name
        for attempt in range(2):
            try:
                response = client.chat.completions.create(**kwargs)
                return response.choices[0].message.content
            except Exception as exc:
                last_exception = exc
                err_text = str(exc)
                if "model_decommissioned" in err_text or "decommissioned" in err_text:
                    logger.warning("Model %s is decommissioned, switching to next candidate", model_name)
                    break  # Move to next candidate model
                if "429" in err_text or "rate_limit" in err_text:
                    wait_time = 1.5 * (attempt + 1)
                    logger.warning("Rate limit hit on %s (attempt %d). Backing off %.1fs...", model_name, attempt + 1, wait_time)
                    time.sleep(wait_time)
                    continue  # Retry with backoff
                # For any other fatal exception, break to next candidate
                logger.error("Error invoking model %s: %s", model_name, exc)
                break

    if last_exception:
        raise last_exception
    raise RuntimeError("All LLM model candidates exhausted.")



# ── Node 1: Extract ──────────────────────────────────────────────

EXTRACTION_SYSTEM = (
    "You are a precise pharmaceutical complaint data extraction assistant. "
    "Extract structured data from raw complaint text. "
    "Return ONLY valid JSON. Use null for fields not found in the text. "
    "Never invent information that is not present."
)

EXTRACTION_PROMPT = """Extract the following fields from this pharmaceutical complaint.
Return a JSON object with exactly these keys:

{{
  "complaint_source": "Email | portal | phone | document | other",
  "customer_name": "company or person name, or null",
  "customer_contact": "email, phone, or reference, or null",
  "product_name": "product / API / FDF name, or null",
  "product_strength_grade": "strength, grade, or specification, or null",
  "batch_number": "batch or lot reference, or null",
  "manufacturing_date": "YYYY-MM-DD or null",
  "expiry_date": "YYYY-MM-DD or null",
  "quantity_affected": "quantity with unit, or null",
  "complaint_type": "Foreign Matter | Contamination | Packaging/Labeling | Potency/Efficacy | Stability | Adverse Reaction | Documentation | Other",
  "complaint_date": "YYYY-MM-DD or null",
  "description": "detailed complaint narrative (required)"
}}

COMPLAINT TEXT:
---
{text}
---"""


def extract_complaint(state: ComplaintGraphState) -> dict:
    """Node 1 — Extract structured complaint fields from raw text via LLM."""
    try:
        raw = _call_groq(
            EXTRACTION_SYSTEM,
            EXTRACTION_PROMPT.format(text=state["raw_text"]),
        )
        extracted = parse_json_from_llm(raw)

        # Guarantee required fields
        if not extracted.get("description"):
            extracted["description"] = state["raw_text"]
        if not extracted.get("complaint_source"):
            extracted["complaint_source"] = "other"

        return {"extracted_complaint": extracted}

    except Exception as exc:
        logger.error("extract_complaint failed: %s", exc)
        return {
            "extracted_complaint": {
                "description": state["raw_text"],
                "complaint_source": "other",
            },
            "errors": state.get("errors", []) + [f"Extraction failed: {exc}"],
        }


# ── Node 2: Validate ─────────────────────────────────────────────

_VALID_COMPLAINT_TYPES = {
    "Foreign Matter", "Contamination", "Packaging/Labeling",
    "Potency/Efficacy", "Stability", "Adverse Reaction",
    "Documentation", "Other",
}

_VALID_SEVERITIES = {"LOW", "MEDIUM", "HIGH", "CRITICAL"}


def validate_fields(state: ComplaintGraphState) -> dict:
    """Node 2 — Normalize and validate extracted fields."""
    extracted = state.get("extracted_complaint")
    if not extracted:
        return {"validated_complaint": {}, "errors": state.get("errors", []) + ["No extraction data to validate"]}

    validated = dict(extracted)

    # Normalise complaint_type
    ct = validated.get("complaint_type", "")
    if ct and ct not in _VALID_COMPLAINT_TYPES:
        # Best-effort fuzzy match
        for valid in _VALID_COMPLAINT_TYPES:
            if valid.lower() in ct.lower() or ct.lower() in valid.lower():
                validated["complaint_type"] = valid
                break
        else:
            validated["complaint_type"] = "Other"

    # Normalise severity if present
    sev = validated.get("severity", "")
    if sev and sev.upper() not in _VALID_SEVERITIES:
        validated["severity"] = None

    # Strip "null" strings that LLMs sometimes produce
    for key, val in list(validated.items()):
        if isinstance(val, str) and val.strip().lower() == "null":
            validated[key] = None

    return {"validated_complaint": validated}


# ── Node 3: Completeness ─────────────────────────────────────────

CRITICAL_FIELD_WEIGHT = 20
IMPORTANT_FIELD_WEIGHT = 8

_CRITICAL_FIELDS = ["product_name", "batch_number", "description"]
_IMPORTANT_FIELDS = [
    "customer_name", "complaint_type", "quantity_affected",
    "manufacturing_date", "expiry_date",
]


def check_completeness(state: ComplaintGraphState) -> dict:
    """Node 3 — Score how complete the complaint record is based on critical and important QA fields."""
    validated = state.get("validated_complaint", {})
    if not validated:
        return {"completeness_result": {"score": 0, "missing_fields": ["all"]}}

    missing: list[str] = []
    score = 100

    for f in _CRITICAL_FIELDS:
        if not validated.get(f):
            missing.append(f)
            score -= CRITICAL_FIELD_WEIGHT

    for f in _IMPORTANT_FIELDS:
        if not validated.get(f):
            missing.append(f)
            score -= IMPORTANT_FIELD_WEIGHT

    score = max(0, score)

    return {
        "completeness_result": {
            "score": score,
            "missing_fields": missing,
        }
    }



# ── Node 4: Risk Assessment ──────────────────────────────────────

RISK_SYSTEM = (
    "You are a pharmaceutical quality assurance expert. "
    "Assess complaint risk based on patient safety impact, product quality, "
    "and regulatory implications. Always cite evidence from the complaint. "
    "Use cautious language — these are suggestions, not final decisions."
)

RISK_PROMPT = """Assess the risk of this pharmaceutical complaint.

Return a JSON object with exactly these keys:
{{
  "risk_level": "LOW | MEDIUM | HIGH | CRITICAL",
  "risk_reason": "concise rationale citing complaint facts",
  "recommended_next_action": "suggested immediate next step",
  "root_cause_hypotheses": ["hypothesis 1", "hypothesis 2"],
  "capa_recommendations": ["action 1", "action 2"]
}}

COMPLAINT DATA:
{data}

COMPLETENESS INFO:
{completeness}"""


def assess_risk(state: ComplaintGraphState) -> dict:
    """Node 4 — AI risk assessment with root-cause and CAPA suggestions."""
    try:
        raw = _call_groq(
            RISK_SYSTEM,
            RISK_PROMPT.format(
                data=json.dumps(state.get("validated_complaint", {}), default=str),
                completeness=json.dumps(state.get("completeness_result", {}), default=str),
            ),
        )
        assessment = parse_json_from_llm(raw)
        return {"risk_assessment": assessment}

    except Exception as exc:
        logger.error("assess_risk failed: %s", exc)
        return {
            "risk_assessment": {
                "risk_level": "MEDIUM",
                "risk_reason": "Unable to perform AI assessment — manual review recommended.",
                "recommended_next_action": "Manual review by QA team",
                "root_cause_hypotheses": [],
                "capa_recommendations": [],
            },
            "errors": state.get("errors", []) + [f"Risk assessment failed: {exc}"],
        }


# ── Node 5: Summarize ────────────────────────────────────────────

SUMMARY_SYSTEM = (
    "You are a concise technical writer for pharmaceutical quality records."
)

SUMMARY_PROMPT = """Write a 2-3 sentence reviewer summary of this complaint.
Include: who reported it, what product/batch is affected, the core issue,
and the suggested risk level.

COMPLAINT: {data}
RISK: {risk}

Return plain text only — no JSON, no markdown."""


def summarize(state: ComplaintGraphState) -> dict:
    """Node 5 — Generate a concise reviewer-facing summary."""
    try:
        raw = _call_groq(
            SUMMARY_SYSTEM,
            SUMMARY_PROMPT.format(
                data=json.dumps(state.get("validated_complaint", {}), default=str),
                risk=json.dumps(state.get("risk_assessment", {}), default=str),
            ),
            json_mode=False,
            temperature=0.3,
        )
        return {"summary": raw.strip()}

    except Exception as exc:
        logger.error("summarize failed: %s", exc)
        return {
            "summary": "Summary generation failed — please review complaint details manually.",
            "errors": state.get("errors", []) + [f"Summarization failed: {exc}"],
        }
