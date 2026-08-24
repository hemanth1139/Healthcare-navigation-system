"""
Disease Prediction, SHAP, and severity assessment API integration tests.
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
    """Verify that a disease prediction report, SHAP values, and severity levels are computed and retrieved."""
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

        # 3. Trigger prediction
        res_pred = await ac.post(
            "/api/v1/predictions",
            json={"conversationId": conversation_id},
            headers=headers,
        )
        assert res_pred.status_code == 201
        report = res_pred.json()
        
        # Verify prediction report schema properties
        assert "prediction" in report
        assert "differential" in report
        assert "shapExplanations" in report
        assert "severityAssessment" in report
        assert "recommendedSpecialistCategory" in report
        
        prediction_id = report["prediction"]["predictionId"]
        assert report["prediction"]["predictedDisease"] == "Acute Coronary Syndrome"
        assert report["severityAssessment"]["severity"] == "emergency"
        assert report["severityAssessment"]["emergencyFlag"] is True
        
        # Check SHAP explanations have plain language labels
        assert len(report["shapExplanations"]) >= 1
        assert report["shapExplanations"][0]["plainLanguageLabel"] != ""

        # 4. List predictions
        res_list = await ac.get("/api/v1/predictions", headers=headers)
        assert res_list.status_code == 200
        assert len(res_list.json()) >= 1

        # 5. Fetch prediction details by ID
        res_detail = await ac.get(f"/api/v1/predictions/{prediction_id}", headers=headers)
        assert res_detail.status_code == 200
        detail = res_detail.json()
        assert detail["prediction"]["predictedDisease"] == "Acute Coronary Syndrome"

        # 6. Fetch SHAP explanations separately
        res_shap = await ac.get(f"/api/v1/predictions/{prediction_id}/explanation", headers=headers)
        assert res_shap.status_code == 200
        assert len(res_shap.json()) >= 1
        
        # 7. Fetch Specialist category separately
        res_spec = await ac.get(f"/api/v1/predictions/{prediction_id}/specialist", headers=headers)
        assert res_spec.status_code == 200
        assert "specialist" in res_spec.json()
        assert res_spec.json()["specialist"] == "Cardiologist (Emergency)"
