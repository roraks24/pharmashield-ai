"""LangGraph construction and compilation."""
from langgraph.graph import StateGraph, END
from graph.state import ComplaintGraphState
from graph.nodes import (
    extract_complaint,
    validate_fields,
    check_completeness,
    assess_risk,
    summarize
)

def build_graph():
    """Build and compile the complaint processing graph."""
    workflow = StateGraph(ComplaintGraphState)
    
    workflow.add_node("extract", extract_complaint)
    workflow.add_node("validate", validate_fields)
    workflow.add_node("completeness", check_completeness)
    workflow.add_node("risk", assess_risk)
    workflow.add_node("summarize", summarize)
    
    workflow.set_entry_point("extract")
    
    workflow.add_edge("extract", "validate")
    workflow.add_edge("validate", "completeness")
    workflow.add_edge("completeness", "risk")
    workflow.add_edge("risk", "summarize")
    workflow.add_edge("summarize", END)
    
    return workflow.compile()

graph = build_graph()
