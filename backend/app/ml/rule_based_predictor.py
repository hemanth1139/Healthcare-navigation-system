"""
Rule-Based Disease Prediction & Clinical Decision Engine.
Authoritative, deterministic clinical rules for severity, urgency classification,
red-flag detection, specialist recommendations, and dynamic natural language symptom extraction.
"""

from typing import List, Dict, Any, Tuple, Optional
import re

# ─── Canonical Symptom Synonyms & Normalization ──────────────────────────────

SYMPTOM_SYNONYMS: Dict[str, List[str]] = {
    "knee_pain": [
        "knee pain", "pain in knee", "knee discomfort", "hurting knee", "swollen knee",
        "knee ache", "patellar pain", "pain in my knee", "right knee pain", "left knee pain",
        "both knees pain", "knee hurts", "knee soreness", "knee tenderness", "pain around knee"
    ],
    "joint_pain": [
        "joint pain", "pain in joints", "aching joints", "arthralgia", "arthritis",
        "shoulder pain", "elbow pain", "wrist pain", "hip pain", "ankle pain", "joint stiffness",
        "pain in joints", "hurting joints"
    ],
    "inability_to_bear_weight": [
        "cannot bear weight", "can't bear weight", "unable to bear weight", "cannot walk",
        "unable to walk", "can't walk", "cannot put weight on it", "can't put weight",
        "unable to put weight", "non weight bearing", "cannot stand", "unable to stand",
        "limping severely", "cannot put pressure on leg", "inability to bear weight",
        "cannot take a step", "unable to step"
    ],
    "joint_deformity": [
        "visible deformity", "joint deformity", "deformed knee", "crooked knee",
        "bone sticking out", "knee out of place", "dislocated knee", "patellar dislocation",
        "abnormal knee shape", "bone deformity", "misaligned joint"
    ],
    "joint_warmth_redness": [
        "hot to touch", "joint warmth", "redness around joint", "warm and red knee",
        "red and swollen joint", "joint erythema", "hot joint", "warm knee", "red knee",
        "burning hot knee", "knee is warm", "joint feels hot"
    ],
    "knee_locking": [
        "knee locking", "locked knee", "knee is locked", "clicking and locking",
        "knee gives out", "knee gave way", "knee instability", "giving way",
        "cannot bend knee", "cannot straighten knee", "joint catching", "joint locking"
    ],
    "trauma_injury": [
        "fell down", "fall", "sports injury", "twisted knee", "knee twist", "twisting injury",
        "direct hit to knee", "popping sound in knee", "heard a pop", "direct blow",
        "traumatic impact", "road accident", "hit by bike", "fell from stairs", "sports collision"
    ],
    "swelling": [
        "swelling", "swollen", "inflammation", "edema", "puffy", "puffiness",
        "knee effusion", "joint effusion", "fluid in knee", "swollen up"
    ],
    "back_pain": [
        "back pain", "lower back pain", "lumbar pain", "spine pain", "back ache",
        "stiff back", "upper back pain", "pain in back"
    ],
    "throat_pain": [
        "throat pain", "sore throat", "pain in throat", "hurting throat", "pharyngitis",
        "throat irritation", "difficulty swallowing", "scratchy throat", "raw throat",
        "tonsil pain", "pain when swallowing", "swollen throat", "throat infection", "pain in my throat"
    ],
    "nausea": [
        "nausea", "feeling sick", "queasy", "upset stomach", "nauseous", "nauseated", "feel like throwing up"
    ],
    "body_aches": [
        "body aches", "body pain", "muscle pain", "myalgia", "generalized aches",
        "aching all over", "sore muscles", "aches", "body ache", "all over body pain"
    ],
    "chest_pain": [
        "chest pain", "chest tightness", "chest pressure", "chest discomfort",
        "tightness in chest", "heaviness in chest", "squeezing in chest", "crushing chest pain",
        "angina", "sternal pain", "substernal pain", "pain in chest"
    ],
    "left_arm_radiation": [
        "left arm pain", "left arm", "radiation to arm", "shooting down left arm",
        "pain in left shoulder", "radiating to jaw", "radiating to neck", "jaw pain", "neck pain", "arm numbness"
    ],
    "shortness_of_breath": [
        "shortness of breath", "breathlessness", "difficulty breathing", "dyspnea",
        "cannot breathe", "gasping", "trouble breathing", "wheezing", "tight chest breathing", "breathless"
    ],
    "fever": [
        "fever", "high temperature", "chills", "feverish", "shivering",
        "hot and cold", "pyrexia", "body burning", "running a fever", "running temperature", "high fever"
    ],
    "headache": [
        "headache", "head pain", "throbbing head", "migraine", "pain in head",
        "temple pain", "forehead pain", "head pressure", "pain in my head"
    ],
    "thunderclap_headache": [
        "thunderclap headache", "worst headache of my life", "sudden severe headache",
        "explosive headache", "onset in seconds", "worst headache ever"
    ],
    "stiff_neck": [
        "stiff neck", "neck stiffness", "cannot bend neck", "nuchal rigidity",
        "pain moving neck", "neck rigidity", "cannot touch chin to chest"
    ],
    "abdominal_pain": [
        "abdominal pain", "stomach ache", "belly pain", "gut pain",
        "lower abdominal pain", "right lower quadrant pain", "stomach cramps", "stomach pain", "pain in stomach"
    ],
    "cough": [
        "cough", "coughing", "dry cough", "wet cough", "productive cough",
        "hacking cough", "barking cough"
    ],
    "vomiting": [
        "vomiting", "throwing up", "puking", "emesis"
    ],
    "dizziness": [
        "dizziness", "lightheadedness", "fainting", "syncope", "feeling faint", "spinning", "vertigo", "dizzy"
    ],
    "sweating": [
        "sweating", "cold sweat", "diaphoresis", "profuse sweating", "night sweats", "sweaty"
    ],
    "facial_droop_weakness": [
        "facial droop", "slurred speech", "one side weakness", "arm weakness",
        "cannot speak", "facial numbness", "stroke symptoms", "sudden weakness", "arm drift"
    ],
    "burning_urination": [
        "burning urination", "painful urination", "dysuria", "stinging urine", "frequent urination"
    ],
    "fatigue": [
        "fatigue", "tiredness", "exhaustion", "weakness", "lethargy", "feeling tired"
    ],
    "heartburn": [
        "heartburn", "acid reflux", "burning in chest after food", "sour taste", "regurgitation", "gerd"
    ],
}

