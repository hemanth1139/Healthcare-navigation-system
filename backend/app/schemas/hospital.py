"""
Hospital Pydantic schemas — request/response shapes matching the frontend TypeScript models.
"""

from pydantic import BaseModel, Field
from typing import Optional, List


class HospitalNearbyRequest(BaseModel):
    latitude: float
    longitude: float
    specialist: Optional[str] = None
    max_distance_km: Optional[float] = Field(None, alias="maxDistanceKm")

    model_config = {"populate_by_name": True}


class HospitalOut(BaseModel):
    hospital_id: str = Field(..., alias="hospital_id")
    google_place_id: str = Field(..., alias="google_place_id")
    hospital_name: str = Field(..., alias="hospital_name")
    address: str
    city: str
    state: str
    latitude: float
    longitude: float
    phone: str
    website: Optional[str] = None
    specialties: List[str]
    has_emergency_room: bool = Field(True, alias="has_emergency_room")
    rating: Optional[float] = None
    
    # Distance additions
    distance_km: float = Field(..., alias="distance_km")
    estimated_time: str = Field(..., alias="estimated_time")

    model_config = {"populate_by_name": True, "from_attributes": True}

    @classmethod
    def from_dict(cls, data: dict, hospital_id: str) -> "HospitalOut":
        # Parse specialties from comma-delimited string
        specialties_raw = data.get("specialties", "General Medicine")
        specialties = [s.strip() for s in specialties_raw.split(",")]
        
        return cls(
            hospital_id=hospital_id,
            google_place_id=data["google_place_id"],
            hospital_name=data["hospital_name"],
            address=data.get("address", ""),
            city=data.get("city", ""),
            state=data.get("state", ""),
            latitude=float(data["latitude"]),
            longitude=float(data["longitude"]),
            phone=data.get("phone", ""),
            website=data.get("website"),
            specialties=specialties,
            has_emergency_room=data.get("has_emergency_room", True),
            rating=float(data["rating"]) if data.get("rating") else None,
            distance_km=float(data["distance_km"]),
            estimated_time=data["estimated_time"]
        )
