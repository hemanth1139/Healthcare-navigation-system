"""
Render / Uvicorn fallback entrypoint.
Allows running either `uvicorn app.main:app` or `uvicorn api:app`.
"""

from app.main import app

__all__ = ["app"]
