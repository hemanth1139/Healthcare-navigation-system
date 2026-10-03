"""
Personalized Daily Health Tips Service.
Queries patient profile, evaluates age coefficients, and serves custom daily tips.
"""

import json
import uuid
from datetime import date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List, Dict, Any

from app.models.profile import PatientProfile
from app.models.user import User
from app.models.conversation import Conversation
from app.models.prediction import DiseasePrediction
from app.agents.tips_agent import HealthTipsAgent


class TipsService:
    @staticmethod
    async def get_daily_tips(
        db: AsyncSession,
        user: User,
        conversation_id: uuid.UUID | None = None,
    ) -> List[Dict[str, Any]]:
        """
        Retrieves custom daily health tips based on patient demographics.
        """
        # Find user profile eagerly loading relationships
        result = await db.execute(
            select(PatientProfile)
            .where(PatientProfile.user_id == user.user_id)
            .options(
                selectinload(PatientProfile.allergies),
                selectinload(PatientProfile.chronic_conditions)
            )
        )
        profile = result.scalar_one_or_none()
        
        if not profile:
            return await HealthTipsAgent.generate_tips(
                age=0, gender="", allergies="", chronic_conditions=""
            )

        # Calculate patient age
        age = 35  # Default base age
        if profile.date_of_birth:
            today = date.today()
            dob = profile.date_of_birth
            age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))

        # Format lists from relationships
        allergies_str = ", ".join([a.allergy_name for a in profile.allergies])
        conditions_str = ", ".join([c.condition_name for c in profile.chronic_conditions])

        # Use the requested conversation's assessment when supplied; otherwise
        # select this patient's most recent assessment. Join through the profile
        # so a caller can never retrieve another user's diagnosis.
        prediction_query = (
            select(DiseasePrediction)
            .join(Conversation, DiseasePrediction.conversation_id == Conversation.conversation_id)
            .where(Conversation.profile_id == profile.profile_id)
            .options(selectinload(DiseasePrediction.severity_assessment))
        )
        if conversation_id:
            prediction_query = prediction_query.where(
                DiseasePrediction.conversation_id == conversation_id
            )
        prediction_result = await db.execute(
            prediction_query.order_by(DiseasePrediction.predicted_at.desc()).limit(1)
        )
        prediction = prediction_result.scalar_one_or_none()

        assessment = None
        if prediction:
            try:
                vector = json.loads(prediction.symptom_vector or "{}")
                if not isinstance(vector, dict):
                    vector = {}
            except (TypeError, json.JSONDecodeError):
                vector = {}
            severity = prediction.severity_assessment
            assessment = {
                "predicted_disease": prediction.predicted_disease,
                "confidence_score": float(prediction.confidence_score),
                "canonical_symptoms": vector.get("canonical_symptoms", []),
                "urgency_level": severity.urgency_level if severity else "ROUTINE",
                "severity": severity.severity if severity else "routine",
                "emergency_flag": severity.emergency_flag if severity else False,
                "recommended_action": vector.get("recommended_action", ""),
            }

        # Generate custom tips using agent
        return await HealthTipsAgent.generate_tips(
            age=age,
            gender=profile.gender or "Other",
            allergies=allergies_str,
            chronic_conditions=conditions_str,
            assessment=assessment,
        )
