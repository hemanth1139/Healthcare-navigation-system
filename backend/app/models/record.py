"""
Medical record model — securely uploaded prescriptions, lab reports, etc.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Text, Boolean, DateTime, ForeignKey, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class MedicalRecord(Base):
    __tablename__ = "medical_records"

    record_id: Mapped[uuid.UUID] = mapped_column(
        UUID, primary_key=True, default=uuid.uuid4
    )
    profile_id: Mapped[uuid.UUID] = mapped_column(
        UUID, ForeignKey("patient_profiles.profile_id", ondelete="CASCADE"), nullable=False
    )
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    # Cloudinary CDN URL of the stored (PII-redacted) file
    cloudinary_url: Mapped[str] = mapped_column(Text, nullable=False)
    # Cloudinary public_id for deletion
    cloudinary_public_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    # "pdf" | "image" | "dicom"
    file_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    # "prescription" | "lab_report" | "imaging" | "discharge_summary" | "other"
    category: Mapped[str | None] = mapped_column(String(100), nullable=True)
    upload_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    is_pii_redacted: Mapped[bool] = mapped_column(Boolean, default=False)
    # HL7 FHIR R4 resource type, e.g. "DocumentReference"
    fhir_resource_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    # Full FHIR resource JSON
    fhir_resource: Mapped[str | None] = mapped_column(Text, nullable=True)

    profile: Mapped["PatientProfile"] = relationship("PatientProfile", back_populates="medical_records")
