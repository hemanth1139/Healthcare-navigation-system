"""
Activity Logs API Router.
"""

from fastapi import APIRouter
from sqlalchemy import select
from typing import List, Dict, Any

from app.dependencies import DBSession, CurrentUser
from app.models.audit import ActivityLog

router = APIRouter(prefix="/activity-logs", tags=["Activity logs & Audit trails"])


@router.get("", response_model=List[Dict[str, Any]])
async def get_activity_logs(db: DBSession, current_user: CurrentUser):
    """Retrieve security audit activity logs for the logged-in user."""
    result = await db.execute(
        select(ActivityLog)
        .where(ActivityLog.user_id == current_user.user_id)
        .order_by(ActivityLog.created_at.desc())
    )
    logs = result.scalars().all()
    
    return [
        {
            "activityId": str(log.activity_id),
            "userId": str(log.user_id),
            "activityType": log.activity_type,
            "description": log.description,
            "ipAddress": log.ip_address,
            "createdAt": log.created_at.isoformat()
        }
        for log in logs
    ]
