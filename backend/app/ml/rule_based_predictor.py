"""
Rule-Based Disease Prediction Engine.
Replaces XGBoost with a transparent, clinical rule-based classifier.

Each disease has:
  - required_symptoms : symptom keywords that must match (all needed = high confidence)
  - supporting_symptoms: optional supporting symptoms that boost confidence
  - base_confidence : minimum confidence if only required symptoms match
  - max_confidence  : maximum reachable confidence (with all supporting symptoms)
  - specialist       : recommended specialist
  - urgency          : severity level for this disease

Confidence Score Formula:
  matched_required / total_required * weight(0.7)
  + matched_supporting / total_supporting * weight(0.3)
  = normalized 0.0 → max_confidence
"""

from typing import List, Dict, Any, Tuple


# ─── Clinical Disease Rule Definitions ───────────────────────────────────────

DISEASE_RULES: List[Dict[str, Any]] = [
    {
        "disease": "Acute Coronary Syndrome (Heart Attack)",
        "required_symptoms": ["chest_pain", "chest pain"],
        "supporting_symptoms": [
            "left_arm_radiation", "left arm", "radiation", "shortness_of_breath",
            "sweating", "nausea", "dizziness", "jaw pain", "neck pain", "pressure"
        ],
        "base_confidence": 0.55,
        "max_confidence": 0.95,
        "severity": "emergency",
        "urgency_level": "EMERGENCY — Immediate ER / Ambulance Required",
        "emergency_flag": True,
        "specialist": "Cardiologist (Emergency)",
        "explanation": (
            "Chest pain with radiation to the left arm and associated sweating or breathlessness "
            "strongly suggests a cardiac event. Call emergency services (112/911) immediately."
        ),
    },
    {
        "disease": "Influenza / Viral Fever",
        "required_symptoms": ["fever"],
        "supporting_symptoms": [
            "body_aches", "body aches", "chills", "fatigue", "headache",
            "cough", "sore throat", "nasal_congestion", "runny nose", "muscle pain"
        ],
        "base_confidence": 0.50,
        "max_confidence": 0.88,
        "severity": "low",
        "urgency_level": "Routine — Rest and Hydration Recommended",
        "emergency_flag": False,
        "specialist": "General Physician",
        "explanation": (
            "Fever with body aches, chills, and fatigue is consistent with influenza or a viral illness. "
            "Rest, hydration, and over-the-counter antipyretics are recommended. "
            "Consult a GP if symptoms worsen or fever exceeds 103°F (39.4°C)."
        ),
    },
    {
        "disease": "Tension-Type Headache",
        "required_symptoms": ["headache"],
        "supporting_symptoms": [
            "stress", "neck tightness", "neck_tightness", "fatigue",
            "eye strain", "pressure", "throbbing", "temples", "forehead"
        ],
        "base_confidence": 0.50,
        "max_confidence": 0.85,
        "severity": "low",
        "urgency_level": "Routine — Primary Care Recommended",
        "emergency_flag": False,
        "specialist": "General Physician / Neurologist",
        "explanation": (
            "A persistent or pressure-type headache around the temples and forehead without fever or neurological signs "
            "is most likely tension-type. Rest, hydration, and mild analgesics usually help. "
            "See a neurologist if headaches are frequent or severe."
        ),
    },
    {
        "disease": "Migraine",
        "required_symptoms": ["headache"],
        "supporting_symptoms": [
            "nausea", "vomiting", "light sensitivity", "sound sensitivity",
            "aura", "throbbing", "one side", "unilateral", "pulsating"
        ],
        "base_confidence": 0.45,
        "max_confidence": 0.87,
        "severity": "moderate",
        "urgency_level": "Moderate — Specialist Consultation Advised",
        "emergency_flag": False,
        "specialist": "Neurologist",
        "explanation": (
            "A throbbing unilateral headache with nausea, light sensitivity, or aura is characteristic of migraine. "
            "Dark, quiet rooms and analgesics help acutely. A neurologist can prescribe preventive therapy."
        ),
    },
    {
        "disease": "Gastroesophageal Reflux Disease (GERD)",
        "required_symptoms": ["chest pain"],
        "supporting_symptoms": [
            "burning", "heartburn", "acid", "belching", "regurgitation",
            "after eating", "lying down", "throat burning", "sour taste"
        ],
        "base_confidence": 0.40,
        "max_confidence": 0.82,
        "severity": "low",
        "urgency_level": "Routine — Lifestyle and Diet Modification",
        "emergency_flag": False,
        "specialist": "Gastroenterologist",
        "explanation": (
            "Burning chest discomfort that worsens after meals or while lying down is typical of GERD. "
            "Antacids and dietary changes often relieve symptoms. A gastroenterologist can confirm with endoscopy."
        ),
    },
    {
        "disease": "Acute Bronchitis / Respiratory Infection",
        "required_symptoms": ["cough"],
        "supporting_symptoms": [
            "fever", "shortness_of_breath", "shortness of breath", "chest_tightness",
            "chest tightness", "mucus", "phlegm", "wheezing", "fatigue", "sore throat"
        ],
        "base_confidence": 0.50,
        "max_confidence": 0.86,
        "severity": "moderate",
        "urgency_level": "Moderate — GP Consultation Within 24-48 Hours",
        "emergency_flag": False,
        "specialist": "Pulmonologist / General Physician",
        "explanation": (
            "A productive cough with chest tightness and possible low-grade fever suggests bronchitis "
            "or a respiratory infection. Rest and fluids are recommended; antibiotics if bacterial cause is confirmed."
        ),
    },
    {
        "disease": "Pneumonia",
        "required_symptoms": ["cough", "fever"],
        "supporting_symptoms": [
            "shortness_of_breath", "shortness of breath", "chest pain",
            "chills", "fatigue", "confusion", "sweating", "yellow phlegm", "green phlegm"
        ],
        "base_confidence": 0.55,
        "max_confidence": 0.90,
        "severity": "high",
        "urgency_level": "Urgent — Seek Medical Attention Soon",
        "emergency_flag": False,
        "specialist": "Pulmonologist / General Physician",
        "explanation": (
            "Fever combined with cough, breathlessness, and chest pain may indicate pneumonia. "
            "Medical evaluation and a chest X-ray are essential. Antibiotics are required if bacterial."
        ),
    },
    {
        "disease": "Gastroenteritis (Stomach Flu)",
        "required_symptoms": ["nausea"],
        "supporting_symptoms": [
            "vomiting", "diarrhea", "abdominal_pain", "abdominal pain",
            "stomach cramps", "loss of appetite", "fever", "dehydration"
        ],
        "base_confidence": 0.50,
        "max_confidence": 0.87,
        "severity": "low",
        "urgency_level": "Routine — Rest and Oral Rehydration",
        "emergency_flag": False,
        "specialist": "Gastroenterologist / General Physician",
        "explanation": (
            "Nausea with vomiting and diarrhea is typical of gastroenteritis. Oral rehydration salts (ORS) "
            "and rest are the mainstay. Seek care if severe dehydration, blood in stool, or fever >38.5°C occurs."
        ),
    },
    {
        "disease": "Urinary Tract Infection (UTI)",
        "required_symptoms": ["burning urination"],
        "supporting_symptoms": [
            "frequent urination", "urgency", "lower abdominal pain", "pelvic pain",
            "blood in urine", "cloudy urine", "fever", "back pain"
        ],
        "base_confidence": 0.55,
        "max_confidence": 0.90,
        "severity": "moderate",
        "urgency_level": "Moderate — GP Visit Recommended",
        "emergency_flag": False,
        "specialist": "Urologist / General Physician",
        "explanation": (
            "Burning or painful urination with increased frequency suggests a UTI. "
            "A urine culture confirms the diagnosis. Antibiotic treatment prescribed by a GP is standard care."
        ),
    },
    {
        "disease": "Hypertensive Episode",
        "required_symptoms": ["dizziness"],
        "supporting_symptoms": [
            "headache", "blurred vision", "nosebleed", "chest pain",
            "shortness_of_breath", "palpitations", "high blood pressure", "hypertension"
        ],
        "base_confidence": 0.40,
        "max_confidence": 0.82,
        "severity": "high",
        "urgency_level": "Urgent — Blood Pressure Check Required",
        "emergency_flag": False,
        "specialist": "Cardiologist / General Physician",
        "explanation": (
            "Sudden dizziness with headache and visual changes may indicate an elevated blood pressure episode. "
            "Check BP immediately. If BP > 180/120 with symptoms, go to ER urgently."
        ),
    },
    {
        "disease": "Anxiety / Panic Disorder",
        "required_symptoms": ["chest pain"],
        "supporting_symptoms": [
            "palpitations", "shortness_of_breath", "dizziness", "sweating",
            "trembling", "fear", "panic", "numbness", "tingling", "stress"
        ],
        "base_confidence": 0.35,
        "max_confidence": 0.78,
        "severity": "moderate",
        "urgency_level": "Moderate — Mental Health / GP Evaluation",
        "emergency_flag": False,
        "specialist": "Psychiatrist / General Physician",
        "explanation": (
            "Chest tightness with palpitations, sweating, and a sense of fear or panic can indicate "
            "anxiety or panic disorder. Breathing exercises help acutely. A GP or psychiatrist can assess further."
        ),
    },
    {
        "disease": "Appendicitis",
        "required_symptoms": ["abdominal_pain"],
        "supporting_symptoms": [
            "abdominal pain", "right side", "lower right", "nausea", "vomiting",
            "fever", "loss of appetite", "rebound tenderness", "guarding"
        ],
        "base_confidence": 0.50,
        "max_confidence": 0.88,
        "severity": "high",
        "urgency_level": "Urgent — ER Evaluation Required",
        "emergency_flag": False,
        "specialist": "General Surgeon / Emergency Medicine",
        "explanation": (
            "Right lower abdominal pain with nausea and fever raises concern for appendicitis. "
            "This is a surgical emergency if confirmed. Go to the emergency room immediately."
        ),
    },
]


