"""
Daily health tips API integration tests.
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


async def test_daily_health_tips():
    """Verify daily customized health tips recommendations based on profiles."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        headers = await _get_auth_headers_and_profile(ac)

        # Fetch daily tips
        res_tips = await ac.get("/api/v1/tips/daily", headers=headers)
        assert res_tips.status_code == 200
        tips = res_tips.json()
        
        # Verify tips structures and personalized recommendations
        assert len(tips) >= 1
        tips_titles = [t["title"] for t in tips]
        assert any("Air Quality" in title for title in tips_titles)
