"""
Severity Assessment Agent — evaluates predicted conditions and patient context
to determine urgency level (low, moderate, high, emergency) and generate a safety rationale.
"""

import json
from typing import Dict, Any
from app.config import settings

# Fallback rules
SEVERITY_MAPPING = {
    "Acute Coronary Syndrome": {
        "severity": "emergency",
        "urgency_level": "Immediate Emergency Triage Required",
        "emergency_flag": True,
        "explanation": "Your chest pain symptoms combined with potential cardiac risk indicate a high likelihood of an acute cardiac event. Call emergency services (112 / 911) immediately."
    },
    "Tension-Type Headache & Viral Syndrome": {
        "severity": "moderate",
        "urgency_level": "Moderate Urgency - Routine Care",
        "emergency_flag": False,
        "explanation": "Symptoms suggest general viral or tension patterns. Standard rest, hydration, and over-the-counter consult are recommended. Contact a GP if symptoms persist."
    }
}


async def run_severity_agent(disease_name: str, confidence_score: float) -> Dict[str, Any]:
    """
    Classifies condition severity and returns urgency metrics.
    """
    
    if not settings.GOOGLE_API_KEY:
        # Fallback rule matching
        for k, v in SEVERITY_MAPPING.items():
            if k in disease_name or disease_name in k:
                return v
        # Default fallback
        return {
            "severity": "moderate",
            "urgency_level": "Standard Primary Care",
            "emergency_flag": False,
            "explanation": f"Condition ({disease_name}) requires routine monitoring by a primary care physician."
        }

    # Lazy import to avoid loading Google SDK if not needed
    from langchain_google_genai import ChatGoogleGenerativeAI
    from langchain_core.messages import SystemMessage, HumanMessage

    SYSTEM_PROMPT = """You are an expert Medical Triage Officer.
Given a predicted disease and its prediction confidence score, classify the severity of the patient's condition.

You MUST choose one of the following severity levels:
1. "low" (Self-limiting conditions, minor concerns)
2. "moderate" (Requires primary care GP visit within 24-48 hours)
3. "high" (Requires urgent care visit or specialist consult soon)
4. "emergency" (Life-threatening symptoms, requires immediate ambulance or ER visit)

You MUST respond strictly in the following JSON format:
{
  "severity": "low"|"moderate"|"high"|"emergency",
  "urgency_level": "Readable short summary of urgency (e.g. Immediate Triage Required)",
  "emergency_flag": true|false,
  "explanation": "Explain your clinical reasoning simply for the patient, including safety warnings."
}
"""
    try:
        llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            temperature=0.1,
            google_api_key=settings.GOOGLE_API_KEY,
        )
        
        response = await llm.ainvoke([
            SystemMessage(content=SYSTEM_PROMPT),
            HumanMessage(content=f"Predicted Disease: {disease_name}\nConfidence Score: {confidence_score:.2f}")
        ])
        
        res_text = response.content.strip()
        if "```json" in res_text:
            res_text = res_text.split("```json")[1].split("```")[0].strip()
        elif "```" in res_text:
            res_text = res_text.split("```")[1].split("```")[0].strip()
            
        return json.loads(res_text)
    except Exception as e:
        print(f"[ERROR] Error in Severity Agent: {e}. Falling back to rules.")
        # Fallback
        for k, v in SEVERITY_MAPPING.items():
            if k in disease_name or disease_name in k:
                return v
        return {
            "severity": "moderate",
            "urgency_level": "Standard Primary Care",
            "emergency_flag": False,
            "explanation": f"Condition ({disease_name}) requires routine monitoring by a primary care physician."
        }
