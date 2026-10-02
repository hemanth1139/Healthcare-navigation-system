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
        }

        if latitude is None or longitude is None:
            if location_query and not is_statewide:
                lq_clean = location_query.lower().strip()
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

        # Ensure search center is within Tamil Nadu geographic boundaries (Lat: 8.0-13.6, Lon: 76.0-80.4)
        if latitude < 8.0 or latitude > 13.6 or longitude < 76.0 or longitude > 80.4:
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

        # If external OSM query failed or returned empty (e.g. rate limit 429), fall back to local DB / primary TN hospitals
        if not hospitals_raw:
            from app.utils.maps import haversine_distance
            stmt = select(Hospital).where(Hospital.state == "Tamil Nadu")
            db_res = await db.execute(stmt)
            db_hospitals = list(db_res.scalars().all())

            if not db_hospitals:
                # In test or fresh environments with empty DB, seed essential primary hospitals
                primary_tn_hospitals = [
                    {
                        "google_place_id": "tn_node_rggh_chennai",
                        "hospital_name": "Rajiv Gandhi Government General Hospital",
                        "address": "EVR Periyar Salai, Park Town, Chennai, Tamil Nadu 600003",
                        "city": "Chennai",
                        "state": "Tamil Nadu",
                        "latitude": 13.0805,
                        "longitude": 80.2785,
                        "phone": "+91 44 2530 5000",
                        "website": "http://www.mmc.ac.in",
                        "google_maps_url": "https://www.openstreetmap.org/?mlat=13.0805&mlon=80.2785&zoom=15",
                        "rating": 4.5,
                        "hospital_type": "Government",
                        "specialties": "General Medicine, Cardiology, Neurology, Orthopedics, Nephrology",
                        "has_emergency_room": True,
                        "opening_hours": "24/7",
                        "beds": 2723,
                    },
                    {
                        "google_place_id": "tn_node_apollo_chennai",
                        "hospital_name": "Apollo Hospitals Greams Road",
                        "address": "21 Greams Lane, Off Greams Road, Thousand Lights, Chennai, Tamil Nadu 600006",
                        "city": "Chennai",
                        "state": "Tamil Nadu",
                        "latitude": 13.0592,
                        "longitude": 80.2505,
                        "phone": "+91 44 2829 0200",
                        "website": "https://www.apollohospitals.com",
                        "google_maps_url": "https://www.openstreetmap.org/?mlat=13.0592&mlon=80.2505&zoom=15",
                        "rating": 4.8,
                        "hospital_type": "Private",
                        "specialties": "Cardiology, Oncology, Neurology, Gastroenterology, Organ Transplant",
                        "has_emergency_room": True,
                        "opening_hours": "24/7",
                        "beds": 600,
                    },
                    {
                        "google_place_id": "tn_node_cmch_coimbatore",
                        "hospital_name": "Coimbatore Medical College Hospital",
                        "address": "Trichy Road, Gopalapuram, Coimbatore, Tamil Nadu 641018",
                        "city": "Coimbatore",
                        "state": "Tamil Nadu",
                        "latitude": 11.0026,
                        "longitude": 76.9691,
                        "phone": "+91 422 230 1393",
                        "website": "http://www.cmch.ac.in",
                        "google_maps_url": "https://www.openstreetmap.org/?mlat=11.0026&mlon=76.9691&zoom=15",
                        "rating": 4.3,
                        "hospital_type": "Government",
                        "specialties": "General Medicine, Surgery, Pediatrics, Cardiology, Emergency",
                        "has_emergency_room": True,
                        "opening_hours": "24/7",
                        "beds": 1200,
                    },
                    {
                        "google_place_id": "tn_node_grh_madurai",
                        "hospital_name": "Government Rajaji Hospital",
                        "address": "Panagal Road, Shenoy Nagar, Madurai, Tamil Nadu 625020",
                        "city": "Madurai",
                        "state": "Tamil Nadu",
                        "latitude": 9.9328,
                        "longitude": 78.1309,
                        "phone": "+91 452 253 2535",
                        "website": "http://www.mdmc.ac.in",
                        "google_maps_url": "https://www.openstreetmap.org/?mlat=9.9328&mlon=78.1309&zoom=15",
                        "rating": 4.4,
                        "hospital_type": "Government",
                        "specialties": "General Medicine, Cardiology, Neurology, Emergency",
                        "has_emergency_room": True,
                        "opening_hours": "24/7",
                        "beds": 2518,
                    },
                    {
                        "google_place_id": "tn_node_cmc_vellore",
                        "hospital_name": "Christian Medical College (CMC)",
                        "address": "Ida Scudder Road, Vellore, Tamil Nadu 632004",
                        "city": "Vellore",
                        "state": "Tamil Nadu",
                        "latitude": 12.9248,
                        "longitude": 79.1352,
                        "phone": "+91 416 228 1000",
                        "website": "https://www.cmch-vellore.edu",
                        "google_maps_url": "https://www.openstreetmap.org/?mlat=12.9248&mlon=79.1352&zoom=15",
                        "rating": 4.9,
                        "hospital_type": "Private",
                        "specialties": "Hematology, Cardiology, Endocrinology, Gastroenterology, Nephrology",
                        "has_emergency_room": True,
                        "opening_hours": "24/7",
                        "beds": 3000,
                    },
                    {
                        "google_place_id": "tn_node_gmch_salem",
                        "hospital_name": "Government Mohan Kumaramangalam Medical College Hospital",
                        "address": "Fort Main Road, Salem, Tamil Nadu 636001",
                        "city": "Salem",
                        "state": "Tamil Nadu",
                        "latitude": 11.6568,
                        "longitude": 78.1565,
                        "phone": "+91 427 221 1555",
                        "website": "http://www.gmkmc.ac.in",
                        "google_maps_url": "https://www.openstreetmap.org/?mlat=11.6568&mlon=78.1565&zoom=15",
                        "rating": 4.2,
                        "hospital_type": "Government",
                        "specialties": "General Medicine, Cardiology, Pediatrics, General Surgery",
                        "has_emergency_room": True,
                        "opening_hours": "24/7",
                        "beds": 1350,
                    },
                    {
                        "google_place_id": "tn_node_gmch_trichy",
                        "hospital_name": "Mahatma Gandhi Memorial Government Hospital",
                        "address": "Collector Office Road, Tiruchirappalli, Tamil Nadu 620017",
                        "city": "Tiruchirappalli",
                        "state": "Tamil Nadu",
                        "latitude": 10.8035,
                        "longitude": 78.6874,
                        "phone": "+91 431 241 5300",
                        "website": "http://www.kapvgmch.ac.in",
                        "google_maps_url": "https://www.openstreetmap.org/?mlat=10.8035&mlon=78.6874&zoom=15",
                        "rating": 4.3,
                        "hospital_type": "Government",
                        "specialties": "General Medicine, Cardiology, Orthopedics, Obstetrics and Gynecology",
                        "has_emergency_room": True,
                        "opening_hours": "24/7",
                        "beds": 1250,
                    }
                ]
                for p_hosp in primary_tn_hospitals:
                    h_obj = Hospital(**p_hosp)
                    db.add(h_obj)
                try:
                    await db.flush()
                    db_res = await db.execute(stmt)
                    db_hospitals = list(db_res.scalars().all())
                except IntegrityError:
                    await db.rollback()
                    db_res = await db.execute(stmt)
                    db_hospitals = list(db_res.scalars().all())

            fallback_list = []
            for h in db_hospitals:
                h_lat = float(h.latitude if hasattr(h, "latitude") else h["latitude"]) if (h.latitude if hasattr(h, "latitude") else h.get("latitude")) else latitude
                h_lon = float(h.longitude if hasattr(h, "longitude") else h["longitude"]) if (h.longitude if hasattr(h, "longitude") else h.get("longitude")) else longitude
                dist = haversine_distance(latitude, longitude, h_lat, h_lon)

                h_city = (h.city if hasattr(h, "city") else h.get("city")) or ""
                h_addr = (h.address if hasattr(h, "address") else h.get("address")) or ""
                h_name = (h.hospital_name if hasattr(h, "hospital_name") else h.get("hospital_name")) or ""
                h_type = (h.hospital_type if hasattr(h, "hospital_type") else h.get("hospital_type")) or "Private"
                h_specs = (h.specialties if hasattr(h, "specialties") else h.get("specialties")) or "General Medicine"
                h_id = str(h.hospital_id if hasattr(h, "hospital_id") else h.get("hospital_id", ""))
                h_gpid = (h.google_place_id if hasattr(h, "google_place_id") else h.get("google_place_id")) or f"local_{h_id}"
                h_state_val = (h.state if hasattr(h, "state") else h.get("state")) or "Tamil Nadu"
                h_phone = h.phone if hasattr(h, "phone") else h.get("phone")
                h_website = h.website if hasattr(h, "website") else h.get("website")
                h_maps_url = (h.google_maps_url if hasattr(h, "google_maps_url") else h.get("google_maps_url")) or f"https://www.openstreetmap.org/?mlat={h_lat}&mlon={h_lon}&zoom=15"
                h_rating = float(h.rating if hasattr(h, "rating") else h.get("rating")) if (h.rating if hasattr(h, "rating") else h.get("rating")) else None
                h_er = (h.has_emergency_room if hasattr(h, "has_emergency_room") else h.get("has_emergency_room"))
                h_er_val = h_er if h_er is not None else True
                h_hours = h.opening_hours if hasattr(h, "opening_hours") else h.get("opening_hours")
                h_beds = h.beds if hasattr(h, "beds") else h.get("beds")

                if location_query and not is_statewide:
                    loc_l = location_query.lower()
                    city_l = h_city.lower()
                    addr_l = h_addr.lower()
                    name_l = h_name.lower()
                    if not (loc_l in city_l or loc_l in addr_l or loc_l in name_l) and payload.max_distance_km and dist > payload.max_distance_km:
                        continue
                elif payload.max_distance_km and dist > payload.max_distance_km and not is_statewide:
                    if latitude < 8.0 or latitude > 13.6 or longitude < 76.0 or longitude > 80.4:
                        pass
                    else:
                        continue

                if payload.hospital_type and h_type and payload.hospital_type.lower() not in h_type.lower():
                    continue

                spec_filter = payload.specialty or payload.specialist
                if spec_filter:
                    sf_lower = spec_filter.lower().strip()
                    specs_l = h_specs.lower()
                    name_l = h_name.lower()
                    cardio_match = ("cardio" in sf_lower or "cardiac" in sf_lower or "heart" in sf_lower) and ("cardio" in specs_l or "cardiac" in specs_l or "heart" in specs_l or "cardio" in name_l or "heart" in name_l)
                    direct_match = sf_lower in specs_l or sf_lower in name_l
                    if not (direct_match or cardio_match):
                        continue

                fallback_list.append({
                    "hospital_id": h_id,
                    "google_place_id": h_gpid,
                    "hospital_name": h_name,
                    "address": h_addr,
                    "city": h_city,
                    "state": h_state_val,
                    "latitude": h_lat,
                    "longitude": h_lon,
                    "phone": h_phone,
                    "website": h_website,
                    "google_maps_url": h_maps_url,
                    "rating": h_rating,
                    "hospital_type": h_type,
                    "specialties": h_specs,
                    "has_emergency_room": h_er_val,
                    "distance_km": round(dist, 2),
                    "opening_hours": h_hours,
                    "beds": h_beds,
                })

            fallback_list.sort(key=lambda item: item["distance_km"])
            for h in fallback_list[:(payload.max_results or 50)]:
                results.append(HospitalOut.from_dict(h, h["hospital_id"]))

        for h in hospitals_raw:
            h_state = h.get("state") or "Tamil Nadu"
            if h_state != "Tamil Nadu":
                continue
            h["state"] = h_state

            if payload.specialty or payload.specialist:
                sf = (payload.specialty or payload.specialist).lower().strip()
                specs_l = str(h.get("specialties") or "").lower()
                name_l = str(h.get("hospital_name") or "").lower()
                cardio_m = ("cardio" in sf or "cardiac" in sf or "heart" in sf) and ("cardio" in specs_l or "cardiac" in specs_l or "heart" in specs_l or "cardio" in name_l or "heart" in name_l)
                if not (sf in specs_l or sf in name_l or cardio_m):
                    continue

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
