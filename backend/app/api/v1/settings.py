"""
Settings API Router.
"""

from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Dict, Any

from app.dependencies import DBSession, CurrentUser

router = APIRouter(prefix="/settings", tags=["Application & User Settings"])


class SettingsUpdateRequest(BaseModel):
    theme: str = Field(default="light", pattern="^(light|dark|system)$")
    language: str = Field(default="en", min_length=2, max_length=10)
    enable_notifications: bool = True


@router.get("", response_model=Dict[str, Any])
async def get_settings(db: DBSession, current_user: CurrentUser):
    """Retrieve application preferences for the user."""
    return {
        "userId": str(current_user.user_id),
        "theme": current_user.preferred_theme,
        "language": current_user.preferred_language,
        "enableNotifications": current_user.enable_notifications,
    }


@router.put("", response_model=Dict[str, Any])
async def update_settings(
    payload: SettingsUpdateRequest,
    db: DBSession,
    current_user: CurrentUser
):
    """Update application preferences."""
    current_user.preferred_theme = payload.theme
    current_user.preferred_language = payload.language
    current_user.enable_notifications = payload.enable_notifications
    await db.commit()
    await db.refresh(current_user)
    return {
        "userId": str(current_user.user_id),
        "theme": payload.theme,
        "language": payload.language,
        "enableNotifications": payload.enable_notifications,
        "message": "Settings updated successfully."
    }
