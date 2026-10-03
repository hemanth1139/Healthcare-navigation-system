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
from app.ml.rule_based_predictor import (
    extract_cumulative_symptoms,
    normalize_symptom_list,
    predict_disease,
)

# ─── Mock Fallback Flow (Deterministic Adaptive Clinical Questionnaire) ──────

def _get_mock_triage_response(messages: List[Dict[str, str]], patient_context: str = "") -> Dict[str, Any]:
    """Adaptive conversational triage state machine when LLM is offline."""
    cumulative = extract_cumulative_symptoms(messages)
    symptoms = cumulative["all_symptoms"]
    history_text = " ".join([m.get("content", "").lower() for m in messages if m.get("sender") == "user"])

    # 1. Immediate Emergency Red-Flag Checks
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
    is_chest = (
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


# ─── Gemini 2.5 Flash Triage Agent ──────────────────────────────────────────

SYSTEM_PROMPT = """You are an expert Clinical Triage Specialist in an AI-based Healthcare Navigation System.
Your objective is to conduct an adaptive, symptom-specific, multi-turn clinical intake.

CLINICAL INTAKE PROTOCOLS:

1. EMERGENCY RED FLAG EVALUATION (IMMEDIATE ESCALATION):
   - Cardiorespiratory: Crushing chest pain radiating to left arm/jaw, severe dyspnea, diaphoresis.
   - Neurological: Acute facial droop, slurred speech, hemiparesis, sudden thunderclap headache.
   - Meningeal: High fever + rigid stiff neck + altered sensorium.
   - Urinary Retention: Complete inability to urinate with lower abdominal distension / severe distress.
   - Pyelonephritis / Urosepsis: Urinary symptoms + high fever + severe flank/back pain + rigors.
   - Upper Airway Compromise: Severe throat pain + inability to swallow saliva / drooling + respiratory stridor.
   - Septic Joint: Severe joint pain + high fever + hot/erythematous joint or acute inability to move joint.
   If ANY emergency red flag is present:
   - Set "is_emergency": true, "needs_more_info": false.
   - Set "question": "EMERGENCY ALERT: Immediate clinical evaluation is required."
   - Extract the identified emergency symptoms in "symptoms".

2. ADAPTIVE DOMAIN-SPECIFIC QUESTIONING:
   - FOR URINARY DIFFICULTY / RETENTION / DYSURIA:
     * Screen: 1) Stream volume & retention (complete inability to pass urine vs weak stream/straining vs normal).
     * Screen: 2) Systemic red flags (fever, chills, flank/back pain, gross hematuria, nausea/vomiting).
     * Screen: 3) Sensations & distension (burning/dysuria vs lower abdominal distension/bladder fullness).
   - FOR THROAT / DYSPHAGIA:
     * Screen: 1) Saliva management & breathing ability (cannot swallow fluids/saliva vs solid food difficulty).
     * Screen: 2) Systemic & focal signs (fever, unilateral peritonsillar pain, neck swelling).
   - FOR KNEE PAIN / JOINT COMPLAINTS:
     * Screen: 1) Onset & injury mechanism (twist, fall, sports vs gradual wear).
     * Screen: 2) Weight-bearing ability & ambulation (can bear weight vs cannot walk/stand).
     * Screen: 3) Red flags & mechanical signs (joint swelling, warmth/redness, fever, locking, deformity).
   - FOR HEADACHE: Screen for sudden explosive onset, neck stiffness, fever, neurological deficits.
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

        # The generative model may over-escalate from an isolated symptom. Only
        # close the intake as an emergency when the deterministic rules confirm
        # a red-flag combination from user-reported positive findings.
        if is_emergency:
            cumulative = extract_cumulative_symptoms(messages)
            deterministic = predict_disease(
                cumulative["all_symptoms"], cumulative_data=cumulative
            )
            is_emergency = bool(deterministic.get("emergency_flag"))
            if not is_emergency:
                needs_more_info = True
                fallback = _get_mock_triage_response(messages, patient_context_summary)
                data["question"] = fallback.get("question") or (
                    "Could you tell me when this started and whether you have any other symptoms?"
                )
                data["options"] = fallback.get("options")

        # Enforce that Turn 1 non-emergency CANNOT mark intake complete
        if user_turns <= 1 and not is_emergency:
            needs_more_info = True
            if not data.get("question"):
                mock_resp = _get_mock_triage_response(messages, patient_context_summary)
                data["question"] = mock_resp.get("question")
                data["options"] = mock_resp.get("options")

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

