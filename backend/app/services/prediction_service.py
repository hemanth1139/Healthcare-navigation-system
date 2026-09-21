"""
Rule-Based Prediction Service.
Triggered when a triage conversation concludes with a symptom list.
Runs the rule-based disease predictor, saves results to the database,
and returns a structured prediction report.
"""

import json
import uuid
from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.models.user import User
from app.models.conversation import Conversation
from app.models.prediction import (
    DiseasePrediction,
    SeverityAssessment,
    SpecialistRecommendation,
)
from app.models.profile import PatientProfile
from app.ml.rule_based_predictor import predict_disease
from app.core.exceptions import NotFoundError, ValidationError


async def _get_profile(db: AsyncSession, user: User) -> PatientProfile:
    result = await db.execute(
        select(PatientProfile).where(PatientProfile.user_id == user.user_id)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise NotFoundError("Patient profile")
    return profile


class RuleBasedPredictionService:

    @staticmethod
    async def run_prediction(
        db: AsyncSession,
        user: User,
        conversation_id: uuid.UUID,
        symptoms: List[str],
    ) -> Dict[str, Any]:
        """
        Runs rule-based prediction on symptoms extracted by the triage agent.
        Saves DiseasePrediction, SeverityAssessment, and SpecialistRecommendation to DB.
        Returns a full prediction report dict.
        """
        profile = await _get_profile(db, user)

        # Verify the conversation belongs to this user
        conv_result = await db.execute(
            select(Conversation).where(
                Conversation.conversation_id == conversation_id,
                Conversation.profile_id == profile.profile_id,
            )
        )
        conv = conv_result.scalar_one_or_none()
        if not conv:
            raise NotFoundError("Conversation")

        # ── 1. Run rule-based prediction ──────────────────────────────────────
        prediction_result = predict_disease(symptoms)

        # ── 2. Save DiseasePrediction ─────────────────────────────────────────
        disease_pred = DiseasePrediction(
            conversation_id=conversation_id,
            predicted_disease=prediction_result["predicted_disease"],
            confidence_score=prediction_result["confidence_score"],
            differential_diagnoses=json.dumps(prediction_result["differential"]),
            prediction_model=prediction_result["prediction_model"],
            symptom_vector=json.dumps(symptoms),
        )
        db.add(disease_pred)
        await db.flush()

        # ── 3. Save SeverityAssessment ────────────────────────────────────────
        severity = SeverityAssessment(
            prediction_id=disease_pred.prediction_id,
            severity=prediction_result["severity"],
            urgency_level=prediction_result["urgency_level"],
            emergency_flag=prediction_result["emergency_flag"],
            explanation=prediction_result["explanation"],
        )
        db.add(severity)

        # ── 4. Save SpecialistRecommendation ──────────────────────────────────
        specialist = SpecialistRecommendation(
            prediction_id=disease_pred.prediction_id,
            specialist=prediction_result["specialist"],
            reason=prediction_result["explanation"],
        )
        db.add(specialist)

        await db.flush()

        # ── 5. Return structured report ───────────────────────────────────────
        return {
            "prediction_id": str(disease_pred.prediction_id),
            "predicted_disease": prediction_result["predicted_disease"],
            "confidence_score": prediction_result["confidence_score"],
            "prediction_model": prediction_result["prediction_model"],
            "differential": prediction_result["differential"],
            "triggered_rules": prediction_result["triggered_rules"],
            "severity": {
                "assessment_id": str(severity.assessment_id),
                "severity": prediction_result["severity"],
                "urgency_level": prediction_result["urgency_level"],
                "emergency_flag": prediction_result["emergency_flag"],
                "explanation": prediction_result["explanation"],
            },
            "specialist": {
                "recommendation_id": str(specialist.recommendation_id),
                "specialist": prediction_result["specialist"],
                "reason": prediction_result["explanation"],
            },
            "symptoms_used": symptoms,
        }

    @staticmethod
    async def get_prediction_by_conversation(
        db: AsyncSession,
        user: User,
        conversation_id: uuid.UUID,
    ) -> Dict[str, Any] | None:
        """
        Retrieves the stored prediction report for a completed conversation.
        Returns None if no prediction exists yet.
        """
        profile = await _get_profile(db, user)

        # Get conversation
        conv_result = await db.execute(
            select(Conversation).where(
                Conversation.conversation_id == conversation_id,
                Conversation.profile_id == profile.profile_id,
            )
        )
        conv = conv_result.scalar_one_or_none()
        if not conv:
            raise NotFoundError("Conversation")

        # Get prediction for this conversation
        pred_result = await db.execute(
            select(DiseasePrediction)
            .where(DiseasePrediction.conversation_id == conversation_id)
            .options(
                selectinload(DiseasePrediction.severity_assessment),
                selectinload(DiseasePrediction.specialist_recommendation),
            )
            .order_by(DiseasePrediction.predicted_at.desc())
            .limit(1)
        )
        pred = pred_result.scalar_one_or_none()

        if not pred:
            return None

        differential = []
        if pred.differential_diagnoses:
            try:
                differential = json.loads(pred.differential_diagnoses)
            except Exception:
                differential = []

        symptoms_used = []
        if pred.symptom_vector:
            try:
                symptoms_used = json.loads(pred.symptom_vector)
            except Exception:
                symptoms_used = []

        return {
            "prediction_id": str(pred.prediction_id),
            "predicted_disease": pred.predicted_disease,
            "confidence_score": float(pred.confidence_score),
            "prediction_model": pred.prediction_model,
            "differential": differential,
            "triggered_rules": [],
            "severity": {
                "assessment_id": str(pred.severity_assessment.assessment_id) if pred.severity_assessment else None,
                "severity": pred.severity_assessment.severity if pred.severity_assessment else "low",
                "urgency_level": pred.severity_assessment.urgency_level if pred.severity_assessment else "Routine",
                "emergency_flag": pred.severity_assessment.emergency_flag if pred.severity_assessment else False,
                "explanation": pred.severity_assessment.explanation if pred.severity_assessment else "",
            },
            "specialist": {
                "recommendation_id": str(pred.specialist_recommendation.recommendation_id) if pred.specialist_recommendation else None,
                "specialist": pred.specialist_recommendation.specialist if pred.specialist_recommendation else "General Physician",
                "reason": pred.specialist_recommendation.reason if pred.specialist_recommendation else "",
            },
            "symptoms_used": symptoms_used,
            "predicted_at": pred.predicted_at.isoformat(),
        }
