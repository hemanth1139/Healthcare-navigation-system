"""
Authentication API router — /api/v1/auth/*
"""

from fastapi import APIRouter, Request
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.dependencies import DBSession, CurrentUser
from app.schemas.auth import (
    RegisterRequest, LoginRequest, AuthResponse, MessageResponse,
    ForgotPasswordRequest, ResetPasswordRequest, RefreshTokenRequest, VerifyEmailRequest,
)
from app.services.auth_service import AuthService
from app.models.audit import ActivityLog

router = APIRouter(prefix="/auth", tags=["Authentication"])


def _get_ip(request: Request) -> str:
    return request.client.host if request.client else "unknown"


@router.post("/register", response_model=AuthResponse, status_code=201)
async def register(payload: RegisterRequest, db: DBSession, request: Request):
    """Register a new patient account."""
    response = await AuthService.register(db, payload)
    # Log activity
    db.add(ActivityLog(
        user_id=UUID(response.user.id),
        activity_type="REGISTER",
        description="New user registered",
        ip_address=_get_ip(request),
    ))
    return response


@router.post("/login", response_model=AuthResponse)
async def login(payload: LoginRequest, db: DBSession, request: Request):
    """Authenticate and receive JWT token pair."""
    response = await AuthService.login(db, payload)
    db.add(ActivityLog(
        user_id=UUID(response.user.id),
        activity_type="LOGIN",
        description="User logged in",
        ip_address=_get_ip(request),
    ))
    return response


@router.post("/refresh", response_model=AuthResponse)
async def refresh_token(payload: RefreshTokenRequest, db: DBSession):
    """Issue a new access token using a valid refresh token."""
    return await AuthService.refresh(db, payload.refresh_token)


@router.post("/logout", response_model=MessageResponse)
async def logout(db: DBSession, current_user: CurrentUser, request: Request):
    """Invalidate the current session's refresh token."""
    result = await AuthService.logout(db, current_user)
    db.add(ActivityLog(
        user_id=current_user.user_id,
        activity_type="LOGOUT",
        description="User logged out",
        ip_address=_get_ip(request),
    ))
    return result


@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(payload: ForgotPasswordRequest, db: DBSession):
    """Send a password reset email."""
    return await AuthService.forgot_password(db, payload)


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(payload: ResetPasswordRequest, db: DBSession):
    """Reset password using a valid reset token."""
    return await AuthService.reset_password(db, payload)


@router.post("/verify-email", response_model=MessageResponse)
async def verify_email(payload: VerifyEmailRequest, db: DBSession):
    """Verify user email address via token."""
    return await AuthService.verify_email(db, payload.token)
