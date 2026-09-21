"""
Conversation service — implements database storage for chat sessions and messages,
and handles integration with the LangGraph triage workflow.
"""

from uuid import UUID, uuid4
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import Optional, List

from app.models.profile import PatientProfile
from app.models.user import User
from app.models.conversation import Conversation, ConversationMessage
from app.schemas.conversation import (
    ConversationOut, MessageOut, FollowUpQuestion, QuickReplyOption,
)
from app.agents.graph import execute_triage
from app.core.exceptions import NotFoundError, ValidationError
from app.services.prediction_service import RuleBasedPredictionService


async def _get_profile_by_user(db: AsyncSession, user: User) -> PatientProfile:
    result = await db.execute(
        select(PatientProfile).where(PatientProfile.user_id == user.user_id)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise NotFoundError("Patient profile")
    return profile


class ConversationService:

    @staticmethod
    async def create_conversation(
        db: AsyncSession, user: User, language: str = "en", input_type: str = "text"
    ) -> ConversationOut:
        """Create a new symptom triage conversation."""
        profile = await _get_profile_by_user(db, user)
        
        # Start session
        conv = Conversation(
            profile_id=profile.profile_id,
            language=language,
            input_type=input_type,
            status="active"
        )
        db.add(conv)
        await db.flush()
        return ConversationOut.from_orm(conv)

    @staticmethod
    async def list_conversations(db: AsyncSession, user: User) -> List[ConversationOut]:
        """List all conversations of the patient."""
        profile = await _get_profile_by_user(db, user)
        
        result = await db.execute(
            select(Conversation)
            .where(Conversation.profile_id == profile.profile_id)
            .order_by(Conversation.started_at.desc())
        )
        conversations = result.scalars().all()
        
        # Build outputs with stubs for emergency / last message details
        return [ConversationOut.from_orm(c) for c in conversations]

    @staticmethod
    async def get_conversation(db: AsyncSession, user: User, conversation_id: UUID) -> Conversation:
        """Get conversation with eagerly loaded messages."""
        profile = await _get_profile_by_user(db, user)
        result = await db.execute(
            select(Conversation)
            .where(
                Conversation.conversation_id == conversation_id,
                Conversation.profile_id == profile.profile_id
            )
            .options(selectinload(Conversation.messages))
        )
        conv = result.scalar_one_or_none()
        if not conv:
            raise NotFoundError("Conversation")
        return conv

    @staticmethod
    async def delete_conversation(db: AsyncSession, user: User, conversation_id: UUID) -> None:
        """Delete a conversation history session."""
        conv = await ConversationService.get_conversation(db, user, conversation_id)
        await db.delete(conv)

    @staticmethod
    async def send_message(
        db: AsyncSession, user: User, conversation_id: UUID, message_text: str, input_type: str = "text"
    ) -> MessageOut:
        """Send user message, execute LangGraph triage node, and store response."""
        conv = await ConversationService.get_conversation(db, user, conversation_id)
        
        if conv.status != "active":
            raise ValidationError("Cannot send message to a concluded conversation.")

        # 1. Save user message to database
        user_msg = ConversationMessage(
            conversation_id=conversation_id,
            sender="user",
            message=message_text,
        )
        db.add(user_msg)
        await db.flush()

        # 2. Gather whole history for the LangGraph context
        # (Fetch all messages, ordering by created_at)
        history = []
        for msg in conv.messages:
            history.append({"sender": msg.sender, "content": msg.message})
        # Add the new message since flush has happened
        history.append({"sender": "user", "content": message_text})

        # 3. Invoke LangGraph Orchestrator
        triage_state = await execute_triage(history)

        # 4. Save agent response
        needs_more_info = triage_state["needs_more_info"]
        is_emergency = triage_state["is_emergency"]
        symptoms = triage_state["symptoms"]
        
        # Decide content of reply
        if is_emergency:
            reply_text = (
                "🚨 EMERGENCY ALERT: Your symptoms suggest a potential medical emergency. "
                "Please call your local emergency services (e.g., 112 or 911) or visit the nearest emergency room immediately."
            )
            conv.status = "completed"
            conv.ended_at = datetime.now(timezone.utc)
        elif not needs_more_info:
            reply_text = (
                f"Thank you. I have gathered enough details to assess your symptoms: {', '.join(symptoms)}. "
                "I am now initiating your disease prediction report..."
            )
            conv.status = "completed"
            conv.ended_at = datetime.now(timezone.utc)
        else:
            # Triage agent returned follow up question
            reply_text = triage_state["question"] or "Can you provide more details about your symptoms?"

        agent_msg = ConversationMessage(
            conversation_id=conversation_id,
            sender="assistant",
            message=reply_text,
        )
        db.add(agent_msg)
        await db.flush()

        # 5. Format question details if any
        follow_up = None
        if needs_more_info and not is_emergency:
            options_raw = triage_state.get("options")
            options = None
            if options_raw:
                options = [QuickReplyOption(id=opt["id"], label=opt["label"], value=opt["value"]) for opt in options_raw]
            
            follow_up = FollowUpQuestion(
                questionId=str(uuid4()),
                questionText=reply_text,
                options=options,
                allowFreeText=True,
                isAnswered=False
            )

        # ── Trigger rule-based prediction when triage concludes ──────────────
        prediction_id = None
        if not needs_more_info and not is_emergency and symptoms:
            try:
                pred_report = await RuleBasedPredictionService.run_prediction(
                    db=db,
                    user=user,
                    conversation_id=conversation_id,
                    symptoms=symptoms,
                )
                prediction_id = pred_report["prediction_id"]
                print(f"[SUCCESS] Rule-based prediction completed: {pred_report['predicted_disease']} "
                      f"(confidence: {pred_report['confidence_score']:.2f})")
            except Exception as e:
                print(f"[WARN] Rule-based prediction failed: {e}")
                prediction_id = None

        return MessageOut.from_orm(
            agent_msg,
            follow_up=follow_up,
            prediction_id=prediction_id,
            is_emergency=is_emergency
        )
