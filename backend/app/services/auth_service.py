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
    ForgotPasswordRequest, ResetPasswordRequest, ChangePasswordRequest,
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
    user.refresh_token_hash = _hash_token(refresh_token)
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

        # Create user (auto-verified for smooth instant login)
        user = User(
            full_name=payload.full_name,
            email=payload.email,
            phone=payload.phone,
            password_hash=hash_password(payload.password),
            is_verified=True,
        )
        db.add(user)
        await db.flush()  # Get user_id before committing

        # Auto-create empty patient profile
        profile = PatientProfile(user_id=user.user_id)
        db.add(profile)

        response = _build_auth_response(user, "Account created successfully.")
        await db.commit()
        return response

    @staticmethod
    async def login(db: AsyncSession, payload: LoginRequest) -> AuthResponse:
        """Authenticate user credentials and return JWT token pair."""
        result = await db.execute(select(User).where(User.email == payload.email))
        user = result.scalar_one_or_none()

        if not user or not verify_password(payload.password, user.password_hash):
            raise AuthError("Incorrect email address or password. Please try again.")

        response = _build_auth_response(user, "Login successful")
        await db.commit()
        return response

    @staticmethod
    async def login_with_google(db: AsyncSession, credential: str) -> AuthResponse:
        """
        Verify Google ID token, resolve user identity, link or create user, and issue JWT tokens.
        """
        import httpx
        from app.config import settings

        google_user_info = None

        # 1. Verify token with Google public tokeninfo API
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(f"https://oauth2.googleapis.com/tokeninfo?id_token={credential}")
                if res.status_code == 200:
                    google_user_info = res.json()
        except Exception as e:
            print(f"[WARN] Google tokeninfo verification network error: {e}")

        # Fallback: if google-auth library is available
        if not google_user_info:
            try:
                from google.oauth2 import id_token
                from google.auth.transport import requests as google_requests

                req = google_requests.Request()
                google_user_info = id_token.verify_oauth2_token(
                    credential, req, settings.GOOGLE_CLIENT_ID or None
                )
            except Exception as e:
                print(f"[WARN] google-auth verify error: {e}")

        if not google_user_info or "email" not in google_user_info:
            raise AuthError("Google authentication failed. Invalid or expired Google token.", "GOOGLE_TOKEN_INVALID")

        email = google_user_info["email"].lower().strip()
        google_id = str(google_user_info.get("sub", ""))
        full_name = google_user_info.get("name") or email.split("@")[0].capitalize()

        # 2. Check if user already exists by google_id or email
        result = await db.execute(
            select(User).where((User.google_id == google_id) | (User.email == email))
        )
        user = result.scalar_one_or_none()

        if user:
            # Link Google ID if not previously linked
            if not user.google_id and google_id:
                user.google_id = google_id
            user.is_verified = True
            msg = "Google login successful"
        else:
            # Create new user
            random_pw = secrets.token_urlsafe(32)
            user = User(
                full_name=full_name,
                email=email,
                password_hash=hash_password(random_pw),
                google_id=google_id,
                is_verified=True,
            )
            db.add(user)
            await db.flush()

            # Auto-create empty patient profile
            profile = PatientProfile(user_id=user.user_id)
            db.add(profile)
            msg = "Google account registered and logged in successfully."

        response = _build_auth_response(user, msg)
        await db.commit()
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
        await db.commit()
        return response

    @staticmethod
    async def logout(db: AsyncSession, user: User) -> dict:
        """Invalidate the user's refresh token."""
        user.refresh_token_hash = None
        await db.commit()
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

    @staticmethod
    async def change_password(db: AsyncSession, user: User, payload: ChangePasswordRequest) -> dict:
        """Verify current password and update to new password for authenticated user."""
        if not verify_password(payload.current_password, user.password_hash):
            raise AuthError("Current password is incorrect.", "INVALID_CURRENT_PASSWORD")

        user.password_hash = hash_password(payload.new_password)
        user.refresh_token_hash = None
        await db.commit()
        return {"message": "Password changed successfully."}

    @staticmethod
    async def delete_account(db: AsyncSession, user: User) -> dict:
        """Permanently delete authenticated user and cascade to clinical profiles/records."""
        await db.delete(user)
        await db.commit()
        return {"message": "User account and all associated records permanently deleted."}

