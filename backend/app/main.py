"""
Healthcare Navigation System — FastAPI Application Entry Point
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os

from app.config import settings
from app.core.database import engine, Base
from app.api.v1.router import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events."""
    # Startup
    print(f"[START] Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    print(f"   Environment : {settings.APP_ENV}")
    print(f"   API Base    : /api/v1")
    yield
    # Shutdown
    print("[STOP] Shutting down Healthcare Navigator API")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "AI-Based Healthcare Navigation and Patient Assistance System. "
        "Provides conversational symptom assessment, disease prediction, "
        "specialist recommendation, hospital discovery, and government scheme eligibility."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# ─── CORS ────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routes ──────────────────────────────────────────────────────────────────
app.include_router(api_router, prefix="/api/v1")

# Mount uploads static folder (ensure directory exists first)
upload_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "uploads"))
if not os.path.exists(upload_dir):
    os.makedirs(upload_dir)
app.mount("/uploads", StaticFiles(directory=upload_dir), name="uploads")


# ─── Health Check ─────────────────────────────────────────────────────────────
@app.get("/api/v1/health", tags=["Health"])
async def health_check():
    """Liveness probe — returns 200 if the server is running."""
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.APP_ENV,
    }
