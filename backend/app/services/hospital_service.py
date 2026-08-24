"""
Hospital service — handles querying nearby hospital discoverability,
maintaining the cache database, and retrieving specific hospital details.
"""

from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional

from app.models.hospital import Hospital, HospitalRecommendation
from app.schemas.hospital import HospitalNearbyRequest, HospitalOut
from app.utils.maps import GoogleMapsService
from app.core.exceptions import NotFoundError


class HospitalService:

    @staticmethod
    async def get_nearby_hospitals(
        db: AsyncSession, payload: HospitalNearbyRequest
    ) -> List[HospitalOut]:
        """
        Query nearby hospitals, update database cache, and return results.
        """
        # 1. Fetch hospitals from Google Maps Wrapper
        hospitals_raw = GoogleMapsService.get_nearby_hospitals(
            payload.latitude,
            payload.longitude,
            payload.specialist,
            payload.max_distance_km
        )

        results = []
        for h in hospitals_raw:
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
                    rating=h.get("rating")
                )
                db.add(cached_hosp)
                await db.flush()

            # Format to Output Schema
            h_out = HospitalOut.from_dict(h, str(cached_hosp.hospital_id))
            results.append(h_out)

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
