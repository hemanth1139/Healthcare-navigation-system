"""
Healthcare Navigation System — FastAPI Application Entry Point
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os
import math

from app.config import settings
from app.core.database import engine, Base
from app.api.v1.router import api_router
from app.rag.embeddings import EmbeddingService
from app.rag.pipeline import _get_vector_store, _load_all_schemes, _vector_store


from sqlalchemy import select
from app.models.scheme import GovernmentScheme

def get_preloaded_vector_store():
    """Get the pre-loaded vector store instance."""
    return _vector_store_instance

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

    # Pre-load Vector Store for performance
    try:
        print("[INFO] Pre-loading RAG vector store...")
        vector_store = _get_vector_store()
        if vector_store and vector_store.documents:
            print(f"[SUCCESS] Vector store loaded with {len(vector_store.documents)} chunks")
        else:
            print("[WARN] Vector store empty or failed to load")
    except Exception as e:
        print(f"[WARN] Vector store pre-loading failed: {e}")

    # Pre-load Embedding Model for performance
    global _embedding_model_loaded
    try:
        print("[INFO] Pre-loading SentenceTransformers embedding model...")
        from app.rag.embeddings import _get_sentence_model
        model = _get_sentence_model()
        if model:
            _embedding_model_loaded = True
            print("[SUCCESS] Embedding model loaded successfully")
        else:
            print("[WARN] Embedding model failed to load (will use Gemini or fallback)")
    except Exception as e:
        print(f"[WARN] Embedding model pre-loading failed: {e}")

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
    allow_origins=["*", settings.FRONTEND_URL, "http://localhost:3000"],
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


@app.get("/api/v1/health/rag", tags=["Health"])
async def rag_health_check():
    """Check that the RAG vector store, embeddings, and retrieval are operational."""
    checks = {
        "vector_store_loaded": False,
        "embeddings_working": False,
        "search_returns_results": False,
    }
    details = {}

    try:
        vector_store = _get_vector_store()
        checks["vector_store_loaded"] = bool(vector_store.documents)
        details["document_count"] = len(vector_store.documents)
        if not vector_store.documents:
            details["vector_store"] = "No indexed documents are loaded."
        else:
            query = "government healthcare scheme benefits and eligibility"
            embedding = await EmbeddingService.get_embedding(query)
            first_document_embedding = vector_store.documents[0].get("embedding", [])
            checks["embeddings_working"] = bool(embedding) and bool(first_document_embedding) and (
                len(embedding) == len(first_document_embedding)
            ) and any(value != 0 for value in embedding) and all(
                isinstance(value, (int, float)) and math.isfinite(value) for value in embedding
            )
            if checks["embeddings_working"]:
                details["embedding_dimension"] = len(embedding)
                results = vector_store.hybrid_search(embedding, query, k=1)
                checks["search_returns_results"] = bool(results)
                details["search_result_count"] = len(results)
    except Exception as exc:
        details["error"] = str(exc)

    healthy = all(checks.values())
    response = {
        "status": "healthy" if healthy else "degraded",
        "checks": checks,
        "details": details,
    }
    if not healthy:
        raise HTTPException(status_code=503, detail=response)
    return response
