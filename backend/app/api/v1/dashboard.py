"""
Dashboard Summary API Router.
"""

from fastapi import APIRouter
from sqlalchemy import select, func
from typing import Dict, Any

from app.dependencies import DBSession, CurrentUser
from app.models.profile import PatientProfile
from app.models.conversation import Conversation
from app.models.record import MedicalRecord
from app.models.prediction import DiseasePrediction

router = APIRouter(prefix="/dashboard", tags=["Dashboard Summaries"])


@router.get("", response_model=Dict[str, Any])
async def get_dashboard_summary(db: DBSession, current_user: CurrentUser):
    """Retrieve summary metrics for the patient home dashboard."""
    # Find patient profile
    prof_res = await db.execute(
        select(PatientProfile).where(PatientProfile.user_id == current_user.user_id)
    )
    profile = prof_res.scalar_one_or_none()
    
    if not profile:
        return {
            "totalConversations": 0,
            "totalUploads": 0,
            "totalPredictions": 0,
            "recentDiagnosis": None
        }

    # Count conversations
    conv_count_res = await db.execute(
        select(func.count(Conversation.conversation_id))
        .where(Conversation.profile_id == profile.profile_id)
    )
    total_convs = conv_count_res.scalar() or 0

    # Count medical records
    rec_count_res = await db.execute(
        select(func.count(MedicalRecord.record_id))
        .where(MedicalRecord.profile_id == profile.profile_id)
    )
    total_recs = rec_count_res.scalar() or 0

    # Find predictions and get latest prediction
    pred_res = await db.execute(
        select(DiseasePrediction)
        .join(Conversation)
        .where(Conversation.profile_id == profile.profile_id)
        .order_by(DiseasePrediction.predicted_at.desc())
    )
    preds = pred_res.scalars().all()
    total_preds = len(preds)
    latest_diagnosis = preds[0].predicted_disease if preds else "None"

    return {
        "totalConversations": total_convs,
        "totalUploads": total_recs,
        "totalPredictions": total_preds,
        "recentDiagnosis": latest_diagnosis
    }