def normalize_symptom(symptom_str: str) -> str:
    """Normalize any natural language symptom string to its canonical key."""
    if not symptom_str:
        return ""
    cleaned = symptom_str.lower().strip().replace("_", " ").replace("-", " ")
    for canonical, synonyms in SYMPTOM_SYNONYMS.items():
        if canonical.replace("_", " ") == cleaned:
            return canonical
        for syn in synonyms:
            if syn == cleaned or f" {syn} " in f" {cleaned} " or cleaned.endswith(f" {syn}") or cleaned.startswith(f"{syn} "):
                return canonical
    
    # Check body parts with pain/ache/discomfort
    for part in COMMON_BODY_PARTS:
        if part in cleaned and ("pain" in cleaned or "ache" in cleaned or "discomfort" in cleaned or "hurt" in cleaned):
            return f"{part}_pain"

    return cleaned.replace(" ", "_")

def normalize_symptom_list(symptoms: List[str]) -> List[str]:
    """Normalize a list of raw symptom strings, removing duplicates while preserving order."""
    normalized = []
    seen = set()
    for s in symptoms:
        norm = normalize_symptom(s)
        if norm and norm not in seen:
            seen.add(norm)
            normalized.append(norm)
    return normalized

def format_symptom_title(symptom_key: str) -> str:
    """Format canonical symptom key to a clean title for user display."""
    if not symptom_key:
        return "General Concern"
    
    # Custom titles for key findings
    custom_titles = {
        "knee_pain": "Knee Pain",
        "joint_pain": "Joint Pain",
        "inability_to_bear_weight": "Inability to Bear Weight",
        "joint_deformity": "Joint Deformity / Misalignment",
        "joint_warmth_redness": "Joint Warmth / Erythema",
        "knee_locking": "Mechanical Knee Locking / Instability",
        "trauma_injury": "Acute Trauma / Injury Mechanism",
        "thunderclap_headache": "Sudden Severe Thunderclap Headache",
        "facial_droop_weakness": "Acute Focal Neurological Deficit",
        "shortness_of_breath": "Shortness of Breath",
        "left_arm_radiation": "Radiation to Arm / Jaw",
        "burning_urination": "Dysuria (Burning Urination)",
    }
    if symptom_key in custom_titles:
        return custom_titles[symptom_key]
    return symptom_key.replace("_", " ").title()

# ─── Dynamic Natural Language Symptom Extractor Across Message History ──────

COMMON_BODY_PARTS = [
    "knee", "joint", "back", "neck", "shoulder", "elbow", "wrist", "hip", "ankle",
    "foot", "leg", "arm", "throat", "head", "chest", "stomach", "abdomen", "belly",
    "ear", "eye", "tooth", "muscle"
]

# Explicit negation triggers
NEGATION_PATTERNS = [
    r"\b(?:no|not|denies|denied|without|never had|don't have|dont have|do not have|no longer|none of|negative for)\b\s+([a-zA-Z\s]{2,30})",
    r"\b(?:can bear weight|able to walk|can walk|walk fine|walking is fine|no trouble walking)\b",
    r"\b(?:no swelling|no redness|no fever|no fall|no injury|no trauma|no locking|no chest pain|no breathlessness)\b",
]

