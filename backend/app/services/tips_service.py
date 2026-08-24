"""
Personalized Daily Health Tips Service.
Queries patient profile, evaluates age coefficients, and serves custom daily tips.
"""

from datetime import date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List, Dict, Any

from app.models.profile import PatientProfile
from app.models.user import User
from app.agents.tips_agent import HealthTipsAgent, DEFAULT_TIPS


class TipsService:
    @staticmethod
    async def get_daily_tips(db: AsyncSession, user: User) -> List[Dict[str, str]]:
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
        
        # Fallback if profile not created yet
        if not profile:
            return DEFAULT_TIPS

        # Calculate patient age
        age = 35  # Default base age
        if profile.date_of_birth:
            today = date.today()
            dob = profile.date_of_birth
            age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))

        # Format lists from relationships
        allergies_str = ", ".join([a.allergy_name for a in profile.allergies])
        conditions_str = ", ".join([c.condition_name for c in profile.chronic_conditions])

        # Generate custom tips using agent
        return await HealthTipsAgent.generate_tips(
            age=age,
            gender=profile.gender or "Other",
            allergies=allergies_str,
            chronic_conditions=conditions_str
        )
