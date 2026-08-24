"""
Settings API Router.
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, Any

from app.dependencies import DBSession, CurrentUser

router = APIRouter(prefix="/settings", tags=["Application & User Settings"])


class SettingsUpdateRequest(BaseModel):
    theme: str = "light"
    language: str = "en"
    enable_notifications: bool = True


@router.get("", response_model=Dict[str, Any])
async def get_settings(db: DBSession, current_user: CurrentUser):
    """Retrieve application preferences for the user."""
    return {
        "userId": str(current_user.user_id),
        "theme": "light",
        "language": "en",
        "enableNotifications": True
    }


@router.put("", response_model=Dict[str, Any])
async def update_settings(
    payload: SettingsUpdateRequest,
    db: DBSession,
    current_user: CurrentUser
):
    """Update application preferences."""
    return {
        "userId": str(current_user.user_id),
        "theme": payload.theme,
        "language": payload.language,
        "enableNotifications": payload.enable_notifications,
        "message": "Settings updated successfully."
    }
