# HealthCare Navigator - Backend Phase 5 Report
**Module:** Disease Prediction & SHAP Explainability  
**Stack:** FastAPI, SQLAlchemy 2.0, XGBoost, SHAP, Scikit-Learn, Pydantic v2  

---

## Executive Summary
This document provides a detailed step-by-step record of the implementation of Phase 5: Disease Prediction & SHAP Explainability for **HealthCare Navigator**. This phase delivers an ML disease prediction pipeline, SHAP local feature importance explanations, LLM-based severity classification, and clinical specialist mapping.

---

## Detailed Step-by-Step Breakdown

### Step 1: Model Setup & In-Memory Classifier
- **[app/ml/xgboost_model.py](file:///b:/Semester-7/Project%20Phase-1/Project/Healthcare-navigation-system/backend/app/ml/xgboost_model.py)**:
  - Configured clinical feature vector mapping 18 common symptoms to top diagnostic disease categories.
  - Implemented `ensure_model_exists()`: automatically trains a multi-class `XGBClassifier` using synthetic clinical correlations on the first run, saving the `.pkl` artifacts. This prevents build failures due to missing compiler tools.
  - Built `symptoms_to_vector()` and `predict()` to convert user symptoms into binary arrays, query probability distributions, and return differential rankings.

### Step 2: Explainable AI & Severity Assessment Agents
- **[app/ml/shap_explainer.py](file:///b:/Semester-7/Project%20Phase-1/Project/Healthcare-navigation-system/backend/app/ml/shap_explainer.py)**:
  - Created a local explainer using `shap.TreeExplainer` on the loaded XGBoost model.
  - Formatted output feature metrics into human-readable plain language descriptions (e.g. "Pain radiating to left arm", "Absence of nausea").
- **[app/agents/severity_agent.py](file:///b:/Semester-7/Project%20Phase-1/Project/Healthcare-navigation-system/backend/app/agents/severity_agent.py)**:
  - Configured prompt models evaluating predictions and confidence coefficients.
  - Categorizes urgency levels (low, moderate, high, emergency) and issues safety warnings, with rule-based safety fallbacks if no LLM key is configured.
- **[app/agents/specialist_agent.py](file:///b:/Semester-7/Project%20Phase-1/Project/Healthcare-navigation-system/backend/app/agents/specialist_agent.py)**:
  - Maps disease outputs to medical specialist categories (e.g. Cardiologist for ACS, Gastroenterologist for GERD) with clinical reasoning.

### Step 3: API Integration & Service Layer
- **[app/schemas/prediction.py](file:///b:/Semester-7/Project%20Phase-1/Project/Healthcare-navigation-system/backend/app/schemas/prediction.py)**: Built Pydantic serializations matching frontend types (`DifferentialDisease`, `ShapExplanationOut`, `SeverityAssessmentOut`, and `FullPredictionReportOut`).
- **[app/services/prediction_service.py](file:///b:/Semester-7/Project%20Phase-1/Project/Healthcare-navigation-system/backend/app/services/prediction_service.py)**:
  - Built `create_prediction()`: parses conversation symptoms, queries the predictor and explainer, executes severity and specialist logic, saves results, and returns the report.
  - Refactored object construction to utilize local references instead of accessing un-loaded SQLAlchemy relationships, preventing lazy-loading `MissingGreenlet` exceptions during async execution.
- **[app/api/v1/predictions.py](file:///b:/Semester-7/Project%20Phase-1/Project/Healthcare-navigation-system/backend/app/api/v1/predictions.py)**: Exposed 7 REST routes.
- **[app/api/v1/router.py](file:///b:/Semester-7/Project%20Phase-1/Project/Healthcare-navigation-system/backend/app/api/v1/router.py)**: Registered the predictions router.

---

## Verification & Testing
- Integrated integration tests in **[tests/test_predictions.py](file:///b:/Semester-7/Project%20Phase-1/Project/Healthcare-navigation-system/backend/tests/test_predictions.py)** verifying:
  - Invoking predictions from chest pain symptom logs returns "Acute Coronary Syndrome".
  - Verifying the presence of the differential array, SHAP impact factors (with plain text labels), and recommended cardiologist category.
  - Listing previous diagnostics and retrieving specific details by ID.
- Execution command: `python -m pytest tests/test_predictions.py -v` (PASSED).
