"""
Disease Prediction API router — /api/v1/predictions/* and severity endpoints.
"""

from uuid import UUID
from fastapi import APIRouter
from typing import List

from app.dependencies import DBSession, CurrentUser
from app.schemas.prediction import (
    PredictionCreateRequest, FullPredictionReportOut, DiseasePredictionOut,
    ShapExplanationOut, SeverityAssessmentOut,
)
from app.services.prediction_service import PredictionService

router = APIRouter(tags=["Disease Prediction & AI Diagnosis"])


@router.post("/predictions", response_model=FullPredictionReportOut, status_code=201)
async def create_prediction(
    payload: PredictionCreateRequest, db: DBSession, current_user: CurrentUser
):
    """Triggers disease prediction and SHAP calculations from a conversation."""
    return await PredictionService.create_prediction(db, current_user, payload.conversation_id)


@router.get("/predictions", response_model=List[DiseasePredictionOut])
async def list_predictions(db: DBSession, current_user: CurrentUser):
    """List all previous predictions for the current patient profile."""
    return await PredictionService.list_predictions(db, current_user)


@router.get("/predictions/{prediction_id}", response_model=FullPredictionReportOut)
async def get_prediction(
    prediction_id: UUID, db: DBSession, current_user: CurrentUser
):
    """Get the full diagnosis report details including differential and severity."""
    return await PredictionService.get_prediction(db, current_user, prediction_id)


@router.get("/predictions/{prediction_id}/explanation", response_model=List[ShapExplanationOut])
async def get_shap_explanation(
    prediction_id: UUID, db: DBSession, current_user: CurrentUser
):
    """Get the SHAP feature contribution list for this prediction."""
    return await PredictionService.get_shap_explanations(db, current_user, prediction_id)


@router.get("/predictions/{prediction_id}/specialist")
async def get_specialist(
    prediction_id: UUID, db: DBSession, current_user: CurrentUser
):
    """Get the specialist category and reasoning directly."""
    report = await PredictionService.get_prediction(db, current_user, prediction_id)
    return {
        "specialist": report.recommendedSpecialistCategory,
        "predictionId": str(prediction_id)
    }


# ─── Severity Router Endpoints ───────────────────────────────────────────────

@router.get("/severity/{prediction_id}", response_model=SeverityAssessmentOut)
async def get_severity(
    prediction_id: UUID, db: DBSession, current_user: CurrentUser
):
    """Fetch severity classification details for a prediction."""
    return await PredictionService.get_severity_assessment(db, current_user, prediction_id)


@router.post("/severity", response_model=SeverityAssessmentOut)
async def create_severity_direct(
    payload: PredictionCreateRequest, db: DBSession, current_user: CurrentUser
):
    """Fallback severity trigger endpoints (returns severity for prediction)."""
    # Since severity is auto-calculated on prediction, retrieve it directly
    predictions = await PredictionService.list_predictions(db, current_user)
    if not predictions:
        raise NotFoundError("Severity Assessment")
    latest_pred_id = UUID(predictions[0].prediction_id)
    return await PredictionService.get_severity_assessment(db, current_user, latest_pred_id)
