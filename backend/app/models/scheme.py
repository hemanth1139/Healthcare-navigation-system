"""
Government scheme models — government_schemes, scheme_queries.
"""

import uuid
from datetime import date, datetime, timezone
from sqlalchemy import String, Text, Date, DateTime, Numeric, ForeignKey, UUID, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class GovernmentScheme(Base):
    __tablename__ = "government_schemes"

    scheme_id: Mapped[str] = mapped_column(
        String(100), primary_key=True, default=lambda: f"sch_{uuid.uuid4().hex[:8]}"
    )
    scheme_name: Mapped[str] = mapped_column(String(250), nullable=False)
    department: Mapped[str | None] = mapped_column(String(250), nullable=True)
    state: Mapped[str | None] = mapped_column(String(150), nullable=True)
    category: Mapped[str | None] = mapped_column(String(100), nullable=True)
    coverage_amount: Mapped[str | None] = mapped_column(String(250), nullable=True)
    cashless: Mapped[bool | None] = mapped_column(default=True, nullable=True)
    eligibility: Mapped[str | None] = mapped_column(Text, nullable=True)
    benefits: Mapped[str | None] = mapped_column(Text, nullable=True)
    official_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    last_updated: Mapped[date | None] = mapped_column(Date, nullable=True)
    eligibility_criteria: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    key_covered_conditions: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    key_exclusions: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    chunks: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    queries: Mapped[list["SchemeQuery"]] = relationship(
        "SchemeQuery", back_populates="scheme"
    )


class SchemeQuery(Base):
    __tablename__ = "scheme_queries"

    query_id: Mapped[uuid.UUID] = mapped_column(
        UUID, primary_key=True, default=uuid.uuid4
    )
    conversation_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID, ForeignKey("conversations.conversation_id", ondelete="CASCADE"), nullable=True
    )
    scheme_id: Mapped[str | None] = mapped_column(
        String(100), ForeignKey("government_schemes.scheme_id", ondelete="SET NULL"), nullable=True
    )
    user_question: Mapped[str] = mapped_column(Text, nullable=False)
    ai_response: Mapped[str | None] = mapped_column(Text, nullable=True)
    retrieved_chunks: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    eligibility_result: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    confidence_score: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    conversation: Mapped["Conversation | None"] = relationship("Conversation", back_populates="scheme_queries")
    scheme: Mapped["GovernmentScheme | None"] = relationship("GovernmentScheme", back_populates="queries")

