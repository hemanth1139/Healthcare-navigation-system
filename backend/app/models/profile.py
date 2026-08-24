"""
Patient profile models — patient_profiles, allergies, chronic_conditions, medications.
"""

import uuid
from datetime import date, datetime, timezone
from sqlalchemy import String, Date, DateTime, Integer, Numeric, Text, ForeignKey, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class PatientProfile(Base):
    __tablename__ = "patient_profiles"

    profile_id: Mapped[uuid.UUID] = mapped_column(
        UUID, primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID, ForeignKey("users.user_id", ondelete="CASCADE"), unique=True, nullable=False
    )
    date_of_birth: Mapped[date | None] = mapped_column(Date, nullable=True)
    gender: Mapped[str | None] = mapped_column(String(20), nullable=True)
    blood_group: Mapped[str | None] = mapped_column(String(10), nullable=True)
    height_cm: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)
    weight_kg: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    state: Mapped[str | None] = mapped_column(String(100), nullable=True)
    pincode: Mapped[str | None] = mapped_column(String(10), nullable=True)
    emergency_contact_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    emergency_contact_phone: Mapped[str | None] = mapped_column(String(15), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="patient_profile")
    allergies: Mapped[list["Allergy"]] = relationship(
        "Allergy", back_populates="profile", cascade="all, delete-orphan"
    )
    chronic_conditions: Mapped[list["ChronicCondition"]] = relationship(
        "ChronicCondition", back_populates="profile", cascade="all, delete-orphan"
    )
    medications: Mapped[list["Medication"]] = relationship(
        "Medication", back_populates="profile", cascade="all, delete-orphan"
    )
    conversations: Mapped[list["Conversation"]] = relationship(
        "Conversation", back_populates="profile", cascade="all, delete-orphan"
    )
    medical_records: Mapped[list["MedicalRecord"]] = relationship(
        "MedicalRecord", back_populates="profile", cascade="all, delete-orphan"
    )


class Allergy(Base):
    __tablename__ = "allergies"

    allergy_id: Mapped[uuid.UUID] = mapped_column(
        UUID, primary_key=True, default=uuid.uuid4
    )
    profile_id: Mapped[uuid.UUID] = mapped_column(
        UUID, ForeignKey("patient_profiles.profile_id", ondelete="CASCADE"), nullable=False
    )
    allergy_name: Mapped[str] = mapped_column(String(100), nullable=False)
    severity: Mapped[str | None] = mapped_column(String(30), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    profile: Mapped["PatientProfile"] = relationship("PatientProfile", back_populates="allergies")


class ChronicCondition(Base):
    __tablename__ = "chronic_conditions"

    condition_id: Mapped[uuid.UUID] = mapped_column(
        UUID, primary_key=True, default=uuid.uuid4
    )
    profile_id: Mapped[uuid.UUID] = mapped_column(
        UUID, ForeignKey("patient_profiles.profile_id", ondelete="CASCADE"), nullable=False
    )
    condition_name: Mapped[str] = mapped_column(String(150), nullable=False)
    diagnosed_year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    profile: Mapped["PatientProfile"] = relationship("PatientProfile", back_populates="chronic_conditions")


class Medication(Base):
    __tablename__ = "medications"

    medication_id: Mapped[uuid.UUID] = mapped_column(
        UUID, primary_key=True, default=uuid.uuid4
    )
    profile_id: Mapped[uuid.UUID] = mapped_column(
        UUID, ForeignKey("patient_profiles.profile_id", ondelete="CASCADE"), nullable=False
    )
    medicine_name: Mapped[str] = mapped_column(String(150), nullable=False)
    dosage: Mapped[str | None] = mapped_column(String(50), nullable=True)
    frequency: Mapped[str | None] = mapped_column(String(100), nullable=True)
    prescribed_by: Mapped[str | None] = mapped_column(String(100), nullable=True)

    profile: Mapped["PatientProfile"] = relationship("PatientProfile", back_populates="medications")
