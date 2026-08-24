"""
Profile Pydantic schemas — patient profile, allergies, conditions, medications.
"""

from pydantic import BaseModel, Field
from datetime import date, datetime
from uuid import UUID
from typing import Optional


# ─── Patient Profile ──────────────────────────────────────────────────────────

class ProfileUpdateRequest(BaseModel):
    date_of_birth: Optional[date] = Field(None, alias="dateOfBirth")
    gender: Optional[str] = None
    blood_group: Optional[str] = Field(None, alias="bloodGroup")
    height_cm: Optional[float] = Field(None, alias="heightCm")
    weight_kg: Optional[float] = Field(None, alias="weightKg")
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    emergency_contact_name: Optional[str] = Field(None, alias="emergencyContactName")
    emergency_contact_phone: Optional[str] = Field(None, alias="emergencyContactPhone")

    model_config = {"populate_by_name": True}


class ProfileOut(BaseModel):
    profile_id: str = Field(..., alias="profileId")
    user_id: str = Field(..., alias="userId")
    date_of_birth: Optional[date] = Field(None, alias="dateOfBirth")
    gender: Optional[str] = None
    blood_group: Optional[str] = Field(None, alias="bloodGroup")
    height_cm: Optional[float] = Field(None, alias="heightCm")
    weight_kg: Optional[float] = Field(None, alias="weightKg")
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    emergency_contact_name: Optional[str] = Field(None, alias="emergencyContactName")
    emergency_contact_phone: Optional[str] = Field(None, alias="emergencyContactPhone")
    created_at: str = Field(..., alias="createdAt")
    updated_at: str = Field(..., alias="updatedAt")

    model_config = {"populate_by_name": True, "from_attributes": True}

    @classmethod
    def from_orm(cls, profile) -> "ProfileOut":
        return cls(
            profileId=str(profile.profile_id),
            userId=str(profile.user_id),
            dateOfBirth=profile.date_of_birth,
            gender=profile.gender,
            bloodGroup=profile.blood_group,
            heightCm=float(profile.height_cm) if profile.height_cm else None,
            weightKg=float(profile.weight_kg) if profile.weight_kg else None,
            address=profile.address,
            city=profile.city,
            state=profile.state,
            pincode=profile.pincode,
            emergencyContactName=profile.emergency_contact_name,
            emergencyContactPhone=profile.emergency_contact_phone,
            createdAt=profile.created_at.isoformat(),
            updatedAt=profile.updated_at.isoformat(),
        )


# ─── Allergy ──────────────────────────────────────────────────────────────────

class AllergyCreate(BaseModel):
    allergy_name: str = Field(..., alias="allergyName", min_length=1, max_length=100)
    severity: Optional[str] = None
    notes: Optional[str] = None

    model_config = {"populate_by_name": True}


class AllergyUpdate(BaseModel):
    allergy_name: Optional[str] = Field(None, alias="allergyName")
    severity: Optional[str] = None
    notes: Optional[str] = None

    model_config = {"populate_by_name": True}


class AllergyOut(BaseModel):
    allergy_id: str = Field(..., alias="allergyId")
    profile_id: str = Field(..., alias="profileId")
    allergy_name: str = Field(..., alias="allergyName")
    severity: Optional[str] = None
    notes: Optional[str] = None

    model_config = {"populate_by_name": True, "from_attributes": True}

    @classmethod
    def from_orm(cls, a) -> "AllergyOut":
        return cls(
            allergyId=str(a.allergy_id),
            profileId=str(a.profile_id),
            allergyName=a.allergy_name,
            severity=a.severity,
            notes=a.notes,
        )


# ─── Chronic Condition ────────────────────────────────────────────────────────

class ConditionCreate(BaseModel):
    condition_name: str = Field(..., alias="conditionName", min_length=1)
    diagnosed_year: Optional[int] = Field(None, alias="diagnosedYear")
    notes: Optional[str] = None

    model_config = {"populate_by_name": True}


class ConditionUpdate(BaseModel):
    condition_name: Optional[str] = Field(None, alias="conditionName")
    diagnosed_year: Optional[int] = Field(None, alias="diagnosedYear")
    notes: Optional[str] = None

    model_config = {"populate_by_name": True}


class ConditionOut(BaseModel):
    condition_id: str = Field(..., alias="conditionId")
    profile_id: str = Field(..., alias="profileId")
    condition_name: str = Field(..., alias="conditionName")
    diagnosed_year: Optional[int] = Field(None, alias="diagnosedYear")
    notes: Optional[str] = None

    model_config = {"populate_by_name": True, "from_attributes": True}

    @classmethod
    def from_orm(cls, c) -> "ConditionOut":
        return cls(
            conditionId=str(c.condition_id),
            profileId=str(c.profile_id),
            conditionName=c.condition_name,
            diagnosedYear=c.diagnosed_year,
            notes=c.notes,
        )


# ─── Medication ───────────────────────────────────────────────────────────────

class MedicationCreate(BaseModel):
    medicine_name: str = Field(..., alias="medicineName", min_length=1)
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    prescribed_by: Optional[str] = Field(None, alias="prescribedBy")

    model_config = {"populate_by_name": True}


class MedicationUpdate(BaseModel):
    medicine_name: Optional[str] = Field(None, alias="medicineName")
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    prescribed_by: Optional[str] = Field(None, alias="prescribedBy")

    model_config = {"populate_by_name": True}


class MedicationOut(BaseModel):
    medication_id: str = Field(..., alias="medicationId")
    profile_id: str = Field(..., alias="profileId")
    medicine_name: str = Field(..., alias="medicineName")
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    prescribed_by: Optional[str] = Field(None, alias="prescribedBy")

    model_config = {"populate_by_name": True, "from_attributes": True}

    @classmethod
    def from_orm(cls, m) -> "MedicationOut":
        return cls(
            medicationId=str(m.medication_id),
            profileId=str(m.profile_id),
            medicineName=m.medicine_name,
            dosage=m.dosage,
            frequency=m.frequency,
            prescribedBy=m.prescribed_by,
        )
