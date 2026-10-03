"""
Health Tips API Router.
"""

import uuid
from fastapi import APIRouter, Query
from typing import List, Dict, Any

from app.dependencies import DBSession, CurrentUser
from app.services.tips_service import TipsService

router = APIRouter(prefix="/tips", tags=["Personalized Daily Health Tips"])


@router.get("/daily", response_model=List[Dict[str, Any]])
async def get_daily_tips(
    db: DBSession,
    current_user: CurrentUser,
    conversation_id: uuid.UUID | None = Query(default=None),
):
    """Return tips tied to the latest assessment, or a specific conversation assessment."""
    return await TipsService.get_daily_tips(db, current_user, conversation_id)
