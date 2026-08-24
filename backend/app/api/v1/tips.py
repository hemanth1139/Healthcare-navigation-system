"""
Health Tips API Router.
"""

from fastapi import APIRouter
from typing import List, Dict

from app.dependencies import DBSession, CurrentUser
from app.services.tips_service import TipsService

router = APIRouter(prefix="/tips", tags=["Personalized Daily Health Tips"])


@router.get("/daily", response_model=List[Dict[str, str]])
async def get_daily_tips(
    db: DBSession,
    current_user: CurrentUser
):
    """Retrieve personalized daily health tips based on chronic and age profile indicators."""
    return await TipsService.get_daily_tips(db, current_user)
