"""
Hospital recommendations, search, filter, and cache API integration tests.
Dedicated to Tamil Nadu, India.
"""

import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

pytestmark = pytest.mark.asyncio


async def _get_auth_headers(ac: AsyncClient) -> dict:
    """Helper to register/login a user and get auth header."""
    reg_payload = {
        "fullName": "Hospital Test User",
        "email": "hosp_tester_tn@example.com",
        "phone": "+15553334444",
        "password": "hosptestpassword123",
    }
    res = await ac.post("/api/v1/auth/register", json=reg_payload)
    if res.status_code == 201:
        token = res.json()["tokens"]["accessToken"]
    else:
        login_payload = {
            "email": "hosp_tester_tn@example.com",
            "password": "hosptestpassword123",
        }
        res_login = await ac.post("/api/v1/auth/login", json=login_payload)
        token = res_login.json()["tokens"]["accessToken"]

    return {"Authorization": f"Bearer {token}"}


async def test_hospital_nearby_and_cache_flow():
    """Verify that nearby hospitals can be queried with coordinates, cached in DB, and loaded by ID."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        headers = await _get_auth_headers(ac)

        # 1. Query nearby hospitals in Chennai (13.0827, 80.2707)
        payload = {
            "latitude": 13.0827,
            "longitude": 80.2707,
            "maxDistanceKm": 25.0
        }
        res_nearby = await ac.post("/api/v1/hospitals/nearby", json=payload, headers=headers)
        assert res_nearby.status_code == 200
        hospitals = res_nearby.json()
        
        assert len(hospitals) >= 1
        assert "hospital_id" in hospitals[0]
        assert "hospital_name" in hospitals[0]
        assert "distance_km" in hospitals[0]
        assert "specialties" in hospitals[0]
        assert "hospital_type" in hospitals[0]
        assert "google_maps_url" in hospitals[0]
        
        # Verify all are in Tamil Nadu
        for h in hospitals:
            assert h.get("state") == "Tamil Nadu"
        
        hospital_id = hospitals[0]["hospital_id"]

        # 2. Get specific hospital details by ID from DB cache
        res_detail = await ac.get(f"/api/v1/hospitals/{hospital_id}", headers=headers)
        assert res_detail.status_code == 200
        hosp_detail = res_detail.json()
        assert hosp_detail["hospital_id"] == hospital_id
        assert hosp_detail["hospital_name"] != ""
        assert hosp_detail["google_place_id"] != ""
        assert hosp_detail.get("state") == "Tamil Nadu"
        assert "hospital_type" in hosp_detail
        assert "specialties" in hosp_detail


async def test_hospital_location_query_and_filters():
    """Verify search by location string, hospital type filter, and specialty filter."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        headers = await _get_auth_headers(ac)

        # Test location query: Chennai + Government hospital filter
        payload = {
            "locationQuery": "Chennai",
            "hospitalType": "Government",
            "maxDistanceKm": 30.0
        }
        res = await ac.post("/api/v1/hospitals/nearby", json=payload, headers=headers)
        assert res.status_code == 200
        hospitals = res.json()
        assert len(hospitals) >= 1
        for h in hospitals:
            assert h.get("state") == "Tamil Nadu"
            assert "government" in h["hospital_type"].lower() or "govt" in h["hospital_type"].lower()

        # Test specialty search: Cardiology
        payload_spec = {
            "locationQuery": "Chennai",
            "specialty": "Cardiology"
        }
        res_spec = await ac.post("/api/v1/hospitals/nearby", json=payload_spec, headers=headers)
        assert res_spec.status_code == 200
        spec_hospitals = res_spec.json()
        assert len(spec_hospitals) >= 1
        for h in spec_hospitals:
            assert h.get("state") == "Tamil Nadu"
            assert any("cardio" in s.lower() or "cardiac" in s.lower() for s in h["specialties"])



async def test_tamil_nadu_districts_discovery():
    """Verify discovery across Coimbatore, Madurai, Salem, Trichy, and Vellore."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        headers = await _get_auth_headers(ac)

        districts = ["Coimbatore", "Madurai", "Salem", "Tiruchirappalli", "Vellore"]
        for dist_name in districts:
            payload = {"locationQuery": dist_name}
            res = await ac.post("/api/v1/hospitals/nearby", json=payload, headers=headers)
            assert res.status_code == 200
            hospitals = res.json()
            assert len(hospitals) >= 1, f"Expected at least 1 hospital in {dist_name}"
            for h in hospitals:
                assert h.get("state") == "Tamil Nadu"


async def test_gps_outside_tamil_nadu_safety():
    """Verify that coordinates outside Tamil Nadu (e.g. Delhi) are safely handled and return only Tamil Nadu hospitals."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        headers = await _get_auth_headers(ac)

        # Delhi coordinates (28.6139, 77.2090)
        payload = {
            "latitude": 28.6139,
            "longitude": 77.2090,
            "maxDistanceKm": 50.0
        }
        res = await ac.post("/api/v1/hospitals/nearby", json=payload, headers=headers)
        assert res.status_code == 200
        hospitals = res.json()
        # Should return Chennai/TN hospitals with zero out-of-state records
        assert len(hospitals) >= 1
        for h in hospitals:
            assert h.get("state") == "Tamil Nadu"
