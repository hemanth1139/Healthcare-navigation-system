"""
Conversational Triage Agent — powered by Gemini 2.5 Flash with Patient Context.
Conducts adaptive, symptom-specific conversational clinical intake.
Screens for acute red flags, tracks positive and negative findings, and dynamically adapts follow-up questions.
"""

import re
import json
import logging
from typing import Dict, Any, List, Optional
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

from app.ml.rule_based_predictor import (
    extract_cumulative_symptoms,
    normalize_symptom_list,
    predict_disease,
)

logger = logging.getLogger(__name__)

# ─── Mock Fallback Flow (Deterministic Adaptive Clinical Questionnaire) ──────

def _get_mock_triage_response(messages: List[Dict[str, str]], patient_context: str = "") -> Dict[str, Any]:
    """Adaptive conversational triage state machine when LLM is offline."""
    cumulative = extract_cumulative_symptoms(messages)
    symptoms = cumulative["all_symptoms"]
    history_text = " ".join([m.get("content", "").lower() for m in messages if m.get("sender") == "user"])

    # 1. Immediate Emergency Red-Flag Checks
    if any(
        phrase in history_text
        for phrase in [
            "can't breathe", "cannot breathe", "barely breathe", "barely breathing",
            "gasping for air", "severe shortness of breath", "struggling to breathe",
            "unable to breathe", "can't catch my breath", "cannot catch my breath",
        ]
    ):
        return {
            "needs_more_info": False,
            "is_emergency": True,
            "question": "🚨 Severe breathing difficulty requires immediate emergency care. Call emergency services (108 / 112) now.",
            "options": None,
            "symptoms": symptoms or ["shortness_of_breath"],
        }

    # (a) Cardiorespiratory emergency
    if "chest_pain" in symptoms and any(
        finding in symptoms
        for finding in ["left_arm_radiation", "shortness_of_breath", "sweating", "dizziness", "nausea"]
    ):
        return {
            "needs_more_info": False,
            "is_emergency": True,
            "question": "🚨 Emergency signs detected (potential acute coronary syndrome). Please call emergency services (108 / 112) or go to the nearest emergency department immediately.",
            "options": None,
            "symptoms": symptoms or ["chest_pain"],
        }

    # (b) Neurological emergency
    if "facial_droop_weakness" in symptoms:
        return {
            "needs_more_info": False,
            "is_emergency": True,
            "question": "🚨 Acute neurological signs detected (possible stroke / TIA). Proceed to the nearest stroke-ready hospital emergency department immediately.",
            "options": None,
            "symptoms": symptoms or ["facial_droop_weakness"],
        }

    # (c) Meningeal emergency / Thunderclap Headache - STRICTER CRITERIA
    # Only trigger if multiple red flags are present
    has_thunderclap = "thunderclap_headache" in symptoms
    has_meningeal = "fever" in symptoms and "stiff_neck" in symptoms
    
    if has_thunderclap or has_meningeal:
        # Additional neurological symptoms must be present for emergency
        neuro_symptoms = {"vomiting", "dizziness", "facial_droop_weakness"}
        if neuro_symptoms.intersection(symptoms):
            return {
                "needs_more_info": False,
                "is_emergency": True,
                "question": "🚨 Neurological emergency signs detected. Seek immediate emergency medical care to rule out serious intracranial pathology.",
                "options": None,
                "symptoms": symptoms or ["headache", "fever", "stiff_neck"],
            }

    # (d) Acute Urinary Retention Emergency
    if "acute_urinary_retention" in symptoms:
        if "lower_abdominal_pain" in symptoms or any(w in history_text for w in ["full bladder", "distended bladder", "painfully full"]):
            return {
                "needs_more_info": False,
                "is_emergency": True,
                "question": "🚨 Emergency medical alert: Complete inability to urinate with bladder distension / lower abdominal distress indicates Acute Urinary Retention. Seek immediate emergency medical care for bladder decompression.",
                "options": None,
                "symptoms": symptoms or ["acute_urinary_retention"],
            }

    # (e) Pyelonephritis / Urosepsis Warning
    if any(u in symptoms for u in ["difficulty_urinating", "burning_urination", "urinary_frequency_urgency", "hematuria"]) and "fever" in symptoms:
        if "flank_pain" in symptoms or "vomiting" in symptoms:
            return {
                "needs_more_info": False,
                "is_emergency": True,
                "question": "🚨 Urgent medical alert: Urinary symptoms accompanied by fever, chills, and flank/back pain suggest an ascending kidney infection (Acute Pyelonephritis) or systemic involvement requiring urgent medical care.",
                "options": None,
                "symptoms": symptoms or ["burning_urination", "fever", "flank_pain"],
            }

    # (f) Severe Airway / Throat Emergency
    if ("difficulty swallowing" in history_text or "cannot swallow" in history_text or "throat" in history_text) and any(w in history_text for w in ["drooling", "stridor", "cannot breathe", "gasping", "can't breathe"]):
        return {
            "needs_more_info": False,
            "is_emergency": True,
            "question": "🚨 Emergency airway alert: Inability to swallow saliva, drooling, or breathing difficulty with throat symptoms indicates potential upper airway compromise. Seek immediate emergency evaluation.",
            "options": None,
            "symptoms": symptoms or ["difficulty_swallowing", "shortness_of_breath"],
        }

    # (g) Septic joint emergency (Knee/joint pain + fever + hot/swollen/unable to bear weight)
    if any(s in symptoms for s in ["knee_pain", "joint_pain"]) and "fever" in symptoms:
        if any(s in symptoms for s in ["joint_warmth_redness", "inability_to_bear_weight"]):
            return {
                "needs_more_info": False,
                "is_emergency": True,
                "question": "🚨 Urgent medical alert: Joint pain accompanied by fever and hot/swollen joint signs requires immediate emergency medical evaluation to rule out joint infection.",
                "options": None,
                "symptoms": symptoms or ["knee_pain", "fever", "joint_warmth_redness"],
            }

    # 2. Adaptive Follow-Up Questioning Based on Presenting Symptom Domain
    user_turns = sum(1 for m in messages if m.get("sender") == "user")

    # ── DOMAIN 1: Urinary / Renal Complaints ──
    is_urinary = (
        any(u in symptoms for u in ["difficulty_urinating", "acute_urinary_retention", "burning_urination", "urinary_frequency_urgency", "hematuria", "flank_pain", "lower_abdominal_pain"])
        or any(w in history_text for w in ["urine", "urinat", "peeing", "pee", "dysuria", "bladder", "micturition", "stream"])
    )
    if is_urinary:
        has_stream_info = any(w in history_text for w in ["cannot pass at all", "no urine at all", "weak stream", "straining", "small amount", "drops", "dribbling", "flow", "pass only small", "normal volume", "normal stream", "can pass urine"])
        has_systemic_urinary = any(w in history_text for w in ["fever", "chills", "flank", "back pain", "blood in urine", "red urine", "pink urine", "vomiting", "no fever", "no blood", "no back pain", "no chills"])
        has_sensation_info = any(w in history_text for w in ["burning", "stinging", "painful urination", "dysuria", "full bladder", "distended", "urgency", "frequency", "no burning", "no lower abdominal"])

        if not has_stream_info:
            return {
                "needs_more_info": True,
                "is_emergency": False,
                "question": "Are you completely unable to pass any urine at all (with painful bladder fullness), or can you pass small amounts with straining or a weak stream?",
                "options": [
                    {"id": "opt1", "label": "Completely unable to pass urine (full bladder)", "value": "I cannot pass any urine at all and my bladder feels painfully full"},
                    {"id": "opt2", "label": "Passing only small amounts / weak stream", "value": "I can pass only small amounts with straining and a very weak stream"},
                    {"id": "opt3", "label": "Normal volume, but severe burning/hesitancy", "value": "I can pass urine but with significant hesitancy and discomfort"},
                ],
                "symptoms": symptoms or ["burning_urination"],
            }

        if not has_systemic_urinary:
            return {
                "needs_more_info": True,
                "is_emergency": False,
                "question": "Do you have any fever, shivering chills, severe flank/back pain, blood in your urine, or nausea/vomiting?",
                "options": [
                    {"id": "opt1", "label": "Yes, fever and severe flank/back pain", "value": "I have a high fever with chills and lower back/flank pain"},
                    {"id": "opt2", "label": "Yes, visible blood in the urine", "value": "I noticed red/pink blood in my urine"},
                    {"id": "opt3", "label": "No fever, flank pain, blood, or vomiting", "value": "No fever, no back pain, no blood in urine, and no nausea"},
                ],
                "symptoms": symptoms or ["burning_urination"],
            }

        if not has_sensation_info and user_turns <= 3:
            return {
                "needs_more_info": True,
                "is_emergency": False,
                "question": "Is there a sharp burning or stinging sensation during urination, or do you feel a painful swelling / pressure in your lower abdomen?",
                "options": [
                    {"id": "opt1", "label": "Sharp burning/stinging during urination", "value": "There is a sharp burning and stinging sensation when urinating"},
                    {"id": "opt2", "label": "Painful pressure / swelling in lower abdomen", "value": "I have lower abdominal pressure and swelling feeling like a full bladder"},
                    {"id": "opt3", "label": "No burning sensation or lower abdominal swelling", "value": "No burning sensation and no lower abdominal swelling"},
                ],
                "symptoms": symptoms or ["burning_urination"],
            }

        # Conclude Urinary Intake
        return {
            "needs_more_info": False,
            "is_emergency": False,
            "question": None,
            "options": None,
            "symptoms": symptoms or ["burning_urination"],
        }

    # ── DOMAIN 2: Throat / Airway Complaints ──
    is_throat = (
        any(t in symptoms for t in ["throat_pain", "difficulty_swallowing"])
        or any(w in history_text for w in ["throat", "swallow", "pharyngitis", "tonsil"])
    )
    if is_throat:
        has_airway_info = any(w in history_text for w in ["saliva", "drooling", "stridor", "breathe", "breathing", "swallow water", "swallow solid", "can swallow"])
        has_fever_neck_info = any(w in history_text for w in ["fever", "neck swelling", "glands", "ear pain", "one side", "no fever"])

        if not has_airway_info and user_turns <= 1:
            return {
                "needs_more_info": True,
                "is_emergency": False,
                "question": "Are you able to swallow liquids and manage your saliva, or is swallowing so painful that you cannot swallow water or breathe comfortably?",
                "options": [
                    {"id": "opt1", "label": "Cannot swallow liquids or saliva / breathing difficult", "value": "I cannot swallow saliva or fluids and breathing is uncomfortable"},
                    {"id": "opt2", "label": "Severe pain swallowing food and drinks", "value": "Severe throat pain when swallowing solid food and liquids"},
                    {"id": "opt3", "label": "Mild sore throat, able to swallow normally", "value": "Mild sore throat, can swallow normally without difficulty"},
                ],
                "symptoms": symptoms or ["throat_pain"],
            }

        if not has_fever_neck_info and user_turns <= 2:
            return {
                "needs_more_info": True,
                "is_emergency": False,
                "question": "Do you also have a fever, swollen neck glands, or severe pain localized to one side of the throat radiating to the ear?",
                "options": [
                    {"id": "opt1", "label": "High fever with one-sided severe throat/ear pain", "value": "High fever and severe pain on one side of my throat radiating to my ear"},
                    {"id": "opt2", "label": "Mild fever and tender neck glands", "value": "Mild fever and swollen tender glands in my neck"},
                    {"id": "opt3", "label": "No fever or swollen neck glands", "value": "No fever and no swollen neck glands"},
                ],
                "symptoms": symptoms or ["throat_pain"],
            }

        return {
            "needs_more_info": False,
            "is_emergency": False,
            "question": None,
            "options": None,
            "symptoms": symptoms or ["throat_pain"],
        }

    # ── DOMAIN 3: Knee Pain & Musculoskeletal ──
    is_msk = (
        "knee_pain" in symptoms or "joint_pain" in symptoms
        or any(w in history_text for w in ["knee", "joint", "walk", "weight", "leg", "limp", "twist", "fell", "fall"])
    )
    if is_msk:
        has_injury_info = any(w in history_text for w in ["fall", "fell", "twist", "injury", "sports", "accident", "hit", "trauma", "gradual", "overuse", "started without injury", "no injury", "no fall"])
        has_weight_bearing_info = any(w in history_text for w in ["bear weight", "weight", "walk", "walking", "stand", "step", "limp", "cannot bear", "can walk", "unable to walk"])
        has_inflammatory_info = any(w in history_text for w in ["swelling", "swollen", "red", "warm", "hot", "fever", "locking", "locked", "giving way", "popping", "heard a pop", "no swelling", "no redness", "no fever"])

        if not has_injury_info:
            return {
                "needs_more_info": True,
                "is_emergency": False,
                "question": "Did this knee discomfort begin after a specific incident (like a fall, twisting injury, or sports collision), or did it develop gradually?",
                "options": [
                    {"id": "opt1", "label": "Sudden injury / fall / twist", "value": "It happened after a sudden twist or fall"},
                    {"id": "opt2", "label": "Gradual onset from walking/exercise", "value": "Started gradually after walking or exercise"},
                    {"id": "opt3", "label": "Woke up with pain / no injury", "value": "Started without any fall or injury, gradual onset"},
                ],
                "symptoms": symptoms or ["knee_pain"],
            }

        if not has_weight_bearing_info:
            return {
                "needs_more_info": True,
                "is_emergency": False,
                "question": "Are you currently able to bear full weight and walk, or are you unable to step on that leg?",
                "options": [
                    {"id": "opt1", "label": "Cannot bear weight / unable to walk", "value": "I cannot bear weight on it and cannot walk"},
                    {"id": "opt2", "label": "Can walk with mild limp", "value": "I can walk with a slight limp, bearing some weight"},
                    {"id": "opt3", "label": "Can walk normally without difficulty", "value": "I can walk and bear weight normally"},
                ],
                "symptoms": symptoms or ["knee_pain"],
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
                "symptoms": symptoms or ["knee_pain"],
            }

        # Conclude Knee Intake
        return {
            "needs_more_info": False,
            "is_emergency": False,
            "question": None,
            "options": None,
            "symptoms": symptoms or ["knee_pain"],
        }

    # ── DOMAIN 4: Chest Discomfort / Cardiorespiratory ──
    is_chest_negated = any(phrase in history_text for phrase in [
        "no chest pain", "don't have chest pain", "dont have chest pain",
        "don't think i have chest pain", "dont think i have chest pain",
        "no chest discomfort", "no pain in chest"
    ])
    is_chest = (not is_chest_negated) and (
        "chest_pain" in symptoms or "left_arm_radiation" in symptoms
        or any(w in history_text for w in ["chest", "angina", "heart", "sternal", "tightness in chest", "pressure in chest"])
    )
    if is_chest:
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
                "symptoms": symptoms or ["chest_pain"],
            }

        return {
            "needs_more_info": False,
            "is_emergency": False,
            "question": None,
            "options": None,
            "symptoms": symptoms or ["chest_pain"],
        }

    # ── DOMAIN 5: Abdominal / Gastrointestinal Complaints ──
    is_abdominal = any(s in symptoms for s in [
        "abdominal_pain", "lower_abdominal_pain", "nausea", "vomiting", "diarrhea"
    ]) or any(w in history_text for w in ["stomach", "belly", "abdomen", "tummy", "diarrhea", "loose stool"])
    if is_abdominal:
        has_abdominal_red_flag_screen = any(w in history_text for w in [
            "severe", "mild", "moderate", "sudden", "gradual", "started", "since", "hours", "days",
            "blood", "black stool", "faint", "rigid", "swollen abdomen", "no blood", "not severe",
            "no vomiting", "not vomiting", "no fever"
        ])
        if not has_abdominal_red_flag_screen:
            return {
                "needs_more_info": True, "is_emergency": False,
                "question": "Where is the discomfort, when did it start, and is it severe or getting worse? Have you noticed blood, repeated vomiting, fainting, or a hard/swollen abdomen?",
                "options": [
                    {"id": "opt1", "label": "Mild and improving", "value": "Mild stomach discomfort, started today, not worsening, no blood or repeated vomiting"},
                    {"id": "opt2", "label": "Persistent or worsening pain", "value": "Abdominal pain has persisted or is getting worse"},
                    {"id": "opt3", "label": "Severe warning signs", "value": "Sudden severe abdominal pain with repeated vomiting or fainting"},
                ], "symptoms": symptoms or ["abdominal_pain"],
            }
        return {"needs_more_info": False, "is_emergency": False, "question": None, "options": None,
                "symptoms": symptoms or ["abdominal_pain"]}

    # ── DOMAIN 6: Cough / Respiratory Complaints ──
    is_cough = "cough" in symptoms or any(w in history_text for w in ["cough", "wheezing", "phlegm", "mucus"])
    if is_cough:
        has_breathing_screen = any(w in history_text for w in [
            "breathless", "shortness of breath", "difficulty breathing", "can't breathe", "cannot breathe",
            "breathing normally", "breathing fine", "no shortness of breath", "not breathless"
        ])
        has_cough_context = any(w in history_text for w in [
            "fever", "no fever", "days", "weeks", "started", "since", "blood", "chest pain", "no chest pain"
        ])
        if not has_breathing_screen or not has_cough_context:
            missing = []
            if not has_breathing_screen:
                missing.append("whether you are short of breath or breathing comfortably")
            if not has_cough_context:
                missing.append("how long you have been coughing and whether you have fever, chest pain, or blood in the mucus")
            return {
                "needs_more_info": True, "is_emergency": False,
                "question": "To understand the cough, please tell me " + " and ".join(missing) + ".",
                "options": [
                    {"id": "opt1", "label": "Breathing comfortably", "value": "I am breathing comfortably, no shortness of breath"},
                    {"id": "opt2", "label": "Breathless or chest pain", "value": "I have shortness of breath or chest pain with this cough"},
                    {"id": "opt3", "label": "Fever or blood", "value": "I have fever or blood in my cough"},
                ], "symptoms": symptoms or ["cough"],
            }
        return {"needs_more_info": False, "is_emergency": False, "question": None, "options": None,
                "symptoms": symptoms or ["cough"]}

    # ── DOMAIN 7: Dizziness / Faintness ──
    is_dizzy = any(s in symptoms for s in ["dizziness", "vertigo", "fainting"]) or any(
        w in history_text for w in ["dizzy", "dizziness", "vertigo", "lightheaded", "light-headed", "faint"]
    )
    if is_dizzy:
        has_dizziness_screen = any(w in history_text for w in [
            "face droop", "facial droop", "weakness on one side", "slurred speech", "trouble speaking",
            "chest pain", "palpitations", "fainted", "did not faint", "not fainted", "no weakness",
            "no chest pain", "no trouble speaking", "no vision changes", "normal vision"
        ])
        if not has_dizziness_screen:
            return {
                "needs_more_info": True, "is_emergency": False,
                "question": "Did this start suddenly, and have you had fainting, chest pain, one-sided weakness, facial drooping, trouble speaking, or new vision changes?",
                "options": [
                    {"id": "opt1", "label": "Sudden neurological symptoms", "value": "Sudden dizziness with one-sided weakness, face drooping, or trouble speaking"},
                    {"id": "opt2", "label": "Fainting or chest symptoms", "value": "Dizziness with fainting, chest pain, or palpitations"},
                    {"id": "opt3", "label": "None of these", "value": "No fainting, chest pain, weakness, speech, or vision problems"},
                ], "symptoms": symptoms or ["dizziness"],
            }
        return {"needs_more_info": False, "is_emergency": False, "question": None, "options": None,
                "symptoms": symptoms or ["dizziness"]}

    # ── DOMAIN 8: Headache / Neurological ──
    is_headache = (
        "headache" in symptoms or "thunderclap_headache" in symptoms
        or any(w in history_text for w in ["headache", "head hurt", "migraine", "temple pain", "throbbing head"])
    )
    if is_headache:
        # Check for severity indicators
        has_severity_info = any(w in history_text for w in ["severe", "mild", "moderate", "bad", "terrible", "worst", "slight", "little", "intense", "extreme"])
        has_duration_info = any(w in history_text for w in ["days", "hours", "weeks", "today", "yesterday", "started", "began", "onset"])
        has_location_info = any(w in history_text for w in ["front", "back", "side", "temple", "forehead", "behind eye", "both sides", "one side"])
        
        # First turn: Ask about severity and duration
        if user_turns <= 1:
            return {
                "needs_more_info": True,
                "is_emergency": False,
                "question": "How would you describe the severity of your headache, and how long has it been bothering you?",
                "options": [
                    {"id": "opt1", "label": "Mild, started today", "value": "Mild headache that started today"},
                    {"id": "opt2", "label": "Moderate, 2-3 days", "value": "Moderate headache for 2-3 days"},
                    {"id": "opt3", "label": "Severe, sudden onset", "value": "Severe headache that started suddenly"},
                    {"id": "opt4", "label": "Worst headache of my life", "value": "This is the worst headache I've ever had"},
                ],
                "symptoms": symptoms or ["headache"],
            }
        
        # Second turn: Check for red flags if severity is high
        if user_turns == 2:
            # Check if user indicated severe or sudden headache
            if any(w in history_text for w in ["severe", "sudden", "worst", "intense", "extreme"]):
                # A mention of one item (including a denial such as "no fever")
                # does not mean the other warning signs have been screened.
                headache_screen_complete = all((
                    any(term in history_text for term in terms)
                    for terms in [
                        ["stiff neck", "neck stiffness", "no stiff neck", "no neck stiffness", "can bend neck"],
                        ["fever", "no fever", "afebrile", "temperature is normal"],
                        ["vomiting", "no vomiting", "not vomiting", "throwing up"],
                        ["vision changes", "visual changes", "trouble seeing", "no vision changes"],
                        ["confusion", "no confusion", "drowsy", "alert and oriented"],
                    ]
                ))
                if not headache_screen_complete:
                    return {
                        "needs_more_info": True,
                        "is_emergency": False,
                        "question": "Do you have any neck stiffness, fever, vomiting, vision changes, or confusion with this headache?",
                        "options": [
                            {"id": "opt1", "label": "Yes, stiff neck and fever", "value": "Yes, I have stiff neck and fever"},
                            {"id": "opt2", "label": "Yes, vomiting and vision changes", "value": "Yes, vomiting and vision changes"},
                            {"id": "opt3", "label": "No, just the headache", "value": "No neck stiffness, fever, vomiting, or vision changes"},
                        ],
                        "symptoms": symptoms or ["headache"],
                    }
            else:
                # Mild/moderate headache - ask about associated symptoms
                has_associated = any(w in history_text for w in ["nausea", "light", "noise", "sound", "sensitive", "dizzy"])
                if not has_associated:
                    return {
                        "needs_more_info": True,
                        "is_emergency": False,
                        "question": "Are you experiencing nausea, sensitivity to light or sound, or dizziness with this headache?",
                        "options": [
                            {"id": "opt1", "label": "Yes, nausea and light sensitivity", "value": "Yes, nausea and sensitive to light"},
                            {"id": "opt2", "label": "Yes, sensitive to noise", "value": "Yes, sensitive to noise"},
                            {"id": "opt3", "label": "No associated symptoms", "value": "No nausea, light sensitivity, or dizziness"},
                        ],
                        "symptoms": symptoms or ["headache"],
                    }

        # Conclude headache intake - classify urgency based on findings
        # Emergency: thunderclap + neurological symptoms OR fever + stiff neck + neurological
        is_thunderclap = "thunderclap" in history_text or ("worst headache" in history_text and "ever" in history_text and "sudden" in history_text)
        has_neuro = any(w in history_text for w in ["confusion", "vomiting", "vision", "light", "seizure", "pass out", "faint", "drowsy"])
        has_meningeal = ("fever" in history_text or "temperature" in history_text) and ("stiff neck" in history_text or "neck stiffness" in history_text)
        
        if (is_thunderclap and has_neuro) or (has_meningeal and has_neuro):
            return {
                "needs_more_info": False,
                "is_emergency": True,
                "question": "🚨 Neurological emergency signs detected. Seek immediate emergency medical care.",
                "options": None,
                "symptoms": symptoms or ["headache"],
            }
        
        # Non-urgent simple headache
        return {
            "needs_more_info": False,
            "is_emergency": False,
            "question": None,
            "options": None,
            "symptoms": symptoms or ["headache"],
        }

    # ── DOMAIN 9: Fever / Systemic ──
    if "fever" in symptoms or "high_fever" in symptoms or "temperature" in history_text:
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
                "symptoms": symptoms or ["fever"],
            }

        has_neuro_fever_check = any(w in history_text for w in ["headache", "neck", "stiff", "light", "confusion", "rash"])
        if not has_neuro_fever_check and user_turns <= 2:
            return {
                "needs_more_info": True,
                "is_emergency": False,
                "question": "Do you also have a severe headache, neck stiffness, unusual rash, or sensitivity to bright light?",
                "options": [
                    {"id": "opt1", "label": "Yes, severe headache & stiff neck", "value": "Severe headache and stiff neck"},
                    {"id": "opt2", "label": "Mild headache only", "value": "Mild headache only"},
                    {"id": "opt3", "label": "No headache or neck stiffness", "value": "No headache or neck stiffness"},
                ],
                "symptoms": symptoms or ["fever"],
            }

        return {
            "needs_more_info": False,
            "is_emergency": False,
            "question": None,
            "options": None,
            "symptoms": symptoms or ["fever"],
        }

    # ── DOMAIN 10: General / Fallback Flow ──
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


