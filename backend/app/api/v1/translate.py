"""
Translation API Router.
"""

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.dependencies import DBSession, CurrentUser
from app.services.translate_service import TranslationService

router = APIRouter(prefix="/translate", tags=["Language Translation"])


class TranslationRequest(BaseModel):
    text: str
    target_lang: str = Field(..., alias="targetLang")

    model_config = {"populate_by_name": True}


@router.post("")
async def translate_text(
    payload: TranslationRequest,
    db: DBSession,
    current_user: CurrentUser
):
    """Translates medical statements into Hindi, Tamil, Telugu, or Bengali."""
    return await TranslationService.translate(payload.text, payload.target_lang)
