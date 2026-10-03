"""Assessment-linked, conservative health guidance.

Tips are selected from reviewed templates using the stored triage assessment. The
assessment is treated as a navigation result, never as a confirmed diagnosis.
"""

import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional


def _tip(title: str, content: str, category: str, condition: str, escalation: str) -> Dict[str, Any]:
    return {
        "tipId": f"tip-{uuid.uuid4().hex[:10]}",
        "title": title,
        "content": content,
        "category": category,
        "targetCondition": condition,
        "escalationGuidance": escalation,
        "readTime": "2 min read",
        "createdAt": datetime.now(timezone.utc).isoformat(),
    }


GENERAL_TIPS = [
    ("Follow the assessment plan", "Use the next-step guidance from your assessment and arrange follow-up if symptoms persist or worsen. This assessment is not a confirmed diagnosis.", "When to Seek Care", "Current assessment", "Seek urgent care if severe or rapidly worsening symptoms develop."),
    ("Keep a short symptom record", "Note when symptoms started, what makes them better or worse, and any new symptoms. This can help a clinician understand the change over time.", "Self-care", "Symptom tracking", "Contact a clinician if symptoms persist, worsen, or new warning signs appear."),
]

DOMAIN_TIPS = {
    "abdominal": [
        ("Track the location and pattern", "Note where the discomfort is, when it occurs, and whether it is getting worse. Avoid starting new medicines or laxatives for abdominal pain without advice from a clinician.", "Self-care", "Abdominal symptoms", "Get urgent medical care for sudden severe or worsening pain, fainting, repeated vomiting, blood in vomit or stool, or a hard/swollen abdomen."),
        ("Choose food and fluids as tolerated", "If you can keep them down, take small amounts of your usual fluids and light food. Do not force food or fluids if they worsen symptoms.", "Self-care", "Abdominal symptoms", "Seek care promptly if you cannot keep fluids down or develop severe pain, fainting, or blood in vomit or stool."),
    ],
    "respiratory": [
        ("Reduce airway irritants", "Rest and avoid smoke, vaping, and other irritants while you have a cough. Follow any existing clinician-provided plan for a chronic breathing condition.", "Self-care", "Cough or respiratory symptoms", "Seek urgent care for difficulty breathing, blue lips, confusion, coughing blood, or rapidly worsening symptoms."),
        ("Monitor how the cough changes", "Keep track of how long you have been coughing and whether fever, chest discomfort, or breathing difficulty develops.", "Monitoring", "Cough or respiratory symptoms", "Contact a clinician if symptoms worsen or do not improve; seek urgent care for breathing difficulty or coughing blood."),
    ],
    "urinary": [
        ("Do not delay assessment for urinary symptoms", "Arrange the follow-up recommended in your assessment. Do not use leftover antibiotics or someone else’s prescription.", "When to Seek Care", "Urinary symptoms", "Seek urgent care for inability to urinate, fever with flank/back pain, vomiting, or visible blood in urine."),
        ("Notice changes in urination", "Record any change in frequency, discomfort, urine amount, or urine appearance to share with a clinician.", "Monitoring", "Urinary symptoms", "Get urgent care if you become unable to urinate or develop fever with flank/back pain."),
    ],
    "headache": [
        ("Reduce stimulation while symptoms settle", "Rest somewhere quiet and note when the headache began and whether it is changing. Avoid driving if you feel dizzy or your vision is affected.", "Self-care", "Headache", "Seek emergency care for a sudden worst-ever headache, new weakness, facial droop, confusion, fainting, vision loss, or headache with fever and neck stiffness."),
        ("Record possible headache patterns", "Note the onset, duration, location, and any associated symptoms to discuss at follow-up.", "Monitoring", "Headache", "Seek urgent care if the headache becomes severe, rapidly worsens, or new neurological symptoms appear."),
    ],
    "joint": [
        ("Avoid movements that worsen joint pain", "Temporarily reduce activities that aggravate the joint and follow the care plan from your assessment. Avoid putting weight on it if walking is unsafe.", "Self-care", "Joint or limb pain", "Seek urgent care if you cannot bear weight, the joint becomes hot/red with fever, or there is major swelling or deformity."),
        ("Watch for changes in movement or swelling", "Note whether swelling, warmth, redness, or difficulty moving the joint is increasing.", "Monitoring", "Joint or limb pain", "Get prompt medical care for increasing swelling, a hot/red joint with fever, or inability to use the limb."),
    ],
    "throat": [
        ("Choose comfortable fluids and rest your voice", "If swallowing is comfortable, take fluids as tolerated and rest your voice. Do not force food or drink if swallowing is difficult.", "Self-care", "Throat symptoms", "Seek emergency care if you cannot swallow saliva, are drooling, or have difficulty breathing."),
        ("Monitor swallowing and fever", "Notice whether you can swallow liquids and whether fever, neck swelling, or one-sided throat pain develops.", "Monitoring", "Throat symptoms", "Seek prompt care if swallowing worsens; emergency care is needed for breathing difficulty or inability to swallow saliva."),
    ],
    "dizziness": [
        ("Reduce fall risk while dizzy", "Sit or lie down until the dizziness passes, get up slowly, and avoid driving or climbing while unsteady.", "Safety", "Dizziness or faintness", "Seek emergency care for fainting with chest pain, one-sided weakness, facial droop, trouble speaking, or new vision loss."),
        ("Note when dizziness occurs", "Record whether it happens when standing, how long it lasts, and any palpitations or fainting to discuss with a clinician.", "Monitoring", "Dizziness or faintness", "Seek urgent care for fainting, chest pain, new neurological symptoms, or worsening dizziness."),
    ],
    "chest": [
        ("Follow the chest-symptom care plan", "Use the assessment’s recommended follow-up and avoid strenuous activity if it brings on chest discomfort.", "When to Seek Care", "Chest symptoms", "Call emergency services for persistent or severe chest pressure, breathlessness, sweating, faintness, or pain spreading to the arm, jaw, or back."),
    ],
    "fever": [
        ("Monitor temperature and new symptoms", "Track your temperature and note any new cough, rash, urinary symptoms, severe pain, or change in alertness. Use only medicines already approved for you by a clinician.", "Monitoring", "Fever", "Seek urgent care for confusion, difficulty breathing, a stiff neck, a concerning rash, or rapidly worsening illness."),
    ],
}


