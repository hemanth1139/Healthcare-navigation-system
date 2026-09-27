"""
Dashboard Summary API Router — unified patient healthcare summary.
"""

from fastapi import APIRouter
from app.dependencies import DBSession, CurrentUser
from app.schemas.dashboard import DashboardResponseOut
from app.services.dashboard_service import DashboardService

router = APIRouter(prefix="/dashboard", tags=["Unified Patient Dashboard"])


@router.get("", response_model=DashboardResponseOut)
async def get_dashboard_summary(db: DBSession, current_user: CurrentUser):
    """Retrieve unified aggregated summary metrics for the patient home dashboard."""
    return await DashboardService.get_dashboard_data(db=db, current_user=current_user)

