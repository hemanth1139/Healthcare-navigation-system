"""
Centralized LLM Service with Provider Routing.
Gemini for RAG, scheme queries, and general AI tasks.
Groq for symptom assessment only (fast, free tier).
Handles normalized model identifiers, structured error classification,
bounded exponential backoff, and secure logging with zero API key exposure.
"""

import os
import asyncio
import logging
from typing import List, Optional, Tuple
from langchain_core.messages import BaseMessage
from app.config import settings

logger = logging.getLogger("app.core.llm")

# ─── Groq Configuration (for symptom assessment only) ────────────────────
# Keep only currently supported Groq models in the fallback roster.
GROQ_SUPPORTED_MODELS: List[str] = [
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
]

def get_groq_candidate_models() -> List[str]:
    configured = getattr(settings, "GROQ_MODEL", "")
    candidates = []
    if configured and configured.strip():
        candidates.append(configured.strip())
    for m in GROQ_SUPPORTED_MODELS:
        if m not in candidates:
            candidates.append(m)
    return candidates

GROQ_CANDIDATE_MODELS: List[str] = get_groq_candidate_models()

# ─── Gemini Configuration (for RAG, schemes, general AI) ───────────────────

# ─── Normalized Gemini Model Roster ──────────────────────────────────────────
# Prioritize high-availability Flash-Lite (low latency, generous capacity) followed by Flash.
SUPPORTED_MODELS: List[str] = [
    "gemini-flash-lite-latest",
    "gemini-flash-latest",
    "gemini-3.8-flash",
]


def get_candidate_models() -> List[str]:
    configured = getattr(settings, "GEMINI_MODEL", "")
    candidates = []
    if configured and configured.strip() and configured.strip() not in ("gemini-3.5-flash", "gemini-3.7-flash"):
        candidates.append(configured.strip())
    for m in SUPPORTED_MODELS:
        if m not in candidates:
            candidates.append(m)
    return candidates


CANDIDATE_MODELS: List[str] = get_candidate_models()



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

def _is_usable_key(k: str) -> bool:
    if not k or not isinstance(k, str):
        return False
    clean = k.strip()
    # Reject placeholders like 'your-third-gemini-api-key-here' or '<your-key>'
    if clean.lower().startswith("your-") or "api-key" in clean.lower() or len(clean) < 10:
        return False
    return True


# ─── Groq API Keys (for symptom assessment) ────────────────────────────
def _get_groq_api_keys() -> List[str]:
    keys = []
    # Primary key
    primary = getattr(settings, "GROQ_API_KEY", "") or os.getenv("GROQ_API_KEY", "")
    if _is_usable_key(primary):
        keys.append(primary.strip())
    # Secondary keys for rotation
    for i in range(2, 6):
        key = os.getenv(f"GROQ_API_KEY_{i}", "") or getattr(settings, f"GROQ_API_KEY_{i}", "")
        if _is_usable_key(key) and key.strip() not in keys:
            keys.append(key.strip())
    return keys


# ─── Gemini API Keys (for RAG, schemes, general AI) ───────────────────


# Configured API keys (supports up to 5 keys for rotation to manage free tier quotas)
def _get_gemini_api_keys() -> List[str]:
    keys = []
    # Primary key
    primary = getattr(settings, "GOOGLE_API_KEY", "") or os.getenv("GOOGLE_API_KEY", "")
    if _is_usable_key(primary):
        keys.append(primary.strip())
    # Secondary keys for rotation
    for i in range(2, 6):
        key = os.getenv(f"GOOGLE_API_KEY_{i}", "") or getattr(settings, f"GOOGLE_API_KEY_{i}", "")
        if _is_usable_key(key) and key.strip() not in keys:
            keys.append(key.strip())
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


