"""
Prediction Pydantic schemas — matches the frontend FullPredictionReport TypeScript types exactly.
"""

from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional
from uuid import UUID


# ─── Individual Sub-Structures ───────────────────────────────────────────────

class DiseasePredictionOut(BaseModel):
    prediction_id: str = Field(..., alias="predictionId")
    conversation_id: str = Field(..., alias="conversationId")
    predicted_disease: str = Field(..., alias="predictedDisease")
    confidence_score: float = Field(..., alias="confidenceScore")
    prediction_model: str = Field(..., alias="predictionModel")
    predicted_at: str = Field(..., alias="predictedAt")

    model_config = {"populate_by_name": True, "from_attributes": True}

    @classmethod
    def from_orm(cls, pred) -> "DiseasePredictionOut":
        return cls(
            predictionId=str(pred.prediction_id),
            conversationId=str(pred.conversation_id),
            predictedDisease=pred.predicted_disease,
            # Ensure float conversion
            confidenceScore=float(pred.confidence_score),
            predictionModel=pred.prediction_model,
            predictedAt=pred.predicted_at.isoformat()
        )


class DifferentialDisease(BaseModel):
    disease_name: str = Field(..., alias="diseaseName")
    confidence_score: float = Field(..., alias="confidenceScore")
    is_top_match: bool = Field(False, alias="isTopMatch")
    description: Optional[str] = None
    category: Optional[str] = None

    model_config = {"populate_by_name": True}


class ShapExplanationOut(BaseModel):
    shap_id: str = Field(..., alias="shapId")
    prediction_id: str = Field(..., alias="predictionId")
    feature_name: str = Field(..., alias="featureName")
    plain_language_label: str = Field(..., alias="plainLanguageLabel")
    contribution_score: float = Field(..., alias="contributionScore")

    model_config = {"populate_by_name": True, "from_attributes": True}

    @classmethod
    def from_orm(cls, shap) -> "ShapExplanationOut":
        return cls(
            shapId=str(shap.shap_id),
            predictionId=str(shap.prediction_id),
            featureName=shap.feature_name,
            plainLanguageLabel=shap.plain_language_label or shap.feature_name.replace("_", " ").capitalize(),
            contribution_score=float(shap.contribution_score)
        )


class SeverityAssessmentOut(BaseModel):
    assessment_id: str = Field(..., alias="assessmentId")
    prediction_id: str = Field(..., alias="predictionId")
    # "low" | "moderate" | "high" | "emergency"
    severity: str
    urgency_level: str = Field(..., alias="urgencyLevel")
    emergency_flag: bool = Field(..., alias="emergencyFlag")
    explanation: Optional[str] = None

    model_config = {"populate_by_name": True, "from_attributes": True}

    @classmethod
    def from_orm(cls, sev) -> "SeverityAssessmentOut":
        return cls(
            assessmentId=str(sev.assessment_id),
            predictionId=str(sev.prediction_id),
            severity=sev.severity,
            urgencyLevel=sev.urgency_level,
            emergencyFlag=sev.emergency_flag,
            explanation=sev.explanation
        )


# ─── Aggregated Report ────────────────────────────────────────────────────────

class FullPredictionReportOut(BaseModel):
    prediction: DiseasePredictionOut
    differential: List[DifferentialDisease]
    shapExplanations: List[ShapExplanationOut] = Field(..., alias="shapExplanations")
    severityAssessment: SeverityAssessmentOut = Field(..., alias="severityAssessment")
    recommendedSpecialistCategory: Optional[str] = Field(None, alias="recommendedSpecialistCategory")

    model_config = {"populate_by_name": True}


# ─── Inputs ───────────────────────────────────────────────────────────────────

class PredictionCreateRequest(BaseModel):
    conversation_id: UUID = Field(..., alias="conversationId")

    model_config = {"populate_by_name": True}
