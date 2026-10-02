"""
Dashboard Pydantic schemas — unified patient healthcare summary response.
"""

from pydantic import BaseModel, Field
from typing import List, Optional


class PatientSummary(BaseModel):
    id: str
    full_name: str = Field(..., alias="fullName")
    email: str
    phone: Optional[str] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = Field(None, alias="bloodGroup")
    age: Optional[int] = None
    city: Optional[str] = None
    state: Optional[str] = None
    allergies: List[str] = Field(default_factory=list)
    chronic_conditions: List[str] = Field(default_factory=list, alias="chronicConditions")
    medications: List[str] = Field(default_factory=list)
    is_profile_completed: bool = Field(False, alias="isProfileCompleted")

    model_config = {"populate_by_name": True}


class LatestAssessment(BaseModel):
    prediction_id: str = Field(..., alias="predictionId")
    conversation_id: str = Field(..., alias="conversationId")
    predicted_disease: str = Field(..., alias="predictedDisease")
    confidence_score: float = Field(..., alias="confidenceScore")
    severity: str  # "low" | "moderate" | "high" | "emergency"
    urgency_level: str = Field(..., alias="urgencyLevel")
    emergency_flag: bool = Field(False, alias="emergencyFlag")
    explanation: Optional[str] = None
    specialist: Optional[str] = None
    assessed_at: str = Field(..., alias="assessedAt")

    model_config = {"populate_by_name": True}


class SpecialistRecommendationSummary(BaseModel):
    specialist: str
    reason: Optional[str] = None
    conversation_id: Optional[str] = Field(None, alias="conversationId")
    prediction_id: Optional[str] = Field(None, alias="predictionId")

    model_config = {"populate_by_name": True}


class RecentConsultationItem(BaseModel):
    conversation_id: str = Field(..., alias="conversationId")
    date: str
    formatted_time: str = Field(..., alias="formattedTime")
    status: str
    primary_symptom: str = Field(..., alias="primarySymptom")
    predicted_disease: Optional[str] = Field(None, alias="predictedDisease")
    confidence_score: Optional[float] = Field(None, alias="confidenceScore")
    severity: Optional[str] = "routine"
    urgency_level: Optional[str] = Field("Routine", alias="urgencyLevel")
    emergency_flag: bool = Field(False, alias="emergencyFlag")
    specialist: Optional[str] = None

    model_config = {"populate_by_name": True}


class RecentSchemeQueryItem(BaseModel):
    query_id: str = Field(..., alias="queryId")
    scheme_id: Optional[str] = Field(None, alias="schemeId")
    scheme_name: str = Field(..., alias="schemeName")
    user_question: str = Field(..., alias="userQuestion")
    overall_status: str = Field(..., alias="overallStatus")  # "ELIGIBLE" | "NOT_ELIGIBLE" | "POSSIBLY_ELIGIBLE" | "INSUFFICIENT_INFORMATION"
    overall_explanation: Optional[str] = Field(None, alias="overallExplanation")
    queried_at: str = Field(..., alias="queriedAt")

    model_config = {"populate_by_name": True}


class HospitalSummaryItem(BaseModel):
    hospital_id: str = Field(..., alias="hospitalId")
    hospital_name: str = Field(..., alias="hospitalName")
    city: Optional[str] = None
    state: Optional[str] = None
    rating: Optional[float] = None
    has_emergency_room: bool = Field(True, alias="hasEmergencyRoom")
    distance_km: Optional[float] = Field(None, alias="distanceKm")
    estimated_time: Optional[int] = Field(None, alias="estimatedTime")
    google_maps_url: Optional[str] = Field(None, alias="googleMapsUrl")

    model_config = {"populate_by_name": True}


class DashboardMetrics(BaseModel):
    total_consultations: int = Field(0, alias="totalConsultations")
    total_schemes_checked: int = Field(0, alias="totalSchemesChecked")
    emergency_alerts_count: int = Field(0, alias="emergencyAlertsCount")
    active_schemes_count: int = Field(0, alias="activeSchemesCount")

    model_config = {"populate_by_name": True}


class DashboardResponseOut(BaseModel):
    patient_summary: PatientSummary = Field(..., alias="patientSummary")
    metrics: DashboardMetrics
    latest_assessment: Optional[LatestAssessment] = Field(None, alias="latestAssessment")
    specialist_recommendation: Optional[SpecialistRecommendationSummary] = Field(None, alias="specialistRecommendation")
    recent_consultations: List[RecentConsultationItem] = Field(default_factory=list, alias="recentConsultations")
    recent_scheme_queries: List[RecentSchemeQueryItem] = Field(default_factory=list, alias="recentSchemeQueries")
    recommended_hospitals: List[HospitalSummaryItem] = Field(default_factory=list, alias="recommendedHospitals")

    model_config = {"populate_by_name": True}