# ─── Groq-Powered Triage Agent ───────────────────────────────────────────────

SYSTEM_PROMPT = """You are a careful, friendly symptom-intake assistant for a health app. You are not a doctor. Never diagnose, prescribe, or claim certainty. Your job is to (1) ask the few questions that matter most, (2) spot urgent danger early, and (3) finish with a severity level and the right type of specialist.

HOW TO ASK QUESTIONS
- Ask exactly ONE question per turn. Keep it under 20 words, in plain everyday language. No medical jargon.
- Questions must be open-ended. Never list choices, options, or multiple-choice answers.
- Start with a brief, warm acknowledgment (a few words, only when natural), then the question.
- Reply in the same language the patient writes in.
- Never ask something already answered in the conversation or in Patient Baseline Context (age, sex, pregnancy, known conditions, medicines, allergies). Use that context silently to choose better questions.
- If the patient says "I don't know" or skips a question, accept it and move on.
- Each question must be about the main symptom, not generic. Prefer questions whose answers change the urgency or the specialist.

QUESTION PRIORITY (pick the most valuable missing item; do not go through mechanically)
1. Safety check: the red-flag symptom most relevant to this complaint, if not yet known.
2. Onset and course: when it started, sudden or gradual, getting better or worse.
3. Character and location: where exactly, what it feels like, whether it spreads.
4. Severity and impact: how bad it is, and whether it stops sleep, work, eating, or normal activity.
5. Associated symptoms: what else is happening along with it.
6. Context: recent injury, infection exposure, travel, new medicines, pregnancy, similar past episodes.

COMPLAINT-SPECIFIC FOCUS (examples of what to prioritize)
- Headache: sudden or gradual, fever or neck stiffness, vision change, vomiting, recent head injury.
- Chest pain: spreading to arm/jaw, breathlessness, sweating, triggered by exertion or breathing.
- Abdominal pain: exact location, vomiting, fever, stool or urine changes, relation to food, pregnancy possibility.
- Fever: how high and how many days, rash, cough, burning urine, travel or mosquito exposure.
- Cough or breathlessness: duration, breathlessness at rest, blood in sputum, wheeze.
- Injury: how it happened, swelling or deformity, ability to bear weight or move.
- Skin problems: spread, itching or pain, new products or medicines, fever.
- Dizziness or weakness: spinning vs faintness, one-sided weakness, speech or vision change.
- Mood or anxiety: duration, effect on sleep and daily life, any thoughts of self-harm.
- Children, older adults, pregnant patients, and people with chronic illness: lower the threshold for recommending in-person care.

SPECIALIST SELECTION BY BODY PART AND SYMPTOM (match these patterns carefully)
- Head, brain, or severe headaches: Neurologist
- Eyes (pain, vision problems, redness): Ophthalmologist
- Ears, nose, throat, neck, swallowing issues: ENT Specialist
- Chest, heart, heart rhythm, heart attack symptoms: Cardiologist
- Lungs, breathing, cough, asthma, wheezing: Pulmonologist
- Stomach, abdomen, digestive issues, diarrhea, constipation: Gastroenterologist
- Kidney, urinary problems, burning urination, difficulty urinating: Urologist or Nephrologist
- Knee, joints, bones, fractures, back injury, muscle pain: Orthopedist
- Skin rashes, itching, skin lesions: Dermatologist
- Pregnancy, menstrual issues, pelvic pain: Gynecologist
- Mental health, anxiety, depression, mood: Psychiatrist
- Children under 18: Pediatrician
- General or unclear symptoms: General Physician

HOW MANY QUESTIONS
- Before four follow-up questions have been asked, a non-emergency case must continue with a relevant question.
- After that, continue only if an important detail or safety check is still unknown. Aim to finish within 4 to 7 questions total. Stop once you can confidently choose a severity level and specialist and the key warning signs have been checked.
- Do not repeat a question in different words.

EMERGENCY RULES
Set is_emergency=true immediately, with no further questions, if the patient describes any of: severe difficulty breathing; chest pain with spreading pain, sweating, or breathlessness; sudden one-sided weakness, facial droop, or slurred speech; fainting with severe symptoms; sudden "worst-ever" headache; fever with stiff neck or confusion; drooling or inability to swallow saliva with throat symptoms; heavy uncontrolled bleeding; seizure; confusion or unresponsiveness; signs of severe allergic reaction (face/throat swelling with breathing trouble); thoughts of suicide or self-harm with intent or plan; or any other clear immediate danger.
- In the "message" field, tell them in 1 to 2 calm sentences to seek emergency care now and call 112 or 108 (India), and not to travel alone or drive themselves if unwell.
- If a warning sign is vague and the patient seems stable, ask ONE focused clarifying question instead of declaring an emergency.

FINAL ASSESSMENT (when interview is complete)
- Set needs_more_info=false, question=null.
- severity: one of "mild", "moderate", "severe" (use is_emergency=true for emergencies).
  - mild: likely manageable with rest and self-care; see a doctor if no improvement in a few days.
  - moderate: should see a doctor within 1 to 3 days.
  - severe: needs prompt medical evaluation today, but not clearly life-threatening.
- specialists: 1 to 3 types of specialist suited to the symptoms, following the body-part-to-specialist mapping above (e.g., "General Physician", "Cardiologist", "Neurologist", "Gastroenterologist", "Dermatologist", "ENT Specialist", "Orthopedist", "Pulmonologist", "Gynecologist", "Pediatrician", "Psychiatrist", "Urologist", "Nephrologist", "Ophthalmologist"). Put the best first. If unclear, use "General Physician".
- message: 2 to 4 plain sentences summarizing what the patient reported, why this level of care is suggested, what warning signs should make them seek urgent care, and a clear statement that this is not a diagnosis and uncertainty remains. Do not name a disease as the cause. Do not recommend specific prescription drugs or doses.

SYMPTOM EXTRACTION
- Include only symptoms the patient reported or explicitly confirmed. Never infer symptoms from a possible disease.
- Use short normalized snake_case names, e.g., "headache", "fever", "chest_pain", "shortness_of_breath". Accumulate across the whole conversation without duplicates.

OUTPUT
Return exactly one valid JSON object and nothing else (no markdown, no extra text):
{
  "needs_more_info": true,
  "is_emergency": false,
  "question": "One short open-ended question, or null",
  "options": null,
  "symptoms": ["..."],
  "severity": null,
  "specialists": [],
  "message": null
}

Field rules:
- Still asking: needs_more_info=true, question is a non-empty string, severity=null, specialists=[], message=null.
- Emergency: needs_more_info=false, is_emergency=true, question=null, severity="emergency", message filled, specialists may list the relevant emergency-capable specialty or be [].
- Complete: needs_more_info=false, is_emergency=false, question=null, severity/specialists/message filled.
- "options" is always null."""


