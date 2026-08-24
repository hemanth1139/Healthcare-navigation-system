# HealthCare Navigator - Backend Phase 10 Report
**Module:** Dashboard, History, Guardrails & Settings  
**Stack:** FastAPI, Guardrails Agent, SQLAlchemy 2.0, Pydantic v2  

---

## Executive Summary
This document provides a detailed step-by-step record of the implementation of Phase 10: Dashboard, History, Guardrails & Settings for **HealthCare Navigator**. This phase delivers user preference settings, home dashboard metric aggregations, history audit logging, and input/output query guardrails blocking non-medical inputs (such as general programming requests).

---

## Detailed Step-by-Step Breakdown

### Step 1: Input Guardrails Agent
- **[app/agents/guardrail_agent.py](file:///b:/Semester-7/Project%20Phase-1/Project/Healthcare-navigation-system/backend/app/agents/guardrail_agent.py)**:
  - Developed `validate_query()`: analyzes user inputs for safety and alignment with clinical/medical contexts.
  - Intercepts adversarial or non-medical prompts (such as "write code in python") using static string checks and returns a safety refusal message, with optional Gemini LLM context classifiers.

### Step 2: Dashboard Statistics & Audits
- **[app/api/v1/dashboard.py](file:///b:/Semester-7/Project%20Phase-1/Project/Healthcare-navigation-system/backend/app/api/v1/dashboard.py)**: Exposes `GET /api/v1/dashboard` compiling counts of user conversation sessions, diagnostic record uploads, previous predictions, and latest diagnosed symptoms.
- **[app/api/v1/history.py](file:///b:/Semester-7/Project%20Phase-1/Project/Healthcare-navigation-system/backend/app/api/v1/history.py)**: Exposes `GET /api/v1/history` returning full chronological lists of predictions.
- **[app/api/v1/activity_logs.py](file:///b:/Semester-7/Project%20Phase-1/Project/Healthcare-navigation-system/backend/app/api/v1/activity_logs.py)**: Exposes `GET /api/v1/activity-logs` pulling user audit logging entries from the SQLite/PostgreSQL `activity_logs` table (e.g. login updates, profile modifications).

### Step 3: Settings Preferences & Router Wiring
- **[app/api/v1/settings.py](file:///b:/Semester-7/Project%20Phase-1/Project/Healthcare-navigation-system/backend/app/api/v1/settings.py)**: Exposes endpoints to query and update user UI settings (language, dark theme, notifications).
- **[app/api/v1/router.py](file:///b:/Semester-7/Project%20Phase-1/Project/Healthcare-navigation-system/backend/app/api/v1/router.py)**: Exposes all endpoints by registering Phase 10 routers.

---

## Verification & Testing
- Integrated integration tests in **[tests/test_phase10.py](file:///b:/Semester-7/Project%20Phase-1/Project/Healthcare-navigation-system/backend/tests/test_phase10.py)** verifying:
  - Guardrail checks block coding prompts with appropriate safety guidelines, while passing symptom logs.
  - Dashboard reports valid counts.
  - Setting update payload stores theme preferences.
  - Activity logs endpoints fetch user audit entries.
- Execution command: `python -m pytest tests/test_phase10.py -v` (PASSED).