# ─── Symptom Normalization ────────────────────────────────────────────────────

def _normalize(symptom: str) -> str:
    """Lowercase and replace underscores/hyphens with spaces."""
    return symptom.lower().strip().replace("_", " ").replace("-", " ")


def _symptoms_match(symptom_list: List[str], keywords: List[str]) -> int:
    """Count how many keywords have at least one match in the symptom list."""
    normalized_symptoms = [_normalize(s) for s in symptom_list]
    count = 0
    for kw in keywords:
        kw_norm = _normalize(kw)
        if any(kw_norm in s or s in kw_norm for s in normalized_symptoms):
            count += 1
    return count


# ─── Main Prediction Engine ───────────────────────────────────────────────────

def predict_disease(symptoms: List[str]) -> Dict[str, Any]:
    """
    Runs rule-based disease prediction on the given symptom list.

    Returns:
        {
            predicted_disease   : str,
            confidence_score    : float (0.0 - 1.0),
            differential        : List[{disease_name, confidence_score, is_top_match, triggered_rules}],
            triggered_rules     : List[str],   # symptoms that matched the top prediction
            severity            : str,
            urgency_level       : str,
            emergency_flag      : bool,
            specialist          : str,
            explanation         : str,
        }
    """
    if not symptoms:
        return _no_match_result()

    scored: List[Tuple[float, Dict[str, Any], List[str]]] = []

    for rule in DISEASE_RULES:
        req = rule["required_symptoms"]
        sup = rule["supporting_symptoms"]

        matched_req = _symptoms_match(symptoms, req)
        matched_sup = _symptoms_match(symptoms, sup)

        total_req = max(len(req), 1)
        total_sup = max(len(sup), 1)

        req_ratio = matched_req / total_req
        sup_ratio = matched_sup / total_sup

        # Only consider if at least one required symptom matched
        if matched_req == 0:
            continue

        # Weighted confidence
        raw_confidence = (req_ratio * 0.70) + (sup_ratio * 0.30)

        # Scale to disease's confidence range
        confidence_range = rule["max_confidence"] - rule["base_confidence"]
        final_confidence = rule["base_confidence"] + (raw_confidence * confidence_range)
        final_confidence = round(min(final_confidence, rule["max_confidence"]), 3)

        # Build triggered rules list (human-readable)
        triggered = []
        for kw in req:
            if _symptoms_match(symptoms, [kw]) > 0:
                triggered.append(kw.replace("_", " ").title())
        for kw in sup:
            if _symptoms_match(symptoms, [kw]) > 0:
                triggered.append(kw.replace("_", " ").title())

        scored.append((final_confidence, rule, list(dict.fromkeys(triggered))))  # deduplicate

    if not scored:
        return _no_match_result()

    # Sort by confidence descending
    scored.sort(key=lambda x: x[0], reverse=True)

    # Build differential diagnosis list (top 5)
    differential = []
    for idx, (conf, rule, _) in enumerate(scored[:5]):
        differential.append({
            "disease_name": rule["disease"],
            "confidence_score": conf,
            "is_top_match": idx == 0,
            "triggered_rules": scored[idx][2],
        })

    top_conf, top_rule, top_triggered = scored[0]

    return {
        "predicted_disease": top_rule["disease"],
        "confidence_score": top_conf,
        "prediction_model": "Rule-Based Clinical Engine v1",
        "differential": differential,
        "triggered_rules": top_triggered,
        "severity": top_rule["severity"],
        "urgency_level": top_rule["urgency_level"],
        "emergency_flag": top_rule["emergency_flag"],
        "specialist": top_rule["specialist"],
        "explanation": top_rule["explanation"],
    }


def _no_match_result() -> Dict[str, Any]:
    """Returns a safe fallback when no symptoms match any rule."""
    return {
        "predicted_disease": "Undetermined — General Assessment Required",
        "confidence_score": 0.0,
        "prediction_model": "Rule-Based Clinical Engine v1",
        "differential": [],
        "triggered_rules": [],
        "severity": "low",
        "urgency_level": "Routine — GP Consultation Recommended",
        "emergency_flag": False,
        "specialist": "General Physician",
        "explanation": (
            "Insufficient symptom information to determine a specific condition. "
            "Please consult a general physician for a comprehensive evaluation."
        ),
    }
