"""
Audit models — guardrail_logs, activity_logs.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Text, DateTime, ForeignKey, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class GuardrailLog(Base):
    __tablename__ = "guardrail_logs"

    log_id: Mapped[uuid.UUID] = mapped_column(
        UUID, primary_key=True, default=uuid.uuid4
    )
    conversation_id: Mapped[uuid.UUID] = mapped_column(
        UUID, ForeignKey("conversations.conversation_id", ondelete="CASCADE"), nullable=False
    )
    # "passed" | "failed" | "corrected"
    validation_status: Mapped[str] = mapped_column(String(30), nullable=False)
    violations: Mapped[str | None] = mapped_column(Text, nullable=True)
    original_response: Mapped[str | None] = mapped_column(Text, nullable=True)
    corrected_response: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    conversation: Mapped["Conversation"] = relationship("Conversation", back_populates="guardrail_logs")


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    activity_id: Mapped[uuid.UUID] = mapped_column(
        UUID, primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False
    )
    # e.g. "LOGIN", "LOGOUT", "PREDICTION_CREATED", "RECORD_UPLOADED"
    activity_type: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    user: Mapped["User"] = relationship("User", back_populates="activity_logs")
