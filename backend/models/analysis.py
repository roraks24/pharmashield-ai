"""Pydantic models for AI Analysis and Copilot responses."""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from models.complaint import SeverityEnum

class AnalysisResult(BaseModel):
    """AI analysis output including QA risk, completeness, and CAPA recommendations."""
    complaint_id: Optional[str] = None
    summary: Optional[str] = None
    completeness_score: Optional[int] = Field(None, ge=0, le=100)
    missing_fields: Optional[List[str]] = None
    risk_level: Optional[SeverityEnum] = None
    risk_reason: Optional[str] = None
    duplicate_score: Optional[float] = None
    duplicate_reason: Optional[str] = None
    root_cause_hypotheses: Optional[List[str]] = None
    capa_recommendations: Optional[List[str]] = None
    recommended_next_action: Optional[str] = None
    confidence: Optional[float] = None

class AnalyzeResponse(BaseModel):
    """Combined response payload containing extracted complaint fields and AI analysis."""
    complaint: Dict[str, Any]
    analysis: AnalysisResult

class CopilotMessageResponse(BaseModel):
    """Structured response from the Copilot agentic message endpoint."""
    action: str = Field(..., description="Action taken: LOG_COMPLAINT, UPDATE_COMPLAINT, or GENERAL_CHAT")
    response: str = Field(..., description="Conversational reply text")
    updated_fields: Optional[Dict[str, Any]] = Field(None, description="Fields extracted for Tool 2 (edit)")
    complaint: Optional[Dict[str, Any]] = Field(None, description="Full extracted complaint for Tool 1 (log)")
    analysis: Optional[Dict[str, Any]] = Field(None, description="AI analysis dictionary for Tool 1 (log)")

