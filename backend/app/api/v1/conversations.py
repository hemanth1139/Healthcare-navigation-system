"""
Conversation API router — /api/v1/conversations/*
"""

from uuid import UUID
from fastapi import APIRouter
from typing import List

from app.dependencies import DBSession, CurrentUser
from app.schemas.conversation import (
    ConversationCreateRequest, ConversationOut, MessageCreateRequest, MessageOut,
)
from app.services.conversation_service import ConversationService

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
    # Simple map to response schema
    return ConversationOut.from_orm(conv)


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
