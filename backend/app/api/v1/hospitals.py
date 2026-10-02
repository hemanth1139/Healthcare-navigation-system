"""
Hospital Recommendation API router — /api/v1/hospitals/*
"""

from uuid import UUID
from fastapi import APIRouter
from typing import List
from pydantic import BaseModel

from app.dependencies import DBSession, CurrentUser
from app.schemas.hospital import HospitalNearbyRequest, HospitalOut, HospitalSearchResponse
from app.services.hospital_service import HospitalService
from app.utils.maps import NominatimService, OSRMService

router = APIRouter(prefix="/hospitals", tags=["Hospital Discovery & Recommendations"])


class GeocodeRequest(BaseModel):
    address: str


class RouteRequest(BaseModel):
    start_lat: float
    start_lon: float
    end_lat: float
    end_lon: float
    profile: str = "driving"  # driving, cycling, walking


@router.post("/nearby", response_model=HospitalSearchResponse)
async def get_nearby_hospitals(
    payload: HospitalNearbyRequest, db: DBSession
):
    """Retrieve nearby hospitals based on coordinates and filters, caching findings."""
    return await HospitalService.get_nearby_hospitals(db, payload)


@router.get("/{hospital_id}")
async def get_hospital_by_id(
    hospital_id: UUID, db: DBSession
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
        "google_maps_url": hosp.google_maps_url,
        "rating": float(hosp.rating) if hosp.rating else None,
        "hospital_type": hosp.hospital_type,
        "specialties": [s.strip() for s in hosp.specialties.split(",")] if hosp.specialties else [],
        "has_emergency_room": hosp.has_emergency_room,
    }


@router.post("/geocode")
async def geocode_address(payload: GeocodeRequest):
    """Convert address to coordinates using Nominatim (free)."""
    result = await NominatimService.geocode(payload.address)
    if result:
        return result
    return {"error": "Address not found"}


@router.get("/reverse-geocode")
async def reverse_geocode(lat: float, lon: float):
    """Convert coordinates to address using Nominatim (free)."""
    result = await NominatimService.reverse_geocode(lat, lon)
    if result:
        return result
    return {"error": "Location not found"}


@router.post("/route")
async def get_route(payload: RouteRequest):
    """Get route between two points using OSRM (free)."""
    result = await OSRMService.get_route(
        payload.start_lat,
        payload.start_lon,
        payload.end_lat,
        payload.end_lon,
        payload.profile
    )
    if result:
        return result
    return {"error": "Route not found"}

