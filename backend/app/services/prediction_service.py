"""
Prediction service — orchestrates XGBoost predictions, SHAP explainers,
severity evaluations, and specialist mappings, committing all results to PostgreSQL.
"""

import json
from uuid import UUID, uuid4
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List, Dict, Any, Optional

from app.models.conversation import Conversation
from app.models.profile import PatientProfile
from app.models.user import User
from app.models.prediction import (
    DiseasePrediction, ShapExplanation, SeverityAssessment, SpecialistRecommendation,
)
from app.schemas.prediction import (
    FullPredictionReportOut, DiseasePredictionOut, DifferentialDisease,
    ShapExplanationOut, SeverityAssessmentOut,
)
from app.ml.xgboost_model import XGBoostPredictor
from app.ml.shap_explainer import ShapExplainer
from app.agents.severity_agent import run_severity_agent
from app.agents.specialist_agent import recommend_specialist
from app.core.exceptions import NotFoundError, ValidationError

# Initialize ML Predictor and Explainer singletons
predictor = XGBoostPredictor()
explainer = ShapExplainer(predictor)


class PredictionService:

    @staticmethod
    async def create_prediction(db: AsyncSession, user: User, conversation_id: UUID) -> FullPredictionReportOut:
        """Create a disease prediction report from the symptoms of an ended conversation."""
        # 1. Fetch conversation
        result = await db.execute(
            select(Conversation)
            .where(Conversation.conversation_id == conversation_id)
            .options(selectinload(Conversation.messages))
        )
        conv = result.scalar_one_or_none()
        if not conv:
            raise NotFoundError("Conversation")

        # 2. Extract symptoms list from conversation history
        # (For simulation, search the message logs for clinical symptom matches)
        user_messages = [m.message.lower() for m in conv.messages if m.sender == "user"]
        all_text = " ".join(user_messages)
        
        detected_symptoms = []
        # Search for presence of clinical symptoms in user messages
        for symptom in predictor.features:
            symptom_kw = symptom.replace("_", " ")
            if symptom_kw in all_text or symptom in all_text:
                detected_symptoms.append(symptom)

        # Fallback if no symptoms detected in text
        if not detected_symptoms:
            detected_symptoms = ["fever", "headache"]  # Default base case

        # 3. XGBoost prediction
        disease_name, confidence, differential_raw, vector = predictor.predict(detected_symptoms)

        # 4. Save base prediction model
        pred = DiseasePrediction(
            conversation_id=conversation_id,
            predicted_disease=disease_name,
            confidence_score=confidence,
            differential_diagnoses=json.dumps(differential_raw),
            prediction_model=predictor.model.__class__.__name__ + f"-TreeClassifier-v{predictor.model.n_estimators}",
            symptom_vector=json.dumps(vector.tolist())
        )
        db.add(pred)
        await db.flush()  # Generate prediction_id

        # 5. Calculate SHAP Explanations
        shap_vals = explainer.explain(vector, str(pred.prediction_id), disease_name)
        shap_list = []
        for val in shap_vals:
            exp_row = ShapExplanation(
                prediction_id=pred.prediction_id,
                feature_name=val["feature_name"],
                plain_language_label=val["plain_language_label"],
                contribution_score=val["contribution_score"]
            )
            db.add(exp_row)
            shap_list.append(exp_row)

        # 6. Execute Severity Agent (runs LLM or fallback rules)
        severity_data = await run_severity_agent(disease_name, confidence)
        sev = SeverityAssessment(
            prediction_id=pred.prediction_id,
            severity=severity_data["severity"],
            urgency_level=severity_data["urgency_level"],
            emergency_flag=severity_data["emergency_flag"],
            explanation=severity_data["explanation"]
        )
        db.add(sev)

        # 7. Execute Specialist Agent (rules mapping)
        specialist_data = recommend_specialist(disease_name, severity_data["severity"])
        spec = SpecialistRecommendation(
            prediction_id=pred.prediction_id,
            specialist=specialist_data["specialist"],
            reason=specialist_data["reason"]
        )
        db.add(spec)
        await db.flush()

        # Compile final outputs
        differential = [
            DifferentialDisease(
                diseaseName=d["disease_name"],
                confidenceScore=d["confidence_score"],
                isTopMatch=d["is_top_match"],
                description=d.get("description", "Potential diagnosis match based on symptom configuration."),
                category=specialist_data["specialist"] if d["is_top_match"] else "General Medicine"
            ) for d in differential_raw
        ]

        return FullPredictionReportOut(
            prediction=DiseasePredictionOut.from_orm(pred),
            differential=differential,
            shapExplanations=[ShapExplanationOut.from_orm(s) for s in shap_list],
            severityAssessment=SeverityAssessmentOut.from_orm(sev),
            recommendedSpecialistCategory=spec.specialist
        )

    @staticmethod
    async def get_prediction(db: AsyncSession, user: User, prediction_id: UUID) -> FullPredictionReportOut:
        """Fetch full disease prediction report."""
        result = await db.execute(
            select(DiseasePrediction)
            .where(DiseasePrediction.prediction_id == prediction_id)
            .options(
                selectinload(DiseasePrediction.shap_explanations),
                selectinload(DiseasePrediction.severity_assessment),
                selectinload(DiseasePrediction.specialist_recommendation)
            )
        )
        pred = result.scalar_one_or_none()
        if not pred:
            raise NotFoundError("Disease prediction report")

        # Parse stored differential
        differential_raw = json.loads(pred.differential_diagnoses) if pred.differential_diagnoses else []
        differential = [
            DifferentialDisease(
                diseaseName=d["disease_name"],
                confidenceScore=d["confidence_score"],
                isTopMatch=d["is_top_match"],
                description=d.get("description", "Potential diagnosis match based on symptom configuration."),
                category=pred.specialist_recommendation.specialist if d["is_top_match"] else "General Care"
            ) for d in differential_raw
        ]

        return FullPredictionReportOut(
            prediction=DiseasePredictionOut.from_orm(pred),
            differential=differential,
            shapExplanations=[ShapExplanationOut.from_orm(s) for s in pred.shap_explanations],
            severityAssessment=SeverityAssessmentOut.from_orm(pred.severity_assessment),
            recommendedSpecialistCategory=pred.specialist_recommendation.specialist if pred.specialist_recommendation else None
        )

    @staticmethod
    async def list_predictions(db: AsyncSession, user: User) -> List[DiseasePredictionOut]:
        """List all previous predictions."""
        # Find user profile
        prof_res = await db.execute(select(PatientProfile).where(PatientProfile.user_id == user.user_id))
        profile = prof_res.scalar_one_or_none()
        if not profile:
            return []
            
        result = await db.execute(
            select(DiseasePrediction)
            .join(Conversation)
            .where(Conversation.profile_id == profile.profile_id)
            .order_by(DiseasePrediction.predicted_at.desc())
        )
        predictions = result.scalars().all()
        return [DiseasePredictionOut.from_orm(p) for p in predictions]

    @staticmethod
    async def get_shap_explanations(db: AsyncSession, user: User, prediction_id: UUID) -> List[ShapExplanationOut]:
        """Get SHAP explanations for a specific prediction."""
        result = await db.execute(
            select(ShapExplanation).where(ShapExplanation.prediction_id == prediction_id)
        )
        exps = result.scalars().all()
        return [ShapExplanationOut.from_orm(e) for e in exps]

    @staticmethod
    async def get_severity_assessment(db: AsyncSession, user: User, prediction_id: UUID) -> SeverityAssessmentOut:
        """Get severity assessment for a prediction."""
        result = await db.execute(
            select(SeverityAssessment).where(SeverityAssessment.prediction_id == prediction_id)
        )
        sev = result.scalar_one_or_none()
        if not sev:
            raise NotFoundError("Severity assessment")
        return SeverityAssessmentOut.from_orm(sev)
