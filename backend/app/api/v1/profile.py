"""
Patient Profile API router — /api/v1/profile/*
"""

from uuid import UUID
from fastapi import APIRouter

from app.dependencies import DBSession, CurrentUser
from app.schemas.profile import (
    ProfileUpdateRequest, ProfileOut,
    AllergyCreate, AllergyUpdate, AllergyOut,
    ConditionCreate, ConditionUpdate, ConditionOut,
    MedicationCreate, MedicationUpdate, MedicationOut,
)
from app.services.profile_service import ProfileService

router = APIRouter(prefix="/profile", tags=["Patient Profile"])


# ─── Patient Profile ──────────────────────────────────────────────────────────

@router.get("", response_model=ProfileOut)
async def get_profile(db: DBSession, current_user: CurrentUser):
    """Get the authenticated user's patient profile."""
    return await ProfileService.get_profile(db, current_user)


@router.put("", response_model=ProfileOut)
async def update_profile(payload: ProfileUpdateRequest, db: DBSession, current_user: CurrentUser):
    """Update the authenticated user's patient profile."""
    return await ProfileService.update_profile(db, current_user, payload)


# ─── Allergies ────────────────────────────────────────────────────────────────

@router.get("/allergies", response_model=list[AllergyOut])
async def list_allergies(db: DBSession, current_user: CurrentUser):
    return await ProfileService.list_allergies(db, current_user)


@router.post("/allergies", response_model=AllergyOut, status_code=201)
async def create_allergy(payload: AllergyCreate, db: DBSession, current_user: CurrentUser):
    return await ProfileService.create_allergy(db, current_user, payload)


@router.put("/allergies/{allergy_id}", response_model=AllergyOut)
async def update_allergy(allergy_id: UUID, payload: AllergyUpdate, db: DBSession, current_user: CurrentUser):
    return await ProfileService.update_allergy(db, current_user, allergy_id, payload)


@router.delete("/allergies/{allergy_id}", status_code=204)
async def delete_allergy(allergy_id: UUID, db: DBSession, current_user: CurrentUser):
    await ProfileService.delete_allergy(db, current_user, allergy_id)


# ─── Chronic Conditions ───────────────────────────────────────────────────────

@router.get("/conditions", response_model=list[ConditionOut])
async def list_conditions(db: DBSession, current_user: CurrentUser):
    return await ProfileService.list_conditions(db, current_user)


@router.post("/conditions", response_model=ConditionOut, status_code=201)
async def create_condition(payload: ConditionCreate, db: DBSession, current_user: CurrentUser):
    return await ProfileService.create_condition(db, current_user, payload)


@router.put("/conditions/{condition_id}", response_model=ConditionOut)
async def update_condition(condition_id: UUID, payload: ConditionUpdate, db: DBSession, current_user: CurrentUser):
    return await ProfileService.update_condition(db, current_user, condition_id, payload)


@router.delete("/conditions/{condition_id}", status_code=204)
async def delete_condition(condition_id: UUID, db: DBSession, current_user: CurrentUser):
    await ProfileService.delete_condition(db, current_user, condition_id)


# ─── Medications ──────────────────────────────────────────────────────────────

@router.get("/medications", response_model=list[MedicationOut])
async def list_medications(db: DBSession, current_user: CurrentUser):
    return await ProfileService.list_medications(db, current_user)


@router.post("/medications", response_model=MedicationOut, status_code=201)
async def create_medication(payload: MedicationCreate, db: DBSession, current_user: CurrentUser):
    return await ProfileService.create_medication(db, current_user, payload)


@router.put("/medications/{medication_id}", response_model=MedicationOut)
async def update_medication(medication_id: UUID, payload: MedicationUpdate, db: DBSession, current_user: CurrentUser):
    return await ProfileService.update_medication(db, current_user, medication_id, payload)


@router.delete("/medications/{medication_id}", status_code=204)
async def delete_medication(medication_id: UUID, db: DBSession, current_user: CurrentUser):
    await ProfileService.delete_medication(db, current_user, medication_id)
