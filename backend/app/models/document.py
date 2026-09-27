"""
Scheme Uploaded Document Model — uploaded_documents.
Stores patient-uploaded supporting documents (Income certificate, eligibility certificate, etc.)
for government scheme verification and personal records.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Text, DateTime, ForeignKey, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class UploadedDocument(Base):
    __tablename__ = "uploaded_documents"

    document_id: Mapped[uuid.UUID] = mapped_column(
        UUID, primary_key=True, default=uuid.uuid4
    )
    profile_id: Mapped[uuid.UUID] = mapped_column(
        UUID, ForeignKey("patient_profiles.profile_id", ondelete="CASCADE"), nullable=False
    )
    scheme_query_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID, ForeignKey("scheme_queries.query_id", ondelete="SET NULL"), nullable=True
    )
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    # Category: "INCOME_CERTIFICATE" | "ELIGIBILITY_CERTIFICATE" | "CASTE_CERTIFICATE" | "AADHAAR_CARD" | "RATION_CARD" | "OTHER"
    category: Mapped[str] = mapped_column(String(100), nullable=False, default="OTHER")
    # Cloudinary or Local static CDN URL
    cloudinary_url: Mapped[str] = mapped_column(Text, nullable=False)
    cloudinary_public_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    upload_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    # Status: "AVAILABLE" | "PROCESSING" | "FAILED" | "VERIFIED"
    processing_status: Mapped[str] = mapped_column(String(50), default="AVAILABLE")

    # Relationships
    profile: Mapped["PatientProfile"] = relationship("PatientProfile", back_populates="uploaded_documents")
    scheme_query: Mapped["SchemeQuery | None"] = relationship("SchemeQuery")
