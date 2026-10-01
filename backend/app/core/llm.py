"""
Centralized, Resilient Gemini LLM Service with Model Routing and Fallbacks.
Handles normalized model identifiers, structured error classification (404/429/401/5xx/timeout),
bounded exponential backoff, and secure logging with zero API key exposure.
"""

import os
import asyncio
import logging
from typing import List, Optional, Tuple
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import BaseMessage
from app.config import settings

logger = logging.getLogger("app.core.llm")

# ─── Normalized Gemini Model Roster ──────────────────────────────────────────
# Standard official Google GenAI model IDs (no broken 'models/' prefix or '-latest' aliases)
CANDIDATE_MODELS: List[str] = [
    "gemini-2.5-flash",        # Primary fast multimodal reasoning model
    "gemini-2.5-flash-lite",   # High-throughput low-latency fallback
    "gemini-2.5-pro",          # Deep clinical reasoning fallback
    "gemini-1.5-flash",        # Stable baseline fallback
    "gemini-1.5-pro",          # Secondary baseline fallback
]

# Configured API keys (supports up to 5 keys for rotation to manage free tier quotas)
def _get_api_keys() -> List[str]:
    keys = []
    # Primary key
    primary = getattr(settings, "GOOGLE_API_KEY", "") or os.getenv("GOOGLE_API_KEY", "")
    if primary:
        keys.append(primary)
    # Secondary keys for rotation
    for i in range(2, 6):
        key = os.getenv(f"GOOGLE_API_KEY_{i}", "") or getattr(settings, f"GOOGLE_API_KEY_{i}", "")
        if key and key not in keys:
            keys.append(key)
    return keys


def _classify_error(exc: Exception) -> Tuple[int, str]:
    """Classifies exceptions into HTTP status code and clinical category."""
    err_str = str(exc).lower()
    
    if "404" in err_str or "not found" in err_str or "is not found" in err_str or "unsupported" in err_str:
        return 404, "MODEL_NOT_FOUND"
    if "429" in err_str or "quota" in err_str or "resource_exhausted" in err_str or "rate limit" in err_str:
        return 429, "RESOURCE_EXHAUSTED"
    if "401" in err_str or "403" in err_str or "permission_denied" in err_str or "unauthenticated" in err_str or "api_key_invalid" in err_str:
        return 401, "AUTH_FAILURE"
    if isinstance(exc, asyncio.TimeoutError) or "timeout" in err_str or "deadline_exceeded" in err_str:
        return 408, "TIMEOUT"
    if "500" in err_str or "503" in err_str or "internal" in err_str or "unavailable" in err_str:
        return 503, "SERVER_ERROR"
    return 500, "GENERIC_FAILURE"


async def invoke_gemini(
    messages: List[BaseMessage],
    feature: str = "general_inference",
    temperature: float = 0.2,
    timeout_seconds: float = 12.0,
    max_retries_per_model: int = 2
) -> str:
    """
    Invokes Gemini through the centralized Model Router with bounded retry,
    exponential backoff, and automatic fallback.
    Never exposes API keys in logs or responses.
    """
    api_keys = _get_api_keys()
    if not api_keys:
        raise ValueError("No Gemini API key configured in backend environment.")

    last_exception = None

    for key_idx, active_key in enumerate(api_keys):
        key_auth_failed = False
        for model_name in CANDIDATE_MODELS:
            if key_auth_failed:
                break
            for attempt in range(1, max_retries_per_model + 1):
                try:
                    llm = ChatGoogleGenerativeAI(
                        model=model_name,
                        temperature=temperature,
                        max_retries=0,  # We manage bounded retries explicitly with backoff
                        timeout=timeout_seconds,
                        google_api_key=active_key
                    )

                    response = await asyncio.wait_for(
                        llm.ainvoke(messages),
                        timeout=timeout_seconds
                    )
                    
                    content = response.content if hasattr(response, "content") else str(response)
                    if isinstance(content, list):
                        # Handle multi-part responses
                        content = "".join(str(part.get("text", "")) if isinstance(part, dict) else str(part) for part in content)
                    
                    cleaned = str(content).strip()
                    if cleaned:
                        return cleaned

                except Exception as exc:
                    last_exception = exc
                    status, reason = _classify_error(exc)

                    # 404 MODEL_NOT_FOUND: Do not retry same model, advance to next model immediately
                    if status == 404:
                        logger.warning(
                            "[LLM ROTATOR] feature=%s model=%s status=%d reason=%s attempt=%d action=advance_next_model",
                            feature, model_name, status, reason, attempt
                        )
                        break

                    # 401 AUTH_FAILURE: Move to next key or abort immediately
                    if status == 401:
                        logger.error(
                            "[LLM ROTATOR] feature=%s model=%s status=%d reason=%s attempt=%d action=switch_credential",
                            feature, model_name, status, reason, attempt
                        )
                        key_auth_failed = True
                        break  # Stop trying other models with the same invalid key

                    # 429 RESOURCE_EXHAUSTED / 503 SERVER_ERROR / 408 TIMEOUT: Bounded exponential backoff
                    if attempt < max_retries_per_model:
                        backoff = min(2.0, 0.4 * (2 ** (attempt - 1)))
                        logger.warning(
                            "[LLM ROTATOR] feature=%s model=%s status=%d reason=%s attempt=%d action=retry_with_backoff delay=%.2fs",
                            feature, model_name, status, reason, attempt, backoff
                        )
                        await asyncio.sleep(backoff)
                    else:
                        logger.warning(
                            "[LLM ROTATOR] feature=%s model=%s status=%d reason=%s attempt=%d action=advance_fallback_model",
                            feature, model_name, status, reason, attempt
                        )

    # If all models exhausted, raise the classified exception
    raise last_exception if last_exception else RuntimeError("All configured Gemini models and fallbacks failed.")
