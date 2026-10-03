"""
Hospital service — handles querying nearby hospital discoverability,
maintaining the cache database, and retrieving specific hospital details.
Uses OpenStreetMap Overpass API (free, no API key required).
"""

import uuid
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from typing import List, Optional

from app.models.hospital import Hospital, HospitalRecommendation
from app.schemas.hospital import HospitalNearbyRequest, HospitalOut, HospitalSearchResponse
from app.utils.maps import NominatimService, OpenStreetMapService, haversine_distance, OSRMService, resolve_tamil_nadu_district
from app.core.exceptions import NotFoundError

SPECIALTY_TAXONOMY = {
    "cardiology": ["cardio", "cardiac", "heart", "coronary", "vascular"],
    "neurology": ["neuro", "brain", "stroke", "spine", "neurosurgery"],
    "orthopedics": ["ortho", "orthopedic", "orthopaedics", "bone", "joint", "trauma", "arthroscopy"],
    "urology": ["uro", "urology", "urological", "nephrology", "kidney", "renal", "bladder", "prostate"],
    "pulmonology": ["pulmon", "pulmonary", "respiratory", "chest", "lung", "asthma"],
    "ent": ["ent", "ear", "nose", "throat", "otolaryngology", "head and neck"],
    "gastroenterology": ["gastro", "gastroenterology", "digestive", "liver", "endoscopy", "stomach"],
    "pediatrics": ["pediatr", "paediatr", "child", "infant", "neonat"],
    "oncology": ["oncol", "cancer", "tumor", "radiation oncology", "chemotherapy"],
    "emergency": ["emerg", "trauma", "casualty", "critical care", "icu"],
    "general_medicine": ["general", "physician", "internal medicine", "family medicine", "medicine"],
}

def match_specialty(spec_filter: str, hospital_specs: str, hospital_name: str) -> bool:
    if not spec_filter or spec_filter.lower().strip() in ["all", "any", ""]:
        return True
    
    sf = spec_filter.lower().strip()
    target_text = f"{hospital_specs} {hospital_name}".lower()
    
    # Direct substring match
    if sf in target_text:
        return True

    # Taxonomy keyword match
    for category, keywords in SPECIALTY_TAXONOMY.items():
        if any(k in sf for k in [category] + keywords):
            if any(k in target_text for k in keywords):
                return True

    return False


