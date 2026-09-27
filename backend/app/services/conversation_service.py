"""
Conversation service — database storage for chat sessions, messages,
integration with LangGraph triage workflow, and cumulative clinical symptom extraction.
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
from app.models.prediction import DiseasePrediction
from app.schemas.conversation import (
    ConversationOut, MessageOut, FollowUpQuestion, QuickReplyOption,
)
from app.agents.graph import execute_triage
from app.core.exceptions import NotFoundError, ValidationError
from app.services.prediction_service import RuleBasedPredictionService
from app.services.profile_service import ProfileService
from app.ml.rule_based_predictor import extract_cumulative_symptoms, format_symptom_title


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
        """List all conversations for the authenticated patient."""
        profile = await _get_profile_by_user(db, user)
        
        result = await db.execute(
            select(Conversation)
            .where(Conversation.profile_id == profile.profile_id)
            .options(
                selectinload(Conversation.messages),
                selectinload(Conversation.disease_predictions)
            )
            .order_by(Conversation.started_at.desc())
        )
        conversations = result.scalars().all()
        
        output = []
        for c in conversations:
            last_msg = c.messages[-1].message if c.messages else None
            pred_id = str(c.disease_predictions[0].prediction_id) if c.disease_predictions else None
            output.append(ConversationOut.from_orm(c, last_msg=last_msg, prediction_id=pred_id))
        return output

    @staticmethod
    async def get_conversation(db: AsyncSession, user: User, conversation_id: UUID) -> Conversation:
        """Get conversation with eagerly loaded messages and predictions."""
        profile = await _get_profile_by_user(db, user)
        result = await db.execute(
            select(Conversation)
            .where(
                Conversation.conversation_id == conversation_id,
                Conversation.profile_id == profile.profile_id
            )
            .options(
                selectinload(Conversation.messages),
                selectinload(Conversation.disease_predictions)
            )
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
            raise ValidationError("This conversation has already been completed. Please start a new assessment.")

        # 1. Save user message to database
        user_msg = ConversationMessage(
            conversation_id=conversation_id,
            sender="user",
            message=message_text,
        )
        db.add(user_msg)
        await db.flush()

        # 2. Gather whole history for the LangGraph context
        history = []
        for msg in conv.messages:
            history.append({"sender": msg.sender, "content": msg.message})
        if not history or history[-1].get("content") != message_text:
            history.append({"sender": "user", "content": message_text})

        # 3. Retrieve patient baseline context
        patient_ctx = await ProfileService.get_patient_context(db, user.user_id)
        context_summary = patient_ctx.get("context_summary", "")

        # 4. Invoke LangGraph Orchestrator
        triage_state = await execute_triage(history, context_summary)

        needs_more_info = triage_state.get("needs_more_info", True)
        is_emergency = triage_state.get("is_emergency", False)

        # 5. Extract cumulative symptoms across ALL messages in history
        cumulative_data = extract_cumulative_symptoms(
            history,
            llm_symptoms=triage_state.get("symptoms", [])
        )
        symptoms = cumulative_data["all_symptoms"]
        formatted_symptoms = cumulative_data["formatted_symptoms"]

        # 6. Formulate reply message text
        is_completed = (not needs_more_info) or is_emergency

        if is_emergency:
            reply_text = (
                "🚨 EMERGENCY ALERT: Your reported symptoms indicate potential acute medical risk requiring immediate evaluation. "
                "Please call emergency services (108 or 112) or proceed to the nearest emergency department immediately."
            )
            conv.status = "completed"
            conv.ended_at = datetime.now(timezone.utc)
        elif not needs_more_info:
            reply_text = (
                f"Thank you. I have gathered enough clinical details regarding {', '.join(formatted_symptoms)}. "
                "Your structured symptom assessment has been completed."
            )
            conv.status = "completed"
            conv.ended_at = datetime.now(timezone.utc)
        else:
            reply_text = triage_state.get("question") or "Can you provide a bit more detail about when this started and how it feels?"

        # Save assistant message
        agent_msg = ConversationMessage(
            conversation_id=conversation_id,
            sender="assistant",
            message=reply_text,
        )
        db.add(agent_msg)
        await db.flush()

        # 7. Format follow-up question options if any
        follow_up = None
        if needs_more_info and not is_emergency:
            options_raw = triage_state.get("options")
            options = None
            if options_raw and isinstance(options_raw, list):
                options = [
                    QuickReplyOption(id=opt.get("id", f"opt_{i}"), label=opt.get("label", str(opt)), value=opt.get("value", str(opt)))
                    for i, opt in enumerate(options_raw) if isinstance(opt, dict)
                ]
            
            follow_up = FollowUpQuestion(
                questionId=str(uuid4()),
                questionText=reply_text,
                options=options,
                allowFreeText=True,
                isAnswered=False
            )

        # 8. Deterministic Rule Engine Trigger on Completion
        prediction_id = None
        prediction_report = None

        if is_completed:
            try:
                prediction_report = await RuleBasedPredictionService.run_prediction(
                    db=db,
                    user=user,
                    conversation_id=conversation_id,
                    symptoms=symptoms,
                    cumulative_metadata=cumulative_data,
                )
                prediction_id = prediction_report.get("prediction_id")
            except Exception as e:
                print(f"[ERROR] Failed to run rule prediction: {e}")
                prediction_id = None

        await db.commit()

        return MessageOut.from_orm(
            agent_msg,
            follow_up=follow_up,
            prediction_id=prediction_id,
            is_emergency=is_emergency,
            completed=is_completed,
            symptoms_identified=formatted_symptoms,
            prediction_report=prediction_report,
        )
