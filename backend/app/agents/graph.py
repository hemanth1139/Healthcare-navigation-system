"""
LangGraph Workflow Orchestrator for Conversational Symptom Triage.
Manages triage state, patient context passing, and follow-up generation.
"""

from typing import TypedDict, List, Dict, Any, Optional
from langgraph.graph import StateGraph, START, END

from app.agents.triage_agent import run_triage_agent


# ─── Graph State Definition ──────────────────────────────────────────────────

class AgentState(TypedDict):
    # History of messages: List of {"sender": "user"|"assistant", "content": "..."}
    messages: List[Dict[str, str]]
    # Patient background context summary
    patient_context: str
    # Output variables
    needs_more_info: bool
    is_emergency: bool
    symptoms: List[str]
    # Follow-up question properties
    question: Optional[str]
    options: Optional[List[Dict[str, str]]]


# ─── Node Implementations ────────────────────────────────────────────────────

async def triage_node(state: AgentState) -> Dict[str, Any]:
    """Triage node execution — evaluates symptom details and asks follow-ups."""
    result = await run_triage_agent(
        messages=state["messages"],
        patient_context_summary=state.get("patient_context", "")
    )
    return {
        "needs_more_info": result["needs_more_info"],
        "is_emergency": result["is_emergency"],
        "symptoms": result["symptoms"],
        "question": result.get("question"),
        "options": result.get("options"),
    }


# ─── Graph Compilation ────────────────────────────────────────────────────────

workflow = StateGraph(AgentState)
workflow.add_node("triage", triage_node)
workflow.add_edge(START, "triage")
workflow.add_edge("triage", END)

triage_graph = workflow.compile()


# ─── Entry Point Helper ──────────────────────────────────────────────────────

async def execute_triage(
    messages: List[Dict[str, str]],
    patient_context: str = ""
) -> Dict[str, Any]:
    """Helper function to execute the triage LangGraph workflow."""
    initial_state: AgentState = {
        "messages": messages,
        "patient_context": patient_context,
        "needs_more_info": True,
        "is_emergency": False,
        "symptoms": [],
        "question": None,
        "options": None,
    }
    final_state = await triage_graph.ainvoke(initial_state)
    return final_state
