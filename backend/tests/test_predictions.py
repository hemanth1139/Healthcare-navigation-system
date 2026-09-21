"""
Rule-Based Disease Prediction API integration tests.
"""

import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

pytestmark = pytest.mark.asyncio


async def _get_auth_headers(ac: AsyncClient) -> dict:
    """Helper to register/login a user and get auth header."""
    reg_payload = {
        "fullName": "Prediction Test User",
        "email": "predict@example.com",
        "phone": "+15552223333",
        "password": "predicttestpassword123",
    }
    res = await ac.post("/api/v1/auth/register", json=reg_payload)
    token = res.json()["tokens"]["accessToken"]
    return {"Authorization": f"Bearer {token}"}


async def test_prediction_pipeline_flow():
    """Verify that a disease prediction report and severity levels are computed and retrieved."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        headers = await _get_auth_headers(ac)

        # 1. Start conversation
        res_conv = await ac.post(
            "/api/v1/conversations",
            json={"language": "en", "inputType": "text"},
            headers=headers,
        )
        conversation_id = res_conv.json()["conversationId"]

        # 2. Add message turns with chest pain keywords to trigger ACS prediction
        res_msg = await ac.post(
            f"/api/v1/conversations/{conversation_id}/messages",
            json={"message": "I have had severe chest pain and radiation to my left arm.", "inputType": "text"},
            headers=headers,
        )
        assert res_msg.status_code == 200

        # 3. Trigger rule-based prediction
        res_pred = await ac.post(
            f"/api/v1/predictions/{conversation_id}/run",
            headers=headers,
        )
        assert res_pred.status_code == 200
        report = res_pred.json()
        
        # Verify prediction report properties
        assert "predicted_disease" in report
        assert "confidence_score" in report
        assert "severity" in report
        assert "specialist" in report

        prediction_id = report["prediction_id"]
        assert "Acute Coronary Syndrome" in report["predicted_disease"]
        assert "EMERGENCY" in report["severity"]["urgency_level"] or "URGENT" in report["severity"]["urgency_level"]
        assert "Cardiologist" in report["specialist"]["specialist"]

        # 4. Fetch prediction details by ID
        res_detail = await ac.get(f"/api/v1/predictions/{conversation_id}", headers=headers)
        assert res_detail.status_code == 200
        detail = res_detail.json()
        assert "Acute Coronary Syndrome" in detail["predicted_disease"]
