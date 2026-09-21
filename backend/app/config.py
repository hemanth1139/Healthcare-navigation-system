"""
Application Configuration — loaded from .env via Pydantic BaseSettings
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
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


    # ─── LLM Providers ────────────────────────────────────────────────────────
    GOOGLE_API_KEY: str = ""
    GROQ_API_KEY: str = ""
    PRIMARY_LLM_PROVIDER: Literal["gemini", "groq"] = "gemini"

    # ─── Google Maps ──────────────────────────────────────────────────────────
    GOOGLE_MAPS_API_KEY: str = ""

    # ─── Cloudinary ───────────────────────────────────────────────────────────
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""

    # ─── RAG / ChromaDB ───────────────────────────────────────────────────────
    CHROMA_PERSIST_DIRECTORY: str = "./app/rag/chroma_store"
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"

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
