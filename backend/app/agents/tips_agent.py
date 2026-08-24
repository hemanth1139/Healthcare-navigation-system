"""
Personalized Health Tips Agent.
Analyzes patient profile characteristics (age, allergies, chronic conditions) 
and compiles personalized, daily health/preventive guidelines.
"""

import json
from typing import List, Dict, Any
from app.config import settings

# Base fallback tips
DEFAULT_TIPS = [
    {
        "title": "Stay Adequately Hydrated",
        "content": "Aim to drink 8-10 glasses of water daily to maintain metabolic efficiency and muscle function.",
        "category": "Hydration"
    },
    {
        "title": "Incorporate Light Exercise",
        "content": "A simple 30-minute daily walk improves cardiac strength and joint flexibility.",
        "category": "Activity"
    },
    {
        "title": "Prioritize Sleep Quality",
        "content": "Ensure 7-8 hours of uninterrupted sleep every night to support cellular recovery.",
        "category": "Recovery"
    }
]


class HealthTipsAgent:
    @staticmethod
    async def generate_tips(
        age: int,
        gender: str,
        allergies: str,
        chronic_conditions: str
    ) -> List[Dict[str, str]]:
        """
        Generates exactly 3 personalized health recommendations.
        """
        
        # 1. Fallback Rule-Based Tips if no API Key
        if not settings.GOOGLE_API_KEY:
            tips = list(DEFAULT_TIPS)
            
            # Customize if chronic conditions present
            if chronic_conditions and "asthma" in chronic_conditions.lower():
                tips[1] = {
                    "title": "Monitor Air Quality Index",
                    "content": "Keep inhalers close and avoid strenuous outdoor exercise when AQI is high.",
                    "category": "Respiratory Safety"
                }
            if allergies and "peanut" in allergies.lower():
                tips[2] = {
                    "title": "Strict Ingredient Review",
                    "content": "Verify allergen labels on packaged foods and warn dining venues about peanut triggers.",
                    "category": "Allergen Warning"
                }
            return tips

        # 2. LLM Generation
        from langchain_google_genai import ChatGoogleGenerativeAI
        from langchain_core.messages import SystemMessage, HumanMessage

        SYSTEM_PROMPT = """You are a Preventive Medicine Coach.
Given patient characteristics (Age, Gender, Allergies, and Chronic Conditions), generate exactly 3 personalized, daily health recommendations.

Response MUST be strictly in JSON format (array of objects):
[
  {
    "title": "Concise, actionable tip title",
    "content": "A simple, practical explanation of the tip (1-2 sentences)",
    "category": "General" | "Allergen Warning" | "Cardiac Care" | "Dietary" | "Activity"
  }
]
"""
        user_info = (
            f"Patient Context:\n"
            f"- Age: {age}\n"
            f"- Gender: {gender}\n"
            f"- Allergies: {allergies or 'None'}\n"
            f"- Chronic Conditions: {chronic_conditions or 'None'}"
        )
        try:
            llm = ChatGoogleGenerativeAI(
                model="gemini-2.5-flash",
                temperature=0.3,
                google_api_key=settings.GOOGLE_API_KEY
            )
            response = await llm.ainvoke([
                SystemMessage(content=SYSTEM_PROMPT),
                HumanMessage(content=user_info)
            ])
            
            res_text = response.content.strip()
            if "```json" in res_text:
                res_text = res_text.split("```json")[1].split("```")[0].strip()
            elif "```" in res_text:
                res_text = res_text.split("```")[1].split("```")[0].strip()
                
            return json.loads(res_text)[:3]
        except Exception as e:
            print(f"[ERROR] Health tips LLM failed: {e}. Falling back to rule templates.")
            return HealthTipsAgent.generate_tips(age, gender, allergies, chronic_conditions)
