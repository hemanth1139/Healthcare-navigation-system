"""
Conversational Triage Agent — powered by Gemini 2.5 Flash with Patient Context.
Collects symptom onset, duration, location, severity, radiation, and associated signs.
Enforces cumulative symptom tracking and immediate emergency escalation for acute red flags.
"""

import re
import json
from typing import Dict, Any, List, Optional
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

from app.config import settings
from app.ml.rule_based_predictor import extract_cumulative_symptoms, normalize_symptom_list

# ─── Mock Fallback Flow ──────────────────────────────────────────────────────

def _get_mock_triage_response(messages: List[Dict[str, str]], patient_context: str = "") -> Dict[str, Any]:
    """Fallback conversational triage when Gemini is unavailable."""
    cumulative = extract_cumulative_symptoms(messages)
    symptoms = cumulative["all_symptoms"]
    history_text = " ".join([m.get("content", "").lower() for m in messages])

    # Emergency check with negation filtering
    emergency_kws = ["chest pain", "cannot breathe", "heart attack", "slurred speech", "facial droop", "arm numbness", "stiff neck"]
    for kw in emergency_kws:
        if kw in history_text:
            if not re.search(rf"\b(?:no|not|denies|without|don't have|never had|don't think i have)\b[^\.\n]*\b{re.escape(kw)}\b", history_text):
                return {
                    "needs_more_info": False,
                    "is_emergency": True,
                    "question": "🚨 Emergency signs detected. Please call emergency services (108 / 112) or go to the nearest hospital immediately.",
                    "options": None,
                    "symptoms": symptoms or ["chest_pain"],
                }

    # Multi-turn progression
    user_turns = sum(1 for m in messages if m.get("sender") == "user")
    if user_turns <= 1:
        return {
            "needs_more_info": True,
            "is_emergency": False,
            "question": "When did these symptoms begin, and how severe does the discomfort feel right now?",
            "options": [
                {"id": "opt1", "label": "Just started today (Mild)", "value": "Started today, mild"},
                {"id": "opt2", "label": "2-3 days ago (Moderate)", "value": "Started 2-3 days ago, moderate"},
                {"id": "opt3", "label": "More than 5 days (Severe)", "value": "Persistent for over 5 days, severe"},
            ],
            "symptoms": symptoms,
        }
    elif user_turns == 2:
        return {
            "needs_more_info": True,
            "is_emergency": False,
            "question": "Are you experiencing any other sensations like body aches, breathlessness, nausea, or sweating?",
            "options": [
                {"id": "opt1", "label": "Yes, body aches & chills", "value": "Body aches and chills"},
                {"id": "opt2", "label": "Yes, nausea or dizziness", "value": "Nausea and dizziness"},
                {"id": "opt3", "label": "No other associated symptoms", "value": "No other symptoms"},
            ],
            "symptoms": symptoms,
        }
    else:
        # Turn 3+: Conclude intake
        return {
            "needs_more_info": False,
            "is_emergency": False,
            "question": None,
            "options": None,
            "symptoms": symptoms,
        }


# ─── Gemini 2.5 Flash Triage Agent ──────────────────────────────────────────

SYSTEM_PROMPT = """You are an expert AI Clinical Triage Specialist in an AI-based Healthcare Navigation System.
Your objective is to conduct a professional, focused, multi-turn conversational intake to collect clinical details from the patient.

TRIAGE PROTOCOL:
1. EMERGENCY CHECK (CRITICAL PRIORITY):
   If the user reports immediate high-risk red flags (e.g. crushing chest pain, radiation to left arm/jaw, acute breathlessness, sudden facial droop, slurred speech, sudden loss of consciousness, or stiff neck with high fever):
   - Set "is_emergency": true
   - Set "needs_more_info": false
   - Set "question": "EMERGENCY ALERT: Your reported symptoms indicate potential acute risk requiring immediate emergency evaluation."
   - Extract the emergency symptoms in "symptoms".

2. CUMULATIVE SYMPTOM TRACKING:
   - The "symptoms" array MUST contain ONLY and ALL symptoms explicitly reported by the patient in the current conversation.
   - For example, if the patient reported symptom A in message 1, and reports symptom B in message 2, return both ["symptom_a", "symptom_b"].
   - NEVER invent symptoms that the user did not mention.
   - NEVER drop or overwrite earlier reported symptoms unless the user explicitly denies or corrects them.

3. MULTI-TURN INTAKE (OPQRST Framework):
   If NOT an emergency, evaluate if you have gathered key dimensions:
   - Onset & Duration (when it started)
   - Severity & Character (mild, moderate, severe)
   - Associated symptoms (any additional sensations reported by the user)
   
4. RELEVANT FOLLOW-UP QUESTIONS:
   - Ask ONLY ONE focused, relevant question at a time.
   - Provide 2 to 4 quick reply options where helpful.
   - 2 to 4 turns of intake are sufficient to conclude.

5. COMPLETION CHECK:
   - Once sufficient details are collected, set "needs_more_info": false and "question": null.
   - Extract a clean list of canonical symptom strings in "symptoms" in snake_case format (e.g. ["knee_pain"]).

You MUST respond strictly in valid JSON format:
{
  "needs_more_info": true/false,
  "is_emergency": true/false,
  "question": "Your single conversational follow-up question" or null,
  "options": [
    {"id": "opt1", "label": "Option 1 text", "value": "Option 1 value"},
    {"id": "opt2", "label": "Option 2 text", "value": "Option 2 value"}
  ] or null,
  "symptoms": ["symptom_1", "symptom_2"]
}
"""


async def run_triage_agent(
    messages: List[Dict[str, str]],
    patient_context_summary: str = ""
) -> Dict[str, Any]:
    """Runs the conversational triage agent using Gemini 2.5 Flash."""
    if not settings.GOOGLE_API_KEY:
        return _get_mock_triage_response(messages, patient_context_summary)

    from app.core.llm import invoke_gemini

    try:
        lc_messages = [SystemMessage(content=SYSTEM_PROMPT)]
        if patient_context_summary:
            lc_messages.append(SystemMessage(content=f"Patient Baseline Context: {patient_context_summary}"))

        for msg in messages:
            if msg.get("sender") == "user":
                lc_messages.append(HumanMessage(content=msg.get("content", "")))
            else:
                lc_messages.append(AIMessage(content=msg.get("content", "")))

        res_text = await invoke_gemini(lc_messages, temperature=0.15)

        if "```json" in res_text:
            res_text = res_text.split("```json")[1].split("```")[0].strip()
        elif "```" in res_text:
            res_text = res_text.split("```")[1].split("```")[0].strip()

        data = json.loads(res_text)
        
        extracted_symptoms = data.get("symptoms", [])
        if isinstance(extracted_symptoms, list):
            extracted_symptoms = normalize_symptom_list(extracted_symptoms)

        user_turns = sum(1 for m in messages if m.get("sender") == "user")
        is_emergency = bool(data.get("is_emergency", False))
        needs_more_info = bool(data.get("needs_more_info", True))
        if user_turns >= 3 and not is_emergency:
            needs_more_info = False

        return {
            "needs_more_info": needs_more_info,
            "is_emergency": is_emergency,
            "question": data.get("question") if needs_more_info else None,
            "options": data.get("options") if needs_more_info else None,
            "symptoms": extracted_symptoms,
        }
    except Exception as e:
        print(f"[ERROR] LLM Triage execution error: {e}. Falling back to mock flow.")
        return _get_mock_triage_response(messages, patient_context_summary)