class HealthTipsAgent:
    @staticmethod
    async def generate_tips(
        age: int,
        gender: str,
        allergies: str,
        chronic_conditions: str,
        assessment: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        """Select consistent, assessment-specific tips; never invent treatment advice."""
        assessment = assessment or {}
        disease = str(assessment.get("predicted_disease") or "")
        action = str(assessment.get("recommended_action") or "").strip()
        urgency = str(assessment.get("urgency_level") or assessment.get("severity") or "").upper()
        emergency = bool(assessment.get("emergency_flag")) or "EMERGENCY" in urgency
        urgent = emergency or "URGENT" in urgency

        if emergency:
            message = action or "Seek emergency medical care now."
            return [_tip(
                "Seek emergency care now", message,
                "When to Seek Care", disease or "Current assessment",
                "Call local emergency services or go to the nearest emergency department now.",
            )]

        canonical = set(assessment.get("canonical_symptoms") or [])
        text = " ".join([disease, *[str(s) for s in canonical]]).lower()
        if any(k in text for k in ["chest", "cardiac", "coronary"]):
            domain = "chest"
        elif any(k in text for k in ["urinary", "urine", "renal", "kidney", "cystitis", "pyelonephritis"]):
            domain = "urinary"
        elif any(k in text for k in ["headache", "migraine", "thunderclap"]):
            domain = "headache"
        elif any(k in text for k in ["throat", "tonsil", "swallow"]):
            domain = "throat"
        elif any(k in text for k in ["joint", "knee", "fracture", "musculoskeletal"]):
            domain = "joint"
        elif any(k in text for k in ["dizz", "vertigo", "faint"]):
            domain = "dizziness"
        elif any(k in text for k in ["cough", "pneumonia", "respiratory", "asthma", "breath"]):
            domain = "respiratory"
        elif any(k in text for k in ["fever", "infection", "sepsis"]):
            domain = "fever"
        elif any(k in text for k in ["abdominal", "appendicitis", "stomach", "gastro", "nausea", "vomit"]):
            domain = "abdominal"
        else:
            domain = None

        selected: List[tuple] = []
        if urgent:
            selected.append((
                "Follow the urgent care recommendation",
                action or "Arrange prompt medical assessment as recommended by your symptom assessment.",
                "When to Seek Care", disease or "Current assessment",
                "Seek emergency care immediately if symptoms become severe or rapidly worsen.",
            ))
        selected.extend(DOMAIN_TIPS.get(domain, GENERAL_TIPS))

        # Chronic conditions/allergies are surfaced as a safety caveat without
        # inventing a contraindication for an unspecified profile.
        if allergies or chronic_conditions:
            caution = "Consider your recorded allergies and health conditions when following general self-care advice; confirm anything uncertain with your clinician."
            first = list(selected[0])
            first[1] = f"{first[1]} {caution}"
            selected[0] = tuple(first)

        limit = 2 if urgent else 3
        return [_tip(*row) for row in selected[:limit]]
