"""
Rule-Based Disease Prediction & Clinical Decision Engine.
Authoritative, deterministic clinical rules for severity, urgency classification,
red-flag detection, specialist recommendations, and dynamic natural language symptom extraction.
"""

from typing import List, Dict, Any, Tuple
import re

# ─── Canonical Symptom Synonyms & Normalization ──────────────────────────────

SYMPTOM_SYNONYMS: Dict[str, List[str]] = {
    "knee_pain": [
        "knee pain", "pain in knee", "knee discomfort", "hurting knee", "swollen knee",
        "knee ache", "patellar pain", "pain in my knee", "right knee pain", "left knee pain", "both knees pain"
    ],
    "joint_pain": [
        "joint pain", "pain in joints", "aching joints", "arthralgia", "arthritis",
        "shoulder pain", "elbow pain", "wrist pain", "hip pain", "ankle pain", "joint stiffness"
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
        "body aches", "body pain", "muscle pain", "myalgia", "joint pain",
        "generalized aches", "aching all over", "sore muscles", "aches", "body ache", "all over body pain"
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
    "stiff_neck": [
        "stiff neck", "neck stiffness", "cannot bend neck", "nuchal rigidity",
        "pain moving neck", "neck rigidity"
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
        "cannot speak", "facial numbness", "stroke symptoms", "sudden weakness"
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
    "swelling": [
        "swelling", "swollen", "inflammation", "edema", "puffy"
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
            if syn == cleaned or f" {syn} " in f" {cleaned} ":
                return canonical
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
    return symptom_key.replace("_", " ").title()

# ─── Dynamic Natural Language Symptom Extractor Across Message History ──────

COMMON_BODY_PARTS = [
    "knee", "joint", "back", "neck", "shoulder", "elbow", "wrist", "hip", "ankle",
    "foot", "leg", "arm", "throat", "head", "chest", "stomach", "abdomen", "belly",
    "ear", "eye", "tooth", "muscle"
]

def extract_cumulative_symptoms(
    messages: List[Dict[str, str]],
    llm_symptoms: List[str] | None = None
) -> Dict[str, Any]:
    """
    Extracts and accumulates symptoms across ALL user turns in the conversation.
    1. Scans canonical dictionary.
    2. Scans natural language phrases (e.g. 'knee pain', 'ear ache', 'eye swelling').
    3. Merges valid LLM-extracted symptoms.
    4. Handles explicit user corrections and negations.
    """
    detected_chronological: List[str] = []
    removed_symptoms: set = set()

    for msg in messages:
        if msg.get("sender") != "user":
            continue
        raw_text = msg.get("content", "")
        text = raw_text.lower().strip()

        # Check for corrections/negations (e.g. "actually I don't have throat pain")
        for canon, syns in SYMPTOM_SYNONYMS.items():
            for syn in [canon.replace("_", " ")] + syns:
                if f"don't have {syn}" in text or f"no {syn}" in text or f"not {syn}" in text or f"no longer {syn}" in text:
                    removed_symptoms.add(canon)

        # 1. Match against SYMPTOM_SYNONYMS
        for canon, syns in SYMPTOM_SYNONYMS.items():
            if canon in removed_symptoms:
                continue
            for syn in [canon.replace("_", " ")] + syns:
                pattern = r"(?<!\bno\s)(?<!\bnot\s)(?<!\bdon't\s)\b" + re.escape(syn) + r"\b"
                if re.search(pattern, text) or syn in text:
                    if canon not in detected_chronological:
                        detected_chronological.append(canon)
                    break

        # 2. Dynamic regex matching for body part pains (e.g. "knee pain", "ear pain", etc.)
        for part in COMMON_BODY_PARTS:
            part_pain = f"{part} pain"
            part_ache = f"{part} ache"
            if (part_pain in text or part_ache in text or f"pain in {part}" in text or f"pain in my {part}" in text) and f"{part}_pain" not in removed_symptoms:
                canon_name = f"{part}_pain"
                if canon_name not in detected_chronological:
                    detected_chronological.append(canon_name)

        # 3. Direct simple phrase extraction (e.g. "I have X")
        phrase_matches = re.findall(r"(?:i have|having|experiencing|suffering from|got)\s+([a-zA-Z\s]{3,30}?)(?:[\.,\n]|$|and|also|since|for)", text)
        for phrase in phrase_matches:
            clean_p = phrase.strip()
            # Ignore trivial filler words
            if clean_p not in ["a lot", "some", "bad", "this", "it", "that", "something", "a bit", "issues", "problem"]:
                norm_p = normalize_symptom(clean_p)
                if norm_p and norm_p not in removed_symptoms and norm_p not in detected_chronological:
                    detected_chronological.append(norm_p)

    # 4. Also merge any LLM-extracted symptoms that were not negated
    if llm_symptoms:
        for s in llm_symptoms:
            norm = normalize_symptom(s)
            if norm and norm not in removed_symptoms and norm not in detected_chronological:
                # Ensure it's not a generic placeholder
                if norm not in ["symptom_1", "symptom_2", "primary_symptom_name", "associated_symptom_name"]:
                    detected_chronological.append(norm)

    # Final cleanup of removed symptoms
    final_symptoms = [s for s in detected_chronological if s not in removed_symptoms]

    if not final_symptoms:
        final_symptoms = ["general_discomfort"]

    primary_key = final_symptoms[0]
    associated_keys = final_symptoms[1:]

    return {
        "primary_symptom": format_symptom_title(primary_key),
        "associated_symptoms": [format_symptom_title(s) for s in associated_keys],
        "all_symptoms": final_symptoms,
        "formatted_symptoms": [format_symptom_title(s) for s in final_symptoms],
    }


# ─── Clinical Disease Rule Definitions ───────────────────────────────────────

DISEASE_RULES: List[Dict[str, Any]] = [
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
        "explanation": (
            "Sudden unilateral weakness, facial droop, or speech impairment indicates an acute stroke. "
            "Time is critical for brain tissue preservation."
        ),
        "recommended_action": "Proceed to the nearest stroke-ready hospital emergency department immediately."
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
        "explanation": (
            "High fever coupled with persistent cough, breathlessness, and chest tightness suggests lower respiratory involvement."
        ),
        "recommended_action": "Schedule a clinical evaluation, chest auscultation, and radiography today."
    },
    {
        "disease": "Bacterial Meningitis (Suspected)",
        "required_symptoms": ["fever", "stiff_neck"],
        "supporting_symptoms": [
            "headache", "nausea", "vomiting", "dizziness"
        ],
        "base_confidence": 0.70,
        "max_confidence": 0.95,
        "urgency_tier": "EMERGENCY",
        "emergency_flag": True,
        "specialist": "Neurologist (Emergency)",
        "explanation": (
            "High fever paired with neck stiffness and severe headache is a clinical red flag for central nervous system infection."
        ),
        "recommended_action": "Seek emergency medical department evaluation immediately."
    },
    {
        "disease": "Musculoskeletal Strain / Joint & Ligament Evaluation",
        "required_symptoms": ["knee_pain", "joint_pain", "back_pain"],
        "supporting_symptoms": [
            "swelling", "body_aches", "fatigue"
        ],
        "base_confidence": 0.60,
        "max_confidence": 0.88,
        "urgency_tier": "ROUTINE",
        "emergency_flag": False,
        "specialist": "Orthopedic Specialist / General Physician",
        "explanation": (
            "Localized joint or muscle discomfort without acute neurovascular compromise is characteristic of musculoskeletal strain or joint irritation."
        ),
        "recommended_action": "Apply joint rest, ice/elevation, and schedule an outpatient evaluation with an orthopedic doctor or general physician if symptoms persist."
    },
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
        "explanation": (
            "Dysuria and urinary discomfort indicate urinary tract irritation or bacterial cystitis."
        ),
        "recommended_action": "Provide a clean-catch urine sample for urinalysis at your local clinic."
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

def predict_disease(raw_symptoms: List[str]) -> Dict[str, Any]:
    """
    Deterministically computes clinical urgency, triggered red flags,
    and specialist recommendation purely from Python clinical rules.
    """
    if not raw_symptoms:
        return _no_match_result([])

    canonical_symptoms = normalize_symptom_list(raw_symptoms)
    if not canonical_symptoms:
        return _no_match_result(raw_symptoms)

    scored = []

    for rule in DISEASE_RULES:
        req = rule["required_symptoms"]
        sup = rule["supporting_symptoms"]

        matched_req_count, matched_req_keys = _match_symptoms_count(canonical_symptoms, req)
        matched_sup_count, matched_sup_keys = _match_symptoms_count(canonical_symptoms, sup)

        total_req = max(len(req), 1)
        total_sup = max(len(sup), 1)

        # Must match at least 1 required symptom
        if matched_req_count == 0:
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
        return _no_match_result(canonical_symptoms)

    # Sort descending by confidence
    scored.sort(key=lambda x: x[0], reverse=True)

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

    return {
        "predicted_disease": top_rule["disease"],
        "confidence_score": top_conf,
        "prediction_model": "Clinical Decision Rule Engine v2.5",
        "differential": differential,
        "triggered_rules": top_triggered,
        "severity": urgency_tier.lower(),
        "urgency_level": urgency_tier,
        "emergency_flag": emergency_flag,
        "specialist": top_rule["specialist"],
        "explanation": human_explanation,
        "canonical_symptoms": canonical_symptoms,
    }


def _no_match_result(canonical_symptoms: List[str]) -> Dict[str, Any]:
    norm_list = normalize_symptom_list(canonical_symptoms) if canonical_symptoms else ["general_discomfort"]
    triggered = [format_symptom_title(s) for s in norm_list]
    primary_title = triggered[0] if triggered else "General Inquiry"
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
        "explanation": f"Based on the reported symptom ({', '.join(triggered)}), standard outpatient evaluation by a primary care physician is recommended.",
        "canonical_symptoms": norm_list,
    }


# ─── Generative AI Augmentation (Deterministic Guardrails Enforced) ─────────

async def predict_disease_generative(
    symptoms: List[str],
    patient_context_summary: str = ""
) -> Dict[str, Any]:
    """
    Generative AI Symptom Assessment.
    CRITICAL SAFETY CONSTRAINT:
    The deterministic Python Rule Engine determines urgency_level, emergency_flag,
    and specialist. Gemini provides narrative context and nuance without overriding the rules.
    """
    # 1. Run deterministic Python Rule Engine FIRST
    deterministic_result = predict_disease(symptoms)

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
