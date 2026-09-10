"""LangGraph state definition."""
from typing import TypedDict, Optional, List, Dict, Any

class ComplaintGraphState(TypedDict):
    """Shared state for the complaint processing graph."""
    raw_text: str
    extracted_complaint: Optional[Dict[str, Any]]
    validated_complaint: Optional[Dict[str, Any]]
    completeness_result: Optional[Dict[str, Any]]
    risk_assessment: Optional[Dict[str, Any]]
    summary: Optional[str]
    errors: List[str]
