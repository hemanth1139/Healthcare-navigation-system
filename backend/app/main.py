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


from sqlalchemy import select
from app.models.scheme import GovernmentScheme

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events."""
    print(f"[START] Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    print(f"   Environment : {settings.APP_ENV}")
    print(f"   API Base    : /api/v1")

    # Initialize tables
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("[SUCCESS] Database tables verified / created successfully.")
    except Exception as e:
        print(f"[WARN] Database initialization error: {e}")

    # Check and seed schemes & demo user automatically if needed
    try:
        from app.core.database import async_sessionmaker, AsyncSession
        from app.models.user import User
        from app.models.profile import PatientProfile
        from app.core.security import hash_password

        Session = async_sessionmaker(bind=engine, class_=AsyncSession)
        async with Session() as db:
            res = await db.execute(select(GovernmentScheme).limit(1))
            if not res.scalar_one_or_none():
                print("[INFO] Database empty. Automatically seeding healthcare_schemes.json...")
                from scripts.seed_schemes import seed
                await seed()

            # Seed Quick Demo user (sarah@example.com) if missing
            user_res = await db.execute(select(User).where(User.email == "sarah@example.com"))
            demo_user = user_res.scalar_one_or_none()
            if not demo_user:
                print("[INFO] Creating Quick Demo user (sarah@example.com)...")
                demo_user = User(
                    full_name="Sarah Jenkins",
                    email="sarah@example.com",
                    password_hash=hash_password("password123"),
                    phone="+1234567890",
                    role="PATIENT",
                    is_verified=True,
                )
                db.add(demo_user)
                await db.flush()

                profile = PatientProfile(
                    user_id=demo_user.user_id,
                    gender="Female",
                    blood_group="O+",
                    height_cm=165.0,
                    weight_kg=60.0,
                    address="123 Health Ave",
                    city="Boston",
                    state="MA",
                    pincode="02115",
                )
                db.add(profile)
                await db.commit()
                print("[SUCCESS] Quick Demo user sarah@example.com created successfully.")
    except Exception as e:
        print(f"[WARN] Automatic seeding check failed: {e}")

    yield
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
