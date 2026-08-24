# HealthCare Navigator - Backend Phase 6 Report
**Module:** Hospital Recommendation  
**Stack:** FastAPI, Google Places API Wrapper, SQLAlchemy 2.0, Pydantic v2  

---

## Executive Summary
This document provides a detailed step-by-step record of the implementation of Phase 6: Hospital Recommendation for **HealthCare Navigator**. This phase delivers an endpoint to locate nearby hospital care facilities based on geographic coordinates, featuring automated distance calculations, drive time estimation, specialized medical care filtering, and local database caching to optimize performance.

---

## Detailed Step-by-Step Breakdown

### Step 1: Maps API Client & Distance Calculations
- **[app/utils/maps.py](file:///b:/Semester-7/Project%20Phase-1/Project/Healthcare-navigation-system/backend/app/utils/maps.py)**:
  - Built geodesic distance calculations using the Haversine trigonometric formula to evaluate kilometrical intervals between user coordinates and hospital markers.
  - Implemented `get_nearby_hospitals()`: integrated standard `googlemaps` Places client for live nearby queries.
  - Configured local clinic fallback dataset containing key coordinates, contacts, ratings, and drive-duration estimates (2.5 min per km urban traffic multiplier). This allows local development and test executions without requiring active Google API credentials.

### Step 2: Database Caching & Service Layer
- **[app/schemas/hospital.py](file:///b:/Semester-7/Project%20Phase-1/Project/Healthcare-navigation-system/backend/app/schemas/hospital.py)**: Defined input/output validation models matching the frontend properties (`HospitalNearbyRequest` and `HospitalOut` mapping properties like `has_emergency_room`).
- **[app/services/hospital_service.py](file:///b:/Semester-7/Project%20Phase-1/Project/Healthcare-navigation-system/backend/app/services/hospital_service.py)**:
  - Developed `get_nearby_hospitals()`: queries nearby facilities from the Maps wrapper, updates the `hospitals` cache table, and returns formatted outputs.
  - Developed `get_hospital_by_id()`: retrieves cached hospital information by ID.

### Step 3: API Integration
- **[app/api/v1/hospitals.py](file:///b:/Semester-7/Project%20Phase-1/Project/Healthcare-navigation-system/backend/app/api/v1/hospitals.py)**: Exposed 2 REST endpoints:
  - `POST /api/v1/hospitals/nearby` (Discover nearby hospitals and cache them)
  - `GET /api/v1/hospitals/{hospital_id}` (Retrieve hospital by ID)
- **[app/api/v1/router.py](file:///b:/Semester-7/Project%20Phase-1/Project/Healthcare-navigation-system/backend/app/api/v1/router.py)**: Registered the hospitals router.

---

## Verification & Testing
- Integrated integration tests in **[tests/test_hospitals.py](file:///b:/Semester-7/Project%20Phase-1/Project/Healthcare-navigation-system/backend/tests/test_hospitals.py)** verifying:
  - Fetching nearby hospitals centered around Kolkata returns a valid list of facilities.
  - Verifying the presence of critical parameters: `hospital_id`, `distance_km`, `estimated_time`, and list of `specialties`.
  - Fetching individual hospital details from the cache by ID.
- Execution command: `python -m pytest tests/test_hospitals.py -v` (PASSED).