def _recommend_specialists(
    symptoms: List[str],
    messages: List[Dict[str, str]],
    patient_context_summary: str,
    is_emergency: bool,
) -> List[str]:
    """Return a conservative symptom-domain referral; use primary care when unclear."""
    if is_emergency:
        return []

    user_text = " ".join(
        str(item.get("content", ""))
        for item in messages
        if item.get("sender") == "user"
    ).lower()
    context = patient_context_summary.lower()
    symptom_set = {str(symptom).lower() for symptom in symptoms}

    age_match = re.search(r"\b(?:age\s*[:=]?\s*|aged\s+)(\d{1,2})\b|\b(\d{1,2})\s*(?:years? old|y/o)\b", context)
    reported_age = next((int(value) for value in age_match.groups() if value), None) if age_match else None
    if (reported_age is not None and reported_age < 18) or re.search(r"\b(child|children|toddler|infant|newborn)\b", user_text):
        return ["Pediatrician"]

    pregnancy_status = re.search(r"\bPregnancy:\s*([a-z_-]+)", patient_context_summary, re.IGNORECASE)
    profile_says_pregnant = bool(pregnancy_status and pregnancy_status.group(1).lower() in {"pregnant", "yes", "positive"})
    pregnancy_text = re.sub(
        r"\b(?:not|never|no|isn't|aren't|am not|wasn't|no chance of)\s+(?:currently\s+)?pregnan\w*\b",
        "",
        user_text,
    )
    if profile_says_pregnant or re.search(r"\b(pregnan\w*|period pain|menstrual|missed period|vaginal bleeding|pelvic pain)\b", pregnancy_text):
        return ["Gynecologist"]
    if re.search(r"\b(panic attack|anxiety|depress\w*|mood disorder)\b", user_text):
        return ["Psychiatrist"]
    if re.search(r"\b(rash|itchy skin|skin lesion|hives|eczema|acne)\b", user_text):
        return ["Dermatologist"]
    if re.search(r"\b(eye pain|blurry vision|blurred vision|red eye|vision loss)\b", user_text):
        return ["Ophthalmologist"]

    domains = []
    # Cardiac
    if symptom_set.intersection({"chest_pain", "left_arm_radiation"}) or re.search(r"\b(palpitations|irregular heartbeat|heart.*pain|chest.*tightness)\b", user_text):
        domains.append("Cardiologist")
    # Urinary/Renal
    if symptom_set.intersection({"difficulty_urinating", "acute_urinary_retention", "burning_urination", "urinary_frequency_urgency", "hematuria", "flank_pain"}):
        domains.append("Urologist")
    if re.search(r"\b(kidney disease|chronic kidney|reduced kidney function)\b", context):
        domains.append("Nephrologist")
    # ENT
    if symptom_set.intersection({"throat_pain", "difficulty_swallowing"}) or re.search(r"\b(ear pain|earache|sinus pain|blocked nose|neck.*pain|swallow.*difficult)\b", user_text):
        domains.append("ENT Specialist")
    # Pulmonary
    if "shortness_of_breath" in symptom_set or re.search(r"\b(wheezing|asthma|persistent cough|breath.*difficult|lung.*pain)\b", user_text):
        domains.append("Pulmonologist")
    # Gastrointestinal
    if symptom_set.intersection({"abdominal_pain", "heartburn", "lower_abdominal_pain"}) or re.search(r"\b(diarrh\w*|constipat\w*|blood in stool|stomach.*pain|belly.*pain|digestive)\b", user_text):
        domains.append("Gastroenterologist")
    # Orthopedic (check for body part + pain patterns)
    body_part_orthopedic = any(
        f"{part}_pain" in symptom_set
        for part in ["knee", "joint", "shoulder", "hip", "ankle", "wrist", "elbow", "back", "neck"]
    )
    if body_part_orthopedic or symptom_set.intersection({"joint_pain", "joint_deformity", "inability_to_bear_weight", "joint_warmth_redness", "knee_locking"}):
        domains.append("Orthopedist")
    # Neurological
    if "headache" in symptom_set and re.search(r"\b(recurrent|repeated|chronic|migraine)\b", user_text):
        domains.append("Neurologist")
    if symptom_set.intersection({"facial_droop_weakness", "thunderclap_headache", "dizziness", "confusion"}):
        domains.append("Neurologist")
    # Ophthalmologic
    if re.search(r"\b(eye.*pain|vision.*blur|red eye|vision.*loss|blurry.*vision)\b", user_text):
        domains.append("Ophthalmologist")

    # Multiple unrelated symptom systems are better assessed first by primary care.
    if len(domains) == 1:
        return domains
    return ["General Physician"]


