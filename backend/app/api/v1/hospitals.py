"""
Hospital Recommendation API router — /api/v1/hospitals/*
"""

from uuid import UUID
from fastapi import APIRouter
from typing import List

from app.dependencies import DBSession, CurrentUser
from app.schemas.hospital import HospitalNearbyRequest, HospitalOut
from app.services.hospital_service import HospitalService

router = APIRouter(prefix="/hospitals", tags=["Hospital Discovery & Recommendations"])


@router.post("/nearby", response_model=List[HospitalOut])
async def get_nearby_hospitals(
    payload: HospitalNearbyRequest, db: DBSession, current_user: CurrentUser
):
    """Retrieve nearby hospitals based on coordinates and filters, caching findings."""
    return await HospitalService.get_nearby_hospitals(db, payload)


@router.get("/{hospital_id}")
async def get_hospital_by_id(
    hospital_id: UUID, db: DBSession, current_user: CurrentUser
):
    """Fetch details of a single hospital from cache database."""
    hosp = await HospitalService.get_hospital_by_id(db, hospital_id)
    return {
        "hospital_id": str(hosp.hospital_id),
        "google_place_id": hosp.google_place_id,
        "hospital_name": hosp.hospital_name,
        "address": hosp.address,
        "city": hosp.city,
        "state": hosp.state,
        "latitude": float(hosp.latitude) if hosp.latitude else None,
        "longitude": float(hosp.longitude) if hosp.longitude else None,
        "phone": hosp.phone,
        "website": hosp.website,
        "rating": float(hosp.rating) if hosp.rating else None,
    }
