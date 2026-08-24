"""
AI conversation models — conversations, conversation_messages.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Text, DateTime, ForeignKey, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Conversation(Base):
    __tablename__ = "conversations"

    conversation_id: Mapped[uuid.UUID] = mapped_column(
        UUID, primary_key=True, default=uuid.uuid4
    )
    profile_id: Mapped[uuid.UUID] = mapped_column(
        UUID, ForeignKey("patient_profiles.profile_id", ondelete="CASCADE"), nullable=False
    )
    language: Mapped[str] = mapped_column(String(30), default="en")
    # "text" | "voice"
    input_type: Mapped[str] = mapped_column(String(20), default="text")
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    # "active" | "completed" | "abandoned"
    status: Mapped[str] = mapped_column(String(30), default="active")

    # Relationships
    profile: Mapped["PatientProfile"] = relationship("PatientProfile", back_populates="conversations")
    messages: Mapped[list["ConversationMessage"]] = relationship(
        "ConversationMessage", back_populates="conversation", cascade="all, delete-orphan",
        order_by="ConversationMessage.created_at"
    )
    disease_predictions: Mapped[list["DiseasePrediction"]] = relationship(
        "DiseasePrediction", back_populates="conversation", cascade="all, delete-orphan"
    )
    scheme_queries: Mapped[list["SchemeQuery"]] = relationship(
        "SchemeQuery", back_populates="conversation", cascade="all, delete-orphan"
    )
    guardrail_logs: Mapped[list["GuardrailLog"]] = relationship(
        "GuardrailLog", back_populates="conversation", cascade="all, delete-orphan"
    )


class ConversationMessage(Base):
    __tablename__ = "conversation_messages"

    message_id: Mapped[uuid.UUID] = mapped_column(
        UUID, primary_key=True, default=uuid.uuid4
    )
    conversation_id: Mapped[uuid.UUID] = mapped_column(
        UUID, ForeignKey("conversations.conversation_id", ondelete="CASCADE"), nullable=False
    )
    # "user" | "assistant"
    sender: Mapped[str] = mapped_column(String(20), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    # Translated version (if multilingual input was used)
    translated_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    conversation: Mapped["Conversation"] = relationship("Conversation", back_populates="messages")
