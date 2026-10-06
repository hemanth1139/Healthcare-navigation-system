"""
Hospital service — handles querying nearby hospital discoverability,
maintaining the cache database, and retrieving specific hospital details.
Uses OpenStreetMap Overpass API (free, no API key required).
"""

import uuid
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
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

    DEMO_LATITUDE = 13.009644
    DEMO_LONGITUDE = 80.004336
    DEMO_HOSPITAL_PREFIX = "thandalam_demo_"

    @staticmethod
    async def get_nearby_hospitals(
        db: AsyncSession, payload: HospitalNearbyRequest
    ) -> HospitalSearchResponse:
        """
        Query nearby hospitals using local database catalogue first.
        If local catalogue has insufficient matches, use OpenStreetMap Overpass API as fallback.
        Calculates real OSRM driving duration and distance.
        Focuses on Chennai and surrounding districts (Thiruvallur, Kancheepuram, Chengalpattu).
        """
        # Resolve user coordinates
        latitude, longitude = payload.latitude, payload.longitude
        location_query = (payload.location_query or "").strip()
        if payload.demo_only:
            latitude = HospitalService.DEMO_LATITUDE
            longitude = HospitalService.DEMO_LONGITUDE
            location_query = ""
        is_statewide = location_query.lower() in {"all tamil nadu", "tamil nadu"}
        # Chennai and surrounding districts only
        TN_DISTRICT_COORDS = {
            "thandalam": (13.009644, 80.004336),
            "poonamallee": (13.0567, 80.0747),
            "porur": (13.0381, 80.1428),
            "sriperumbudur": (12.9572, 79.9434),
            "tambaram": (12.9257, 80.1494),
            "velappanchavadi": (13.0589, 80.1267),
            "kundrathur": (13.0041, 80.1119),
            "mangadu": (13.0167, 80.1250),
            "chennai": (13.0827, 80.2707),
            "tiruvallur": (13.1438, 79.9083),
            "kanchipuram": (12.8342, 79.7036),
            "chengalpattu": (12.6922, 79.9770),
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
                        raise NotFoundError(f"Location '{location_query}'")
            elif is_statewide:
                latitude, longitude = 10.7905, 78.7047
            else:
                latitude, longitude = 13.0827, 80.2707

        # Ensure search center is within Tamil Nadu geographic boundaries (Lat: 8.0-13.75, Lon: 76.0-80.4)
        if latitude < 8.0 or latitude > 13.75 or longitude < 76.0 or longitude > 80.4:
            raise NotFoundError(f"Location '{location_query or 'Coordinates'}' is outside Tamil Nadu")

        radius_km = payload.max_distance_km if payload.max_distance_km and payload.max_distance_km > 0 else 25
        if payload.demo_only:
            radius_km = min(payload.max_distance_km or 25, 25) # Increased to 25km to show all demo hospitals
        if is_statewide and not payload.max_distance_km:
            radius_km = 400

        # 1. Primary Query: Local Database Catalogue with SQL-level filtering
        # Build WHERE conditions at database level for performance
        conditions = [Hospital.state == "Tamil Nadu"]
        
        # Filter out hospitals without coordinates
        conditions.append(Hospital.latitude.isnot(None))
        conditions.append(Hospital.longitude.isnot(None))
        
        # Filter out mock/corrupted entries
        conditions.append(Hospital.hospital_name.isnot(None))
        conditions.append(Hospital.hospital_name != "")
        conditions.append(~Hospital.hospital_name.ilike("hospital"))
        conditions.append(~Hospital.hospital_name.ilike("clinic"))
        conditions.append(~Hospital.hospital_name.ilike("health centre"))
        conditions.append(~Hospital.address.ilike("%offset from location%"))
        conditions.append(~Hospital.google_place_id.like("fallback_%"))
        
        # Demo mode filtering
        if payload.demo_only:
            conditions.append(Hospital.google_place_id.like(f"{HospitalService.DEMO_HOSPITAL_PREFIX}%"))
        
        # Geographic filtering at SQL level
        if location_query and not is_statewide:
            loc_clean = location_query.lower().split(",")[0].strip()
            if loc_clean in TN_DISTRICT_COORDS:
                # Match city or address containing district name
                conditions.append(
                    or_(
                        func.lower(Hospital.city) == loc_clean,
                        Hospital.address.ilike(f"%{loc_clean}%")
                    )
                )
        
        # Hospital type filtering
        if payload.hospital_type and payload.hospital_type.lower() != "all":
            conditions.append(Hospital.hospital_type.ilike(f"%{payload.hospital_type}%"))
        
        # Free-text search filtering
        if payload.search and payload.search.strip():
            term = f"%{payload.search.strip()}%"
            conditions.append(
                or_(
                    Hospital.hospital_name.ilike(term),
                    Hospital.address.ilike(term),
                    Hospital.city.ilike(term),
                    Hospital.specialties.ilike(term),
                )
            )
        
        # Apply all conditions
        stmt = select(Hospital).where(*conditions)
        db_res = await db.execute(stmt)
        db_hospitals = list(db_res.scalars().all())

        seen_keys = set()
        local_matched = []
        for h in db_hospitals:
            h_lat = float(h.latitude)
            h_lon = float(h.longitude)
            dist = haversine_distance(latitude, longitude, h_lat, h_lon)

            h_city = (h.city or "")
            h_addr = (h.address or "")
            h_name = (h.hospital_name or "")
            h_type = (h.hospital_type or "Unknown")
            h_specs = (h.specialties or "General Medicine")
            h_id = str(h.hospital_id)
            h_gpid = h.google_place_id or f"local_{h_id}"
            h_state_val = h.state or "Tamil Nadu"

            # Distance filtering (still needed as it requires calculation)
            if not is_statewide and dist > radius_km:
                continue

            # Specialty Filtering using Centralized Taxonomy (requires Python logic)
            spec_filter = payload.specialty or payload.specialist
            if spec_filter and not match_specialty(spec_filter, h_specs, h_name):
                continue

            # Strict in-memory deduplication by normalized name and close proximity (200m)
            h_name_lower = h_name.lower().strip()
            is_duplicate = False
            for m in local_matched:
                if m["hospital_name"].lower().strip() == h_name_lower:
                    if haversine_distance(h_lat, h_lon, m["latitude"], m["longitude"]) < 0.2:
                        is_duplicate = True
                        break
            if is_duplicate:
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
                "has_emergency_room": h.has_emergency_room if h.has_emergency_room is not None else False,
                "distance_km": round(dist, 2),
                "opening_hours": h.opening_hours,
                "beds": h.beds,
            })

        local_catalogue_count = len(local_matched)
        osm_results_added = 0

        # 2. Supplementary Discovery via OpenStreetMap if local DB matches are insufficient (< 3 results) and no specialty filter is active
        if not payload.demo_only and len(local_matched) < 3 and not is_statewide and not (payload.specialty or payload.specialist):
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
                        has_emergency_room=h_raw.get("has_emergency_room", False),
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
                    "has_emergency_room": h_raw.get("has_emergency_room", False),
                    "distance_km": round(h_raw.get("distance_km", 0.0), 2),
                    "opening_hours": h_raw.get("opening_hours"),
                    "beds": h_raw.get("beds"),
                })
                osm_results_added += 1

        # 3. Sort results
        if payload.sort_by == "name":
            local_matched.sort(key=lambda item: item["hospital_name"].lower())
        elif payload.sort_by == "rating":
            local_matched.sort(key=lambda item: (item["rating"] is None, -(item["rating"] or 0)))
        else:
            local_matched.sort(key=lambda item: item["distance_km"])

        capped_results = local_matched[:(payload.max_results or 50)]

        # Keep the presentation demo deterministic and independent of routing
        # service availability; ordinary searches still use live OSRM results.
        if payload.demo_only:
            for hospital in capped_results:
                hospital["duration_minutes"] = max(1, round(hospital["distance_km"] / 25 * 60))
                hospital["travel_time_source"] = "estimated"
        # 4. Attach Genuine OSRM Travel Times (only for top 20 to reduce API calls)
        elif capped_results:
            # Limit travel time calculations to top 20 hospitals for performance
            results_with_times = capped_results[:20]
            results_with_times = await OSRMService.attach_travel_times(
                start_lat=latitude,
                start_lon=longitude,
                hospitals=results_with_times,
            )
            # Merge back with remaining results without travel times
            capped_results = results_with_times + capped_results[20:]

        # 5. Format to HospitalOut Schema
        results = [HospitalOut.from_dict(h, h["hospital_id"]) for h in capped_results]
        
        # Return as HospitalSearchResponse with metadata
        return HospitalSearchResponse(
            hospitals=results,
            status="success",
            message=f"Found {len(results)} hospitals within {radius_km} km",
            requested_radius_km=radius_km,
            actual_radius_km=radius_km,
            # Keep API metadata accurate without adding source labels or live
            # failure messages to the presentation UI.
            data_source=(
                "live" if osm_results_added
                else "cached" if local_catalogue_count
                else "fallback"
            ),
        )

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