async def _invoke_groq_model(
    model_name: str,
    api_key: str,
    messages: List[BaseMessage],
    temperature: float,
    timeout_seconds: float,
) -> str:
    """Send a LangChain message sequence through Groq API."""
    from groq import AsyncGroq
    from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

    # Convert LangChain messages to Groq format
    groq_messages = []
    for message in messages:
        role = getattr(message, "type", "")
        content = _content_text(getattr(message, "content", ""))
        if not content:
            continue
        if role == "system":
            groq_messages.append({"role": "system", "content": content})
        elif role in ("human", "user"):
            groq_messages.append({"role": "user", "content": content})
        elif role in ("ai", "assistant"):
            groq_messages.append({"role": "assistant", "content": content})
        else:
            groq_messages.append({"role": "user", "content": content})

    if not groq_messages:
        raise ValueError("Groq chat requires at least one message.")

    client = AsyncGroq(api_key=api_key)
    try:
        response = await asyncio.wait_for(
            client.chat.completions.create(
                model=model_name,
                messages=groq_messages,
                temperature=temperature,
            ),
            timeout=timeout_seconds
        )
        return response.choices[0].message.content.strip()
    finally:
        await client.close()


async def invoke_groq(
    messages: List[BaseMessage],
    feature: str = "symptom_assessment",
    temperature: float = 0.2,
    timeout_seconds: float = 12.0,
    max_retries_per_model: int = 1,
    overall_timeout_seconds: float = 25.0,
) -> str:
    """
    Invokes Groq through the centralized Model Router with resilient timeout.
    Used for symptom assessment only.
    """
    api_keys = _get_groq_api_keys()
    if not api_keys:
        raise ValueError("No Groq API key configured in backend environment.")

    last_exception = None
    loop = asyncio.get_running_loop()
    deadline = loop.time() + max(0.0, overall_timeout_seconds)

    for model_name in GROQ_CANDIDATE_MODELS:
        for key_idx, active_key in enumerate(api_keys):
            for attempt in range(1, max_retries_per_model + 1):
                remaining = deadline - loop.time()
                if remaining <= 0:
                    last_exception = asyncio.TimeoutError("Groq total time budget exhausted.")
                    break
                try:
                    cleaned = await _invoke_groq_model(
                        model_name,
                        active_key,
                        messages,
                        temperature,
                        min(timeout_seconds, remaining),
                    )
                    if cleaned:
                        logger.info(
                            "[GROQ ROTATOR] feature=%s model=%s key_slot=%d action=success",
                            feature,
                            model_name,
                            key_idx + 1,
                        )
                        return cleaned
                    logger.warning(
                        "[GROQ ROTATOR] feature=%s model=%s key_slot=%d action=empty_response",
                        feature,
                        model_name,
                        key_idx + 1,
                    )

                except Exception as exc:
                    last_exception = exc
                    status, reason = _classify_error(exc)

                    # 404, 401: fatal for this model/key, immediately try next
                    if status in (404, 401):
                        logger.warning(
                            "[GROQ ROTATOR] feature=%s model=%s key_slot=%d status=%d reason=%s action=fast_failover_next_credential",
                            feature, model_name, key_idx + 1, status, reason
                        )
                        break

                    # If multiple keys exist and we got 429 or 503, fail over to next key slot immediately
                    if status in (429, 503) and len(api_keys) > 1 and key_idx < len(api_keys) - 1:
                        logger.warning(
                            "[GROQ ROTATOR] feature=%s model=%s key_slot=%d status=%d reason=%s action=fast_failover_next_credential",
                            feature, model_name, key_idx + 1, status, reason
                        )
                        break

                    # 408 TIMEOUT / 429 / 503 on single or last key: retry with backoff if attempts remain
                    if attempt < max_retries_per_model:
                        backoff = min(0.5, 0.2 * (2 ** (attempt - 1)))
                        logger.warning(
                            "[GROQ ROTATOR] feature=%s model=%s key_slot=%d status=%d reason=%s attempt=%d action=retry_with_backoff delay=%.2fs",
                            feature, model_name, key_idx + 1, status, reason, attempt, backoff
                        )
                        await asyncio.sleep(backoff)
                    else:
                        logger.warning(
                            "[GROQ ROTATOR] feature=%s model=%s key_slot=%d status=%d reason=%s attempt=%d action=try_next_credential",
                            feature, model_name, key_idx + 1, status, reason, attempt
                        )

            if loop.time() >= deadline:
                break
        if loop.time() >= deadline:
            break

    raise last_exception if last_exception else RuntimeError("All configured Groq models and fallbacks failed.")


