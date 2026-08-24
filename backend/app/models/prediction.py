"""
Prediction models — disease_predictions, shap_explanations, severity_assessments,
specialist_recommendations, health_tips.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Text, Boolean, DateTime, Numeric, ForeignKey, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class DiseasePrediction(Base):
    __tablename__ = "disease_predictions"

    prediction_id: Mapped[uuid.UUID] = mapped_column(
        UUID, primary_key=True, default=uuid.uuid4
    )
    conversation_id: Mapped[uuid.UUID] = mapped_column(
        UUID, ForeignKey("conversations.conversation_id", ondelete="CASCADE"), nullable=False
    )
    predicted_disease: Mapped[str] = mapped_column(String(150), nullable=False)
    confidence_score: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    # JSON string of top-3 differential diagnoses
    differential_diagnoses: Mapped[str | None] = mapped_column(Text, nullable=True)
    prediction_model: Mapped[str] = mapped_column(String(100), default="XGBoost-v1")
    # Extracted symptom vector as JSON for reproducibility
    symptom_vector: Mapped[str | None] = mapped_column(Text, nullable=True)
    predicted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    conversation: Mapped["Conversation"] = relationship("Conversation", back_populates="disease_predictions")
    shap_explanations: Mapped[list["ShapExplanation"]] = relationship(
        "ShapExplanation", back_populates="prediction", cascade="all, delete-orphan"
    )
    severity_assessment: Mapped["SeverityAssessment"] = relationship(
        "SeverityAssessment", back_populates="prediction", uselist=False, cascade="all, delete-orphan"
    )
    specialist_recommendation: Mapped["SpecialistRecommendation"] = relationship(
        "SpecialistRecommendation", back_populates="prediction", uselist=False, cascade="all, delete-orphan"
    )
    hospital_recommendations: Mapped[list["HospitalRecommendation"]] = relationship(
        "HospitalRecommendation", back_populates="prediction", cascade="all, delete-orphan"
    )
    health_tips: Mapped[list["HealthTip"]] = relationship(
        "HealthTip", back_populates="prediction", cascade="all, delete-orphan"
    )


class ShapExplanation(Base):
    __tablename__ = "shap_explanations"

    shap_id: Mapped[uuid.UUID] = mapped_column(
        UUID, primary_key=True, default=uuid.uuid4
    )
    prediction_id: Mapped[uuid.UUID] = mapped_column(
        UUID, ForeignKey("disease_predictions.prediction_id", ondelete="CASCADE"), nullable=False
    )
    feature_name: Mapped[str] = mapped_column(String(100), nullable=False)
    plain_language_label: Mapped[str | None] = mapped_column(String(200), nullable=True)
    contribution_score: Mapped[float] = mapped_column(Numeric(8, 4), nullable=False)

    prediction: Mapped["DiseasePrediction"] = relationship("DiseasePrediction", back_populates="shap_explanations")


class SeverityAssessment(Base):
    __tablename__ = "severity_assessments"

    assessment_id: Mapped[uuid.UUID] = mapped_column(
        UUID, primary_key=True, default=uuid.uuid4
    )
    prediction_id: Mapped[uuid.UUID] = mapped_column(
        UUID, ForeignKey("disease_predictions.prediction_id", ondelete="CASCADE"),
        unique=True, nullable=False
    )
    # "low" | "moderate" | "high" | "emergency"
    severity: Mapped[str] = mapped_column(String(30), nullable=False)
    urgency_level: Mapped[str] = mapped_column(String(50), nullable=False)
    emergency_flag: Mapped[bool] = mapped_column(Boolean, default=False)
    explanation: Mapped[str | None] = mapped_column(Text, nullable=True)

    prediction: Mapped["DiseasePrediction"] = relationship("DiseasePrediction", back_populates="severity_assessment")


class SpecialistRecommendation(Base):
    __tablename__ = "specialist_recommendations"

    recommendation_id: Mapped[uuid.UUID] = mapped_column(
        UUID, primary_key=True, default=uuid.uuid4
    )
    prediction_id: Mapped[uuid.UUID] = mapped_column(
        UUID, ForeignKey("disease_predictions.prediction_id", ondelete="CASCADE"),
        unique=True, nullable=False
    )
    specialist: Mapped[str] = mapped_column(String(150), nullable=False)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    prediction: Mapped["DiseasePrediction"] = relationship(
        "DiseasePrediction", back_populates="specialist_recommendation"
    )


class HealthTip(Base):
    __tablename__ = "health_tips"

    tip_id: Mapped[uuid.UUID] = mapped_column(
        UUID, primary_key=True, default=uuid.uuid4
    )
    prediction_id: Mapped[uuid.UUID] = mapped_column(
        UUID, ForeignKey("disease_predictions.prediction_id", ondelete="CASCADE"), nullable=False
    )
    generated_tip: Mapped[str] = mapped_column(Text, nullable=False)
    generated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    prediction: Mapped["DiseasePrediction"] = relationship("DiseasePrediction", back_populates="health_tips")
