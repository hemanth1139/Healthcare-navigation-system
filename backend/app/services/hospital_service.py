"""
Hospital service — handles querying nearby hospital discoverability,
maintaining the cache database, and retrieving specific hospital details.
Uses OpenStreetMap Overpass API (free, no API key required).
"""

from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from typing import List, Optional

from app.models.hospital import Hospital, HospitalRecommendation
from app.schemas.hospital import HospitalNearbyRequest, HospitalOut
from app.utils.maps import NominatimService, OpenStreetMapService
from app.core.exceptions import NotFoundError


class HospitalService:

    @staticmethod
    async def get_nearby_hospitals(
        db: AsyncSession, payload: HospitalNearbyRequest
    ) -> List[HospitalOut]:
        """
        Query nearby hospitals using OpenStreetMap Overpass API (free),
        update database cache, and return results.
        """
        # Resolve manual locations instead of silently searching around Chennai.
        latitude, longitude = payload.latitude, payload.longitude
        location_query = (payload.location_query or "").strip()
        is_statewide = location_query.lower() in {"all tamil nadu", "tamil nadu"}
        if latitude is None or longitude is None:
            if location_query and not is_statewide:
                geocoded = await NominatimService.geocode(location_query + ", Tamil Nadu, India")
                if not geocoded:
                    return []
                latitude, longitude = geocoded["latitude"], geocoded["longitude"]
            elif is_statewide:
                latitude, longitude = 10.7905, 78.7047
            else:
                latitude, longitude = 13.0827, 80.2707

        radius_km = payload.max_distance_km if payload.max_distance_km and payload.max_distance_km > 0 else 10
        if is_statewide and not payload.max_distance_km:
            radius_km = 250

        # 1. Fetch hospitals from OpenStreetMap Overpass API
        hospitals_raw = await OpenStreetMapService.search_hospitals(
            lat=latitude,
            lon=longitude,
            radius=int(radius_km * 1000),
            max_results=payload.max_results or 50,
            hospital_type=payload.hospital_type,
            specialty=payload.specialty or payload.specialist
        )

        results = []
        for h in hospitals_raw:
            if payload.search and payload.search.strip():
                term = payload.search.strip().lower()
                searchable = " ".join(str(h.get(field) or "") for field in ("hospital_name", "address", "city", "state", "specialties", "specialty_search_text"))
                if term not in searchable.lower():
                    continue
            if payload.max_distance_km and h.get("distance_km", 0) > payload.max_distance_km:
                continue

            # 2. Check if hospital already cached in DB
            result = await db.execute(
                select(Hospital).where(Hospital.google_place_id == h["google_place_id"])
            )
            cached_hosp = result.scalar_one_or_none()

            if not cached_hosp:
                # Cache it in DB
                cached_hosp = Hospital(
                    google_place_id=h["google_place_id"],
                    hospital_name=h["hospital_name"],
                    address=h.get("address"),
                    city=h.get("city"),
                    state=h.get("state"),
                    latitude=h.get("latitude"),
                    longitude=h.get("longitude"),
                    phone=h.get("phone"),
                    website=h.get("website"),
                    google_maps_url=h.get("google_maps_url"),
                    rating=h.get("rating"),
                    hospital_type=h.get("hospital_type", "Private"),
                    specialties=h.get("specialties", "General Medicine"),
                    has_emergency_room=h.get("has_emergency_room", True),
                    opening_hours=h.get("opening_hours"),
                    beds=h.get("beds")
                )
                db.add(cached_hosp)
                try:
                    await db.flush()
                except IntegrityError:
                    # Concurrent nearby searches can race between the lookup and
                    # insert. Roll back the losing insert and use the winner's row.
                    await db.rollback()
                    result = await db.execute(
                        select(Hospital).where(Hospital.google_place_id == h["google_place_id"])
                    )
                    cached_hosp = result.scalar_one_or_none()
                    if cached_hosp is None:
                        raise

            # Format to Output Schema - update with current distance data
            h_out = HospitalOut.from_dict(h, str(cached_hosp.hospital_id))
            results.append(h_out)

        if payload.sort_by == "name":
            results.sort(key=lambda hospital: hospital.hospital_name.lower())
        elif payload.sort_by == "rating":
            results.sort(key=lambda hospital: (hospital.rating is None, -(hospital.rating or 0)))
        else:
            results.sort(key=lambda hospital: hospital.distance_km)

        return results

    @staticmethod
    async def get_hospital_by_id(db: AsyncSession, hospital_id: UUID) -> Hospital:
        """Fetch hospital details from cache DB."""
        result = await db.execute(
            select(Hospital).where(Hospital.hospital_id == hospital_id)
        )
        hosp = result.scalar_one_or_none()
        if not hosp:
            raise NotFoundError("Hospital")
        return hosp
