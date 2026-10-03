"""
Comprehensive Unit & Failure-Mode Tests for Centralized Gemini LLM Service (app.core.llm).
Tests model rotation, 404/429/401/timeout error handling, bounded exponential backoff,
fallback degradation, and credential confidentiality.
"""

import pytest
import asyncio
from unittest.mock import AsyncMock, patch
from langchain_core.messages import HumanMessage
from app.core.llm import invoke_gemini, _classify_error, CANDIDATE_MODELS


def test_gemini_error_classification():
    """Verify error categorizer accurately identifies HTTP and SDK exception types."""
    assert _classify_error(Exception("404 Resource models/nonexistent not found")) == (404, "MODEL_NOT_FOUND")
    assert _classify_error(Exception("429 Resource exhausted: quota exceeded")) == (429, "RESOURCE_EXHAUSTED")
    assert _classify_error(Exception("401 Invalid API key provided")) == (401, "AUTH_FAILURE")
    assert _classify_error(asyncio.TimeoutError()) == (408, "TIMEOUT")
    assert _classify_error(Exception("503 Service Unavailable: overloaded")) == (503, "SERVER_ERROR")


@pytest.mark.asyncio
async def test_gemini_404_model_not_found_advances_immediately():
    """
    Verify that encountering a 404 NOT_FOUND advances to the next candidate model
    without wasteful retry loops on the nonexistent model.
    """
    with patch("app.core.llm._get_api_keys", return_value=["test_api_key_valid"]):
        with patch("app.core.llm._invoke_model", new_callable=AsyncMock) as mock_invoke:
            mock_invoke.side_effect = [Exception("404 Model not found"), "Grounded clinical triage advice"]

            res = await invoke_gemini(
                [HumanMessage(content="Hello doctor")],
                feature="test_triage",
                timeout_seconds=2.0,
                max_retries_per_model=2
            )

            assert res == "Grounded clinical triage advice"
            # Model 1 called exactly once (skipped immediately on 404), then Model 2 called
            assert mock_invoke.call_count == 2


@pytest.mark.asyncio
async def test_gemini_429_quota_exhausted_retries_with_backoff_then_falls_back():
    """
    Verify that 429 quota exhaustion executes bounded backoff and then falls back to secondary model.
    """
    with patch("app.core.llm._get_api_keys", return_value=["test_api_key_valid"]):
        with patch("app.core.llm._invoke_model", new_callable=AsyncMock) as mock_invoke:
            mock_invoke.side_effect = [
                Exception("429 Quota exhausted for project"),
                Exception("429 Quota exhausted for project"),
                "Fallback model response",
            ]

            with patch("asyncio.sleep", new_callable=AsyncMock) as mock_sleep:
                res = await invoke_gemini(
                    [HumanMessage(content="Explain fever")],
                    feature="test_429",
                    timeout_seconds=2.0,
                    max_retries_per_model=2
                )

                assert res == "Fallback model response"
                # Sleep was called for backoff
                assert mock_sleep.called


@pytest.mark.asyncio
async def test_gemini_timeout_advances_to_fallback():
    """
    Verify that network timeout advances to fallback model cleanly.
    """
    with patch("app.core.llm._get_api_keys", return_value=["test_api_key_valid"]):
        with patch("app.core.llm._invoke_model", new_callable=AsyncMock) as mock_invoke:
            mock_invoke.side_effect = [
                asyncio.TimeoutError("Call timed out"),
                "Healthy recovered response",
            ]

            with patch("asyncio.sleep", new_callable=AsyncMock):
                res = await invoke_gemini(
                    [HumanMessage(content="Check symptoms")],
                    feature="test_timeout",
                    timeout_seconds=2.0,
                    max_retries_per_model=1
                )
                assert res == "Healthy recovered response"


@pytest.mark.asyncio
async def test_gemini_key_never_exposed_in_exception():
    """
    Security verification: When all models fail, exception message must never contain API secrets.
    """
    secret_key = "AIzaSySecretGoogleApiKey999"
    with patch("app.core.llm._get_api_keys", return_value=[secret_key]):
        with patch("app.core.llm._invoke_model", new_callable=AsyncMock) as mock_invoke:
            mock_invoke.side_effect = Exception("503 Service unavailable")

            with patch("asyncio.sleep", new_callable=AsyncMock):
                with pytest.raises(Exception) as exc_info:
                    await invoke_gemini(
                        [HumanMessage(content="Test query")],
                        feature="test_security",
                        timeout_seconds=1.0,
                        max_retries_per_model=1
                    )
                
                assert secret_key not in str(exc_info.value)
