"""Pydantic models for AI Analysis."""
from pydantic import BaseModel, Field
from typing import Optional, List
from models.complaint import SeverityEnum

class AnalysisResult(BaseModel):
    """AI analysis output."""
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

class AnalyzeRequest(BaseModel):
    """Input to analyze endpoint."""
    text: Optional[str] = None

class AnalyzeResponse(BaseModel):
    """Combines complaint extraction + analysis."""
    complaint: dict
    analysis: AnalysisResult
