# HealthCare Navigator - Backend Phase 7 Report
**Module:** Government Scheme RAG (Retrieval-Augmented Generation)  
**Stack:** FastAPI, Custom JSON-NumPy Vector DB, Google Gemini API, SQLAlchemy 2.0, Pydantic v2  

---

## Executive Summary
This document provides a detailed step-by-step record of the implementation of Phase 7: Government Healthcare Scheme RAG for **HealthCare Navigator**. This phase delivers a retrieval system that indexes government schemes (like Ayushman Bharat PM-JAY and CGHS), performs semantic searching, and feeds context snippets to Gemini to answer questions regarding medical eligibility, benefits, and coverage.

---

## Detailed Step-by-Step Breakdown

### Step 1: Embeddings & Vector Database
- **[app/rag/embeddings.py](file:///b:/Semester-7/Project%20Phase-1/Project/Healthcare-navigation-system/backend/app/rag/embeddings.py)**:
  - Generates 768-dimensional document vectors utilizing standard Google Generative AI Embeddings (`text-embedding-004`).
  - Configured a cryptographic `hashlib.md5`-based deterministic pseudo-embedding generator fallback for local development when GOOGLE_API_KEY is not configured. This ensures vector calculations and tests are process-independent.
- **[app/rag/vectorstore.py](file:///b:/Semester-7/Project%20Phase-1/Project/Healthcare-navigation-system/backend/app/rag/vectorstore.py)**:
  - Implemented a lightweight, binary-compiler-free JSON-backed vector database using NumPy to perform cosine similarity calculations. This bypasses the complex C++ building requirements of ChromaDB on Python 3.13.

### Step 2: RAG Pipeline & Database Logs
- **[app/rag/pipeline.py](file:///b:/Semester-7/Project%20Phase-1/Project/Healthcare-navigation-system/backend/app/rag/pipeline.py)**:
  - Developed `query()`: converts search inputs to vectors, executes similarity search on local indices, builds structured prompts with document context, and executes Gemini LLM generation.
- **[app/services/scheme_service.py](file:///b:/Semester-7/Project%20Phase-1/Project/Healthcare-navigation-system/backend/app/services/scheme_service.py)**:
  - Handles scheme listing, individual detail loading, and RAG execution (which logs the queries and references the matched scheme ID in the database).

### Step 3: API Integration & Seeding
- **[app/schemas/scheme.py](file:///b:/Semester-7/Project%20Phase-1/Project/Healthcare-navigation-system/backend/app/schemas/scheme.py)**: Defined Pydantic models matching the frontend properties (`RetrievedChunkOut` and `SchemeQueryOut`).
- **[app/api/v1/schemes.py](file:///b:/Semester-7/Project%20Phase-1/Project/Healthcare-navigation-system/backend/app/api/v1/schemes.py)**: Registered API routes:
  - `GET /api/v1/schemes`
  - `GET /api/v1/schemes/{scheme_id}`
  - `POST /api/v1/schemes/query`
- **[scripts/seed_schemes.py](file:///b:/Semester-7/Project%20Phase-1/Project/Healthcare-navigation-system/backend/scripts/seed_schemes.py)**: Created a seeding script to populate the SQLite database and index document chunks in the JSON vector store.

---

## Verification & Testing
- Integrated integration tests in **[tests/test_schemes.py](file:///b:/Semester-7/Project%20Phase-1/Project/Healthcare-navigation-system/backend/tests/test_schemes.py)** verifying:
  - Schemes listing retrieves seeded data.
  - Detail endpoints query database.
  - Executing Q&A query returns matching context blocks, source metadata, AI response details, and confidence levels.
- Execution command: `python -m pytest tests/test_schemes.py -v` (PASSED).
