"""
User model — authentication table.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Boolean, DateTime, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID, primary_key=True, default=uuid.uuid4
    )
    full_name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(150), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(nullable=False)
    phone: Mapped[str | None] = mapped_column(String(15), unique=True, nullable=True)
    role: Mapped[str] = mapped_column(String(20), default="PATIENT", nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    # Stores hashed refresh token for rotation validation
    refresh_token_hash: Mapped[str | None] = mapped_column(nullable=True)
    # Stores password-reset token hash (short-lived)
    reset_token_hash: Mapped[str | None] = mapped_column(nullable=True)
    reset_token_expires: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    # Preferred language from settings
    preferred_language: Mapped[str] = mapped_column(String(10), default="en")
    preferred_theme: Mapped[str] = mapped_column(String(20), default="dark")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    patient_profile: Mapped["PatientProfile"] = relationship(
        "PatientProfile", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    activity_logs: Mapped[list["ActivityLog"]] = relationship(
        "ActivityLog", back_populates="user", cascade="all, delete-orphan"
    )
