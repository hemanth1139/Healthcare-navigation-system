"""
Main API v1 router — aggregates all sub-routers.
Routers for phases not yet implemented are added as stubs.
"""

from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.profile import router as profile_router
from app.api.v1.conversations import router as conversations_router
from app.api.v1.predictions import router as predictions_router
from app.api.v1.hospitals import router as hospitals_router
from app.api.v1.schemes import router as schemes_router
from app.api.v1.records import router as records_router
from app.api.v1.tips import router as tips_router
from app.api.v1.dashboard import router as dashboard_router
from app.api.v1.history import router as history_router
from app.api.v1.settings import router as settings_router
from app.api.v1.guardrails import router as guardrails_router
from app.api.v1.activity_logs import router as activity_logs_router

api_router = APIRouter()

# ─── Phase 2 ─────────────────────────────────────────────────────────────────
api_router.include_router(auth_router)

# ─── Phase 3 ─────────────────────────────────────────────────────────────────
api_router.include_router(profile_router)

# ─── Phase 4 ─────────────────────────────────────────────────────────────────
api_router.include_router(conversations_router)

# ─── Phase 5 (Rule-Based Disease Prediction) ──────────────────────────────
api_router.include_router(predictions_router)

# ─── Phase 6 ─────────────────────────────────────────────────────────────────
api_router.include_router(hospitals_router)

# ─── Phase 7 ─────────────────────────────────────────────────────────────────
api_router.include_router(schemes_router)

# ─── Phase 8 ─────────────────────────────────────────────────────────────────
api_router.include_router(records_router)

# ─── Phase 9 ────────────────────────────────────────────────────────────────
api_router.include_router(tips_router)

# ─── Phase 10 ────────────────────────────────────────────────────────────────
api_router.include_router(dashboard_router)
api_router.include_router(history_router)
api_router.include_router(settings_router)
api_router.include_router(guardrails_router)
api_router.include_router(activity_logs_router)
