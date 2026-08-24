"""
Conversational Triage Agent — parses message history to ask follow-up questions
or extract symptoms once sufficient details are gathered.
Supports automated mock fallback if GOOGLE_API_KEY is not configured.
"""

import json
from typing import Dict, Any, List, Optional
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

from app.config import settings
from app.schemas.conversation import FollowUpQuestion, QuickReplyOption

# ─── Mock Fallback Templates ─────────────────────────────────────────────────
MOCK_TRIAGE_STEPS = [
    {
        "trigger_keywords": [], # Default fallback first step
        "question": "Can you describe when this started, and where exactly you feel the pain or discomfort?",
        "options": None,
    },
    {
        "trigger_keywords": ["chest", "pain", "tightness", "breath"],
        "question": "Does the chest pain radiate to your left arm, neck, or jaw?",
        "options": [
            {"id": "yes", "label": "Yes, it radiates", "value": "yes"},
            {"id": "no", "label": "No, it stays in chest", "value": "no"},
        ],
    },
    {
        "trigger_keywords": ["fever", "cough", "headache", "throat"],
        "question": "Do you also have body aches, chills, or difficulty swallowing?",
        "options": [
            {"id": "yes", "label": "Yes, body aches & chills", "value": "yes"},
            {"id": "no", "label": "No other symptoms", "value": "no"},
        ],
    }
]


def _get_mock_response(history_len: int, last_message: str) -> Dict[str, Any]:
    """Generates mock triage responses for development testing."""
    last_msg_lower = last_message.lower()
    
    # Check for mock emergency trigger
    is_emergency = False
    if "emergency" in last_msg_lower or "crushing" in last_msg_lower:
        is_emergency = True

    # Check if we should conclude triage (simulate after ~3-4 turns)
    if history_len >= 5 and not is_emergency:
        # Extract keywords as mock symptoms
        detected_symptoms = ["fever", "cough"]
        if "chest" in last_msg_lower or "heart" in last_msg_lower:
            detected_symptoms = ["chest_pain", "shortness_of_breath"]
        elif "stomach" in last_msg_lower or "abdominal" in last_msg_lower:
            detected_symptoms = ["abdominal_pain", "nausea"]
        
        return {
            "needs_more_info": False,
            "is_emergency": False,
            "symptoms": detected_symptoms,
            "question": None,
            "options": None,
        }

    # Match triage steps based on keywords
    for step in MOCK_TRIAGE_STEPS:
        if any(kw in last_msg_lower for kw in step["trigger_keywords"]) or is_emergency:
            return {
                "needs_more_info": False if is_emergency else True,
                "is_emergency": is_emergency,
                "symptoms": [],
                "question": "🚨 Emergency detected. Please seek immediate care." if is_emergency else step["question"],
                "options": None if is_emergency else step["options"],
            }
            
    # Default fallback first question
    default_step = MOCK_TRIAGE_STEPS[0]
    return {
        "needs_more_info": False if is_emergency else True,
        "is_emergency": is_emergency,
        "symptoms": [],
        "question": "🚨 Emergency detected. Please seek immediate care." if is_emergency else default_step["question"],
        "options": None if is_emergency else default_step["options"],
    }


# ─── LLM Triage Execution ───────────────────────────────────────────────────

SYSTEM_PROMPT = """You are an expert AI Triage Assistant. Your role is to assess patient symptoms.
Analyze the conversation history and the patient's latest message.

Step 1: Check for IMMEDIATE emergency signs (e.g., crushing chest pain, sudden severe shortness of breath, loss of speech, facial drooping).
If an emergency is detected, set "is_emergency" to true, output an urgent warning, and set "needs_more_info" to false.

Step 2: If it is not an emergency, evaluate if you have gathered enough clinical context to predict possible conditions.
You need to know:
- The main symptom (location, description).
- Onset and duration (when it started, is it constant or intermittent).
- Severity (scale of 1-10, or mild/moderate/severe).
- Associated symptoms (fever, nausea, etc.).

Step 3: If you need more details, set "needs_more_info" to true, and generate a single relevant follow-up question.
Provide quick reply options if applicable (especially for yes/no or scale questions).

Step 4: If you have sufficient details (usually after 3-4 turns), set "needs_more_info" to false and extract a clean python-list of key symptoms (e.g. ["fever", "dry_cough", "mild_chest_tightness"]).

You MUST respond strictly in the following JSON format:
{
  "needs_more_info": true/false,
  "is_emergency": true/false,
  "question": "Your next single follow-up question here",
  "options": [{"id": "opt1", "label": "Yes", "value": "yes"}, ...] or null,
  "symptoms": ["extracted_symptom_1", "extracted_symptom_2"] or []
}
"""

async def run_triage_agent(messages: List[Dict[str, str]]) -> Dict[str, Any]:
    """
    Analyzes conversation history and decides on the next triage step.
    Returns: Dict containing needs_more_info, is_emergency, question, options, and symptoms.
    """
    last_msg = messages[-1]["content"] if messages else ""
    
    if not settings.GOOGLE_API_KEY:
        # Fallback to Mock Response in development when API key is missing
        print("[WARN] GOOGLE_API_KEY not configured. Using Mock Triage Agent.")
        return _get_mock_response(len(messages), last_msg)

    # Lazy import to avoid loading Google SDK if not needed
    from langchain_google_genai import ChatGoogleGenerativeAI
    
    try:
        llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            temperature=0.1,
            google_api_key=settings.GOOGLE_API_KEY,
        )
        
        # Prepare LangChain messages
        lc_messages = [SystemMessage(content=SYSTEM_PROMPT)]
        for msg in messages:
            if msg["sender"] == "user":
                lc_messages.append(HumanMessage(content=msg["content"]))
            else:
                lc_messages.append(AIMessage(content=msg["content"]))

        # Execute call
        response = await llm.ainvoke(lc_messages)
        res_text = response.content.strip()
        
        # Parse JSON block from LLM response
        if "```json" in res_text:
            res_text = res_text.split("```json")[1].split("```")[0].strip()
        elif "```" in res_text:
            res_text = res_text.split("```")[1].split("```")[0].strip()
            
        data = json.loads(res_text)
        return {
            "needs_more_info": data.get("needs_more_info", True),
            "is_emergency": data.get("is_emergency", False),
            "question": data.get("question"),
            "options": data.get("options"),
            "symptoms": data.get("symptoms", []),
        }
    except Exception as e:
        print(f"[ERROR] Error running LLM Triage: {e}. Falling back to mock responses.")
        return _get_mock_response(len(messages), last_msg)
