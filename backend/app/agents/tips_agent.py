"""
Personalized Health Tips Agent.
Analyzes patient profile characteristics (age, allergies, chronic conditions) 
and compiles personalized, daily health/preventive guidelines.
Adheres strictly to non-diagnostic, preventive safety guardrails.
"""

import json
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any
from app.config import settings

# Base fallback tips with full escalation and safety guidance
DEFAULT_TIPS: List[Dict[str, Any]] = [
    {
        "tipId": "tip-hydr-01",
        "title": "Maintain Optimal Daily Hydration",
        "content": "Drink 2 to 2.5 liters of clean water daily to support kidney filtration, cellular nutrient delivery, and blood pressure regulation.",
        "category": "General Wellness",
        "targetCondition": "Baseline Hydration",
        "escalationGuidance": "Consult a physician if you have diagnosed fluid restriction requirements for congestive heart failure or renal disorders.",
        "readTime": "2 min read",
        "createdAt": datetime.now(timezone.utc).isoformat()
    },
    {
        "tipId": "tip-act-02",
        "title": "Engage in 30 Minutes of Moderate Aerobic Movement",
        "content": "Low-impact physical activity such as brisk walking, cycling, or swimming strengthens the myocardium and regulates postprandial glucose levels.",
        "category": "Physical Activity",
        "targetCondition": "Cardiovascular Conditioning",
        "escalationGuidance": "Stop immediately and seek emergency medical care if you experience acute chest tightness, severe dizziness, or sudden shortness of breath.",
        "readTime": "3 min read",
        "createdAt": datetime.now(timezone.utc).isoformat()
    },
    {
        "tipId": "tip-nutr-03",
        "title": "Prioritize Dietary Micronutrients & Soluble Fiber",
        "content": "Incorporate leafy greens, legumes, and antioxidant-rich seasonal fruits to maintain gut microbiome diversity and reduce arterial inflammation.",
        "category": "Nutrition",
        "targetCondition": "Metabolic Health",
        "escalationGuidance": "Discuss significant dietary alterations with a clinical dietitian if managing chronic kidney disease or anticoagulant therapies.",
        "readTime": "2 min read",
        "createdAt": datetime.now(timezone.utc).isoformat()
    },
    {
        "tipId": "tip-prev-04",
        "title": "Establish Consistent Circadian Sleep Hygiene",
        "content": "Aim for 7-8 hours of uninterrupted sleep in a dark, quiet environment to facilitate nocturnal cortisol regulation and neural memory consolidation.",
        "category": "Preventive Care",
        "targetCondition": "Restorative Sleep",
        "escalationGuidance": "Seek professional medical evaluation if chronic insomnia, nocturnal gasping, or daytime somnolence persists beyond 3 weeks.",
        "readTime": "2 min read",
        "createdAt": datetime.now(timezone.utc).isoformat()
    },
    {
        "tipId": "tip-med-05",
        "title": "Adhere to Timely Medication Scheduling",
        "content": "Keep an accurate list of all prescribed medications and take doses at consistent hours as directed by your physician to prevent therapeutic fluctuations.",
        "category": "Medication Safety",
        "targetCondition": "Therapeutic Adherence",
        "escalationGuidance": "Never discontinue or alter prescription dosages without consulting your prescribing healthcare provider.",
        "readTime": "2 min read",
        "createdAt": datetime.now(timezone.utc).isoformat()
    }
]


