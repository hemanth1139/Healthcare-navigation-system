"""
Enhanced OpenStreetMap Services.
Free, no API key required.
- Overpass API for hospital data
- Nominatim for geocoding/reverse geocoding
- OSRM for routing/directions
"""

import math
import logging
import time
import asyncio
import httpx
from typing import List, Dict, Any, Optional, Tuple
from app.config import settings

logger = logging.getLogger(__name__)
_hospital_search_cache: Dict[tuple, tuple[float, List[Dict[str, Any]]]] = {}
_hospital_search_locks: Dict[tuple, asyncio.Lock] = {}
_HOSPITAL_CACHE_TTL_SECONDS = 15 * 60


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great circle distance between two points on Earth."""
    R = 6371  # Earth's radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


class OpenStreetMapService:

    @staticmethod
    async def search_hospitals(
        lat: float,
        lon: float,
        radius: int = 10000,  # 10km radius
        max_results: int = 50,
        hospital_type: Optional[str] = None,
        specialty: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        cache_key = (
            round(lat, 4), round(lon, 4), radius, max_results,
            (hospital_type or "").lower(), (specialty or "").lower(),
        )
        cached = _hospital_search_cache.get(cache_key)
        if cached and time.monotonic() - cached[0] < _HOSPITAL_CACHE_TTL_SECONDS:
            return [dict(item) for item in cached[1]]

        lock = _hospital_search_locks.setdefault(cache_key, asyncio.Lock())
        async with lock:
            # Another request for the same location/filter may have populated
            # the cache while this request waited.
            cached = _hospital_search_cache.get(cache_key)
            if cached and time.monotonic() - cached[0] < _HOSPITAL_CACHE_TTL_SECONDS:
                return [dict(item) for item in cached[1]]

            results = await OpenStreetMapService._query_hospitals(
                lat, lon, radius, max_results, hospital_type, specialty, cache_key
            )
            if results:
                return results

            # During rate limiting or an outage, prefer slightly stale real OSM
            # results over an empty response; never invent facilities.
            cached = _hospital_search_cache.get(cache_key)
            if cached and cached[1]:
                logger.warning("[OpenStreetMap] Serving stale cached hospitals after upstream failure")
                return [dict(item) for item in cached[1]]
            return results

    @staticmethod
    async def _query_hospitals(
        lat: float,
        lon: float,
        radius: int,
        max_results: int,
        hospital_type: Optional[str],
        specialty: Optional[str],
        cache_key: tuple,
    ) -> List[Dict[str, Any]]:
        """
        Search for hospitals using OpenStreetMap Overpass API.
        Progressively reduce the requested radius only after resource/timeouts.
        """
        try:
            data = None
            used_radius = radius
            rate_limited = False
            radii = list(dict.fromkeys([radius, min(radius, 10000), min(radius, 5000)]))
            endpoints = (
                "https://overpass-api.de/api/interpreter",
                "https://overpass.kumi.systems/api/interpreter",
            )
            async with httpx.AsyncClient(timeout=25.0) as client:
                for query_radius in radii:
                    # amenity=hospital is the canonical hospital tag; nwr still
                    # covers nodes, mapped building outlines, and relations.
                    query = f"""
                    [out:json][timeout:15][maxsize:67108864];
                    nwr["amenity"="hospital"](around:{query_radius},{lat},{lon});
                    out center;
                    """
                    logger.info(
                        "[OpenStreetMap] Querying hospitals at lat=%s lon=%s radius=%sm",
                        lat, lon, query_radius,
                    )
                    for endpoint in endpoints:
                        try:
                            response = await client.post(
                                endpoint,
                                data={"data": query},
                                headers={"Accept": "application/json", "User-Agent": "HealthcareNavigationSystem/1.0"},
                            )
                            response.raise_for_status()
                            data = response.json()
                            used_radius = query_radius
                            break
                        except (httpx.HTTPError, ValueError) as endpoint_error:
                            logger.warning(
                                "[OpenStreetMap] Overpass endpoint %s failed at %sm: %s",
                                endpoint, query_radius, endpoint_error,
                            )
                            if (
                                isinstance(endpoint_error, httpx.HTTPStatusError)
                                and endpoint_error.response.status_code == 429
                            ):
                                rate_limited = True
                    if data is not None:
                        break
                    if rate_limited:
                        logger.warning(
                            "[OpenStreetMap] Stopping radius retries after HTTP 429 to avoid adding load"
                        )
                        break

            if data is None:
                logger.error("[OpenStreetMap] All Overpass endpoints failed; returning no results rather than fabricated hospitals")
                return []

            if used_radius < radius:
                logger.warning(
                    "[OpenStreetMap] Returning partial-radius results (%sm of requested %sm) after timeout/load rejection",
                    used_radius, radius,
                )
            logger.info("[OpenStreetMap] Found %d elements", len(data.get("elements", [])))
            results = []
            seen = set()
            for element in data.get("elements", []):
                hospital = OpenStreetMapService._parse_osm_element(element, lat, lon)
                if not hospital:
                    continue
                if hospital["google_place_id"] in seen:
                    continue
                seen.add(hospital["google_place_id"])
                if hospital_type and not OpenStreetMapService._matches_type(hospital, hospital_type):
                    continue
                if specialty and not OpenStreetMapService._matches_specialty(hospital, specialty):
                    continue
                results.append(hospital)

            logger.info("[OpenStreetMap] Parsed %d hospitals", len(results))
            results.sort(key=lambda item: item.get("distance_km", float("inf")))
            results = results[:max_results]
            _hospital_search_cache[cache_key] = (time.monotonic(), [dict(item) for item in results])
            return results
                
        except Exception as e:
            logger.error(f"[OpenStreetMap] API error: {e}")
            return []

    @staticmethod
    def _parse_osm_element(element: Dict[str, Any], center_lat: float, center_lon: float) -> Optional[Dict[str, Any]]:
        """Parse an OSM element into hospital data with enhanced fields."""
        try:
            tags = element.get("tags", {})
            
            # Get coordinates
            if element["type"] == "node":
                lat = element.get("lat")
                lon = element.get("lon")
            else:
                # For ways/relations, use center or bounds
                lat = element.get("center", {}).get("lat")
                lon = element.get("center", {}).get("lon")
                if lat is None or lon is None:
                    bounds = element.get("bounds", {})
                    lat = (bounds.get("minlat", 0) + bounds.get("maxlat", 0)) / 2
                    lon = (bounds.get("minlon", 0) + bounds.get("maxlon", 0)) / 2
            
            if lat is None or lon is None:
                return None
            
            # Calculate distance
            distance = haversine_distance(center_lat, center_lon, lat, lon)
            
            # Enhanced hospital type detection
            operator = tags.get("operator", "").lower()
            healthcare = tags.get("healthcare", "").lower()
            amenity = tags.get("amenity", "").lower()
            
            if "government" in operator or "govt" in operator or "state" in operator:
                hospital_type = "Government"
            elif "private" in operator:
                hospital_type = "Private"
            elif healthcare == "hospital" or amenity == "hospital":
                hospital_type = "Private"  # Default for hospitals
            elif healthcare == "clinic" or amenity == "clinic":
                hospital_type = "Clinic"
            else:
                hospital_type = "Private"
            
            # OSM data uses several spelling/tag conventions for specialties.
            specialty_values = [
                tags.get("healthcare:speciality"),
                tags.get("healthcare:specialty"),
                tags.get("medical"),
                tags.get("speciality"),
                tags.get("specialty"),
            ]
            specialties = []
            for value in specialty_values:
                if value:
                    specialties.extend(
                        term.strip() for term in value.replace(",", ";").split(";") if term.strip()
                    )
            if not specialties:
                specialties = ["General Medicine"]
            
            # Build enhanced address
            address = OpenStreetMapService._build_address(tags)
            
            hospital = {
                "google_place_id": f"osm_{element.get('type', 'unknown')}_{element.get('id', 'unknown')}",
                "hospital_name": tags.get("name", tags.get("alt_name", "Hospital")),
                "address": address,
                "city": tags.get("addr:city", tags.get("city", "")),
                "state": tags.get("addr:state", tags.get("state", "")),
                "latitude": lat,
                "longitude": lon,
                "phone": tags.get("phone", tags.get("contact:phone", "")),
                "website": tags.get("website", tags.get("contact:website", "")),
                "google_maps_url": f"https://www.openstreetmap.org/?mlat={lat}&mlon={lon}&zoom=15",
                "rating": None,
                "hospital_type": hospital_type,
                "specialties": ", ".join(specialties),
                "specialty_search_text": " ".join(
                    str(tags.get(key) or "")
                    for key in (
                        "name", "alt_name", "description", "operator",
                        "healthcare:speciality", "healthcare:specialty",
                        "medical", "speciality", "specialty",
                    )
                ),
                "has_emergency_room": tags.get("emergency", "yes") == "yes",
                "distance_km": round(distance, 2),
                "drive_duration_minutes": round(distance * 2.5, 1),
                "opening_hours": tags.get("opening_hours", ""),
                "beds": tags.get("beds"),
            }
            
            return hospital
            
        except Exception as e:
            logger.warning(f"[OpenStreetMap] Failed to parse element: {e}")
            return None

    @staticmethod
    def _build_address(tags: Dict[str, Any]) -> str:
        """Build address from OSM tags with better formatting."""
        parts = []
        if tags.get("housenumber"):
            parts.append(tags["housenumber"])
        if tags.get("street"):
            parts.append(tags["street"])
        if tags.get("addr:suburb"):
            parts.append(tags["addr:suburb"])
        if tags.get("addr:city"):
            parts.append(tags["addr:city"])
        if tags.get("addr:state"):
            parts.append(tags["addr:state"])
        if tags.get("postcode"):
            parts.append(tags["postcode"])
        return ", ".join(parts) if parts else "Address not available"

    @staticmethod
    def _matches_type(hospital: Dict[str, Any], hospital_type: str) -> bool:
        """Check if hospital matches the type filter."""
        h_type = hospital.get("hospital_type", "").lower()
        filter_type = hospital_type.lower()
        
        if filter_type == "all":
            return True
        if filter_type == "government":
            return "government" in h_type
        if filter_type == "private":
            return "private" in h_type
        return True

    @staticmethod
    def _matches_specialty(hospital: Dict[str, Any], specialty: str) -> bool:
        """Check if hospital matches the specialty filter."""
        h_specialties = " ".join([
            str(hospital.get("specialties") or ""),
            str(hospital.get("specialty_search_text") or ""),
            str(hospital.get("hospital_name") or ""),
        ]).lower()
        specialty_lower = specialty.lower()
        
        if specialty_lower in h_specialties:
            return True
        
        specialty_keywords = {
            "cardiology": ["heart", "cardiac", "cardiovascular"],
            "neurology": ["brain", "neuro", "stroke", "neural"],
            "orthopedics": ["bone", "joint", "fracture", "ortho", "spine"],
            "oncology": ["cancer", "tumor", "chemotherapy", "oncology"],
            "pediatrics": ["child", "children", "kid", "infant", "pediatric", "paediatric"],
            "emergency": ["emergency", "trauma", "accident", "icu", "casualty"],
            "pulmonology": ["pulmonary", "respiratory", "lung", "chest"],
            "gastroenterology": ["gastro", "digestive", "liver", "stomach"],
            "multi-organ transplant": ["transplant", "organ transplant"],
            "general medicine": ["general medicine", "internal medicine", "primary care"],
        }
        
        keywords = specialty_keywords.get(specialty_lower, [])
        if keywords and any(keyword in h_specialties for keyword in keywords):
            return True
        
        return False

    @staticmethod
    def get_nearby_hospitals(
        lat: Optional[float] = None,
        lng: Optional[float] = None,
        location_query: Optional[str] = None,
        search_query: Optional[str] = None,
        specialist: Optional[str] = None,
        specialty: Optional[str] = None,
        hospital_type: Optional[str] = None,
        max_distance: Optional[float] = None,
        sort_by: Optional[str] = "distance",
        max_results: int = 50
    ) -> List[Dict[str, Any]]:
        """Synchronous wrapper for OSM hospital search."""
        logger.warning("[OpenStreetMap] Synchronous search is unsupported; returning no fabricated results.")
        
        if lat and lng:
            return []
        
        return []


class NominatimService:
    """Nominatim geocoding service - Free address search and reverse geocoding."""

    @staticmethod
    async def geocode(address: str) -> Optional[Dict[str, Any]]:
        """
        Convert address to coordinates using Nominatim.
        Free, no API key required.
        """
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                params = {
                    "q": address,
                    "format": "json",
                    "limit": 1,
                    "addressdetails": 1,
                }
                response = await client.get(
                    "https://nominatim.openstreetmap.org/search",
                    params=params,
                    headers={"User-Agent": "HealthcareNavigationSystem/1.0"}
                )
                response.raise_for_status()
                data = response.json()
                
                if data and len(data) > 0:
                    result = data[0]
                    return {
                        "latitude": float(result.get("lat")),
                        "longitude": float(result.get("lon")),
                        "display_name": result.get("display_name"),
                        "address": result.get("address", {}),
                    }
                
                return None
                
        except Exception as e:
            logger.error(f"[Nominatim] Geocoding error: {e}")
            return None

    @staticmethod
    async def reverse_geocode(lat: float, lon: float) -> Optional[Dict[str, Any]]:
        """
        Convert coordinates to address using Nominatim.
        Free, no API key required.
        """
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                params = {
                    "lat": lat,
                    "lon": lon,
                    "format": "json",
                    "addressdetails": 1,
                }
                response = await client.get(
                    "https://nominatim.openstreetmap.org/reverse",
                    params=params,
                    headers={"User-Agent": "HealthcareNavigationSystem/1.0"}
                )
                response.raise_for_status()
                data = response.json()
                
                return {
                    "display_name": data.get("display_name"),
                    "address": data.get("address", {}),
                }
                
        except Exception as e:
            logger.error(f"[Nominatim] Reverse geocoding error: {e}")
            return None


class OSRMService:
    """OSRM routing service - Free routing and directions."""

    @staticmethod
    async def get_route(
        start_lat: float,
        start_lon: float,
        end_lat: float,
        end_lon: float,
        profile: str = "driving"
    ) -> Optional[Dict[str, Any]]:
        """
        Get route between two points using OSRM.
        Free, no API key required.
        
        Profiles: driving, cycling, walking
        """
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                url = f"https://router.project-osrm.org/route/v1/{profile}/{start_lon},{start_lat};{end_lon},{end_lat}"
                params = {
                    "overview": "full",
                    "geometries": "geojson",
                    "steps": "true",
                }
                response = await client.get(url, params=params)
                response.raise_for_status()
                data = response.json()
                
                if data.get("code") == "Ok" and data.get("routes"):
                    route = data["routes"][0]
                    return {
                        "distance_km": route["distance"] / 1000,
                        "duration_seconds": route["duration"],
                        "duration_minutes": round(route["duration"] / 60, 1),
                        "geometry": route.get("geometry"),
                        "steps": route.get("legs", [{}])[0].get("steps", []),
                    }
                
                return None
                
        except Exception as e:
            logger.error(f"[OSRM] Routing error: {e}")
            return None

    @staticmethod
    async def get_nearest_road(lat: float, lon: float) -> Optional[Dict[str, Any]]:
        """Find nearest road/way for routing."""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                url = f"https://router.project-osrm.org/nearest/v1/driving/{lon},{lat}"
                params = {"number": 1}
                response = await client.get(url, params=params)
                response.raise_for_status()
                data = response.json()
                
                if data.get("code") == "Ok" and data.get("waypoints"):
                    waypoint = data["waypoints"][0]
                    return {
                        "latitude": waypoint["location"][1],
                        "longitude": waypoint["location"][0],
                        "name": waypoint.get("name", "Road"),
                    }
                
                return None
                
        except Exception as e:
            logger.error(f"[OSRM] Nearest road error: {e}")
            return None
