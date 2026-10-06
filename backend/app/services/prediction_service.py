"""
Prediction Service.
Stores AI-based assessment results from triage conversations.
Rule-based prediction has been disabled in favor of AI-only assessment.
"""

import json
import uuid
from typing import List, Dict, Any, Optional
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
from app.core.exceptions import NotFoundError


async def _get_profile(db: AsyncSession, user: User) -> PatientProfile:
    result = await db.execute(
        select(PatientProfile).where(PatientProfile.user_id == user.user_id)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise NotFoundError("Patient profile")
    return profile


class PredictionService:

    @staticmethod
    async def run_prediction(
        db: AsyncSession,
        user: User,
        conversation_id: uuid.UUID,
        symptoms: List[str],
        cumulative_metadata: Optional[Dict[str, Any]] = None,
        assessment_severity: Optional[str] = None,
        specialists: Optional[List[str]] = None,
        assessment_message: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Stores AI-based assessment results from triage conversation.
        Rule-based prediction has been disabled.
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

        # Build patient context summary if available
        from app.services.profile_service import ProfileService
        ctx = await ProfileService.get_patient_context(db, user.user_id)
        patient_context_summary = ctx.get("context_summary", "")

        # Check if a prediction already exists for this conversation (Idempotency)
        existing_pred_res = await db.execute(
            select(DiseasePrediction)
            .where(DiseasePrediction.conversation_id == conversation_id)
            .options(
                selectinload(DiseasePrediction.severity_assessment),
                selectinload(DiseasePrediction.specialist_recommendation),
            )
        )
        disease_pred = existing_pred_res.scalar_one_or_none()

        # Format symptoms
        from app.ml.rule_based_predictor import normalize_symptom_list, format_symptom_title
        canonical_list = normalize_symptom_list(symptoms)
        primary_sym = cumulative_metadata.get("primary_symptom") if cumulative_metadata else (
            format_symptom_title(canonical_list[0]) if canonical_list else "General Discomfort"
        )
        formatted_list = cumulative_metadata.get("formatted_symptoms") if cumulative_metadata else (
            [format_symptom_title(s) for s in canonical_list]
        )

        # Create or update prediction with AI assessment data
        if not disease_pred:
            disease_pred = DiseasePrediction(
                conversation_id=conversation_id,
                predicted_disease="AI Symptom Assessment",
                confidence_score=0.0,
                prediction_model="AI_Triage_Agent",
                symptom_vector=json.dumps({
                    "primary_symptom": primary_sym,
                    "associated_symptoms": formatted_list[1:] if len(formatted_list) > 1 else [],
                    "raw_symptoms": symptoms,
                    "canonical_symptoms": canonical_list,
                    "formatted_symptoms": formatted_list,
                    "triggered_rules": [],
                    "note": "Rule-based prediction disabled - using AI assessment only"
                }),
                differential_diagnoses=json.dumps([]),
            )
            db.add(disease_pred)
            await db.flush()
        else:
            # Update existing prediction
            disease_pred.symptom_vector = json.dumps({
                "primary_symptom": primary_sym,
                "associated_symptoms": formatted_list[1:] if len(formatted_list) > 1 else [],
                "raw_symptoms": symptoms,
                "canonical_symptoms": canonical_list,
                "formatted_symptoms": formatted_list,
                "triggered_rules": [],
                "note": "Rule-based prediction disabled - using AI assessment only"
            })

        severity_map = {
            "mild": ("low", "Routine / self-care with follow-up"),
            "moderate": ("moderate", "See a doctor within 1 to 3 days"),
            "severe": ("high", "Prompt medical evaluation today"),
            "emergency": ("emergency", "Emergency care now - call 112 or 108"),
        }
        severity_value, urgency_label = severity_map.get(
            assessment_severity or "", ("routine", "Routine Assessment")
        )
        emergency_flag = severity_value == "emergency"
        severity_explanation = assessment_message or (
            "AI-based symptom assessment completed. Please consult a healthcare provider for proper evaluation."
        )

        # Create or update severity assessment
        sev_res = await db.execute(
            select(SeverityAssessment).where(SeverityAssessment.prediction_id == disease_pred.prediction_id)
        )
        severity = sev_res.scalar_one_or_none()

        if not severity:
            severity = SeverityAssessment(
                prediction_id=disease_pred.prediction_id,
                severity=severity_value,
                urgency_level=urgency_label,
                emergency_flag=emergency_flag,
                explanation=severity_explanation,
            )
            db.add(severity)
        else:
            severity.severity = severity_value
            severity.urgency_level = urgency_label
            severity.emergency_flag = emergency_flag
            severity.explanation = severity_explanation

        # Create or update specialist recommendation
        spec_res = await db.execute(
            select(SpecialistRecommendation).where(SpecialistRecommendation.prediction_id == disease_pred.prediction_id)
        )
        specialist = spec_res.scalar_one_or_none()

        specialist_names = [str(name).strip() for name in (specialists or []) if str(name).strip()]
        specialist_name = ", ".join(specialist_names[:3]) or (
            "Emergency Department" if emergency_flag else "General Physician"
        )
        specialist_reason = assessment_message or (
            "A General Physician can assess your symptoms and refer you to a specialist if needed."
        )

        if not specialist:
            specialist = SpecialistRecommendation(
                prediction_id=disease_pred.prediction_id,
                specialist=specialist_name,
                reason=specialist_reason,
            )
            db.add(specialist)
        else:
            specialist.specialist = specialist_name
            specialist.reason = specialist_reason

        await db.commit()

        return {
            "prediction_id": str(disease_pred.prediction_id),
            "predicted_disease": disease_pred.predicted_disease,
            "confidence_score": disease_pred.confidence_score,
            "symptoms_used": formatted_list,
            "triggered_rules": [],
            "severity": {
                "severity": severity.severity,
                "urgency_level": severity.urgency_level,
                "emergency_flag": severity.emergency_flag,
                "explanation": severity.explanation,
            },
            "specialist": {
                "specialist": specialist.specialist,
                "reason": specialist.reason,
            },
        }

    @staticmethod
    async def get_prediction_by_conversation(
        db: AsyncSession,
        user: User,
        conversation_id: uuid.UUID,
    ) -> Optional[Dict[str, Any]]:
        """Retrieve prediction by conversation ID."""
        profile = await _get_profile(db, user)

        result = await db.execute(
            select(DiseasePrediction)
            .where(
                DiseasePrediction.conversation_id == conversation_id,
            )
            .options(
                selectinload(DiseasePrediction.severity_assessment),
                selectinload(DiseasePrediction.specialist_recommendation),
            )
        )
        pred = result.scalar_one_or_none()

        if not pred:
            return None

        return {
            "prediction_id": str(pred.prediction_id),
            "predicted_disease": pred.predicted_disease,
            "confidence_score": pred.confidence_score,
            "symptoms_used": json.loads(pred.symptom_vector).get("formatted_symptoms", []),
            "triggered_rules": json.loads(pred.symptom_vector).get("triggered_rules", []),
            "severity": {
                "severity": pred.severity_assessment.severity if pred.severity_assessment else "routine",
                "urgency_level": pred.severity_assessment.urgency_level if pred.severity_assessment else "Routine Assessment",
                "emergency_flag": pred.severity_assessment.emergency_flag if pred.severity_assessment else False,
                "explanation": pred.severity_assessment.explanation if pred.severity_assessment else "",
            },
            "specialist": {
                "specialist": pred.specialist_recommendation.specialist if pred.specialist_recommendation else "",
                "reason": pred.specialist_recommendation.reason if pred.specialist_recommendation else "",
            },
        }

    @staticmethod
    async def get_prediction_by_id(
        db: AsyncSession,
        user: User,
        prediction_id: uuid.UUID,
    ) -> Optional[Dict[str, Any]]:
        """Retrieve prediction by prediction_id with user ownership verification."""
        profile = await _get_profile(db, user)

        # Join with conversation to verify user ownership
        result = await db.execute(
            select(DiseasePrediction)
            .join(Conversation, DiseasePrediction.conversation_id == Conversation.conversation_id)
            .where(
                DiseasePrediction.prediction_id == prediction_id,
                Conversation.profile_id == profile.profile_id,
            )
            .options(
                selectinload(DiseasePrediction.severity_assessment),
                selectinload(DiseasePrediction.specialist_recommendation),
            )
        )
        pred = result.scalar_one_or_none()

        if not pred:
            return None

        return {
            "prediction_id": str(pred.prediction_id),
            "predicted_disease": pred.predicted_disease,
            "confidence_score": pred.confidence_score,
            "symptoms_used": json.loads(pred.symptom_vector).get("formatted_symptoms", []),
            "triggered_rules": json.loads(pred.symptom_vector).get("triggered_rules", []),
            "severity": {
                "severity": pred.severity_assessment.severity if pred.severity_assessment else "routine",
                "urgency_level": pred.severity_assessment.urgency_level if pred.severity_assessment else "Routine Assessment",
                "emergency_flag": pred.severity_assessment.emergency_flag if pred.severity_assessment else False,
                "explanation": pred.severity_assessment.explanation if pred.severity_assessment else "",
            },
            "specialist": {
                "specialist": pred.specialist_recommendation.specialist if pred.specialist_recommendation else "",
                "reason": pred.specialist_recommendation.reason if pred.specialist_recommendation else "",
            },
        }
