"""
Shared FastAPI dependencies — injected into route handlers via Depends().
"""

from typing import Annotated
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import verify_access_token
from app.core.exceptions import AuthError
from app.models.user import User

# ─── Database Session ─────────────────────────────────────────────────────────
DBSession = Annotated[AsyncSession, Depends(get_db)]

# ─── JWT Bearer Scheme ────────────────────────────────────────────────────────
bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    db: DBSession,
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> User:
    """
    FastAPI dependency — extract and validate the JWT Bearer token,
    then return the authenticated User ORM object.

    Raises:
        AuthError: If token is missing, invalid, or user doesn't exist.
    """
    if not credentials or not credentials.credentials:
        raise AuthError("No authentication token provided", "TOKEN_MISSING")

    user_id = verify_access_token(credentials.credentials)
    if not user_id:
        raise AuthError("Invalid or expired token", "TOKEN_INVALID")

    result = await db.execute(select(User).where(User.user_id == UUID(user_id)))
    user = result.scalar_one_or_none()

    if not user:
        raise AuthError("User not found", "USER_NOT_FOUND")

    return user


# ─── Type Aliases ─────────────────────────────────────────────────────────────
CurrentUser = Annotated[User, Depends(get_current_user)]
