"""
Conversation API router — /api/v1/conversations/*
Handles conversational symptom intake, message exchange, and granular assessment views.
"""

from uuid import UUID
from fastapi import APIRouter
from typing import List, Dict, Any

from app.dependencies import DBSession, CurrentUser
from app.schemas.conversation import (
    ConversationCreateRequest, ConversationOut, MessageCreateRequest, MessageOut,
)
from app.services.conversation_service import ConversationService
from app.services.prediction_service import RuleBasedPredictionService
from app.services.profile_service import ProfileService
from app.core.exceptions import NotFoundError

router = APIRouter(prefix="/conversations", tags=["Conversational Triage"])


@router.post("", response_model=ConversationOut, status_code=201)
async def create_conversation(
    payload: ConversationCreateRequest, db: DBSession, current_user: CurrentUser
):
    """Start a new conversational triage session."""
    return await ConversationService.create_conversation(
        db, current_user, payload.language, payload.input_type
    )


@router.get("", response_model=List[ConversationOut])
async def list_conversations(db: DBSession, current_user: CurrentUser):
    """List all previous conversation sessions for the current patient profile."""
    return await ConversationService.list_conversations(db, current_user)


@router.get("/{conversation_id}", response_model=ConversationOut)
async def get_conversation(
    conversation_id: UUID, db: DBSession, current_user: CurrentUser
):
    """Fetch details of a single conversation session."""
    conv = await ConversationService.get_conversation(db, current_user, conversation_id)
    pred_id = str(conv.disease_predictions[0].prediction_id) if conv.disease_predictions else None
    last_msg = conv.messages[-1].message if conv.messages else None
    return ConversationOut.from_orm(conv, last_msg=last_msg, prediction_id=pred_id)


@router.get("/{conversation_id}/context")
async def get_conversation_context(
    conversation_id: UUID, db: DBSession, current_user: CurrentUser
):
    """Get the patient clinical background context associated with this triage session."""
    await ConversationService.get_conversation(db, current_user, conversation_id)
    return await ProfileService.get_patient_context(db, current_user.user_id)


@router.get("/{conversation_id}/symptoms/structured")
async def get_conversation_structured_symptoms(
    conversation_id: UUID, db: DBSession, current_user: CurrentUser
):
    """Get the structured normalized symptom vector extracted from this conversation."""
    pred = await RuleBasedPredictionService.get_prediction_by_conversation(
        db, current_user, conversation_id=conversation_id
    )
    if not pred:
        raise NotFoundError("Structured symptoms for this conversation")
    return {
        "conversation_id": str(conversation_id),
        "prediction_id": pred["prediction_id"],
        "symptoms_used": pred.get("symptoms_used", []),
        "triggered_rules": pred.get("triggered_rules", []),
    }


@router.get("/{conversation_id}/severity")
async def get_conversation_severity(
    conversation_id: UUID, db: DBSession, current_user: CurrentUser
):
    """Get the deterministic clinical severity and urgency assessment."""
    pred = await RuleBasedPredictionService.get_prediction_by_conversation(
        db, current_user, conversation_id=conversation_id
    )
    if not pred or not pred.get("severity"):
        raise NotFoundError("Severity assessment for this conversation")
    return pred["severity"]


@router.get("/{conversation_id}/specialist")
async def get_conversation_specialist(
    conversation_id: UUID, db: DBSession, current_user: CurrentUser
):
    """Get the recommended medical specialist mapping for this conversation."""
    pred = await RuleBasedPredictionService.get_prediction_by_conversation(
        db, current_user, conversation_id=conversation_id
    )
    if not pred or not pred.get("specialist"):
        raise NotFoundError("Specialist recommendation for this conversation")
    return pred["specialist"]


@router.post("/{conversation_id}/messages", response_model=MessageOut)
async def send_message(
    conversation_id: UUID,
    payload: MessageCreateRequest,
    db: DBSession,
    current_user: CurrentUser,
):
    """Send a user message, run triage agent nodes, and return AI response."""
    return await ConversationService.send_message(
        db, current_user, conversation_id, payload.message, payload.input_type
    )


@router.delete("/{conversation_id}", status_code=204)
async def delete_conversation(
    conversation_id: UUID, db: DBSession, current_user: CurrentUser
):
    """Delete a conversation triage session history."""
    await ConversationService.delete_conversation(db, current_user, conversation_id)
