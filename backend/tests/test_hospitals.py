"""
Hospital recommendations, search, filter, and cache API integration tests.
Dedicated to Tamil Nadu, India.
"""

import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession
from app.main import app

pytestmark = pytest.mark.asyncio


async def _get_auth_headers(ac: AsyncClient) -> dict:
    """Helper to register/login a user and get auth header."""
    import uuid
    rand = uuid.uuid4().hex[:6]
    reg_payload = {
        "fullName": "Hospital Test User",
        "email": f"hosp_tester_{rand}@example.com",
        "phone": f"+9198{rand[:8]}",
        "password": "Password123!",
    }
    res = await ac.post("/api/v1/auth/register", json=reg_payload)
    if res.status_code == 201:
        token = res.json()["tokens"]["accessToken"]
    else:
        login_payload = {
            "email": f"hosp_tester_{rand}@example.com",
            "password": "Password123!",
        }
        res_login = await ac.post("/api/v1/auth/login", json=login_payload)
        token = res_login.json()["tokens"]["accessToken"]

    return {"Authorization": f"Bearer {token}"}


async def test_hospital_nearby_and_cache_flow(db_session: AsyncSession):
    """Verify that nearby hospitals can be queried with coordinates, cached in DB, and loaded by ID."""
    await _ensure_sample_hospitals(db_session)
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


async def test_hospital_location_query_and_filters(db_session: AsyncSession):
    """Verify search by location string, hospital type filter, and specialty filter."""
    await _ensure_sample_hospitals(db_session)
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



from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.hospital import Hospital
import uuid

async def _ensure_sample_hospitals(db: AsyncSession):
    res = await db.execute(select(Hospital))
    existing = res.scalars().all()
    if len(existing) >= 6:
        return
    sample_data = [
        {"name": "Rajiv Gandhi Government General Hospital", "type": "Government", "city": "Chennai", "lat": 13.0805, "lon": 80.2785, "spec": "Trauma Care, Cardiology, Neurology, General Medicine"},
        {"name": "Coimbatore Medical College Hospital", "type": "Government", "city": "Coimbatore", "lat": 11.0016, "lon": 76.9629, "spec": "General Medicine, Cardiology, Emergency"},
        {"name": "Government Rajaji Hospital", "type": "Government", "city": "Madurai", "lat": 9.9252, "lon": 78.1198, "spec": "General Medicine, Surgery, Pediatrics"},
        {"name": "Government Mohan Kumaramangalam Medical College Hospital", "type": "Government", "city": "Salem", "lat": 11.6643, "lon": 78.1460, "spec": "General Medicine, Orthopedics"},
        {"name": "Mahatma Gandhi Memorial Government Hospital", "type": "Government", "city": "Tiruchirappalli", "lat": 10.7905, "lon": 78.7047, "spec": "General Medicine, Cardiology"},
        {"name": "Government Vellore Medical College Hospital", "type": "Government", "city": "Vellore", "lat": 12.9165, "lon": 79.1325, "spec": "General Medicine, Emergency"},
    ]
    for s in sample_data:
        db.add(Hospital(
            hospital_id=uuid.uuid4(),
            google_place_id=f"test_hosp_{uuid.uuid4().hex[:8]}",
            hospital_name=s["name"],
            hospital_type=s["type"],
            address=f"{s['name']}, {s['city']}, Tamil Nadu",
            city=s["city"],
            state="Tamil Nadu",
            latitude=s["lat"],
            longitude=s["lon"],
            phone="044-25305000",
            specialties=s["spec"],
            has_emergency_room=True,
            rating=4.5
        ))
    await db.commit()

async def test_tamil_nadu_districts_discovery(db_session: AsyncSession):
    """Verify discovery across Coimbatore, Madurai, Salem, Trichy, and Vellore."""
    await _ensure_sample_hospitals(db_session)
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


async def test_gps_outside_tamil_nadu_safety(db_session: AsyncSession):
    """Verify that coordinates outside Tamil Nadu (e.g. Delhi) are safely handled and return only Tamil Nadu hospitals."""
    await _ensure_sample_hospitals(db_session)
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
