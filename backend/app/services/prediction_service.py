"""
Rule-Based Prediction Service.
Triggered when a triage conversation concludes or encounters an emergency.
Runs the authoritative rule-based disease predictor, saves results to the database idempotently,
and returns a structured prediction report.
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
from app.ml.rule_based_predictor import (
    predict_disease_generative,
    normalize_symptom_list,
    format_symptom_title,
)
from app.core.exceptions import NotFoundError


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
        cumulative_metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Runs deterministic clinical rule prediction on symptoms with Gemini narrative context.
        Saves DiseasePrediction, SeverityAssessment, and SpecialistRecommendation idempotently.
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

        # 1. Run Generative AI prediction (strictly bounded by deterministic Python Rule Engine)
        prediction_result = await predict_disease_generative(symptoms, patient_context_summary)

        # 2. Check if a prediction already exists for this conversation (Idempotency)
        existing_pred_res = await db.execute(
            select(DiseasePrediction)
            .where(DiseasePrediction.conversation_id == conversation_id)
            .options(
                selectinload(DiseasePrediction.severity_assessment),
                selectinload(DiseasePrediction.specialist_recommendation),
            )
        )
        disease_pred = existing_pred_res.scalar_one_or_none()

        canonical_list = normalize_symptom_list(symptoms)
        primary_sym = cumulative_metadata.get("primary_symptom") if cumulative_metadata else (
            format_symptom_title(canonical_list[0]) if canonical_list else "General Discomfort"
        )
        associated_syms = cumulative_metadata.get("associated_symptoms") if cumulative_metadata else (
            [format_symptom_title(s) for s in canonical_list[1:]] if len(canonical_list) > 1 else []
        )
        formatted_list = cumulative_metadata.get("formatted_symptoms") if cumulative_metadata else (
            [format_symptom_title(s) for s in canonical_list]
        )

        differential_json = json.dumps(prediction_result.get("differential", []))
        symptom_vector_json = json.dumps({
            "primary_symptom": primary_sym,
            "associated_symptoms": associated_syms,
            "raw_symptoms": symptoms,
            "canonical_symptoms": canonical_list,
            "formatted_symptoms": formatted_list,
            "triggered_rules": prediction_result.get("triggered_rules", []),
        })

        if disease_pred:
            # Update existing prediction
            disease_pred.predicted_disease = prediction_result["predicted_disease"]
            disease_pred.confidence_score = prediction_result["confidence_score"]
            disease_pred.differential_diagnoses = differential_json
            disease_pred.prediction_model = prediction_result["prediction_model"]
            disease_pred.symptom_vector = symptom_vector_json

            # Check existing severity
            sev_res = await db.execute(
                select(SeverityAssessment).where(SeverityAssessment.prediction_id == disease_pred.prediction_id)
            )
            severity = sev_res.scalar_one_or_none()
            if severity:
                severity.severity = prediction_result["severity"]
                severity.urgency_level = prediction_result["urgency_level"]
                severity.emergency_flag = prediction_result["emergency_flag"]
                severity.explanation = prediction_result["explanation"]
            else:
                severity = SeverityAssessment(
                    prediction_id=disease_pred.prediction_id,
                    severity=prediction_result["severity"],
                    urgency_level=prediction_result["urgency_level"],
                    emergency_flag=prediction_result["emergency_flag"],
                    explanation=prediction_result["explanation"],
                )
                db.add(severity)

            # Check existing specialist
            spec_res = await db.execute(
                select(SpecialistRecommendation).where(SpecialistRecommendation.prediction_id == disease_pred.prediction_id)
            )
            specialist = spec_res.scalar_one_or_none()
            if specialist:
                specialist.specialist = prediction_result["specialist"]
                specialist.reason = prediction_result["explanation"]
            else:
                specialist = SpecialistRecommendation(
                    prediction_id=disease_pred.prediction_id,
                    specialist=prediction_result["specialist"],
                    reason=prediction_result["explanation"],
                )
                db.add(specialist)
        else:
            disease_pred = DiseasePrediction(
                conversation_id=conversation_id,
                predicted_disease=prediction_result["predicted_disease"],
                confidence_score=prediction_result["confidence_score"],
                differential_diagnoses=differential_json,
                prediction_model=prediction_result["prediction_model"],
                symptom_vector=symptom_vector_json,
            )
            db.add(disease_pred)
            await db.flush()

            severity = SeverityAssessment(
                prediction_id=disease_pred.prediction_id,
                severity=prediction_result["severity"],
                urgency_level=prediction_result["urgency_level"],
                emergency_flag=prediction_result["emergency_flag"],
                explanation=prediction_result["explanation"],
            )
            db.add(severity)

            specialist = SpecialistRecommendation(
                prediction_id=disease_pred.prediction_id,
                specialist=prediction_result["specialist"],
                reason=prediction_result["explanation"],
            )
            db.add(specialist)

        await db.flush()

        # 5. Return structured report
        return {
            "prediction_id": str(disease_pred.prediction_id),
            "conversation_id": str(conversation_id),
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
            "primary_symptom": primary_sym,
            "associated_symptoms": associated_syms,
            "symptoms_used": formatted_list,
        }

    @staticmethod
    async def get_prediction_by_conversation(
        db: AsyncSession,
        user: User,
        conversation_id: uuid.UUID | None = None,
        target_id: uuid.UUID | None = None,
    ) -> Dict[str, Any] | None:
        """
        Retrieves the stored prediction report by conversation_id or prediction_id.
        Returns None if no prediction exists yet.
        """
        lookup_id = conversation_id or target_id
        if not lookup_id:
            return None

        profile = await _get_profile(db, user)

        pred_result = await db.execute(
            select(DiseasePrediction)
            .join(Conversation)
            .where(
                (DiseasePrediction.conversation_id == lookup_id) | (DiseasePrediction.prediction_id == lookup_id),
                Conversation.profile_id == profile.profile_id,
            )
            .options(
                selectinload(DiseasePrediction.severity_assessment),
                selectinload(DiseasePrediction.specialist_recommendation),
            )
            .order_by(DiseasePrediction.predicted_at.desc())
            .limit(1)
        )
        pred = pred_result.scalar_one_or_none()

        if not pred:
            # Check if conversation exists and has messages with symptoms
            conv_res = await db.execute(
                select(Conversation).where(
                    Conversation.conversation_id == lookup_id,
                    Conversation.profile_id == profile.profile_id
                ).options(selectinload(Conversation.messages))
            )
            conv = conv_res.scalar_one_or_none()
            if conv and conv.messages:
                from app.ml.rule_based_predictor import extract_cumulative_symptoms
                history = [{"sender": m.sender, "content": m.message} for m in conv.messages]
                cum_data = extract_cumulative_symptoms(history)
                if cum_data.get("all_symptoms"):
                    return await RuleBasedPredictionService.run_prediction(
                        db=db,
                        user=user,
                        conversation_id=conv.conversation_id,
                        symptoms=cum_data["all_symptoms"],
                        cumulative_metadata=cum_data,
                    )
            return None

        differential = []
        if pred.differential_diagnoses:
            try:
                differential = json.loads(pred.differential_diagnoses)
            except Exception:
                differential = []

        symptoms_used = []
        triggered_rules = []
        primary_sym = "General Assessment"
        associated_syms = []

        if pred.symptom_vector:
            try:
                vector_data = json.loads(pred.symptom_vector)
                if isinstance(vector_data, dict):
                    primary_sym = vector_data.get("primary_symptom", "General Assessment")
                    associated_syms = vector_data.get("associated_symptoms", [])
                    symptoms_used = vector_data.get("formatted_symptoms") or vector_data.get("raw_symptoms", [])
                    triggered_rules = vector_data.get("triggered_rules", [])
                elif isinstance(vector_data, list):
                    symptoms_used = [format_symptom_title(s) for s in vector_data]
                    primary_sym = symptoms_used[0] if symptoms_used else "General Assessment"
                    associated_syms = symptoms_used[1:] if len(symptoms_used) > 1 else []
            except Exception:
                symptoms_used = []

        return {
            "prediction_id": str(pred.prediction_id),
            "conversation_id": str(pred.conversation_id),
            "predicted_disease": pred.predicted_disease,
            "confidence_score": float(pred.confidence_score),
            "prediction_model": pred.prediction_model,
            "differential": differential,
            "triggered_rules": triggered_rules,
            "severity": {
                "assessment_id": str(pred.severity_assessment.assessment_id) if pred.severity_assessment else None,
                "severity": pred.severity_assessment.severity if pred.severity_assessment else "routine",
                "urgency_level": pred.severity_assessment.urgency_level if pred.severity_assessment else "ROUTINE",
                "emergency_flag": pred.severity_assessment.emergency_flag if pred.severity_assessment else False,
                "explanation": pred.severity_assessment.explanation if pred.severity_assessment else "",
            },
            "specialist": {
                "recommendation_id": str(pred.specialist_recommendation.recommendation_id) if pred.specialist_recommendation else None,
                "specialist": pred.specialist_recommendation.specialist if pred.specialist_recommendation else "General Physician",
                "reason": pred.specialist_recommendation.reason if pred.specialist_recommendation else "",
            },
            "primary_symptom": primary_sym,
            "associated_symptoms": associated_syms,
            "symptoms_used": symptoms_used,
            "predicted_at": pred.predicted_at.isoformat(),
        }
