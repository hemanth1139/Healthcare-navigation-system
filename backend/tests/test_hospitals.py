"""
Hospital recommendations and cache API integration tests.
"""

import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

pytestmark = pytest.mark.asyncio


async def _get_auth_headers(ac: AsyncClient) -> dict:
    """Helper to register/login a user and get auth header."""
    reg_payload = {
        "fullName": "Hospital Test User",
        "email": "hosp@example.com",
        "phone": "+15553334444",
        "password": "hosptestpassword123",
    }
    res = await ac.post("/api/v1/auth/register", json=reg_payload)
    token = res.json()["tokens"]["accessToken"]
    return {"Authorization": f"Bearer {token}"}


async def test_hospital_nearby_and_cache_flow():
    """Verify that nearby hospitals can be queried, cached in DB, and loaded by ID."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        headers = await _get_auth_headers(ac)

        # 1. Query nearby hospitals (Kolkata center: 22.5726, 88.3639)
        payload = {
            "latitude": 22.5726,
            "longitude": 88.3639,
            "maxDistanceKm": 20.0
        }
        res_nearby = await ac.post("/api/v1/hospitals/nearby", json=payload, headers=headers)
        assert res_nearby.status_code == 200
        hospitals = res_nearby.json()
        
        # Verify list returned matches mock/places criteria
        assert len(hospitals) >= 1
        assert "hospital_id" in hospitals[0]
        assert "hospital_name" in hospitals[0]
        assert "distance_km" in hospitals[0]
        assert "estimated_time" in hospitals[0]
        assert "specialties" in hospitals[0]
        
        hospital_id = hospitals[0]["hospital_id"]

        # 2. Get specific hospital details by ID from DB cache
        res_detail = await ac.get(f"/api/v1/hospitals/{hospital_id}", headers=headers)
        assert res_detail.status_code == 200
        hosp_detail = res_detail.json()
        assert hosp_detail["hospital_id"] == hospital_id
        assert hosp_detail["hospital_name"] != ""
        assert hosp_detail["google_place_id"] != ""
