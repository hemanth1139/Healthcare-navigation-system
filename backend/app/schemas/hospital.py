"""
Hospital Pydantic schemas — request/response shapes matching the frontend TypeScript models.
"""

from pydantic import BaseModel, Field
from typing import Optional, List


class HospitalNearbyRequest(BaseModel):
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_query: Optional[str] = Field(None, alias="locationQuery")
    search: Optional[str] = None
    specialist: Optional[str] = None
    specialty: Optional[str] = None
    hospital_type: Optional[str] = Field(None, alias="hospitalType")
    max_distance_km: Optional[float] = Field(None, alias="maxDistanceKm")
    sort_by: Optional[str] = Field("distance", alias="sortBy")
    max_results: Optional[int] = Field(50, alias="maxResults")

    model_config = {"populate_by_name": True}


class HospitalOut(BaseModel):
    hospital_id: str = Field(..., alias="hospital_id")
    google_place_id: str = Field(..., alias="google_place_id")
    hospital_name: str = Field(..., alias="hospital_name")
    address: str = ""
    city: str = ""
    state: str = ""
    latitude: float
    longitude: float
    phone: Optional[str] = ""
    website: Optional[str] = None
    google_maps_url: Optional[str] = None
    hospital_type: str = Field("Private", alias="hospital_type")
    specialties: List[str] = []
    has_emergency_room: bool = Field(True, alias="has_emergency_room")
    rating: Optional[float] = None
    distance_km: float = Field(..., alias="distance_km")
    estimated_time: str = Field(..., alias="estimated_time")
    opening_hours: Optional[str] = None
    beds: Optional[int] = None

    model_config = {"populate_by_name": True, "from_attributes": True}

    @classmethod
    def from_dict(cls, data: dict, hospital_id: str) -> "HospitalOut":
        # Parse specialties from comma-delimited string or list
        specialties_raw = data.get("specialties", "General Medicine")
        if isinstance(specialties_raw, list):
            specialties = specialties_raw
        else:
            specialties = [s.strip() for s in str(specialties_raw).split(",") if s.strip()]

        h_type = data.get("hospital_type") or ("Government" if "government" in data.get("hospital_name", "").lower() or "stanley" in data.get("hospital_name", "").lower() or "kilpauk" in data.get("hospital_name", "").lower() or "aiims" in data.get("hospital_name", "").lower() or "safdarjung" in data.get("hospital_name", "").lower() or "rgggh" in data.get("hospital_name", "").lower() else "Private")

        lat = float(data["latitude"])
        lng = float(data["longitude"])
        maps_url = data.get("google_maps_url") or f"https://www.google.com/maps/dir/?api=1&destination={lat},{lng}"

        return cls(
            hospital_id=hospital_id,
            google_place_id=data["google_place_id"],
            hospital_name=data["hospital_name"],
            address=data.get("address", ""),
            city=data.get("city", ""),
            state=data.get("state", ""),
            latitude=lat,
            longitude=lng,
            phone=data.get("phone", ""),
            website=data.get("website"),
            google_maps_url=maps_url,
            hospital_type=h_type,
            specialties=specialties,
            has_emergency_room=data.get("has_emergency_room", True),
            rating=float(data["rating"]) if data.get("rating") else None,
            distance_km=float(data.get("distance_km", 0.0)),
            estimated_time=str(data.get("estimated_time", "5 mins drive")),
            opening_hours=data.get("opening_hours"),
            beds=data.get("beds")
        )