class HospitalService:

    @staticmethod
    async def get_nearby_hospitals(
        db: AsyncSession, payload: HospitalNearbyRequest
    ) -> HospitalSearchResponse:
        """
        Query nearby hospitals using local database catalogue first.
        If local catalogue has insufficient matches, use OpenStreetMap Overpass API as fallback.
        Calculates real OSRM driving duration and distance.
        """
        # Resolve user coordinates
        latitude, longitude = payload.latitude, payload.longitude
        location_query = (payload.location_query or "").strip()
        is_statewide = location_query.lower() in {"all tamil nadu", "tamil nadu"}
        TN_DISTRICT_COORDS = {
            "chennai": (13.0827, 80.2707),
            "coimbatore": (11.0168, 76.9558),
            "madurai": (9.9252, 78.1198),
            "salem": (11.6643, 78.1460),
            "tiruchirappalli": (10.7905, 78.7047),
            "trichy": (10.7905, 78.7047),
            "vellore": (12.9165, 79.1325),
            "tirunelveli": (8.7139, 77.7567),
            "thanjavur": (10.7870, 79.1378),
            "thoothukudi": (8.7642, 78.1348),
            "erode": (11.3410, 77.7172),
            "tiruppur": (11.1085, 77.3411),
            "dindigul": (10.3673, 77.9803),
            "kanchipuram": (12.8342, 79.7036),
            "chengalpattu": (12.6922, 79.9770),
            "tiruvallur": (13.1438, 79.9083),
        }

        if latitude is None or longitude is None:
            if location_query and not is_statewide:
                lq_clean = location_query.lower().split(",")[0].strip()
                if lq_clean in TN_DISTRICT_COORDS:
                    latitude, longitude = TN_DISTRICT_COORDS[lq_clean]
                else:
                    geocoded = await NominatimService.geocode(location_query + ", Tamil Nadu, India")
                    if geocoded:
                        latitude, longitude = geocoded["latitude"], geocoded["longitude"]
                    else:
                        latitude, longitude = 13.0827, 80.2707
            elif is_statewide:
                latitude, longitude = 10.7905, 78.7047
            else:
                latitude, longitude = 13.0827, 80.2707

        # Ensure search center is within Tamil Nadu geographic boundaries (Lat: 8.0-13.75, Lon: 76.0-80.4)
        if latitude < 8.0 or latitude > 13.75 or longitude < 76.0 or longitude > 80.4:
            latitude, longitude = 13.0827, 80.2707

        radius_km = payload.max_distance_km if payload.max_distance_km and payload.max_distance_km > 0 else 25
        if is_statewide and not payload.max_distance_km:
            radius_km = 400

        # 1. Primary Query: Local Database Catalogue
        stmt = select(Hospital).where(Hospital.state == "Tamil Nadu")
        db_res = await db.execute(stmt)
        db_hospitals = list(db_res.scalars().all())

        local_matched = []
        for h in db_hospitals:
            h_lat = float(h.latitude) if h.latitude is not None else latitude
            h_lon = float(h.longitude) if h.longitude is not None else longitude
            dist = haversine_distance(latitude, longitude, h_lat, h_lon)

            h_city = (h.city or "")
            h_addr = (h.address or "")
            h_name = (h.hospital_name or "")
            h_type = (h.hospital_type or "Private")
            h_specs = (h.specialties or "General Medicine")
            h_id = str(h.hospital_id)
            h_gpid = h.google_place_id or f"local_{h_id}"
            h_state_val = h.state or "Tamil Nadu"

            # Strict Geographic & District Isolation
            if location_query and not is_statewide:
                loc_clean = location_query.lower().split(",")[0].strip()
                if loc_clean in TN_DISTRICT_COORDS:
                    district_match = (h_city.lower() == loc_clean) or (loc_clean in h_addr.lower())
                    if not district_match:
                        continue
                    if dist > radius_km:
                        continue
                else:
                    if dist > radius_km:
                        continue
            elif not is_statewide and dist > radius_km:
                continue

            # Hospital Type Filtering
            if payload.hospital_type and payload.hospital_type.lower() not in h_type.lower():
                continue

            # Specialty Filtering using Centralized Taxonomy
            spec_filter = payload.specialty or payload.specialist
            if spec_filter and not match_specialty(spec_filter, h_specs, h_name):
                continue

            # Free-text search filtering
            if payload.search and payload.search.strip():
                term = payload.search.strip().lower()
                searchable = f"{h_name} {h_addr} {h_city} {h_state_val} {h_specs}".lower()
                if term not in searchable:
                    continue

            local_matched.append({
                "hospital_id": h_id,
                "google_place_id": h_gpid,
                "hospital_name": h_name,
                "address": h_addr,
                "city": h_city,
                "state": h_state_val,
                "latitude": h_lat,
                "longitude": h_lon,
                "phone": h.phone,
                "website": h.website,
                "google_maps_url": h.google_maps_url or f"https://www.google.com/maps/dir/?api=1&destination={h_lat},{h_lon}",
                "rating": float(h.rating) if h.rating is not None else None,
                "hospital_type": h_type,
                "specialties": h_specs,
                "has_emergency_room": h.has_emergency_room if h.has_emergency_room is not None else True,
                "distance_km": round(dist, 2),
                "opening_hours": h.opening_hours,
                "beds": h.beds,
            })

        # 2. Supplementary Discovery via OpenStreetMap if local DB matches are insufficient (< 3 results) and no specialty filter is active
        if len(local_matched) < 3 and not is_statewide and not (payload.specialty or payload.specialist):
            hospitals_raw = await OpenStreetMapService.search_hospitals(
                lat=latitude,
                lon=longitude,
                radius=int(radius_km * 1000),
                max_results=payload.max_results or 50,
                hospital_type=payload.hospital_type,
                specialty=None,
            )

            for h_raw in hospitals_raw:
                # Deduplicate with existing local_matched
                if any(m["google_place_id"] == h_raw["google_place_id"] or m["hospital_name"].lower() == h_raw["hospital_name"].lower() for m in local_matched):
                    continue

                raw_lat = float(h_raw.get("latitude") or latitude)
                raw_lon = float(h_raw.get("longitude") or longitude)
                resolved_city = resolve_tamil_nadu_district(raw_lat, raw_lon, h_raw.get("address", ""), h_raw.get("hospital_name", ""))

                # District Isolation Check for discovered hospitals
                if location_query and not is_statewide:
                    loc_clean = location_query.lower().split(",")[0].strip()
                    if loc_clean in TN_DISTRICT_COORDS and resolved_city.lower() != loc_clean:
                        continue

                # Cache newly discovered hospital into local DB
                stmt_find = select(Hospital).where(Hospital.google_place_id == h_raw["google_place_id"])
                cached_res = await db.execute(stmt_find)
                cached_hosp = cached_res.scalar_one_or_none()

                if not cached_hosp:
                    cached_hosp = Hospital(
                        google_place_id=h_raw["google_place_id"],
                        hospital_name=h_raw["hospital_name"],
                        address=h_raw.get("address"),
                        city=resolved_city,
                        state="Tamil Nadu",
                        latitude=raw_lat,
                        longitude=raw_lon,
                        phone=h_raw.get("phone"),
                        website=h_raw.get("website"),
                        google_maps_url=h_raw.get("google_maps_url"),
                        rating=h_raw.get("rating"),
                        hospital_type=h_raw.get("hospital_type", "Private"),
                        specialties=h_raw.get("specialties", "General Medicine"),
                        has_emergency_room=h_raw.get("has_emergency_room", True),
                        opening_hours=h_raw.get("opening_hours"),
                        beds=h_raw.get("beds"),
                    )
                    db.add(cached_hosp)
                    try:
                        await db.flush()
                    except IntegrityError:
                        await db.rollback()
                        cached_res = await db.execute(stmt_find)
                        cached_hosp = cached_res.scalar_one_or_none()

                h_raw_id = str(cached_hosp.hospital_id) if cached_hosp else str(uuid.uuid4())
                local_matched.append({
                    "hospital_id": h_raw_id,
                    "google_place_id": h_raw["google_place_id"],
                    "hospital_name": h_raw["hospital_name"],
                    "address": h_raw.get("address", ""),
                    "city": resolved_city,
                    "state": "Tamil Nadu",
                    "latitude": raw_lat,
                    "longitude": raw_lon,
                    "phone": h_raw.get("phone"),
                    "website": h_raw.get("website"),
                    "google_maps_url": h_raw.get("google_maps_url"),
                    "rating": float(h_raw["rating"]) if h_raw.get("rating") else None,
                    "hospital_type": h_raw.get("hospital_type", "Private"),
                    "specialties": h_raw.get("specialties", "General Medicine"),
                    "has_emergency_room": h_raw.get("has_emergency_room", True),
                    "distance_km": round(h_raw.get("distance_km", 0.0), 2),
                    "opening_hours": h_raw.get("opening_hours"),
                    "beds": h_raw.get("beds"),
                })

        # 3. Sort results
        if payload.sort_by == "name":
            local_matched.sort(key=lambda item: item["hospital_name"].lower())
        elif payload.sort_by == "rating":
            local_matched.sort(key=lambda item: (item["rating"] is None, -(item["rating"] or 0)))
        else:
            local_matched.sort(key=lambda item: item["distance_km"])

        capped_results = local_matched[:(payload.max_results or 50)]

        # 4. Attach Genuine OSRM Travel Times
        if capped_results:
            capped_results = await OSRMService.attach_travel_times(
                start_lat=latitude,
                start_lon=longitude,
                hospitals=capped_results,
            )

        # 5. Format to HospitalOut Schema
        results = [HospitalOut.from_dict(h, h["hospital_id"]) for h in capped_results]
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
