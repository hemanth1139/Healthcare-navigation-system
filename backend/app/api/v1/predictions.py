"""
Disease Prediction API Router.
Exposes endpoints to trigger and retrieve rule-based disease predictions.
"""

from uuid import UUID
from fastapi import APIRouter
from typing import Optional

from app.dependencies import DBSession, CurrentUser
from app.services.prediction_service import RuleBasedPredictionService
from app.core.exceptions import NotFoundError

router = APIRouter(prefix="/predictions", tags=["Disease Prediction"])


@router.post("/{conversation_id}")
async def trigger_prediction(
    conversation_id: UUID,
    db: DBSession,
    current_user: CurrentUser,
):
    """
    Trigger rule-based disease prediction for a completed triage conversation.
    Pass the list of extracted symptoms in the request body.
    """
    from pydantic import BaseModel
    from typing import List

    # Re-fetch symptoms from the conversation's last triage state
    # Symptoms come from the triage agent output stored in the conversation
    # For now allow caller to pass symptoms via query or we pull from conversation
    raise NotFoundError("Use POST /predictions/{conversation_id}/run with symptoms body")


@router.post("/{conversation_id}/run")
async def run_prediction(
    conversation_id: UUID,
    db: DBSession,
    current_user: CurrentUser,
    payload: dict,
):
    """
    Run rule-based disease prediction given a list of extracted symptoms.

    Request body:
    {
        "symptoms": ["fever", "cough", "shortness_of_breath"]
    }
    """
    symptoms = payload.get("symptoms", [])
    if not symptoms:
        from fastapi import HTTPException
        raise HTTPException(status_code=422, detail="symptoms list must not be empty")

    result = await RuleBasedPredictionService.run_prediction(
        db=db,
        user=current_user,
        conversation_id=conversation_id,
        symptoms=symptoms,
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
    Returns 404 if no prediction has been run yet.
    """
    result = await RuleBasedPredictionService.get_prediction_by_conversation(
        db=db,
        user=current_user,
        conversation_id=conversation_id,
    )
    if not result:
        raise NotFoundError("Prediction for this conversation")
    return result
