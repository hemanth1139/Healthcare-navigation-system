# HealthCare Navigator - Backend Phase 1 Report
**Module:** Project Scaffold & Database Setup  
**Stack:** FastAPI, SQLAlchemy 2.0 (Async), Alembic, Pydantic v2, PostgreSQL/SQLite Compatibility  

---

## Executive Summary
This document provides a detailed step-by-step record of the implementation of Phase 1: Project Scaffold & Database Setup for **HealthCare Navigator**. This phase establishes the core FastAPI application entrypoint, asynchronous database connection layer, configuration management via environment variables, custom HTTP error classes, and declarative ORM models mapping all 19 target tables using database-agnostic types to support both SQLite (local development) and PostgreSQL (production).

---

## Detailed Step-by-Step Breakdown

### Step 1: Directory Setup & Dependencies
- **Project Structure**: Initialized the backend skeleton inside `backend/` containing `app/` (with subdirectories for `api/v1/`, `core/`, `models/`, `schemas/`, `services/`, `utils/`, `agents/`, `ml/`, `rag/`, `privacy/`, `fhir/`), `tests/`, `scripts/`, and config files (`requirements-phase1.txt`, `.env`, `.gitignore`).
- **Dependencies Configured**:
  - `fastapi` & `uvicorn`: ASGI web framework and server.
  - `pydantic` & `pydantic-settings`: Type-safe configuration settings and schemas.
  - `sqlalchemy` (with `asyncio` extension) & `asyncpg` / `psycopg[binary]`: Asynchronous database support.
  - `alembic`: DB migration tool.

### Step 2: Configuration & Database Entrypoints
- **[app/config.py](file:///b:/Semester-7/Project%20Phase-1/Project/Healthcare-navigation-system/backend/app/config.py)**: Built global settings using Pydantic `BaseSettings` reading from `.env` with strict type validation.
- **[app/core/database.py](file:///b:/Semester-7/Project%20Phase-1/Project/Healthcare-navigation-system/backend/app/core/database.py)**: Configured an async database engine. Added conditional connection parameters to ignore connection pooling attributes when running against SQLite, ensuring seamless local development without local PostgreSQL setup.
- **[app/dependencies.py](file:///b:/Semester-7/Project%20Phase-1/Project/Healthcare-navigation-system/backend/app/dependencies.py)**: Created the `get_db` async session generator dependency to handle transaction commits and rollbacks automatically.

### Step 3: ORM Declarative Models Mapping (19 Tables)
Integrated all database tables into SQLAlchmey 2.0 model structures under `app/models/` using database-agnostic types:
1. **[user.py](file:///b:/Semester-7/Project%20Phase-1/Project/Healthcare-navigation-system/backend/app/models/user.py)**: `users` table for auth credentials, refresh tokens, resets, preferences.
2. **[profile.py](file:///b:/Semester-7/Project%20Phase-1/Project/Healthcare-navigation-system/backend/app/models/profile.py)**: `patient_profiles`, `allergies`, `chronic_conditions`, and `medications` tables with cascade delete mappings.
3. **[conversation.py](file:///b:/Semester-7/Project%20Phase-1/Project/Healthcare-navigation-system/backend/app/models/conversation.py)**: `conversations` and `conversation_messages` tables.
4. **[prediction.py](file:///b:/Semester-7/Project%20Phase-1/Project/Healthcare-navigation-system/backend/app/models/prediction.py)**: `disease_predictions`, `shap_explanations`, `severity_assessments`, `specialist_recommendations`, and `health_tips` tables.
5. **[hospital.py](file:///b:/Semester-7/Project%20Phase-1/Project/Healthcare-navigation-system/backend/app/models/hospital.py)**: `hospitals` cache and `hospital_recommendations` link tables.
6. **[scheme.py](file:///b:/Semester-7/Project%20Phase-1/Project/Healthcare-navigation-system/backend/app/models/scheme.py)**: `government_schemes` and `scheme_queries` tables.
7. **[record.py](file:///b:/Semester-7/Project%20Phase-1/Project/Healthcare-navigation-system/backend/app/models/record.py)**: `medical_records` storing FHIR metadata and Cloudinary URLs.
8. **[audit.py](file:///b:/Semester-7/Project%20Phase-1/Project/Healthcare-navigation-system/backend/app/models/audit.py)**: `guardrail_logs` and `activity_logs` tables.

*Note: Migrated all models from PG-specific `UUID` and `JSONB` dialects to SQLAlchemy `UUID` and `JSON` classes to enable SQLite execution without compile-time database syntax errors.*

---

## Verification & Testing
- Created **[scripts/create_tables.py](file:///b:/Semester-7/Project%20Phase-1/Project/Healthcare-navigation-system/backend/scripts/create_tables.py)** to execute full ORM metadata generation.
- Verified database setup by running `python scripts/create_tables.py` against a local SQLite database, resulting in a successful schema compilation and file creation (`healthcare_db.db`).
