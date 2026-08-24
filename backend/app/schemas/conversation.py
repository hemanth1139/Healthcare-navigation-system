"""
Conversation Pydantic schemas — request/response shapes matching the frontend TypeScript interfaces exactly.
"""

from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List
from uuid import UUID

# ─── Language & Quick Replies ────────────────────────────────────────────────

class QuickReplyOption(BaseModel):
    id: str
    label: str
    value: str


class FollowUpQuestion(BaseModel):
    question_id: str = Field(..., alias="questionId")
    question_text: str = Field(..., alias="questionText")
    options: Optional[List[QuickReplyOption]] = None
    allowFreeText: Optional[bool] = True
    isAnswered: Optional[bool] = False
    selectedOptionId: Optional[str] = None

    model_config = {"populate_by_name": True}


# ─── Messages ─────────────────────────────────────────────────────────────────

class MessageCreateRequest(BaseModel):
    message: str
    language: Optional[str] = "en"
    input_type: Optional[str] = Field("text", alias="inputType")

    model_config = {"populate_by_name": True}


class MessageOut(BaseModel):
    message_id: str = Field(..., alias="messageId")
    conversation_id: str = Field(..., alias="conversationId")
    # Frontend uses: "user" | "agent" | "system"
    sender: str
    message: str
    translated_message: Optional[str] = Field(None, alias="translatedMessage")
    created_at: str = Field(..., alias="createdAt")
    input_type: Optional[str] = Field("text", alias="inputType")
    followUpQuestion: Optional[FollowUpQuestion] = None
    isEmergencyAlert: Optional[bool] = Field(False, alias="isEmergencyAlert")
    predictionId: Optional[str] = Field(None, alias="predictionId")

    model_config = {"populate_by_name": True, "from_attributes": True}

    @classmethod
    def from_orm(cls, message, follow_up: Optional[FollowUpQuestion] = None, prediction_id: Optional[str] = None, is_emergency: bool = False) -> "MessageOut":
        # Map assistant -> agent to match frontend's MessageSender type ("user" | "agent" | "system")
        sender = "agent" if message.sender == "assistant" else message.sender
        return cls(
            messageId=str(message.message_id),
            conversationId=str(message.conversation_id),
            sender=sender,
            message=message.message,
            translatedMessage=message.translated_message,
            createdAt=message.created_at.isoformat(),
            inputType=message.conversation.input_type if hasattr(message, "conversation") else "text",
            followUpQuestion=follow_up,
            isEmergencyAlert=is_emergency,
            predictionId=prediction_id
        )


# ─── Conversations ────────────────────────────────────────────────────────────

class ConversationCreateRequest(BaseModel):
    language: Optional[str] = "en"
    input_type: Optional[str] = Field("text", alias="inputType")

    model_config = {"populate_by_name": True}


class ConversationOut(BaseModel):
    conversation_id: str = Field(..., alias="conversationId")
    profile_id: str = Field(..., alias="profileId")
    language: str
    input_type: str = Field(..., alias="inputType")
    started_at: str = Field(..., alias="startedAt")
    ended_at: Optional[str] = Field(None, alias="endedAt")
    status: str
    hasEmergencyAlert: Optional[bool] = Field(False, alias="hasEmergencyAlert")
    lastMessageText: Optional[str] = Field(None, alias="lastMessageText")

    model_config = {"populate_by_name": True, "from_attributes": True}

    @classmethod
    def from_orm(cls, conv, has_emergency: bool = False, last_msg: Optional[str] = None) -> "ConversationOut":
        return cls(
            conversationId=str(conv.conversation_id),
            profileId=str(conv.profile_id),
            language=conv.language,
            inputType=conv.input_type,
            startedAt=conv.started_at.isoformat(),
            endedAt=conv.ended_at.isoformat() if conv.ended_at else None,
            status=conv.status,
            hasEmergencyAlert=has_emergency,
            lastMessageText=last_msg
        )
