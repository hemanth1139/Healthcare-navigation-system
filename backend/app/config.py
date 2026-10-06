"""
Application Configuration — loaded from .env via Pydantic BaseSettings
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from typing import Literal


import os

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".env")),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ─── Application ──────────────────────────────────────────────────────────
    APP_ENV: Literal["development", "production", "test"] = "development"
    APP_NAME: str = "Healthcare Navigation System"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # ─── Security ─────────────────────────────────────────────────────────────
    SECRET_KEY: str = "CHANGE_THIS_SECRET_KEY_IN_PRODUCTION"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ─── Database ─────────────────────────────────────────────────────────────
    DATABASE_URL: str = "sqlite+aiosqlite:///./healthcare_db.db"
    DATABASE_ECHO: bool = False

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: str) -> str:
        """
        Normalize PostgreSQL URLs from providers like Render, Heroku, Supabase:
        Converts 'postgres://' or 'postgresql://' into 'postgresql+asyncpg://'.
        """
        if isinstance(v, str):
            if v.startswith("postgres://"):
                return v.replace("postgres://", "postgresql+asyncpg://", 1)
            elif v.startswith("postgresql://") and not v.startswith("postgresql+"):
                return v.replace("postgresql://", "postgresql+asyncpg://", 1)
        return v


    # ─── LLM Providers ────────────────────────────────────────────────────────
    # Gemini for RAG, scheme queries, and general AI tasks
    GOOGLE_API_KEY: str = ""
    GOOGLE_API_KEY_2: str = ""
    GOOGLE_API_KEY_3: str = ""
    GOOGLE_API_KEY_4: str = ""
    GOOGLE_API_KEY_5: str = ""
    PRIMARY_LLM_PROVIDER: str = "gemini"
    GEMINI_MODEL: str = "gemini-3.5-flash"
    GEMINI_EMBEDDING_MODEL: str = "gemini-embedding-001"
    
    # Groq for symptom assessment only (fast, free tier)
    GROQ_API_KEY: str = ""
    GROQ_API_KEY_2: str = ""
    GROQ_API_KEY_3: str = ""
    GROQ_API_KEY_4: str = ""
    GROQ_API_KEY_5: str = ""
    GROQ_MODEL: str = "openai/gpt-oss-120b"

    # ─── Google OAuth 2.0 ─────────────────────────────────────────────────────
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""


    # ─── RAG Vector Store ────────────────────────────────────────────────────
    VECTOR_STORE_DIRECTORY: str = "./app/rag/vector_store"

    # ─── Email ────────────────────────────────────────────────────────────────
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_NAME: str = "Healthcare Navigator"

    # ─── Frontend (CORS) ──────────────────────────────────────────────────────
    FRONTEND_URL: str = "http://localhost:3000"

    # ─── LangSmith (Optional) ─────────────────────────────────────────────────
    LANGCHAIN_TRACING_V2: bool = False
    LANGCHAIN_API_KEY: str = ""
    LANGCHAIN_PROJECT: str = "healthcare-navigator"


# Global settings singleton — import this everywhere
settings = Settings()
