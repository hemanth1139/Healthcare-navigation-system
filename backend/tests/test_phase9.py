"""
Voice processing, language translation, and daily health tips API integration tests.
"""

import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

pytestmark = pytest.mark.asyncio


async def _get_auth_headers_and_profile(ac: AsyncClient) -> dict:
    """Helper to register user, log in, create patient profile, and return auth header."""
    reg_payload = {
        "fullName": "Phase9 Test Patient",
        "email": "p9@example.com",
        "phone": "+15556667777",
        "password": "p9testpassword123",
    }
    res = await ac.post("/api/v1/auth/register", json=reg_payload)
    token = res.json()["tokens"]["accessToken"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create profile details
    profile_payload = {
        "dateOfBirth": "1990-05-15",
        "gender": "Male",
        "bloodGroup": "O+",
        "emergencyContactName": "Jane Doe",
        "emergencyContactPhone": "+15555557777"
    }
    await ac.put("/api/v1/profile", json=profile_payload, headers=headers)
    
    # Create sub-resources
    await ac.post("/api/v1/profile/allergies", json={"allergyName": "Peanut Allergy", "severity": "severe"}, headers=headers)
    await ac.post("/api/v1/profile/conditions", json={"conditionName": "Asthma", "diagnosedYear": 2015}, headers=headers)
    
    return headers


async def test_voice_processing_flow():
    """Verify STT transcription and TTS audio synthesis API endpoints."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        headers = await _get_auth_headers_and_profile(ac)

        # 1. Speech-To-Text (STT)
        audio_content = b"fake-audio-binary-data"
        files = {
            "file": ("chest_pain.wav", audio_content, "audio/wav")
        }
        res_stt = await ac.post("/api/v1/voice/stt", files=files, headers=headers)
        assert res_stt.status_code == 200
        assert "text" in res_stt.json()
        assert "chest pressure" in res_stt.json()["text"].lower()

        # 2. Text-To-Speech (TTS)
        payload = {
            "text": "Your prescription is ready for pickup.",
            "language": "en"
        }
        res_tts = await ac.post("/api/v1/voice/tts", json=payload, headers=headers)
        assert res_tts.status_code == 200
        assert "audioUrl" in res_tts.json()
        assert res_tts.json()["audioUrl"].endswith(".mp3")


async def test_language_translation():
    """Verify medical translations translate correctly to Hindi/Tamil."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        headers = await _get_auth_headers_and_profile(ac)

        # Hindi
        payload_hi = {
            "text": "Hello",
            "targetLang": "hi"
        }
        res_hi = await ac.post("/api/v1/translate", json=payload_hi, headers=headers)
        assert res_hi.status_code == 200
        assert res_hi.json()["translatedText"] == "नमस्ते"

        # Tamil
        payload_ta = {
            "text": "I have a headache and fever",
            "targetLang": "ta"
        }
        res_ta = await ac.post("/api/v1/translate", json=payload_ta, headers=headers)
        assert res_ta.status_code == 200
        assert "தலைவலியும் காய்ச்சலும்" in res_ta.json()["translatedText"]


async def test_daily_health_tips():
    """Verify daily customized health tips recommendations based on profiles."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        headers = await _get_auth_headers_and_profile(ac)

        # Fetch daily tips
        res_tips = await ac.get("/api/v1/tips/daily", headers=headers)
        assert res_tips.status_code == 200
        tips = res_tips.json()
        
        # Verify tips structures and personalized recommendations
        assert len(tips) == 3
        # Check that asthma-specific air quality advice was served
        tips_titles = [t["title"] for t in tips]
        assert "Monitor Air Quality Index" in tips_titles
