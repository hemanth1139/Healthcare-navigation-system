"""
Disease Prediction API Router.
Exposes endpoints to trigger and retrieve rule-based disease predictions.
"""

from uuid import UUID
from typing import Optional, List
from fastapi import APIRouter, Body
from pydantic import BaseModel, Field

from app.dependencies import DBSession, CurrentUser
from app.services.prediction_service import PredictionService
from app.core.exceptions import NotFoundError

router = APIRouter(prefix="/predictions", tags=["Disease Prediction"])


class PredictionRunPayload(BaseModel):
    symptoms: Optional[List[str]] = Field(default=None, description="Optional list of explicit symptom strings")


@router.post("/{conversation_id}")
@router.post("/{conversation_id}/run")
async def run_prediction(
    conversation_id: UUID,
    db: DBSession,
    current_user: CurrentUser,
    payload: Optional[PredictionRunPayload] = Body(default=None),
):
    """
    Run rule-based disease prediction given a list of extracted symptoms.
    If payload/symptoms list is empty, symptoms will be automatically extracted
    from the conversation history.
    """
    symptoms = (payload.symptoms if payload else None) or []

    cumulative_metadata = None
    if not symptoms:
        from app.models.conversation import ConversationMessage
        from sqlalchemy import select
        from app.ml.rule_based_predictor import extract_cumulative_symptoms
        msg_res = await db.execute(
            select(ConversationMessage).where(ConversationMessage.conversation_id == conversation_id).order_by(ConversationMessage.created_at.asc())
        )
        messages = msg_res.scalars().all()
        history = [{"sender": m.sender, "content": m.message} for m in messages]
        cumulative_metadata = extract_cumulative_symptoms(history)
        symptoms = cumulative_metadata.get("all_symptoms", [])
        if not symptoms:
            symptoms = ["general_discomfort"]

    result = await PredictionService.run_prediction(
        db=db,
        user=current_user,
        conversation_id=conversation_id,
        symptoms=symptoms,
        cumulative_metadata=cumulative_metadata,
    )
    await db.commit()
    return result


@router.get("/{conversation_id}")
async def get_prediction(
    conversation_id: UUID,
    db: DBSession,
    current_user: CurrentUser,
):
    """
    Retrieve the stored prediction report for a given conversation.
    If intake is in progress, computes provisional prediction from current message history.
    """
    result = await PredictionService.get_prediction_by_conversation(
        db=db,
        user=current_user,
        conversation_id=conversation_id,
    )
    if not result:
        from app.models.conversation import ConversationMessage
        from sqlalchemy import select
        from app.ml.rule_based_predictor import extract_cumulative_symptoms
        msg_res = await db.execute(
            select(ConversationMessage).where(ConversationMessage.conversation_id == conversation_id).order_by(ConversationMessage.created_at.asc())
        )
        messages = msg_res.scalars().all()
        if messages:
            history = [{"sender": m.sender, "content": m.message} for m in messages]
            cumulative_metadata = extract_cumulative_symptoms(history)
            symptoms = cumulative_metadata.get("all_symptoms", []) or ["general_discomfort"]
            result = await PredictionService.run_prediction(
                db=db,
                user=current_user,
                conversation_id=conversation_id,
                symptoms=symptoms,
                cumulative_metadata=cumulative_metadata,
            )
            await db.commit()
            return result
        raise NotFoundError("Prediction for this conversation")
    return result


@router.get("/by-id/{prediction_id}")
async def get_prediction_by_id(
    prediction_id: UUID,
    db: DBSession,
    current_user: CurrentUser,
):
    """
    Retrieve a prediction report by its prediction_id (UUID).
    This is used by the frontend when viewing individual prediction reports.
    """
    result = await PredictionService.get_prediction_by_id(
        db=db,
        user=current_user,
        prediction_id=prediction_id,
    )
    if not result:
        raise NotFoundError("Prediction")
    return result
