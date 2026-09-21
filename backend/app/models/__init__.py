"""
Models package — import all models here so Alembic autodiscovers them.
"""

from app.models.user import User
from app.models.profile import PatientProfile, Allergy, ChronicCondition, Medication
from app.models.conversation import Conversation, ConversationMessage
from app.models.prediction import (
    DiseasePrediction,
    SeverityAssessment,
    SpecialistRecommendation,
    HealthTip,
)
from app.models.hospital import Hospital, HospitalRecommendation
from app.models.scheme import GovernmentScheme, SchemeQuery
from app.models.record import MedicalRecord
from app.models.audit import GuardrailLog, ActivityLog

__all__ = [
    "User",
    "PatientProfile",
    "Allergy",
    "ChronicCondition",
    "Medication",
    "Conversation",
    "ConversationMessage",
    "DiseasePrediction",
    "SeverityAssessment",
    "SpecialistRecommendation",
    "HealthTip",
    "Hospital",
    "HospitalRecommendation",
    "GovernmentScheme",
    "SchemeQuery",
    "MedicalRecord",
    "GuardrailLog",
    "ActivityLog",
]
