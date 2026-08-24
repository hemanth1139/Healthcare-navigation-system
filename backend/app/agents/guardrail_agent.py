"""
AI Guardrails Agent.
Evaluates user prompts and AI responses for safety, adversarial exploits,
and filters out non-medical topics (e.g. general programming, creative writing).
"""

import json
from typing import Dict, Any
from app.config import settings

# Non-medical keywords for fallback checking
NON_MEDICAL_KEYWORDS = [
    "write code", "programming", "javascript", "python", "html", "css",
    "write a poem", "write a story", "math problem", "solve equations",
    "recipe for", "how to build", "weather in"
]


class GuardrailAgent:
    @staticmethod
    async def validate_query(text: str) -> Dict[str, Any]:
        """
        Validates whether the user query is medical and safe.
        """
        text_lower = text.lower().strip()
        
        # 1. Fallback local checking for common adversarial/non-medical prompts
        is_non_medical = any(kw in text_lower for kw in NON_MEDICAL_KEYWORDS)
        
        # Simple safety bounds
        if is_non_medical:
            return {
                "validation_status": "failed",
                "violations": "Non-medical query detected.",
                "corrected_response": "I am designed to assist with health-related triage, hospital recommendations, and government schemes. I cannot answer non-medical queries."
            }

        # 2. If Gemini API Key is configured, perform LLM evaluation
        if settings.GOOGLE_API_KEY:
            from langchain_google_genai import ChatGoogleGenerativeAI
            from langchain_core.messages import SystemMessage, HumanMessage
            
            SYSTEM_PROMPT = """You are a Healthcare Guardrail System.
Evaluate if the given user query is safe and strictly related to medical, clinical, healthcare, hospital, or government health schemes.
If the query is unrelated (e.g. coding, math, general science, creative tasks), classify it as failed.

You MUST respond strictly in the following JSON format:
{
  "validation_status": "passed" | "failed",
  "violations": "Brief description of the violation, or null if passed",
  "corrected_response": "Polite explanation explaining that you only answer medical queries, or null if passed"
}
"""
            try:
                llm = ChatGoogleGenerativeAI(
                    model="gemini-2.5-flash",
                    temperature=0.1,
                    google_api_key=settings.GOOGLE_API_KEY
                )
                response = await llm.ainvoke([
                    SystemMessage(content=SYSTEM_PROMPT),
                    HumanMessage(content=text)
                ])
                
                res_text = response.content.strip()
                if "```json" in res_text:
                    res_text = res_text.split("```json")[1].split("```")[0].strip()
                elif "```" in res_text:
                    res_text = res_text.split("```")[1].split("```")[0].strip()
                    
                return json.loads(res_text)
            except Exception as e:
                print(f"[ERROR] Guardrails LLM failed: {e}. Falling back to default pass.")

        return {
            "validation_status": "passed",
            "violations": None,
            "corrected_response": None
        }
