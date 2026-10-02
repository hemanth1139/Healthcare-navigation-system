"""
Conversational Triage Agent — powered by Gemini 2.5 Flash with Patient Context.
Conducts adaptive, symptom-specific conversational clinical intake.
Screens for acute red flags, tracks positive and negative findings, and dynamically adapts follow-up questions.
"""

import re
import json
from typing import Dict, Any, List, Optional
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

from app.config import settings
from app.ml.rule_based_predictor import extract_cumulative_symptoms, normalize_symptom_list

# ─── Mock Fallback Flow (Deterministic Adaptive Clinical Questionnaire) ──────

def _get_mock_triage_response(messages: List[Dict[str, str]], patient_context: str = "") -> Dict[str, Any]:
    """Adaptive conversational triage state machine when LLM is offline."""
    cumulative = extract_cumulative_symptoms(messages)
    symptoms = cumulative["all_symptoms"]
    history_text = " ".join([m.get("content", "").lower() for m in messages if m.get("sender") == "user"])

    # 1. Immediate Emergency Red-Flag Checks
    # (a) Cardiorespiratory emergency
    if ("chest pain" in history_text or "chest tightness" in history_text or "heart attack" in history_text) and not any(neg in history_text for neg in ["no chest pain", "not chest pain", "denies chest pain"]):
        if any(rad in history_text for rad in ["arm", "jaw", "neck", "breathe", "breath", "sweat", "dizzy"]):
            return {
                "needs_more_info": False,
                "is_emergency": True,
                "question": "🚨 Emergency signs detected. Please call emergency services (108 / 112) or go to the nearest emergency department immediately.",
                "options": None,
                "symptoms": symptoms or ["chest_pain"],
            }

    # (b) Neurological emergency
    if any(s in history_text for s in ["slurred speech", "facial droop", "arm weakness", "face drooping", "cannot speak", "one side weak"]):
        return {
            "needs_more_info": False,
            "is_emergency": True,
            "question": "🚨 Acute neurological signs detected. Proceed to the nearest stroke-ready hospital emergency department immediately.",
            "options": None,
            "symptoms": symptoms or ["facial_droop_weakness"],
        }

    # (c) Meningeal emergency
    if ("fever" in history_text or "temperature" in history_text) and ("stiff neck" in history_text or "neck stiffness" in history_text or "cannot bend neck" in history_text):
        return {
            "needs_more_info": False,
            "is_emergency": True,
            "question": "🚨 High fever with neck rigidity detected (potential central nervous system infection). Seek immediate emergency medical care.",
            "options": None,
            "symptoms": symptoms or ["fever", "stiff_neck"],
        }

    # (d) Septic joint emergency (Knee/joint pain + fever + hot/swollen/unable to bear weight)
    if ("knee" in history_text or "joint" in history_text) and ("fever" in history_text or "temperature" in history_text):
        if any(w in history_text for w in ["hot", "warm", "red", "cannot walk", "cannot bear weight", "swollen"]):
            return {
                "needs_more_info": False,
                "is_emergency": True,
                "question": "🚨 Urgent medical alert: Joint pain accompanied by fever and hot/swollen joint signs requires immediate emergency medical evaluation to rule out joint infection.",
                "options": None,
                "symptoms": symptoms or ["knee_pain", "fever", "joint_warmth_redness"],
            }

    # 2. Adaptive Follow-Up Questioning Based on Presenting Symptom Domain
    user_turns = sum(1 for m in messages if m.get("sender") == "user")

    # ── DOMAIN A: Knee Pain & Musculoskeletal ──
    if "knee_pain" in symptoms or "joint_pain" in symptoms or "knee" in history_text:
        # Check what dimensions have already been addressed:
        has_injury_info = any(w in history_text for w in ["fall", "fell", "twist", "injury", "sports", "accident", "hit", "trauma", "gradual", "overuse", "started without injury", "no injury", "no fall"])
        has_weight_bearing_info = any(w in history_text for w in ["bear weight", "weight", "walk", "walking", "stand", "step", "limp", "cannot bear", "can walk", "unable to walk"])
        has_inflammatory_info = any(w in history_text for w in ["swelling", "swollen", "red", "warm", "hot", "fever", "locking", "locked", "giving way", "popping", "heard a pop", "no swelling", "no redness", "no fever"])

        if not has_injury_info and user_turns <= 1:
            return {
                "needs_more_info": True,
                "is_emergency": False,
                "question": "Did this knee discomfort begin after a specific incident (like a fall, twisting injury, or sports collision), or did it develop gradually?",
                "options": [
                    {"id": "opt1", "label": "Sudden injury / fall / twist", "value": "It happened after a sudden twist or fall"},
                    {"id": "opt2", "label": "Gradual onset from walking/exercise", "value": "Started gradually after walking or exercise"},
                    {"id": "opt3", "label": "Woke up with pain / no injury", "value": "Started without any fall or injury, gradual onset"},
                ],
                "symptoms": symptoms,
            }

        if not has_weight_bearing_info and user_turns <= 2:
            return {
                "needs_more_info": True,
                "is_emergency": False,
                "question": "Are you currently able to bear full weight and walk, or are you unable to step on that leg?",
                "options": [
                    {"id": "opt1", "label": "Cannot bear weight / unable to walk", "value": "I cannot bear weight on it and cannot walk"},
                    {"id": "opt2", "label": "Can walk with mild limp", "value": "I can walk with a slight limp, bearing some weight"},
                    {"id": "opt3", "label": "Can walk normally without difficulty", "value": "I can walk and bear weight normally"},
                ],
                "symptoms": symptoms,
            }

        if not has_inflammatory_info and user_turns <= 3:
            return {
                "needs_more_info": True,
                "is_emergency": False,
                "question": "Have you noticed any visible swelling, joint warmth/redness, mechanical locking (knee getting stuck), or fever?",
                "options": [
                    {"id": "opt1", "label": "Significant swelling & joint feels warm", "value": "There is noticeable swelling and the knee feels warm to touch"},
                    {"id": "opt2", "label": "Knee clicks or locks when bending", "value": "The knee is clicking and locks when I try to straighten it"},
                    {"id": "opt3", "label": "No swelling, redness, locking, or fever", "value": "No swelling, redness, locking, or fever"},
                ],
                "symptoms": symptoms,
            }

        # Conclude Knee Intake
        return {
            "needs_more_info": False,
            "is_emergency": False,
            "question": None,
            "options": None,
            "symptoms": symptoms,
        }

    # ── DOMAIN B: Chest Discomfort / Cardiorespiratory ──
    if "chest_pain" in symptoms or "chest" in history_text:
        has_radiation = any(w in history_text for w in ["arm", "jaw", "neck", "shoulder", "back", "radiat", "no radiation", "only in chest"])
        if not has_radiation and user_turns <= 1:
            return {
                "needs_more_info": True,
                "is_emergency": False,
                "question": "Does this chest discomfort spread anywhere else (such as your left arm, jaw, neck, or back), and do you feel breathless or sweaty?",
                "options": [
                    {"id": "opt1", "label": "Radiating to left arm / jaw", "value": "Yes, radiating to left arm and jaw"},
                    {"id": "opt2", "label": "Shortness of breath & sweating", "value": "I have shortness of breath and sweating"},
                    {"id": "opt3", "label": "Localized to chest / burning sensation", "value": "No radiation, feels like localized burning after eating"},
                ],
                "symptoms": symptoms,
            }

        return {
            "needs_more_info": False,
            "is_emergency": False,
            "question": None,
            "options": None,
            "symptoms": symptoms,
        }

    # ── DOMAIN C: Headache / Neurological ──
    if "headache" in symptoms or "head" in history_text:
        has_red_flags = any(w in history_text for w in ["stiff neck", "neck", "fever", "thunderclap", "sudden", "vomiting", "vision", "no neck pain", "no fever"])
        if not has_red_flags and user_turns <= 1:
            return {
                "needs_more_info": True,
                "is_emergency": False,
                "question": "Did this headache come on suddenly like a thunderclap, or is it accompanied by neck stiffness, fever, or nausea?",
                "options": [
                    {"id": "opt1", "label": "Sudden severe / worst headache ever", "value": "Sudden severe explosive headache"},
                    {"id": "opt2", "label": "Accompanied by stiff neck and fever", "value": "Accompanied by stiff neck and high fever"},
                    {"id": "opt3", "label": "Throbbing with nausea / light sensitivity", "value": "Throbbing temple pain with nausea"},
                    {"id": "opt4", "label": "Dull ache, no fever or neck stiffness", "value": "Dull band-like ache, no fever or neck stiffness"},
                ],
                "symptoms": symptoms,
            }

        return {
            "needs_more_info": False,
            "is_emergency": False,
            "question": None,
            "options": None,
            "symptoms": symptoms,
        }

    # ── DOMAIN D: Fever / Systemic ──
    if "fever" in symptoms or "temperature" in history_text:
        has_fever_focus = any(w in history_text for w in ["cough", "throat", "urine", "burning", "rash", "rigors", "shivering", "stomach", "body aches"])
        if not has_fever_focus and user_turns <= 1:
            return {
                "needs_more_info": True,
                "is_emergency": False,
                "question": "Besides the fever, do you have a cough, sore throat, burning when urinating, or severe shivering with chills?",
                "options": [
                    {"id": "opt1", "label": "Sore throat & body aches", "value": "Sore throat and body aches"},
                    {"id": "opt2", "label": "Cough & breathlessness", "value": "Cough and breathlessness"},
                    {"id": "opt3", "label": "Burning during urination", "value": "Burning sensation during urination"},
                    {"id": "opt4", "label": "Generalized fatigue and chills only", "value": "Generalized fatigue and chills only"},
                ],
                "symptoms": symptoms,
            }

        return {
            "needs_more_info": False,
            "is_emergency": False,
            "question": None,
            "options": None,
            "symptoms": symptoms,
        }

    # ── DOMAIN E: General / Default Flow ──
    if user_turns <= 1:
        return {
            "needs_more_info": True,
            "is_emergency": False,
            "question": "When did these symptoms begin, and how severe is the discomfort right now?",
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
            "question": "Are you experiencing any other associated sensations like fever, nausea, or localized pain?",
            "options": [
                {"id": "opt1", "label": "Yes, fever & chills", "value": "Fever and chills"},
                {"id": "opt2", "label": "Yes, nausea or body aches", "value": "Nausea and body aches"},
                {"id": "opt3", "label": "No other associated symptoms", "value": "No other symptoms"},
            ],
            "symptoms": symptoms,
        }
    else:
        return {
            "needs_more_info": False,
            "is_emergency": False,
            "question": None,
            "options": None,
            "symptoms": symptoms,
        }


