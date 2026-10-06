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
    ConversationOut, MessageOut, FollowUpQuestion,
)
from app.agents.graph import execute_triage
from app.core.exceptions import NotFoundError, ValidationError
from app.services.profile_service import ProfileService
from app.services.prediction_service import PredictionService
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

        user_turns = sum(1 for m in history if m.get("sender") == "user")
        assistant_questions = sum(1 for m in history if m.get("sender") in ("assistant", "agent"))
        
        # Only force more questions if this is the very first turn
        if user_turns <= 1 and not is_emergency:
            needs_more_info = True
        # Don't force minimum of 4 questions - let the AI decide when enough info is gathered
        # This prevents the infinite loop

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
            reply_text = triage_state.get("message") or (
                "🚨 EMERGENCY ALERT: Your reported symptoms indicate potential acute medical risk requiring immediate evaluation. "
                "Call 112 or 108 now. Do not drive yourself or travel alone if you feel unwell."
            )
            conv.status = "completed"
            conv.ended_at = datetime.now(timezone.utc)
        elif not needs_more_info:
            reply_text = triage_state.get("message") or (
                f"Thank you. I have gathered enough clinical details regarding {', '.join(formatted_symptoms)}. "
                "This is not a diagnosis; please discuss these symptoms with a healthcare professional."
            )
            conv.status = "completed"
            conv.ended_at = datetime.now(timezone.utc)
        else:
            reply_text = triage_state.get("question")
            if not reply_text:
                from app.agents.triage_agent import _get_mock_triage_response
                fallback_mock = _get_mock_triage_response(history, context_summary)
                reply_text = fallback_mock.get("question") or "Since this began, has it been improving, getting worse, or staying about the same?"

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
            follow_up = FollowUpQuestion(
                questionId=str(uuid4()),
                questionText=reply_text,
                options=None,
                allowFreeText=True,
                isAnswered=False
            )

        # 8. On completion, store identified symptoms using AI assessment
        prediction_id = None
        prediction_report = None
        assessment_severity = triage_state.get("severity") or ("emergency" if is_emergency else None)
        recommended_specialists = [] if is_emergency else (triage_state.get("specialists") or [])

        if is_completed:
            try:
                prediction_report = await PredictionService.run_prediction(
                    db=db,
                    user=user,
                    conversation_id=conversation_id,
                    symptoms=symptoms,
                    cumulative_metadata=cumulative_data,
                    assessment_severity=assessment_severity,
                    specialists=recommended_specialists,
                    assessment_message=triage_state.get("message"),
                )
                prediction_id = prediction_report.get("prediction_id")
            except Exception as e:
                print(f"[ERROR] Failed to run prediction: {e}")
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
            assessment_severity=assessment_severity,
            recommended_specialists=recommended_specialists,
        )
