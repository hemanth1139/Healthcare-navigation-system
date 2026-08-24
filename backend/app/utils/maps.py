"""
Google Maps Places API Wrapper.
Handles querying nearby hospitals, calculating distances, and geocoding.
Supports local fallback if GOOGLE_MAPS_API_KEY is not configured.
"""

import math
from typing import List, Dict, Any, Optional
from app.config import settings

# Base mock hospitals with lat/lng coordinates (centered around general coordinates)
# Center point default: 22.5726° N, 88.3639° E (Kolkata)
MOCK_HOSPITAL_DATA = [
    {
        "google_place_id": "ch_apollo_kolkata",
        "hospital_name": "Apollo Gleneagles Hospitals",
        "address": "58, Canal Circular Rd, Kadapara, Phool Bagan, Kankurgachi, Kolkata, West Bengal 700054",
        "city": "Kolkata",
        "state": "West Bengal",
        "latitude": 22.5786,
        "longitude": 88.4067,
        "phone": "+91 33 2320 3040",
        "website": "https://kolkata.apollohospitals.com",
        "rating": 4.4,
        "specialties": "Cardiology, Oncology, Neurology, Emergency Care",
        "has_emergency_room": True
    },
    {
        "google_place_id": "ch_fortis_kolkata",
        "hospital_name": "Fortis Hospital Anandapur",
        "address": "730, Eastern Metropolitan Bypass, Anandapur, East Kolkata Twp, Kolkata, West Bengal 700107",
        "city": "Kolkata",
        "state": "West Bengal",
        "latitude": 22.5123,
        "longitude": 88.4029,
        "phone": "+91 33 6628 4444",
        "website": "https://www.fortishospitals.in",
        "rating": 4.2,
        "specialties": "Neurology, Cardiology, Orthopedics, Nephrology",
        "has_emergency_room": True
    },
    {
        "google_place_id": "ch_amri_dhakuria",
        "hospital_name": "AMRI Hospitals Dhakuria",
        "address": "P-4, 5, Gariahat Rd, Block A, Dhakuria, Kolkata, West Bengal 700029",
        "city": "Kolkata",
        "state": "West Bengal",
        "latitude": 22.5078,
        "longitude": 88.3712,
        "phone": "+91 33 2461 2626",
        "website": "https://www.amrihospitals.in",
        "rating": 4.0,
        "specialties": "Pediatrics, General Medicine, Gastroenterology, Emergency Care",
        "has_emergency_room": True
    },
    {
        "google_place_id": "ch_rubi_hospital",
        "hospital_name": "Ruby General Hospital",
        "address": "Kasba Golpark, E.M. Bypass, Kolkata, West Bengal 700107",
        "city": "Kolkata",
        "state": "West Bengal",
        "latitude": 22.5134,
        "longitude": 88.4038,
        "phone": "+91 33 6687 1800",
        "website": "http://www.rubyhospital.com",
        "rating": 3.9,
        "specialties": "General Medicine, Gynecology, Emergency Medicine",
        "has_emergency_room": True
    }
]


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates geodesic distance between two coordinates in kilometers."""
    R = 6371.0  # Earth radius
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = math.sin(d_lat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


class GoogleMapsService:
    @staticmethod
    def get_nearby_hospitals(
        lat: float, lng: float, specialty: Optional[str] = None, max_distance: Optional[float] = None
    ) -> List[Dict[str, Any]]:
        """
        Query nearby hospitals using Google Places API or clinical fallback data.
        """
        if not settings.GOOGLE_MAPS_API_KEY:
            # Fallback local calculation
            print("[WARN] GOOGLE_MAPS_API_KEY not configured. Calculating distances using local data.")
            results = []
            for h in MOCK_HOSPITAL_DATA:
                dist = haversine_distance(lat, lng, h["latitude"], h["longitude"])
                
                # Check distance filter
                if max_distance and dist > max_distance:
                    continue
                    
                # Check specialty filter
                if specialty:
                    spec_lower = specialty.lower()
                    if spec_lower not in h["specialties"].lower():
                        continue

                # Estimate drive duration (assume 2.5 minutes per km in urban traffic)
                est_time_mins = max(2, int(dist * 2.5))
                
                # Format response properties
                h_copy = h.copy()
                h_copy["distance_km"] = round(dist, 2)
                h_copy["estimated_time"] = f"{est_time_mins} mins drive"
                results.append(h_copy)
                
            # Sort by distance
            return sorted(results, key=lambda x: x["distance_km"])

        import googlemaps
        try:
            gmaps = googlemaps.Client(key=settings.GOOGLE_MAPS_API_KEY)
            
            # Query nearby places
            query = "hospital"
            if specialty:
                query = f"{specialist} hospital"
                
            places_res = gmaps.places_nearby(
                location=(lat, lng),
                radius=10000 if not max_distance else int(max_distance * 1000),
                type="hospital",
                keyword=query
            )
            
            results = []
            for place in places_res.get("results", []):
                p_lat = place["geometry"]["location"]["lat"]
                p_lng = place["geometry"]["location"]["lng"]
                dist = haversine_distance(lat, lng, p_lat, p_lng)
                
                # Drive estimate
                est_time_mins = max(2, int(dist * 2.5))
                
                results.append({
                    "google_place_id": place["place_id"],
                    "hospital_name": place["name"],
                    "address": place.get("vicinity", ""),
                    "city": "Local Area",
                    "state": "",
                    "latitude": p_lat,
                    "longitude": p_lng,
                    "phone": "",
                    "website": "",
                    "rating": place.get("rating", 4.0),
                    "specialties": "General Medicine, Emergency Medicine",
                    "has_emergency_room": True,
                    "distance_km": round(dist, 2),
                    "estimated_time": f"{est_time_mins} mins drive"
                })
                
            return sorted(results, key=lambda x: x["distance_km"])
        except Exception as e:
            print(f"[ERROR] Google Maps API error: {e}. Falling back to local data.")
            # Trigger same fallback logic
            return GoogleMapsService.get_nearby_hospitals(lat, lng, specialty, max_distance)
