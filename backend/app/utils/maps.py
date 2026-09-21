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
    # --- Chennai Region Hospitals ---
    {
        "google_place_id": "ch_apollo_greams_chennai",
        "hospital_name": "Apollo Hospitals Greams Road",
        "address": "21 Greams Lane, Thousand Lights, Chennai, Tamil Nadu 600006",
        "city": "Chennai",
        "state": "Tamil Nadu",
        "latitude": 13.0607,
        "longitude": 80.2512,
        "phone": "+91 44 2829 0200",
        "website": "https://chennai.apollohospitals.com",
        "rating": 4.8,
        "specialties": "Cardiology, Neurology, Oncology, Orthopedics, Emergency Care",
        "has_emergency_room": True
    },
    {
        "google_place_id": "ch_rgggh_chennai",
        "hospital_name": "Rajiv Gandhi Government General Hospital (RGGGH)",
        "address": "EVR Periyar Salai, Park Town, Chennai, Tamil Nadu 600003",
        "city": "Chennai",
        "state": "Tamil Nadu",
        "latitude": 13.0818,
        "longitude": 80.2778,
        "phone": "+91 44 2530 5000",
        "website": "https://www.gghchennai.in",
        "rating": 4.6,
        "specialties": "General Medicine, Emergency Medicine, Trauma Care, General Surgery, Cardiology",
        "has_emergency_room": True
    },
    {
        "google_place_id": "ch_fortis_malar_chennai",
        "hospital_name": "Fortis Malar Hospital",
        "address": "52, 1st Main Rd, Gandhi Nagar, Adyar, Chennai, Tamil Nadu 600020",
        "city": "Chennai",
        "state": "Tamil Nadu",
        "latitude": 13.0067,
        "longitude": 80.2572,
        "phone": "+91 44 4289 2222",
        "website": "https://www.fortishealthcare.com",
        "rating": 4.5,
        "specialties": "Cardiology, Nephrology, Neurology, Pediatrics, Emergency Care",
        "has_emergency_room": True
    },
    {
        "google_place_id": "ch_miot_chennai",
        "hospital_name": "MIOT International Hospital",
        "address": "4/112, Mount Poonamallee Rd, Manapakkam, Chennai, Tamil Nadu 600089",
        "city": "Chennai",
        "state": "Tamil Nadu",
        "latitude": 13.0225,
        "longitude": 80.1764,
        "phone": "+91 44 4200 2288",
        "website": "https://www.miotinternational.com",
        "rating": 4.7,
        "specialties": "Orthopedics, Cardiology, Emergency Medicine, Gastroenterology",
        "has_emergency_room": True
    },
    {
        "google_place_id": "ch_gleneagles_chennai",
        "hospital_name": "Gleneagles Global Health City",
        "address": "439, Cheran Nagar, Perumbakkam, Chennai, Tamil Nadu 600100",
        "city": "Chennai",
        "state": "Tamil Nadu",
        "latitude": 12.9022,
        "longitude": 80.2036,
        "phone": "+91 44 4624 2424",
        "website": "https://gleneaglesglobalhealthcitychennai.com",
        "rating": 4.6,
        "specialties": "Hepatology, Multi-Organ Transplant, Cardiology, Neurology",
        "has_emergency_room": True
    },
    {
        "google_place_id": "ch_sims_chennai",
        "hospital_name": "SIMS Hospital Vadapalani",
        "address": "1, Jawaharlal Nehru Salai, Vadapalani, Chennai, Tamil Nadu 600026",
        "city": "Chennai",
        "state": "Tamil Nadu",
        "latitude": 13.0504,
        "longitude": 80.2121,
        "phone": "+91 44 4921 1455",
        "website": "https://simshospitals.com",
        "rating": 4.6,
        "specialties": "Cardiac Sciences, Neurosciences, Oncology, Emergency Medicine",
        "has_emergency_room": True
    },
    {
        "google_place_id": "ch_vijaya_chennai",
        "hospital_name": "Vijaya Multispeciality Hospital",
        "address": "434, NSK Salai, Vadapalani, Chennai, Tamil Nadu 600026",
        "city": "Chennai",
        "state": "Tamil Nadu",
        "latitude": 13.0518,
        "longitude": 80.2104,
        "phone": "+91 44 6664 6664",
        "website": "https://vijayahospital.org",
        "rating": 4.4,
        "specialties": "Cardiology, General Medicine, Orthopedics, ENT",
        "has_emergency_room": True
    },
    # --- Other Metro Hospitals ---
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