async def invoke_gemini(
    messages: List[BaseMessage],
    feature: str = "general_inference",
    temperature: float = 0.2,
    timeout_seconds: float = 12.0,
    max_retries_per_model: int = 1,
    overall_timeout_seconds: float = 25.0,
) -> str:
    """
    Invokes Gemini through the centralized Model Router with a resilient 12-second
    per-request timeout and a 25-second total budget across models and keys.
    Used for RAG, scheme queries, and general AI tasks.
    Never exposes API keys in logs or responses.
    """
    api_keys = _get_gemini_api_keys()
    if not api_keys:
        raise ValueError("No Gemini API key configured in backend environment.")

    last_exception = None
    loop = asyncio.get_running_loop()
    deadline = loop.time() + max(0.0, overall_timeout_seconds)

    # Try the same model with each credential before moving to a slower
    # fallback model. This lets a healthy secondary key recover quickly.
    for model_name in CANDIDATE_MODELS:
        for key_idx, active_key in enumerate(api_keys):
            for attempt in range(1, max_retries_per_model + 1):
                remaining = deadline - loop.time()
                if remaining <= 0:
                    last_exception = asyncio.TimeoutError("Gemini total time budget exhausted.")
                    break
                try:
                    cleaned = await _invoke_model(
                        model_name,
                        active_key,
                        messages,
                        temperature,
                        min(timeout_seconds, remaining),
                    )
                    if cleaned:
                        logger.info(
                            "[LLM ROTATOR] feature=%s model=%s key_slot=%d action=success",
                            feature,
                            model_name,
                            key_idx + 1,
                        )
                        return cleaned
                    logger.warning(
                        "[LLM ROTATOR] feature=%s model=%s key_slot=%d action=empty_response",
                        feature,
                        model_name,
                        key_idx + 1,
                    )

                except Exception as exc:
                    last_exception = exc
                    status, reason = _classify_error(exc)

                    # 404, 401: fatal for this model/key, immediately try next
                    if status in (404, 401):
                        logger.warning(
                            "[LLM ROTATOR] feature=%s model=%s key_slot=%d status=%d reason=%s action=fast_failover_next_credential",
                            feature, model_name, key_idx + 1, status, reason
                        )
                        break

                    # If multiple keys exist and we got 429 or 503, fail over to next key slot immediately
                    if status in (429, 503) and len(api_keys) > 1 and key_idx < len(api_keys) - 1:
                        logger.warning(
                            "[LLM ROTATOR] feature=%s model=%s key_slot=%d status=%d reason=%s action=fast_failover_next_credential",
                            feature, model_name, key_idx + 1, status, reason
                        )
                        break

                    # 408 TIMEOUT / 429 / 503 on single or last key: retry with backoff if attempts remain
                    if attempt < max_retries_per_model:
                        backoff = min(0.5, 0.2 * (2 ** (attempt - 1)))
                        logger.warning(
                            "[LLM ROTATOR] feature=%s model=%s key_slot=%d status=%d reason=%s attempt=%d action=retry_with_backoff delay=%.2fs",
                            feature, model_name, key_idx + 1, status, reason, attempt, backoff
                        )
                        await asyncio.sleep(backoff)
                    else:
                        logger.warning(
                            "[LLM ROTATOR] feature=%s model=%s key_slot=%d status=%d reason=%s attempt=%d action=try_next_credential",
                            feature, model_name, key_idx + 1, status, reason, attempt
                        )

            if loop.time() >= deadline:
                break
        if loop.time() >= deadline:
            break

    # If all models/keys or the total time budget are exhausted, let the caller
    # choose its safe fallback.
    raise last_exception if last_exception else RuntimeError("All configured Gemini models and fallbacks failed.")
