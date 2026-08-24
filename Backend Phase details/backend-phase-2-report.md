# HealthCare Navigator - Backend Phase 2 Report
**Module:** Authentication API  
**Stack:** FastAPI, SQLAlchemy 2.0, PyJWT (python-jose), Bcrypt, Pydantic v2  

---

## Executive Summary
This document provides a detailed step-by-step record of the implementation of Phase 2: Authentication API for **HealthCare Navigator**. This phase delivers all 7 JWT authentication routes matching the exact schema shapes requested by the frontend, implements token rotation, password hashing, and user activity logging.

---

## Detailed Step-by-Step Breakdown

### Step 1: Password & Token Security Logic
- **[app/core/security.py](file:///b:/Semester-7/Project%20Phase-1/Project/Healthcare-navigation-system/backend/app/core/security.py)**:
  - Implemented direct `bcrypt` password hashing and verification. Avoided old `passlib` bcrypt wrapping dependencies to achieve 100% compatibility under Python 3.13.1.
  - Implemented `create_access_token` (15-min expiry) and `create_refresh_token` (7-day expiry) using HMAC SHA-256 JWT tokens.
  - Created token validation helpers returning payload attributes.

### Step 2: Auth Schemas & Service layer
- **[app/schemas/auth.py](file:///b:/Semester-7/Project%20Phase-1/Project/Healthcare-navigation-system/backend/app/schemas/auth.py)**: Defined Pydantic models for request validation (`RegisterRequest`, `LoginRequest`, etc.) and response serialization (`AuthResponse` mapping the `UserOut` and `TokenPair` properties with frontend camelCase aliases).
- **[app/services/auth_service.py](file:///b:/Semester-7/Project%20Phase-1/Project/Healthcare-navigation-system/backend/app/services/auth_service.py)**:
  - Implemented `register()`: creates new `User` record with hashed password, hashes refresh tokens, and automatically creates an empty `PatientProfile` linking to the user (ensuring Phase 3 initialization).
  - Implemented `login()`: validates bcrypt password and returns a newly signed token pair.
  - Implemented `refresh()`: validates rotation, checks the hashed refresh token in database to prevent reuse, and returns a renewed token pair.
  - Implemented `logout()`, `forgot_password()`, and `reset_password()`.
- **[app/utils/email.py](file:///b:/Semester-7/Project%20Phase-1/Project/Healthcare-navigation-system/backend/app/utils/email.py)**: Built async email utility supporting password-reset template dispatching via SMTP with development print fallback.

### Step 3: Auth Router Integration
- **[app/api/v1/auth.py](file:///b:/Semester-7/Project%20Phase-1/Project/Healthcare-navigation-system/backend/app/api/v1/auth.py)**: Exposed routes:
  - `POST /api/v1/auth/register` (creates user + profile + logs audit entry)
  - `POST /api/v1/auth/login` (verifies credentials + logs audit entry)
  - `POST /api/v1/auth/refresh` (handles token rotation)
  - `POST /api/v1/auth/logout` (invalidates refresh token + logs audit entry)
  - `POST /api/v1/auth/forgot-password` / `POST /api/v1/auth/reset-password`
  - `POST /api/v1/auth/verify-email`
- **[app/dependencies.py](file:///b:/Semester-7/Project%20Phase-1/Project/Healthcare-navigation-system/backend/app/dependencies.py)**: Created `CurrentUser` extractor dependency utilizing JWT authorization headers and retrieving the ORM session user.

---

## Verification & Testing
- Integrated pytest test suite under **[tests/test_auth.py](file:///b:/Semester-7/Project%20Phase-1/Project/Healthcare-navigation-system/backend/tests/test_auth.py)** verifying:
  - User registration output fields (user object + JWT tokens).
  - Duplicate registration prevention (returns 409 conflict).
  - Successful credentials check upon login.
  - Token refresh and old session invalidation.
- Execution command: `python -m pytest tests/test_auth.py -v` (PASSED).
