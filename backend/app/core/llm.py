"""
Resilient LLM Invoker for Gemini models with fast timeout and fallback.
Prevents server hanging on rate-limited or capacity-strained API calls.
"""

import asyncio
from typing import List
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import BaseMessage
from app.config import settings

CANDIDATE_MODELS = [
    "models/gemini-2.5-flash",
    "gemini-2.5-flash",
    "models/gemini-1.5-flash-latest",
    "models/gemini-1.5-pro-latest",
    "models/gemini-2.5-pro",
]


async def invoke_gemini(
    messages: List[BaseMessage],
    temperature: float = 0.2,
    timeout_seconds: float = 15.0
) -> str:
    """
    Invokes Gemini with resilient timeout and automatic model rotation.
    Fast-fails if rate limited or unavailable to keep API responsive.
    """
    if not settings.GOOGLE_API_KEY:
        raise ValueError("GOOGLE_API_KEY is not configured")

    last_exception = None
    for model_name in CANDIDATE_MODELS:
        try:
            llm = ChatGoogleGenerativeAI(
                model=model_name,
                temperature=temperature,
                max_retries=1,
                timeout=timeout_seconds,
                google_api_key=settings.GOOGLE_API_KEY
            )
            # Enforce asyncio timeout so network hangs never block the backend
            response = await asyncio.wait_for(llm.ainvoke(messages), timeout=timeout_seconds)
            return response.content.strip()
        except Exception as e:
            last_exception = e
            print(f"[LLM ROTATOR] Model {model_name} failed ({e}). Trying next model or fallback...")
            continue

    raise last_exception if last_exception else RuntimeError("All Gemini candidate models failed.")