def extract_cumulative_symptoms(
    messages: List[Dict[str, str]],
    llm_symptoms: List[str] | None = None
) -> Dict[str, Any]:
    """
    Extracts and accumulates symptoms across ALL user turns in the conversation.
    Tracks positive, negative (explicitly denied), and unknown findings separately.
    Builds structured Q&A history and captures original complaint in user's own words.
    """
    detected_chronological: List[str] = []
    denied_symptoms: set = set()
    original_complaint = ""
    qa_history: List[Dict[str, str]] = []

    last_assistant_question = ""

    for msg in messages:
        sender = msg.get("sender", "")
        content = msg.get("content", "").strip()

        if sender == "assistant":
            last_assistant_question = content
            continue

        if sender == "user":
            if not original_complaint:
                original_complaint = content
            
            if last_assistant_question:
                qa_history.append({
                    "question": last_assistant_question,
                    "answer": content
                })
                last_assistant_question = ""

            text = content.lower().strip()

            # 1. Check for explicit negations/denials
            # Specific domain-level denial phrases
            if re.search(r"\b(?:can bear weight|able to walk|can walk|walk fine|walking is fine)\b", text):
                denied_symptoms.add("inability_to_bear_weight")
            if re.search(r"\b(?:no fall|no injury|no trauma|no accident|didn't fall|did not fall|no twist)\b", text):
                denied_symptoms.add("trauma_injury")
            if re.search(r"\b(?:no swelling|not swollen|no fluid)\b", text):
                denied_symptoms.add("swelling")
            if re.search(r"\b(?:no warmth|no redness|not hot|not red|no fever|no high temperature)\b", text):
                denied_symptoms.add("joint_warmth_redness")
                denied_symptoms.add("fever")
            if re.search(r"\b(?:no locking|no clicking|doesn't give way|does not lock|bends fine)\b", text):
                denied_symptoms.add("knee_locking")
            if re.search(r"\b(?:no deformity|looks normal shape|not deformed)\b", text):
                denied_symptoms.add("joint_deformity")

            # General regex negations
            for canon, syns in SYMPTOM_SYNONYMS.items():
                for syn in [canon.replace("_", " ")] + syns:
                    neg_pattern = rf"\b(?:no|not|denies|denied|without|don't have|dont have|do not have|no longer|never had)\b[^\.\n]*\b{re.escape(syn)}\b"
                    if re.search(neg_pattern, text):
                        denied_symptoms.add(canon)

            # 2. Match positive mentions against SYMPTOM_SYNONYMS
            for canon, syns in SYMPTOM_SYNONYMS.items():
                if canon in denied_symptoms:
                    continue
                for syn in [canon.replace("_", " ")] + syns:
                    pos_pattern = rf"(?<!\bno\s)(?<!\bnot\s)(?<!\bdon't\s)(?<!\bdont\s)(?<!\bwithout\s)\b{re.escape(syn)}\b"
                    if re.search(pos_pattern, text):
                        if canon not in detected_chronological:
                            detected_chronological.append(canon)
                        break

            # 3. Dynamic regex matching for body part pains (e.g. "severe pain in my left knee")
            for part in COMMON_BODY_PARTS:
                canon_name = f"{part}_pain"
                if canon_name not in denied_symptoms and canon_name not in detected_chronological:
                    if part in text and ("pain" in text or "ache" in text or "discomfort" in text or "hurting" in text or "hurts" in text):
                        detected_chronological.append(canon_name)

            # 4. Direct simple phrase extraction
            phrase_matches = re.findall(r"(?:i have|having|experiencing|suffering from|got)\s+([a-zA-Z\s]{3,30}?)(?:[\.,\n]|$|and|also|since|for)", text)
            for phrase in phrase_matches:
                clean_p = phrase.strip()
                if clean_p not in ["a lot", "some", "bad", "this", "it", "that", "something", "a bit", "issues", "problem", "no pain"]:
                    norm_p = normalize_symptom(clean_p)
                    if norm_p and norm_p not in denied_symptoms and norm_p not in detected_chronological:
                        detected_chronological.append(norm_p)

    # 5. Merge any LLM-extracted symptoms that were not denied
    if llm_symptoms:
        for s in llm_symptoms:
            norm = normalize_symptom(s)
            if norm and norm not in denied_symptoms and norm not in detected_chronological:
                if norm not in ["symptom_1", "symptom_2", "primary_symptom_name", "associated_symptom_name"]:
                    detected_chronological.append(norm)

    # Filter out any denied symptoms from final positive list
    final_symptoms = [s for s in detected_chronological if s not in denied_symptoms]

    if not final_symptoms:
        final_symptoms = ["general_discomfort"]

    primary_key = final_symptoms[0]
    associated_keys = final_symptoms[1:]

    # Build positive and negative findings lists
    positive_findings = [format_symptom_title(s) for s in final_symptoms if s != "general_discomfort"]
    negative_findings = [format_symptom_title(s) for s in denied_symptoms]

    # Evaluate unknown / missing triage dimensions for key complaints
    unknown_findings = []
    limitations = []

    combined_text = " ".join([m.get("content", "") for m in messages if m.get("sender") == "user"]).lower()

    if "knee_pain" in final_symptoms or "joint_pain" in final_symptoms:
        # Check if weight bearing was addressed
        if "inability_to_bear_weight" not in final_symptoms and "inability_to_bear_weight" not in denied_symptoms:
            if not any(w in combined_text for w in ["walk", "weight", "stand", "step", "bearing"]):
                unknown_findings.append("Weight-bearing & ambulatory mobility status")
                limitations.append("Ability to bear weight was not evaluated; Ottawa Knee Rule fracture screening is incomplete.")
        
        # Check if trauma mechanism was addressed
        if "trauma_injury" not in final_symptoms and "trauma_injury" not in denied_symptoms:
            if not any(w in combined_text for w in ["fall", "injury", "twist", "accident", "sports", "hit", "trauma"]):
                unknown_findings.append("Trauma / twisting injury mechanism")

        # Check if joint warmth/fever was addressed
        if "fever" not in final_symptoms and "fever" not in denied_symptoms and "joint_warmth_redness" not in final_symptoms and "joint_warmth_redness" not in denied_symptoms:
            if not any(w in combined_text for w in ["fever", "hot", "red", "warmth", "temperature", "warm"]):
                unknown_findings.append("Presence of fever or hot/erythematous joint (Septic joint screening)")

    elif "headache" in final_symptoms:
        if "stiff_neck" not in final_symptoms and "stiff_neck" not in denied_symptoms and "fever" not in final_symptoms and "fever" not in denied_symptoms:
            if not any(w in combined_text for w in ["neck", "stiff", "fever", "temperature"]):
                unknown_findings.append("Neck stiffness & high fever (Meningeal irritation signs)")

    elif "chest_pain" in final_symptoms:
        if "shortness_of_breath" not in final_symptoms and "shortness_of_breath" not in denied_symptoms:
            if not any(w in combined_text for w in ["breathe", "breath", "dyspnea"]):
                unknown_findings.append("Shortness of breath / respiratory distress")

    return {
        "primary_symptom": format_symptom_title(primary_key),
        "associated_symptoms": [format_symptom_title(s) for s in associated_keys],
        "all_symptoms": final_symptoms,
        "formatted_symptoms": [format_symptom_title(s) for s in final_symptoms],
        "positive_findings": positive_findings,
        "negative_findings": negative_findings,
        "unknown_findings": unknown_findings,
        "limitations": limitations,
        "original_complaint": original_complaint,
        "qa_history": qa_history,
    }


