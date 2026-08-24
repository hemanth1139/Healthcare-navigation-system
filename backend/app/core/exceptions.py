"""
Custom HTTP exceptions for consistent error responses across the API.
"""

from fastapi import HTTPException, status


class AppError(HTTPException):
    """Base application exception with a structured detail payload."""
    def __init__(self, status_code: int, message: str, error_code: str = "APP_ERROR"):
        super().__init__(
            status_code=status_code,
            detail={"message": message, "error_code": error_code},
        )


class AuthError(AppError):
    """Authentication / authorization failures."""
    def __init__(self, message: str = "Authentication failed", error_code: str = "AUTH_ERROR"):
        super().__init__(status_code=status.HTTP_401_UNAUTHORIZED, message=message, error_code=error_code)


class ForbiddenError(AppError):
    """Resource access forbidden for this user."""
    def __init__(self, message: str = "Access forbidden", error_code: str = "FORBIDDEN"):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, message=message, error_code=error_code)


class NotFoundError(AppError):
    """Resource does not exist."""
    def __init__(self, resource: str = "Resource", error_code: str = "NOT_FOUND"):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            message=f"{resource} not found",
            error_code=error_code,
        )


class ConflictError(AppError):
    """Resource already exists (e.g. duplicate email)."""
    def __init__(self, message: str = "Resource already exists", error_code: str = "CONFLICT"):
        super().__init__(status_code=status.HTTP_409_CONFLICT, message=message, error_code=error_code)


class ValidationError(AppError):
    """Input validation failed beyond Pydantic schema."""
    def __init__(self, message: str, error_code: str = "VALIDATION_ERROR"):
        super().__init__(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, message=message, error_code=error_code)


class ServiceUnavailableError(AppError):
    """External service (LLM, Maps, Cloudinary) is unavailable."""
    def __init__(self, service: str = "External service", error_code: str = "SERVICE_UNAVAILABLE"):
        super().__init__(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            message=f"{service} is temporarily unavailable. Please try again later.",
            error_code=error_code,
        )
