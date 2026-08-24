"""
Conversational Triage Agent and conversations API integration tests.
"""

import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

pytestmark = pytest.mark.asyncio


async def _get_auth_headers(ac: AsyncClient) -> dict:
    """Helper to register/login a user and get auth header."""
    reg_payload = {
        "fullName": "Agent Test User",
        "email": "agent@example.com",
        "phone": "+15551112222",
        "password": "agenttestpassword123",
    }
    res = await ac.post("/api/v1/auth/register", json=reg_payload)
    token = res.json()["tokens"]["accessToken"]
    return {"Authorization": f"Bearer {token}"}


async def test_conversational_triage_flow():
    """Verify that a conversation can be started, processed via triage nodes, and concluded."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        headers = await _get_auth_headers(ac)

        # 1. Create a new conversation session
        res_create = await ac.post(
            "/api/v1/conversations",
            json={"language": "en", "inputType": "text"},
            headers=headers,
        )
        assert res_create.status_code == 201
        conv = res_create.json()
        assert conv["status"] == "active"
        conversation_id = conv["conversationId"]

        # 2. Send initial message about a symptom (e.g. fever)
        # Should ask a follow-up question
        res_msg1 = await ac.post(
            f"/api/v1/conversations/{conversation_id}/messages",
            json={"message": "I have had a high fever for the last two days.", "inputType": "text"},
            headers=headers,
        )
        assert res_msg1.status_code == 200
        msg1_data = res_msg1.json()
        assert msg1_data["sender"] == "agent"
        assert msg1_data["followUpQuestion"] is not None
        assert msg1_data["followUpQuestion"]["questionText"] != ""

        # 3. List conversations and verify it shows up
        res_list = await ac.get("/api/v1/conversations", headers=headers)
        assert res_list.status_code == 200
        assert len(res_list.json()) >= 1

        # 4. Fetch the specific conversation details
        res_detail = await ac.get(f"/api/v1/conversations/{conversation_id}", headers=headers)
        assert res_detail.status_code == 200
        assert res_detail.json()["status"] == "active"

        # 5. Send more message turns to simulate completion (history >= 5 messages)
        # Turn 2
        await ac.post(
            f"/api/v1/conversations/{conversation_id}/messages",
            json={"message": "No, I don't think I have chest pain.", "inputType": "text"},
            headers=headers,
        )
        
        # Turn 3 (This completes the 5 history turn trigger in mock triage)
        res_conclude = await ac.post(
            f"/api/v1/conversations/{conversation_id}/messages",
            json={"message": "Yes, I also have a mild headache.", "inputType": "text"},
            headers=headers,
        )
        assert res_conclude.status_code == 200
        conclude_data = res_conclude.json()
        # Mock triage ends after 5 messages in history, returning needs_more_info = False
        # The reply text should summarize extracted symptoms and specify predictionId
        assert conclude_data["predictionId"] is not None
        assert "assess your symptoms" in conclude_data["message"]

        # 6. Verify that sending message to concluded conversation returns validation error
        res_blocked = await ac.post(
            f"/api/v1/conversations/{conversation_id}/messages",
            json={"message": "Wait, one more thing.", "inputType": "text"},
            headers=headers,
        )
        assert res_blocked.status_code == 422