# ─── Clinical Disease Rule Definitions ───────────────────────────────────────

DISEASE_RULES: List[Dict[str, Any]] = [
    # ── Emergency Rules ──
    {
        "disease": "Acute Coronary Syndrome (Suspected Cardiac Event)",
        "required_symptoms": ["chest_pain"],
        "supporting_symptoms": [
            "left_arm_radiation", "shortness_of_breath", "sweating", "dizziness", "nausea"
        ],
        "base_confidence": 0.65,
        "max_confidence": 0.96,
        "urgency_tier": "EMERGENCY",
        "emergency_flag": True,
        "specialist": "Cardiologist (Emergency Medicine)",
        "specialist_code": "CARDIOLOGY",
        "explanation": (
            "Chest discomfort accompanied by radiation to the arm/jaw, breathlessness, or diaphoresis "
            "carries high risk of an acute coronary syndrome. Immediate emergency medical intervention is vital."
        ),
        "recommended_action": "Seek immediate emergency medical attention or call 108 / 112 immediately."
    },
    {
        "disease": "Acute Cerebrovascular Event (Suspected Stroke / TIA)",
        "required_symptoms": ["facial_droop_weakness"],
        "supporting_symptoms": [
            "dizziness", "headache", "shortness_of_breath"
        ],
        "base_confidence": 0.75,
        "max_confidence": 0.98,
        "urgency_tier": "EMERGENCY",
        "emergency_flag": True,
        "specialist": "Neurologist (Emergency)",
        "specialist_code": "NEUROLOGY",
        "explanation": (
            "Sudden unilateral weakness, facial droop, or speech impairment indicates an acute stroke. "
            "Time is critical for brain tissue preservation."
        ),
        "recommended_action": "Proceed to the nearest stroke-ready hospital emergency department immediately."
    },
    {
        "disease": "Septic Arthritis / Acute Infectious Arthropathy",
        "required_symptoms": ["knee_pain", "fever"],
        "supporting_symptoms": [
            "joint_warmth_redness", "inability_to_bear_weight", "swelling", "body_aches"
        ],
        "base_confidence": 0.70,
        "max_confidence": 0.95,
        "urgency_tier": "EMERGENCY",
        "emergency_flag": True,
        "specialist": "Orthopedic Surgeon (Emergency)",
        "specialist_code": "ORTHOPEDICS",
        "explanation": (
            "Acute joint pain accompanied by fever and joint erythema/warmth or severe immobility is a clinical emergency "
            "for septic arthritis, requiring immediate arthrocentesis to prevent joint destruction and systemic sepsis."
        ),
        "recommended_action": "Seek immediate emergency medical evaluation or proceed to the nearest emergency department."
    },
    {
        "disease": "Bacterial Meningitis (Suspected)",
        "required_symptoms": ["fever", "stiff_neck"],
        "supporting_symptoms": [
            "headache", "nausea", "vomiting", "dizziness", "thunderclap_headache"
        ],
        "base_confidence": 0.70,
        "max_confidence": 0.95,
        "urgency_tier": "EMERGENCY",
        "emergency_flag": True,
        "specialist": "Neurologist (Emergency)",
        "specialist_code": "NEUROLOGY",
        "explanation": (
            "High fever paired with neck stiffness and severe headache is a clinical red flag for central nervous system infection."
        ),
        "recommended_action": "Seek emergency medical department evaluation immediately."
    },

    # ── Urgent Rules ──
    {
        "disease": "Acute Traumatic Knee Injury (Suspected Fracture / Ligament Rupture)",
        "required_symptoms": ["knee_pain", "inability_to_bear_weight"],
        "supporting_symptoms": [
            "joint_deformity", "trauma_injury", "knee_locking", "swelling"
        ],
        "base_confidence": 0.65,
        "max_confidence": 0.92,
        "urgency_tier": "URGENT",
        "emergency_flag": False,
        "specialist": "Orthopedic Specialist / Emergency Medicine",
        "specialist_code": "ORTHOPEDICS",
        "explanation": (
            "Acute knee pain with inability to bear weight, locking, or post-traumatic deformity indicates probable acute "
            "ligament tear (ACL/PCL/meniscus) or occult fracture under Ottawa Knee Rules."
        ),
        "recommended_action": "Immobilize the joint, avoid weight-bearing, and obtain urgent orthopedic clinical evaluation and radiography today."
    },
    {
        "disease": "Acute Appendicitis (Suspected Acute Abdomen)",
        "required_symptoms": ["abdominal_pain"],
        "supporting_symptoms": [
            "fever", "nausea", "vomiting", "fatigue"
        ],
        "base_confidence": 0.55,
        "max_confidence": 0.90,
        "urgency_tier": "URGENT",
        "emergency_flag": False,
        "specialist": "General Surgeon",
        "specialist_code": "GENERAL_SURGERY",
        "explanation": (
            "Persistent lower abdominal pain with fever, nausea, or vomiting requires rapid surgical and ultrasound assessment."
        ),
        "recommended_action": "Visit an urgent care center or general surgery clinic within 4 to 6 hours."
    },
    {
        "disease": "Bacterial Pneumonia / Acute Lower Respiratory Infection",
        "required_symptoms": ["cough", "fever"],
        "supporting_symptoms": [
            "shortness_of_breath", "chest_pain", "body_aches", "sweating", "fatigue"
        ],
        "base_confidence": 0.60,
        "max_confidence": 0.92,
        "urgency_tier": "URGENT",
        "emergency_flag": False,
        "specialist": "Pulmonologist",
        "specialist_code": "PULMONOLOGY",
        "explanation": (
            "High fever coupled with persistent cough, breathlessness, and chest tightness suggests lower respiratory involvement."
        ),
        "recommended_action": "Schedule a clinical evaluation, chest auscultation, and radiography today."
    },

    # ── Non-Urgent Rules ──
    {
        "disease": "Acute Pharyngitis / Upper Respiratory Tract Infection",
        "required_symptoms": ["throat_pain"],
        "supporting_symptoms": [
            "fever", "body_aches", "cough", "headache", "fatigue", "nausea"
        ],
        "base_confidence": 0.55,
        "max_confidence": 0.88,
        "urgency_tier": "NON_URGENT",
        "emergency_flag": False,
        "specialist": "ENT Specialist / General Physician",
        "specialist_code": "ENT",
        "explanation": (
            "Throat discomfort accompanied by systemic signs such as body aches or nausea is characteristic of acute pharyngitis or upper respiratory tract infection."
        ),
        "recommended_action": "Maintain warm saline gargles, adequate hydration, and schedule an outpatient consultation with a general physician or ENT specialist."
    },
    {
        "disease": "Acute Bronchitis / Respiratory Infection",
        "required_symptoms": ["cough"],
        "supporting_symptoms": [
            "fever", "shortness_of_breath", "fatigue", "body_aches", "throat_pain"
        ],
        "base_confidence": 0.50,
        "max_confidence": 0.85,
        "urgency_tier": "NON_URGENT",
        "emergency_flag": False,
        "specialist": "Pulmonologist / General Physician",
        "specialist_code": "PULMONOLOGY",
        "explanation": (
            "Cough with mild respiratory signs is consistent with bronchial airway inflammation. "
            "Supportive care, hydration, and medical review are recommended."
        ),
        "recommended_action": "Consult a primary care physician within 24 to 48 hours if symptoms do not improve."
    },
    {
        "disease": "Migraine Episode",
        "required_symptoms": ["headache"],
        "supporting_symptoms": [
            "nausea", "vomiting", "dizziness", "fatigue"
        ],
        "base_confidence": 0.50,
        "max_confidence": 0.88,
        "urgency_tier": "NON_URGENT",
        "emergency_flag": False,
        "specialist": "Neurologist",
        "specialist_code": "NEUROLOGY",
        "explanation": (
            "Moderate to severe throbbing headache associated with nausea or sensory sensitivity suggests a migraine pattern."
        ),
        "recommended_action": "Rest in a quiet, dark environment. Consult a neurologist or physician for targeted migraine management."
    },
    {
        "disease": "Gastroenteritis (Acute Stomach Flu)",
        "required_symptoms": ["nausea"],
        "supporting_symptoms": [
            "vomiting", "abdominal_pain", "fever", "body_aches", "fatigue"
        ],
        "base_confidence": 0.50,
        "max_confidence": 0.87,
        "urgency_tier": "NON_URGENT",
        "emergency_flag": False,
        "specialist": "Gastroenterologist / General Physician",
        "specialist_code": "GASTROENTEROLOGY",
        "explanation": (
            "Nausea and gastrointestinal distress with associated aches is consistent with gastroenteritis. Hydration and rest are essential."
        ),
        "recommended_action": "Maintain oral rehydration salts (ORS). Consult a physician if vomiting persists or signs of dehydration develop."
    },
    {
        "disease": "Gastroesophageal Reflux Disease (GERD)",
        "required_symptoms": ["heartburn"],
        "supporting_symptoms": [
            "chest_pain", "nausea"
        ],
        "base_confidence": 0.50,
        "max_confidence": 0.85,
        "urgency_tier": "NON_URGENT",
        "emergency_flag": False,
        "specialist": "Gastroenterologist",
        "specialist_code": "GASTROENTEROLOGY",
        "explanation": (
            "Burning retrosternal discomfort and acid regurgitation without cardiac red flags points to acid reflux."
        ),
        "recommended_action": "Schedule an outpatient consultation with a gastroenterologist or general physician."
    },
    {
        "disease": "Urinary Tract Infection (UTI)",
        "required_symptoms": ["burning_urination"],
        "supporting_symptoms": [
            "abdominal_pain", "fever", "fatigue"
        ],
        "base_confidence": 0.55,
        "max_confidence": 0.90,
        "urgency_tier": "NON_URGENT",
        "emergency_flag": False,
        "specialist": "Urologist / General Physician",
        "specialist_code": "UROLOGY",
        "explanation": (
            "Dysuria and urinary discomfort indicate urinary tract irritation or bacterial cystitis."
        ),
        "recommended_action": "Provide a clean-catch urine sample for urinalysis at your local clinic."
    },

    # ── Routine Rules ──
    {
        "disease": "Musculoskeletal Strain / Joint & Ligament Evaluation",
        "required_symptoms": ["knee_pain", "joint_pain", "back_pain"],
        "required_match_mode": "any",
        "supporting_symptoms": [
            "swelling", "body_aches", "fatigue"
        ],
        "base_confidence": 0.60,
        "max_confidence": 0.88,
        "urgency_tier": "ROUTINE",
        "emergency_flag": False,
        "specialist": "Orthopedic Specialist / General Physician",
        "specialist_code": "ORTHOPEDICS",
        "explanation": (
            "Localized joint or muscle discomfort without acute neurovascular compromise or inability to bear weight "
            "is characteristic of musculoskeletal strain or joint irritation."
        ),
        "recommended_action": "Apply joint rest, ice/elevation, and schedule an outpatient evaluation with an orthopedic doctor or general physician if symptoms persist."
    },
    {
        "disease": "Viral Upper Respiratory Syndrome (Influenza-like Illness)",
        "required_symptoms": ["fever"],
        "supporting_symptoms": [
            "body_aches", "fatigue", "headache", "cough", "throat_pain", "nausea"
        ],
        "base_confidence": 0.50,
        "max_confidence": 0.88,
        "urgency_tier": "ROUTINE",
        "emergency_flag": False,
        "specialist": "General Physician",
        "specialist_code": "GENERAL_MEDICINE",
        "explanation": (
            "Fever with generalized body aches and fatigue is consistent with a standard viral infection."
        ),
        "recommended_action": "Maintain adequate hydration, oral antipyretics, and rest. Follow up with your GP if fever persists past 3 days."
    },
    {
        "disease": "Tension-Type Headache",
        "required_symptoms": ["headache"],
        "supporting_symptoms": [
            "fatigue", "body_aches"
        ],
        "base_confidence": 0.45,
        "max_confidence": 0.82,
        "urgency_tier": "ROUTINE",
        "emergency_flag": False,
        "specialist": "General Physician",
        "specialist_code": "GENERAL_MEDICINE",
        "explanation": (
            "Bilateral band-like pressure without visual changes or neurological deficits is typical of tension headache."
        ),
        "recommended_action": "Engage in stress reduction, regular hydration, and routine primary care follow-up if needed."
    },
]


