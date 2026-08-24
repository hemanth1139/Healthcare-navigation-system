"""
Auth Pydantic schemas — request/response shapes matching the frontend's TypeScript types.
"""

from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from uuid import UUID


# ─── Request Schemas ──────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100, alias="fullName")
    email: EmailStr
    phone: str = Field(..., min_length=10, max_length=15)
    password: str = Field(..., min_length=8, max_length=100)

    model_config = {"populate_by_name": True}


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8, alias="newPassword")

    model_config = {"populate_by_name": True}


class RefreshTokenRequest(BaseModel):
    refresh_token: str = Field(..., alias="refreshToken")

    model_config = {"populate_by_name": True}


class VerifyEmailRequest(BaseModel):
    token: str


# ─── Response Schemas ─────────────────────────────────────────────────────────

class UserOut(BaseModel):
    """Matches frontend's User TypeScript type."""
    id: str            # UUID as string
    email: str
    full_name: str = Field(..., alias="fullName")
    phone: str | None = None
    created_at: str = Field(..., alias="createdAt")

    model_config = {"populate_by_name": True, "from_attributes": True}

    @classmethod
    def from_orm_user(cls, user) -> "UserOut":
        return cls(
            id=str(user.user_id),
            email=user.email,
            fullName=user.full_name,
            phone=user.phone,
            createdAt=user.created_at.isoformat(),
        )


class TokenPair(BaseModel):
    """Matches frontend's tokens object shape."""
    access_token: str = Field(..., alias="accessToken")
    refresh_token: str = Field(..., alias="refreshToken")

    model_config = {"populate_by_name": True}


class AuthResponse(BaseModel):
    """
    Matches frontend's AuthResponse TypeScript type exactly:
    { user, tokens: { accessToken, refreshToken }, message? }
    """
    user: UserOut
    tokens: TokenPair
    message: str | None = None


class MessageResponse(BaseModel):
    """Simple message-only response."""
    message: str
