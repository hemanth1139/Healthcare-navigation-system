import pytest
from app.utils.maps import OSRMService, haversine_distance, format_travel_time
from app.services.hospital_service import HospitalService
from app.schemas.hospital import HospitalNearbyRequest, HospitalOut
from app.models.hospital import Hospital
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

@pytest.mark.asyncio
async def test_osrm_identical_coordinates():
    """Identical or virtually identical origin and destination should produce < 1 min drive, not fabricated estimates."""
    origin = (13.0827, 80.2707)
    dest = (13.0827, 80.2707)
    route = await OSRMService.get_route(origin[0], origin[1], dest[0], dest[1])
    assert route is not None
    assert route["duration_minutes"] == 0.0
    assert route["distance_km"] == 0.0
    
    formatted = format_travel_time(route["duration_minutes"])
    assert formatted == "< 1 min drive"

def test_osrm_fallback_formatting():
    """Missing or None travel duration must explicitly format as 'Travel time unavailable'."""
    assert format_travel_time(None) == "Travel time unavailable"

def test_osrm_distance_and_duration_format():
    """Valid positive durations must format appropriately and not default to a fixed ~5 mins."""
    assert format_travel_time(1.0) == "1 min drive"
    assert format_travel_time(25.0) == "25 mins drive"
    assert format_travel_time(75.0) == "1 hr 15 mins drive"

def test_hospital_schema_no_fabrication():
    """HospitalOut must not fabricate 5 mins when duration is absent."""
    data = {
        "google_place_id": "test_place_1",
        "hospital_name": "Test Hospital",
        "latitude": 13.0827,
        "longitude": 80.2707,
        "distance_km": 2.5,
        "estimated_time": "Travel time unavailable"
    }
    hosp = HospitalOut.from_dict(data, hospital_id="hosp_test_1")
    assert hosp.estimated_time == "Travel time unavailable"
    assert hosp.hospital_name == "Test Hospital"

@pytest.mark.asyncio
async def test_hospital_service_local_db_priority(db_session: AsyncSession):
    """HospitalService must query local DB first and return verified Chennai hospitals with real coordinates."""
    # Seed a verified Chennai hospital into the test session
    hosp = Hospital(
        hospital_id=uuid.uuid4(),
        google_place_id="rgggh_chennai_test",
        hospital_name="Rajiv Gandhi Government General Hospital",
        hospital_type="Government",
        address="EVR Periyar Salai, Park Town, Chennai, Tamil Nadu 600003",
        city="Chennai",
        state="Tamil Nadu",
        latitude=13.0805,
        longitude=80.2785,
        phone="044-25305000",
        website="https://www.mmc.tn.gov.in",
        has_emergency_room=True,
        beds=2723,
        rating=4.3,
        specialties="Trauma Care, Cardiology, Neurology"
    )
    db_session.add(hosp)
    await db_session.commit()

    # User in Chennai Central area
    req = HospitalNearbyRequest(
        latitude=13.0827,
        longitude=80.2707,
        max_distance_km=15.0,
        max_results=20
    )
    hospitals = await HospitalService.get_nearby_hospitals(
        db=db_session,
        payload=req
    )
    
    assert len(hospitals) > 0
    # Every hospital must have valid real coordinates
    for h in hospitals:
        assert h.latitude is not None
        assert h.longitude is not None
        assert 12.5 <= h.latitude <= 14.0 # Chennai region
        assert 79.5 <= h.longitude <= 81.0
        assert h.distance_km >= 0.0
        assert h.estimated_time != "5 mins drive"

def test_haversine_distance_calculation():
    """Haversine distance between Chennai Central (13.0827, 80.2707) and Rajiv Gandhi Govt Hospital (13.0805, 80.2785) is ~0.9 km."""
    d = haversine_distance(13.0827, 80.2707, 13.0805, 80.2785)
    assert 0.7 < d < 1.2