def _match_symptoms_count(canonical_symptoms: List[str], target_keys: List[str]) -> Tuple[int, List[str]]:
    """Counts how many target keys are present in canonical_symptoms."""
    matched = []
    for key in target_keys:
        if key in canonical_symptoms:
            matched.append(key)
    return len(matched), matched


# ─── Main Deterministic Rule-Based Predictor ─────────────────────────────────

def predict_disease(
    raw_symptoms: List[str],
    cumulative_data: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Deterministically computes clinical urgency, triggered red flags,
    findings breakdown, and specialist recommendation purely from Python clinical rules.
    """
    if not raw_symptoms:
        return _no_match_result([], cumulative_data)

    canonical_symptoms = normalize_symptom_list(raw_symptoms)
    if not canonical_symptoms:
        return _no_match_result(raw_symptoms, cumulative_data)

    scored = []

    for rule in DISEASE_RULES:
        req = rule["required_symptoms"]
        sup = rule["supporting_symptoms"]
        urgency = rule.get("urgency_tier", "ROUTINE")
        is_emergency = urgency == "EMERGENCY" or rule.get("emergency_flag", False)
        is_urgent = urgency == "URGENT"
        match_mode = rule.get("required_match_mode", "all")

        matched_req_count, matched_req_keys = _match_symptoms_count(canonical_symptoms, req)
        matched_sup_count, matched_sup_keys = _match_symptoms_count(canonical_symptoms, sup)

        total_req = max(len(req), 1)
        total_sup = max(len(sup), 1)

        # EMERGENCY RULES: Mandatory red flags must all be satisfied!
        if is_emergency:
            if matched_req_count < len(req):
                continue
        elif is_urgent:
            # Urgent rules require satisfying mandatory keys
            if match_mode == "any":
                if matched_req_count == 0:
                    continue
            else:
                if matched_req_count < len(req):
                    continue
        else:
            if match_mode == "any":
                if matched_req_count == 0:
                    continue
            else:
                if matched_req_count < len(req):
                    continue

        req_ratio = matched_req_count / total_req
        sup_ratio = matched_sup_count / total_sup

        # Weighted calculation
        raw_conf = (req_ratio * 0.70) + (sup_ratio * 0.30)
        conf_range = rule["max_confidence"] - rule["base_confidence"]
        final_conf = round(rule["base_confidence"] + (raw_conf * conf_range), 3)
        final_conf = min(final_conf, rule["max_confidence"])

        # Create clean, readable triggered indicators
        triggered_labels = []
        for k in (matched_req_keys + matched_sup_keys):
            triggered_labels.append(format_symptom_title(k))

        scored.append((final_conf, rule, list(dict.fromkeys(triggered_labels))))

    if not scored:
        return _no_match_result(canonical_symptoms, cumulative_data)

    # Sort descending: EMERGENCY first, then URGENT, then confidence score
    tier_priority = {"EMERGENCY": 3, "URGENT": 2, "NON_URGENT": 1, "ROUTINE": 0}
    scored.sort(key=lambda x: (tier_priority.get(x[1]["urgency_tier"], 0), x[0]), reverse=True)

    # Top match
    top_conf, top_rule, top_triggered = scored[0]

    # Differential diagnoses
    differential = []
    for idx, (conf, rule_item, trigs) in enumerate(scored[:4]):
        differential.append({
            "disease_name": rule_item["disease"],
            "confidence_score": conf,
            "is_top_match": idx == 0,
            "triggered_rules": trigs,
            "urgency_tier": rule_item["urgency_tier"],
        })

    urgency_tier = top_rule["urgency_tier"]
    emergency_flag = top_rule["emergency_flag"]

    # Format human-readable urgency explanation
    human_explanation = (
        f"Based on the clinical indicators reported ({', '.join(top_triggered)}), "
        f"this assessment has been classified as {urgency_tier}. "
        f"{top_rule['explanation']} {top_rule['recommended_action']}"
    )

    specialist_name = top_rule.get("specialist", "General Physician")
    specialist_code = top_rule.get("specialist_code", "GENERAL_MEDICINE")
    dept_name = specialist_name.split("/")[0].strip()
    specialist_reason = (
        f"The symptoms identified during assessment ({', '.join(top_triggered)}) are primarily associated "
        f"with the {dept_name} domain."
    )

    recommended_specialist = {
        "name": specialist_name,
        "code": specialist_code,
        "department": dept_name,
        "reason": specialist_reason,
    }

    # Extract metadata fields
    positive_findings = cumulative_data.get("positive_findings", [format_symptom_title(s) for s in canonical_symptoms]) if cumulative_data else [format_symptom_title(s) for s in canonical_symptoms]
    negative_findings = cumulative_data.get("negative_findings", []) if cumulative_data else []
    unknown_findings = cumulative_data.get("unknown_findings", []) if cumulative_data else []
    limitations = cumulative_data.get("limitations", []) if cumulative_data else []
    original_complaint = cumulative_data.get("original_complaint", "") if cumulative_data else ""
    qa_history = cumulative_data.get("qa_history", []) if cumulative_data else []

    return {
        "predicted_disease": top_rule["disease"],
        "confidence_score": top_conf,
        "prediction_model": "Clinical Decision Rule Engine v2.5",
        "differential": differential,
        "triggered_rules": top_triggered,
        "severity": urgency_tier.lower(),
        "urgency_level": urgency_tier,
        "emergency_flag": emergency_flag,
        "specialist": specialist_name,
        "specialist_code": specialist_code,
        "recommended_specialist": recommended_specialist,
        "explanation": human_explanation,
        "recommended_action": top_rule.get("recommended_action", ""),
        "canonical_symptoms": canonical_symptoms,
        "original_complaint": original_complaint,
        "qa_history": qa_history,
        "positive_findings": positive_findings,
        "negative_findings": negative_findings,
        "unknown_findings": unknown_findings,
        "limitations": limitations,
        "disclaimer": (
            "Clinical Triage Notice: This assessment provides structured triage navigation based on reported findings. "
            "It does not constitute a formal medical diagnosis. If symptoms worsen or severe signs emerge, seek immediate medical care."
        ),
    }


def _no_match_result(
    canonical_symptoms: List[str],
    cumulative_data: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    norm_list = normalize_symptom_list(canonical_symptoms) if canonical_symptoms else ["general_discomfort"]
    triggered = [format_symptom_title(s) for s in norm_list]
    primary_title = triggered[0] if triggered else "General Inquiry"
    
    recommended_specialist = {
        "name": "General Physician",
        "code": "GENERAL_MEDICINE",
        "department": "General Physician",
        "reason": f"Based on the reported symptom ({', '.join(triggered)}), standard outpatient evaluation by a primary care physician is recommended.",
    }

    positive_findings = cumulative_data.get("positive_findings", triggered) if cumulative_data else triggered
    negative_findings = cumulative_data.get("negative_findings", []) if cumulative_data else []
    unknown_findings = cumulative_data.get("unknown_findings", []) if cumulative_data else []
    limitations = cumulative_data.get("limitations", []) if cumulative_data else []
    original_complaint = cumulative_data.get("original_complaint", "") if cumulative_data else ""
    qa_history = cumulative_data.get("qa_history", []) if cumulative_data else []

    return {
        "predicted_disease": f"Clinical Evaluation for {primary_title}",
        "confidence_score": 0.50,
        "prediction_model": "Clinical Decision Rule Engine v2.5",
        "differential": [],
        "triggered_rules": triggered,
        "severity": "routine",
        "urgency_level": "ROUTINE",
        "emergency_flag": False,
        "specialist": "General Physician",
        "specialist_code": "GENERAL_MEDICINE",
        "recommended_specialist": recommended_specialist,
        "explanation": f"Based on the reported symptom ({', '.join(triggered)}), standard outpatient evaluation by a primary care physician is recommended.",
        "recommended_action": "Schedule an outpatient consultation with a primary care general physician.",
        "canonical_symptoms": norm_list,
        "original_complaint": original_complaint,
        "qa_history": qa_history,
        "positive_findings": positive_findings,
        "negative_findings": negative_findings,
        "unknown_findings": unknown_findings,
        "limitations": limitations,
        "disclaimer": (
            "Clinical Triage Notice: This assessment provides structured triage navigation based on reported findings. "
            "It does not constitute a formal medical diagnosis."
        ),
    }


# ─── Generative AI Augmentation (Deterministic Guardrails Enforced) ─────────

async def predict_disease_generative(
    symptoms: List[str],
    patient_context_summary: str = "",
    cumulative_data: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Generative AI Symptom Assessment.
    CRITICAL SAFETY CONSTRAINT:
    The deterministic Python Rule Engine determines urgency_level, emergency_flag,
    and specialist. Gemini provides narrative context and nuance without overriding the rules.
    """
    # 1. Run deterministic Python Rule Engine FIRST
    deterministic_result = predict_disease(symptoms, cumulative_data)

    # 2. If no Gemini API key, return deterministic result directly
    from app.config import settings
    if not settings.GOOGLE_API_KEY:
        return deterministic_result

    # 3. Augment with Gemini narrative while preserving deterministic urgency
    from app.core.llm import invoke_gemini
    from langchain_core.messages import SystemMessage, HumanMessage

    SYSTEM_PROMPT = f"""You are a professional Medical Communication Specialist assisting with symptom triage.
The clinical decision engine has computed the following deterministic assessment:
- Primary Suspected Assessment: {deterministic_result['predicted_disease']}
- Urgency Level: {deterministic_result['urgency_level']}
- Triggered Red Flags: {', '.join(deterministic_result['triggered_rules'])}
- Recommended Specialist: {deterministic_result['specialist']}

Your task is to provide a calm, clear, patient-friendly narrative explanation of why this urgency level was assigned and what next steps are advised.
DO NOT provide a definitive medical diagnosis (do not say "You definitely have X").
DO NOT alter the Urgency Level or Recommended Specialist.

Respond in JSON format:
{{
  "explanation": "A clear, empathetic, 2-3 sentence explanation for the patient detailing what was identified, why the urgency level was assigned, and next steps."
}}
"""

    user_text = f"Reported Symptoms: {', '.join(symptoms)}"
    if patient_context_summary:
        user_text += f"\nPatient Context: {patient_context_summary}"

    try:
        res_text = await invoke_gemini([
            SystemMessage(content=SYSTEM_PROMPT),
            HumanMessage(content=user_text)
        ], temperature=0.2)

        import json
        if "```json" in res_text:
            res_text = res_text.split("```json")[1].split("```")[0].strip()
        elif "```" in res_text:
            res_text = res_text.split("```")[1].split("```")[0].strip()

        data = json.loads(res_text)
        if data.get("explanation"):
            deterministic_result["explanation"] = data["explanation"]
    except Exception as e:
        print(f"[WARN] Generative narrative explanation error: {e}")

    return deterministic_result