async def run_triage_agent(
    messages: List[Dict[str, str]],
    patient_context_summary: str = ""
) -> Dict[str, Any]:
    """Runs the conversational triage agent using Groq with fallback to adaptive state machine."""
    from app.core.llm import _get_groq_api_keys, invoke_groq

    if not _get_groq_api_keys():
        logger.info("[TRIAGE] action=rule_based_fallback reason=no_api_key")
        return _get_mock_triage_response(messages, patient_context_summary)

    try:
        lc_messages = [SystemMessage(content=SYSTEM_PROMPT)]
        if patient_context_summary:
            lc_messages.append(SystemMessage(content=f"Patient Baseline Context: {patient_context_summary}"))

        for msg in messages:
            if msg.get("sender") == "user":
                lc_messages.append(HumanMessage(content=msg.get("content", "")))
            else:
                lc_messages.append(AIMessage(content=msg.get("content", "")))

        res_text = await invoke_groq(
            lc_messages,
            feature="symptom_assessment",
            temperature=0.15,
            timeout_seconds=12.0,
            overall_timeout_seconds=25.0,
        )

        if "```json" in res_text:
            res_text = res_text.split("```json")[1].split("```")[0].strip()
        elif "```" in res_text:
            res_text = res_text.split("```")[1].split("```")[0].strip()

        data = json.loads(res_text)

        extracted_symptoms = data.get("symptoms", [])
        if isinstance(extracted_symptoms, list):
            extracted_symptoms = normalize_symptom_list(extracted_symptoms)

        user_turns = sum(1 for m in messages if m.get("sender") == "user")
        assistant_questions = sum(1 for m in messages if m.get("sender") in ("assistant", "agent"))
        is_emergency = bool(data.get("is_emergency", False))
        needs_more_info = bool(data.get("needs_more_info", True))
        if is_emergency:
            needs_more_info = False

        # Enforce that Turn 1 non-emergency CANNOT mark intake complete
        if user_turns <= 1 and not is_emergency:
            needs_more_info = True
        if assistant_questions < 4 and not is_emergency:
            needs_more_info = True

        if needs_more_info and not data.get("question"):
            mock_resp = _get_mock_triage_response(messages, patient_context_summary)
            data["question"] = mock_resp.get("question") or (
                "Since this began, has it been improving, getting worse, or staying about the same?"
            )

        severity = "emergency" if is_emergency else data.get("severity")
        specialists = _recommend_specialists(
            extracted_symptoms,
            messages,
            patient_context_summary,
            is_emergency,
        )
        assessment_message = data.get("message")

        if needs_more_info and not is_emergency:
            severity = None
            specialists = []
            assessment_message = None
        elif is_emergency:
            assessment_message = assessment_message or (
                "Your symptoms may need emergency care. Call 112 or 108 now. "
                "Do not drive yourself or travel alone if you feel unwell."
            )
        else:
            if severity not in {"mild", "moderate", "severe"}:
                severity = "moderate"
            if not isinstance(assessment_message, str) or not assessment_message.strip():
                assessment_message = (
                    "Your symptom interview is complete. Please discuss these symptoms with a healthcare professional; "
                    "this is not a diagnosis and some uncertainty remains."
                )

        return {
            "needs_more_info": needs_more_info,
            "is_emergency": is_emergency,
            "question": data.get("question") if needs_more_info else None,
            "options": None,
            "symptoms": extracted_symptoms,
            "severity": severity,
            "specialists": specialists,
            "message": assessment_message,
        }
    except Exception as e:
        logger.warning(
            "[TRIAGE] action=rule_based_fallback reason=llm_error error_type=%s: %s",
            type(e).__name__,
            e,
        )
        return _get_mock_triage_response(messages, patient_context_summary)