# ─── Gemini 2.5 Flash Triage Agent ──────────────────────────────────────────

SYSTEM_PROMPT = """You are an expert Clinical Triage Specialist in an AI-based Healthcare Navigation System.
Your objective is to conduct an adaptive, symptom-specific, multi-turn clinical intake.

CLINICAL INTAKE PROTOCOLS:

1. EMERGENCY RED FLAG EVALUATION (IMMEDIATE ESCALATION):
   - Cardiorespiratory: Crushing chest pain radiating to left arm/jaw, severe dyspnea, diaphoresis.
   - Neurological: Acute facial droop, slurred speech, hemiparesis, sudden thunderclap headache.
   - Meningeal: High fever + rigid stiff neck + altered sensorium.
   - Septic Joint: Severe joint pain + high fever + hot/erythematous joint or acute inability to move joint.
   If ANY emergency red flag is present:
   - Set "is_emergency": true, "needs_more_info": false.
   - Set "question": "EMERGENCY ALERT: Immediate clinical evaluation is required."
   - Extract the identified emergency symptoms in "symptoms".

2. ADAPTIVE DOMAIN-SPECIFIC QUESTIONING:
   - FOR KNEE PAIN / JOINT COMPLAINTS:
     * Screen: 1) Onset & injury mechanism (twist, fall, sports vs gradual wear).
     * Screen: 2) Weight-bearing ability & ambulation (can bear weight vs cannot walk/stand).
     * Screen: 3) Red flags & mechanical signs (joint swelling, warmth/redness, fever, locking, deformity).
     * DO NOT ask fixed generic questions. Ask only about dimensions not yet provided.
   - FOR HEADACHE: Screen for sudden onset, neck stiffness, fever, visual changes.
   - FOR CHEST PAIN: Screen for radiation, breathlessness, relation to exertion vs food.
   - FOR FEVER: Screen for respiratory, urinary, GI, or joint focus.

3. EXPLICIT FINDINGS SEPARATION:
   - In "symptoms", include all positive canonical symptoms confirmed by the user.
   - DO NOT assume missing information is negative.

4. COMPLETION:
   - When sufficient information has been collected across the key triage dimensions, or if an urgent finding is confirmed, set "needs_more_info": false and "question": null.

Respond in JSON format:
{
  "needs_more_info": true/false,
  "is_emergency": true/false,
  "question": "Single adaptive follow-up question" or null,
  "options": [
    {"id": "opt1", "label": "Option 1 label", "value": "Option 1 text"},
    {"id": "opt2", "label": "Option 2 label", "value": "Option 2 text"}
  ] or null,
  "symptoms": ["canonical_symptom_1", "canonical_symptom_2"]
}
"""


async def run_triage_agent(
    messages: List[Dict[str, str]],
    patient_context_summary: str = ""
) -> Dict[str, Any]:
    """Runs the conversational triage agent using Gemini 2.5 Flash with fallback to adaptive state machine."""
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

        # Check if user already provided comprehensive details or red flags
        if user_turns >= 4 and not is_emergency:
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