class HealthTipsAgent:
    @staticmethod
    async def generate_tips(
        age: int,
        gender: str,
        allergies: str,
        chronic_conditions: str
    ) -> List[Dict[str, Any]]:
        """
        Generates personalized, non-diagnostic healthcare guidance based on patient context.
        """
        now_iso = datetime.now(timezone.utc).isoformat()

        # 1. Fallback Rule-Based Tips if no API Key configured
        if not settings.GOOGLE_API_KEY:
            custom_tips = [dict(t) for t in DEFAULT_TIPS]
            
            # Custom rule-based adaptation for specific chronic conditions
            if chronic_conditions and "asthma" in chronic_conditions.lower():
                custom_tips[1] = {
                    "tipId": "tip-resp-01",
                    "title": "Monitor Ambient Air Quality & Peak Flow Triggers",
                    "content": "Avoid strenuous outdoor exertion during high pollen counts or elevated particulate AQI, and keep prescribed rescue inhalers accessible.",
                    "category": "When to Seek Care",
                    "targetCondition": "Asthma Management",
                    "escalationGuidance": "Seek urgent emergency medical care if rescue inhalers fail to relieve wheezing or if speaking in full sentences becomes difficult.",
                    "readTime": "2 min read",
                    "createdAt": now_iso
                }
            if chronic_conditions and ("diabet" in chronic_conditions.lower() or "sugar" in chronic_conditions.lower()):
                custom_tips[2] = {
                    "tipId": "tip-diab-01",
                    "title": "Routine Glycemic & Peripheral Foot Inspection",
                    "content": "Monitor daily blood glucose curves and perform evening inspections of the feet for minor blisters or micro-abrasions to prevent diabetic neuropathic complications.",
                    "category": "Preventive Care",
                    "targetCondition": "Diabetes Care",
                    "escalationGuidance": "Contact your endocrinologist promptly if you notice non-healing sores, skin redness, or localized warmth.",
                    "readTime": "3 min read",
                    "createdAt": now_iso
                }
            if allergies and ("peanut" in allergies.lower() or "penicillin" in allergies.lower() or "dust" in allergies.lower()):
                custom_tips[4] = {
                    "tipId": "tip-alg-01",
                    "title": f"Strict Allergen Avoidance Protocol ({allergies})",
                    "content": f"Maintain rigorous ingredient review on all foods/pharmaceuticals and communicate your allergy profile ({allergies}) to all attending clinical staff.",
                    "category": "Medication Safety",
                    "targetCondition": "Allergy Safeguards",
                    "escalationGuidance": "Call emergency services immediately if you develop facial swelling, hives, throat constriction, or anaphylactic symptoms.",
                    "readTime": "2 min read",
                    "createdAt": now_iso
                }
            return custom_tips

        # 2. Gemini-Powered Adaptive Generation with Strict Clinical Guardrails
        from app.core.llm import invoke_gemini
        from langchain_core.messages import SystemMessage, HumanMessage

        SYSTEM_PROMPT = """You are a Preventive Medicine and Clinical Wellness Assistant.
Given patient context (Age, Gender, Allergies, Chronic Conditions), generate exactly 4 to 5 personalized, non-diagnostic wellness and preventive guidance tips.

SAFETY AND COMPLIANCE RULES:
1. DO NOT provide definitive medical diagnoses or prescribe specific medications.
2. Provide general preventive care, nutrition, hydration, sleep, lifestyle, and safety guidance.
3. Every tip MUST include clear "escalationGuidance" stating when the patient should seek professional medical attention.
4. Response MUST be strictly valid JSON (array of objects):
[
  {
    "title": "Concise, actionable tip title",
    "content": "Practical, evidence-informed guidance (2-3 sentences)",
    "category": "General Wellness" | "Preventive Care" | "Medication Safety" | "When to Seek Care" | "Nutrition" | "Physical Activity",
    "targetCondition": "E.g. Cardiovascular Health / Sleep Hygiene / Allergy Safeguards",
    "escalationGuidance": "Clear instruction on when to contact a doctor or visit emergency room",
    "readTime": "2 min read"
  }
]
"""
        user_info = (
            f"Patient Profile Context:\n"
            f"- Age: {age}\n"
            f"- Gender: {gender}\n"
            f"- Allergies: {allergies or 'None reported'}\n"
            f"- Chronic Conditions: {chronic_conditions or 'None reported'}"
        )

        try:
            res_text = await invoke_gemini([
                SystemMessage(content=SYSTEM_PROMPT),
                HumanMessage(content=user_info)
            ], temperature=0.2)
            
            if "```json" in res_text:
                res_text = res_text.split("```json")[1].split("```")[0].strip()
            elif "```" in res_text:
                res_text = res_text.split("```")[1].split("```")[0].strip()
                
            parsed = json.loads(res_text)
            if isinstance(parsed, list) and len(parsed) > 0:
                result = []
                for idx, t in enumerate(parsed):
                    result.append({
                        "tipId": f"gen-tip-{idx+1}-{uuid.uuid4().hex[:6]}",
                        "title": t.get("title", "Clinical Wellness Tip"),
                        "content": t.get("content", ""),
                        "category": t.get("category", "General Wellness"),
                        "targetCondition": t.get("targetCondition", "Preventive Care"),
                        "escalationGuidance": t.get("escalationGuidance", "Consult your physician for personalized medical advice."),
                        "readTime": t.get("readTime", "2 min read"),
                        "createdAt": now_iso
                    })
                return result
            return DEFAULT_TIPS
        except Exception as e:
            print(f"[ERROR] Health tips LLM failed: {e}. Returning clinical template guidelines.")
            return DEFAULT_TIPS
