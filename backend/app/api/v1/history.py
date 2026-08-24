"""
History API Router.
"""

from fastapi import APIRouter
from sqlalchemy import select
from typing import List, Dict, Any

from app.dependencies import DBSession, CurrentUser
from app.models.profile import PatientProfile
from app.models.prediction import DiseasePrediction
from app.models.conversation import Conversation

router = APIRouter(prefix="/history", tags=["User Assessment History"])


@router.get("", response_model=List[Dict[str, Any]])
async def get_assessment_history(db: DBSession, current_user: CurrentUser):
    """Retrieve full chronological list of previous disease predictions and chats."""
    # Find patient profile
    prof_res = await db.execute(
        select(PatientProfile).where(PatientProfile.user_id == current_user.user_id)
    )
    profile = prof_res.scalar_one_or_none()
    if not profile:
        return []

    # Query all predictions for user profile
    result = await db.execute(
        select(DiseasePrediction)
        .join(Conversation)
        .where(Conversation.profile_id == profile.profile_id)
        .order_by(DiseasePrediction.predicted_at.desc())
    )
    predictions = result.scalars().all()
    
    history_list = []
    for pred in predictions:
        history_list.append({
            "predictionId": str(pred.prediction_id),
            "conversationId": str(pred.conversation_id),
            "predictedDisease": pred.predicted_disease,
            "confidenceScore": float(pred.confidence_score),
            "predictedAt": pred.predicted_at.isoformat()
        })
        
    return history_list
