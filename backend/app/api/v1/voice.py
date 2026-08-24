"""
Voice STT/TTS API Router.
"""

from fastapi import APIRouter, File, UploadFile, Form
from pydantic import BaseModel
from typing import Optional

from app.dependencies import DBSession, CurrentUser
from app.services.voice_service import VoiceService

router = APIRouter(prefix="/voice", tags=["Voice Speech Processing"])


class TTSRequest(BaseModel):
    text: str
    language: Optional[str] = "en"


@router.post("/stt")
async def speech_to_text(
    db: DBSession,
    current_user: CurrentUser,
    file: UploadFile = File(...)
):
    """Transcribes an uploaded clinical audio statement into clinical text."""
    content = await file.read()
    text = await VoiceService.speech_to_text(content, file.filename)
    return {
        "text": text,
        "filename": file.filename
    }


@router.post("/tts")
async def text_to_speech(
    payload: TTSRequest,
    db: DBSession,
    current_user: CurrentUser
):
    """Synthesizes text into speech audio and returns playability url."""
    audio_url = await VoiceService.text_to_speech(payload.text, payload.language)
    return {
        "audioUrl": audio_url,
        "text": payload.text
    }
