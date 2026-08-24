"""
Authentication service — business logic for registration, login, token refresh, password reset.
"""

import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.user import User
from app.models.profile import PatientProfile
from app.schemas.auth import (
    RegisterRequest, LoginRequest, AuthResponse, UserOut, TokenPair,
    ForgotPasswordRequest, ResetPasswordRequest,
)
from app.core.security import (
    hash_password, verify_password,
    create_access_token, create_refresh_token, verify_refresh_token,
)
from app.core.exceptions import AuthError, ConflictError, NotFoundError, ValidationError
from app.utils.email import send_password_reset_email


def _hash_token(token: str) -> str:
    """SHA-256 hash a token before storing (never store raw tokens)."""
    return hashlib.sha256(token.encode()).hexdigest()


def _build_auth_response(user: User, message: str | None = None) -> AuthResponse:
    """Create access + refresh tokens and build the AuthResponse."""
    access_token = create_access_token(str(user.user_id))
    refresh_token = create_refresh_token(str(user.user_id))
    return AuthResponse(
        user=UserOut.from_orm_user(user),
        tokens=TokenPair(accessToken=access_token, refreshToken=refresh_token),
        message=message,
    )


class AuthService:

    @staticmethod
    async def register(db: AsyncSession, payload: RegisterRequest) -> AuthResponse:
        """Register a new user and auto-create an empty patient profile."""
        # Check email uniqueness
        result = await db.execute(select(User).where(User.email == payload.email))
        if result.scalar_one_or_none():
            raise ConflictError("An account with this email address already exists.")

        # Check phone uniqueness
        if payload.phone:
            result = await db.execute(select(User).where(User.phone == payload.phone))
            if result.scalar_one_or_none():
                raise ConflictError("An account with this phone number already exists.")

        # Create user
        user = User(
            full_name=payload.full_name,
            email=payload.email,
            phone=payload.phone,
            password_hash=hash_password(payload.password),
        )
        db.add(user)
        await db.flush()  # Get user_id before committing

        # Auto-create empty patient profile
        profile = PatientProfile(user_id=user.user_id)
        db.add(profile)

        response = _build_auth_response(user, "Account created successfully.")

        # Store hashed refresh token
        user.refresh_token_hash = _hash_token(response.tokens.refresh_token)

        return response

    @staticmethod
    async def login(db: AsyncSession, payload: LoginRequest) -> AuthResponse:
        """Authenticate user credentials and return JWT token pair."""
        result = await db.execute(select(User).where(User.email == payload.email))
        user = result.scalar_one_or_none()

        if not user or not verify_password(payload.password, user.password_hash):
            raise AuthError("Incorrect email address or password. Please try again.")

        response = _build_auth_response(user, "Login successful")
        user.refresh_token_hash = _hash_token(response.tokens.refresh_token)
        return response

    @staticmethod
    async def refresh(db: AsyncSession, refresh_token: str) -> AuthResponse:
        """Rotate the refresh token and issue a new access token."""
        user_id = verify_refresh_token(refresh_token)
        if not user_id:
            raise AuthError("Invalid or expired refresh token.", "TOKEN_INVALID")

        result = await db.execute(select(User).where(User.user_id == UUID(user_id)))
        user = result.scalar_one_or_none()
        if not user:
            raise AuthError("User not found.", "USER_NOT_FOUND")

        # Validate stored hash matches
        if user.refresh_token_hash != _hash_token(refresh_token):
            raise AuthError("Refresh token has been revoked.", "TOKEN_REVOKED")

        response = _build_auth_response(user)
        user.refresh_token_hash = _hash_token(response.tokens.refresh_token)
        return response

    @staticmethod
    async def logout(db: AsyncSession, user: User) -> dict:
        """Invalidate the user's refresh token."""
        user.refresh_token_hash = None
        return {"message": "Logged out successfully."}

    @staticmethod
    async def forgot_password(db: AsyncSession, payload: ForgotPasswordRequest) -> dict:
        """Generate a password reset token and send reset email."""
        result = await db.execute(select(User).where(User.email == payload.email))
        user = result.scalar_one_or_none()

        # Always return success to prevent email enumeration attacks
        if user:
            reset_token = secrets.token_urlsafe(32)
            user.reset_token_hash = _hash_token(reset_token)
            user.reset_token_expires = datetime.now(timezone.utc) + timedelta(hours=1)
            await send_password_reset_email(user.email, user.full_name, reset_token)

        return {"message": f"If an account exists for {payload.email}, a password reset link has been sent."}

    @staticmethod
    async def reset_password(db: AsyncSession, payload: ResetPasswordRequest) -> dict:
        """Validate reset token and update user password."""
        token_hash = _hash_token(payload.token)
        result = await db.execute(
            select(User).where(
                User.reset_token_hash == token_hash,
                User.reset_token_expires > datetime.now(timezone.utc),
            )
        )
        user = result.scalar_one_or_none()

        if not user:
            raise ValidationError("The password reset token is invalid or has expired.")

        user.password_hash = hash_password(payload.new_password)
        user.reset_token_hash = None
        user.reset_token_expires = None
        user.refresh_token_hash = None  # Force re-login

        return {"message": "Your password has been successfully reset. You can now log in."}

    @staticmethod
    async def verify_email(db: AsyncSession, token: str) -> dict:
        """Mark user email as verified."""
        # In production, use a signed email verification token
        # For now, use same pattern as password reset
        token_hash = _hash_token(token)
        result = await db.execute(select(User).where(User.reset_token_hash == token_hash))
        user = result.scalar_one_or_none()

        if not user:
            raise ValidationError("Invalid or expired email verification token.")

        user.is_verified = True
        user.reset_token_hash = None
        return {"message": "Email verified successfully."}
