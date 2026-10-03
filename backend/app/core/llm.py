"""
Centralized, Resilient Gemini LLM Service with Model Routing and Fallbacks.
Handles normalized model identifiers, structured error classification (404/429/401/5xx/timeout),
bounded exponential backoff, and secure logging with zero API key exposure.
"""

import os
import asyncio
import logging
from typing import List, Optional, Tuple
from langchain_core.messages import BaseMessage
from app.config import settings

logger = logging.getLogger("app.core.llm")

# ─── Normalized Gemini Model Roster ──────────────────────────────────────────
# Gemini 2.0 and 1.5 IDs were removed from the old fallback list; 2.0 Flash is
# shut down. Keep the configured model first only when it is in the supported
# roster, then advance through current stable text-generation models.
SUPPORTED_MODELS: List[str] = [
    "gemini-3.8-flash",
    "gemini-3.7-flash",
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-2.5-flash",
]
configured_model = getattr(settings, "GEMINI_MODEL", "")
CANDIDATE_MODELS: List[str] = ([configured_model] if configured_model in SUPPORTED_MODELS else [])
CANDIDATE_MODELS.extend(model for model in SUPPORTED_MODELS if model not in CANDIDATE_MODELS)


def _content_text(content) -> str:
    """Flatten LangChain text blocks for the Google Gen AI chat API."""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = []
        for block in content:
            if isinstance(block, dict):
                if block.get("text"):
                    parts.append(str(block["text"]))
            elif block is not None:
                parts.append(str(block))
        return "".join(parts)
    return str(content) if content is not None else ""


async def _invoke_model(
    model_name: str,
    api_key: str,
    messages: List[BaseMessage],
    temperature: float,
    timeout_seconds: float,
) -> str:
    """Send a LangChain message sequence through the supported async chat API."""
    from google import genai
    from google.genai import types

    system_parts = []
    turns = []
    for message in messages:
        role = getattr(message, "type", "")
        content = _content_text(getattr(message, "content", ""))
        if not content:
            continue
        if role == "system":
            system_parts.append(content)
        elif role in ("human", "user"):
            turns.append(("user", content))
        elif role in ("ai", "assistant"):
            turns.append(("model", content))
        else:
            # Tool output is context supplied to the model, not executable tooling.
            turns.append(("user", content))

    if not turns:
        raise ValueError("Gemini chat requires at least one non-system message.")

    final_role, final_text = turns[-1]
    if final_role != "user":
        # This preserves a useful request for callers that provide an assistant
        # message last, while keeping the SDK conversation role sequence valid.
        final_text = "Continue with the response. " + final_text
    history = [
        types.Content(role=role, parts=[types.Part.from_text(text=text)])
        for role, text in turns[:-1]
    ]
    client = genai.Client(api_key=api_key)
    try:
        chat = client.aio.chats.create(
            model=model_name,
            history=history,
            config=types.GenerateContentConfig(
                system_instruction="\n\n".join(system_parts) or None,
                temperature=temperature,
            ),
        )
        response = await asyncio.wait_for(
            chat.send_message(final_text), timeout=timeout_seconds
        )
        return _content_text(getattr(response, "text", "")).strip()
    finally:
        try:
            client.close()
        finally:
            await client.aio.aclose()

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
    # Handle 400 INVALID_ARGUMENT with API key invalid messages as auth failure
    if "400" in err_str and ("api key not valid" in err_str or "api_key_invalid" in err_str or "invalid api key" in err_str):
        return 401, "AUTH_FAILURE"
    if "401" in err_str or "403" in err_str or "permission_denied" in err_str or "unauthenticated" in err_str:
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
    timeout_seconds: float = 3.0,
    max_retries_per_model: int = 1
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
                    cleaned = await _invoke_model(
                        model_name, active_key, messages, temperature, timeout_seconds
                    )
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
                        break

                    # 429 RESOURCE_EXHAUSTED / 503 SERVER_ERROR / 408 TIMEOUT
                    if attempt < max_retries_per_model:
                        backoff = min(1.0, 0.3 * (2 ** (attempt - 1)))
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
