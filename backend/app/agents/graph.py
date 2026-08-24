"""
LangGraph Workflow Orchestrator.
Defines the state and nodes for conversational symptom triage.
"""

from typing import TypedDict, List, Dict, Any, Optional
from langgraph.graph import StateGraph, START, END

from app.agents.triage_agent import run_triage_agent


# ─── Graph State Definition ──────────────────────────────────────────────────

class AgentState(TypedDict):
    # History of messages: List of {"sender": "user"|"agent", "content": "..."}
    messages: List[Dict[str, str]]
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
    result = await run_triage_agent(state["messages"])
    return {
        "needs_more_info": result["needs_more_info"],
        "is_emergency": result["is_emergency"],
        "symptoms": result["symptoms"],
        "question": result.get("question"),
        "options": result.get("options"),
    }


# ─── Graph Compilation ────────────────────────────────────────────────────────

# Define graph builder
workflow = StateGraph(AgentState)

# Add node
workflow.add_node("triage", triage_node)

# Add edges
workflow.add_edge(START, "triage")
workflow.add_edge("triage", END)

# Compile graph
triage_graph = workflow.compile()


# ─── Entry Point Helper ──────────────────────────────────────────────────────

async def execute_triage(messages: List[Dict[str, str]]) -> Dict[str, Any]:
    """Helper function to execute the triage LangGraph workflow."""
    initial_state = {
        "messages": messages,
        "needs_more_info": True,
        "is_emergency": False,
        "symptoms": [],
        "question": None,
        "options": None,
    }
    
    # Run graph asynchronously
    final_state = await triage_graph.ainvoke(initial_state)
    return final_state
