"""
Hospital models — hospitals master table, hospital_recommendations.
"""

import uuid
from sqlalchemy import String, Text, Numeric, Integer, ForeignKey, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Hospital(Base):
    __tablename__ = "hospitals"

    hospital_id: Mapped[uuid.UUID] = mapped_column(
        UUID, primary_key=True, default=uuid.uuid4
    )
    # Google Places API place_id — used as cache key
    google_place_id: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    hospital_name: Mapped[str] = mapped_column(String(200), nullable=False)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    state: Mapped[str | None] = mapped_column(String(100), nullable=True)
    latitude: Mapped[float | None] = mapped_column(Numeric(10, 7), nullable=True)
    longitude: Mapped[float | None] = mapped_column(Numeric(10, 7), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    website: Mapped[str | None] = mapped_column(Text, nullable=True)
    google_maps_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Google Places rating
    rating: Mapped[float | None] = mapped_column(Numeric(3, 1), nullable=True)

    recommendations: Mapped[list["HospitalRecommendation"]] = relationship(
        "HospitalRecommendation", back_populates="hospital"
    )


class HospitalRecommendation(Base):
    __tablename__ = "hospital_recommendations"

    recommendation_id: Mapped[uuid.UUID] = mapped_column(
        UUID, primary_key=True, default=uuid.uuid4
    )
    prediction_id: Mapped[uuid.UUID] = mapped_column(
        UUID, ForeignKey("disease_predictions.prediction_id", ondelete="CASCADE"), nullable=False
    )
    hospital_id: Mapped[uuid.UUID] = mapped_column(
        UUID, ForeignKey("hospitals.hospital_id", ondelete="CASCADE"), nullable=False
    )
    distance_km: Mapped[float | None] = mapped_column(Numeric(6, 2), nullable=True)
    # Estimated travel time in minutes
    estimated_time: Mapped[int | None] = mapped_column(Integer, nullable=True)

    prediction: Mapped["DiseasePrediction"] = relationship(
        "DiseasePrediction", back_populates="hospital_recommendations"
    )
    hospital: Mapped["Hospital"] = relationship("Hospital", back_populates="recommendations")
