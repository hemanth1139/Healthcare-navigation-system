"""
History API Router.
Retrieves full chronological history of patient triage consultations and predictions.
"""

from fastapi import APIRouter
from sqlalchemy import select
from sqlalchemy.orm import selectinload
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

    # Query all conversations for user profile
    result = await db.execute(
        select(Conversation)
        .where(Conversation.profile_id == profile.profile_id)
        .options(
            selectinload(Conversation.disease_predictions).selectinload(DiseasePrediction.severity_assessment),
            selectinload(Conversation.disease_predictions).selectinload(DiseasePrediction.specialist_recommendation),
            selectinload(Conversation.messages)
        )
        .order_by(Conversation.started_at.desc())
    )
    conversations = result.scalars().all()
    
    history_list = []
    for conv in conversations:
        # Check if conversation has a generated prediction report
        preds = conv.disease_predictions or []
        pred = preds[0] if preds else None
        
        # Last message preview
        last_msg = conv.messages[-1].message if conv.messages else "Symptom check session"
        
        disease_title = pred.predicted_disease if pred else (
            "Chest Pain Assessment" if "chest" in last_msg.lower() else
            "Fever & Viral Assessment" if "fever" in last_msg.lower() or "cold" in last_msg.lower() else
            "Symptom Consultation"
        )
        
        severity_val = "Routine"
        specialist_val = "General Physician"
        confidence_score = 0.5
        
        if pred:
            confidence_score = float(pred.confidence_score)
            if pred.severity_assessment:
                sev_raw = (pred.severity_assessment.severity or "routine").lower()
                severity_val = "Emergency" if "emergen" in sev_raw else "Urgent" if "high" in sev_raw or "urg" in sev_raw else "Moderate" if "mod" in sev_raw else "Routine"
            if pred.specialist_recommendation:
                specialist_val = pred.specialist_recommendation.specialist

        history_list.append({
            "predictionId": str(pred.prediction_id) if pred else str(conv.conversation_id),
            "conversationId": str(conv.conversation_id),
            "predictedDisease": disease_title,
            "confidenceScore": confidence_score,
            "severity": severity_val,
            "specialist": specialist_val,
            "predictedAt": pred.predicted_at.isoformat() if pred else conv.started_at.isoformat()
        })
        
    return history_list
