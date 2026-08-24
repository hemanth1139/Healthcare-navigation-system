"""
Specialist Recommendation Agent — recommends the appropriate medical specialist
based on the predicted condition and severity metrics.
"""

from typing import Dict, Any

SPECIALIST_MAP = {
    "Acute Coronary Syndrome": {
        "specialist": "Cardiologist (Emergency)",
        "reason": "Cardiac events require immediate care by a cardiologist and emergency intervention."
    },
    "Tension-Type Headache & Viral Syndrome": {
        "specialist": "General Physician / Neurologist",
        "reason": "Headache assessments and general viral signs are managed by primary physicians, with neurologists consulted if headaches are chronic."
    },
    "Gastroesophageal Reflux Disease (GERD)": {
        "specialist": "Gastroenterologist",
        "reason": "Chronic acid reflux or chest burning symptoms are referred to gastroenterology experts to inspect esophageal health."
    },
    "Acute Bronchitis / Influenza": {
        "specialist": "Pulmonologist / General Physician",
        "reason": "Respiratory infections and airway inflammation are handled by primary care doctors and lung specialists."
    },
    "Gastroenteritis": {
        "specialist": "Gastroenterologist / General Physician",
        "reason": "Stomach lining inflammation, dehydration, and vomiting require general medicine or GI focus."
    }
}


def recommend_specialist(disease_name: str, severity: str) -> Dict[str, str]:
    """
    Returns specialist name and recommendations reasoning.
    """
    # Try finding an exact match
    for k, v in SPECIALIST_MAP.items():
        if k in disease_name or disease_name in k:
            return v
            
    # Default fallback based on severity
    if severity == "emergency":
        return {
            "specialist": "Emergency Medicine Specialist",
            "reason": "Urgent life-threatening symptoms require immediate assessment at an Emergency Department."
        }
    return {
        "specialist": "General Family Physician",
        "reason": "General health concerns are best evaluated by a primary care doctor first."
    }
