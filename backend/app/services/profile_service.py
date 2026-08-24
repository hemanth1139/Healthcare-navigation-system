"""
Profile service — CRUD for patient profile, allergies, conditions, medications.
"""

from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.profile import PatientProfile, Allergy, ChronicCondition, Medication
from app.models.user import User
from app.schemas.profile import (
    ProfileUpdateRequest, ProfileOut,
    AllergyCreate, AllergyUpdate, AllergyOut,
    ConditionCreate, ConditionUpdate, ConditionOut,
    MedicationCreate, MedicationUpdate, MedicationOut,
)
from app.core.exceptions import NotFoundError, ForbiddenError


async def _get_profile(db: AsyncSession, user: User) -> PatientProfile:
    """Fetch the patient profile for the current user."""
    result = await db.execute(
        select(PatientProfile).where(PatientProfile.user_id == user.user_id)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise NotFoundError("Patient profile")
    return profile


class ProfileService:

    @staticmethod
    async def get_profile(db: AsyncSession, user: User) -> ProfileOut:
        profile = await _get_profile(db, user)
        return ProfileOut.from_orm(profile)

    @staticmethod
    async def update_profile(db: AsyncSession, user: User, payload: ProfileUpdateRequest) -> ProfileOut:
        profile = await _get_profile(db, user)
        update_data = payload.model_dump(exclude_none=True, by_alias=False)
        for field, value in update_data.items():
            setattr(profile, field, value)
        return ProfileOut.from_orm(profile)

    # ─── Allergies ────────────────────────────────────────────────────────────

    @staticmethod
    async def list_allergies(db: AsyncSession, user: User) -> list[AllergyOut]:
        profile = await _get_profile(db, user)
        result = await db.execute(
            select(Allergy).where(Allergy.profile_id == profile.profile_id)
        )
        return [AllergyOut.from_orm(a) for a in result.scalars().all()]

    @staticmethod
    async def create_allergy(db: AsyncSession, user: User, payload: AllergyCreate) -> AllergyOut:
        profile = await _get_profile(db, user)
        allergy = Allergy(
            profile_id=profile.profile_id,
            allergy_name=payload.allergy_name,
            severity=payload.severity,
            notes=payload.notes,
        )
        db.add(allergy)
        await db.flush()
        return AllergyOut.from_orm(allergy)

    @staticmethod
    async def update_allergy(db: AsyncSession, user: User, allergy_id: UUID, payload: AllergyUpdate) -> AllergyOut:
        profile = await _get_profile(db, user)
        result = await db.execute(
            select(Allergy).where(Allergy.allergy_id == allergy_id, Allergy.profile_id == profile.profile_id)
        )
        allergy = result.scalar_one_or_none()
        if not allergy:
            raise NotFoundError("Allergy")
        for field, value in payload.model_dump(exclude_none=True, by_alias=False).items():
            setattr(allergy, field, value)
        return AllergyOut.from_orm(allergy)

    @staticmethod
    async def delete_allergy(db: AsyncSession, user: User, allergy_id: UUID) -> None:
        profile = await _get_profile(db, user)
        result = await db.execute(
            select(Allergy).where(Allergy.allergy_id == allergy_id, Allergy.profile_id == profile.profile_id)
        )
        allergy = result.scalar_one_or_none()
        if not allergy:
            raise NotFoundError("Allergy")
        await db.delete(allergy)

    # ─── Chronic Conditions ───────────────────────────────────────────────────

    @staticmethod
    async def list_conditions(db: AsyncSession, user: User) -> list[ConditionOut]:
        profile = await _get_profile(db, user)
        result = await db.execute(
            select(ChronicCondition).where(ChronicCondition.profile_id == profile.profile_id)
        )
        return [ConditionOut.from_orm(c) for c in result.scalars().all()]

    @staticmethod
    async def create_condition(db: AsyncSession, user: User, payload: ConditionCreate) -> ConditionOut:
        profile = await _get_profile(db, user)
        condition = ChronicCondition(
            profile_id=profile.profile_id,
            condition_name=payload.condition_name,
            diagnosed_year=payload.diagnosed_year,
            notes=payload.notes,
        )
        db.add(condition)
        await db.flush()
        return ConditionOut.from_orm(condition)

    @staticmethod
    async def update_condition(db: AsyncSession, user: User, condition_id: UUID, payload: ConditionUpdate) -> ConditionOut:
        profile = await _get_profile(db, user)
        result = await db.execute(
            select(ChronicCondition).where(
                ChronicCondition.condition_id == condition_id,
                ChronicCondition.profile_id == profile.profile_id
            )
        )
        condition = result.scalar_one_or_none()
        if not condition:
            raise NotFoundError("Chronic condition")
        for field, value in payload.model_dump(exclude_none=True, by_alias=False).items():
            setattr(condition, field, value)
        return ConditionOut.from_orm(condition)

    @staticmethod
    async def delete_condition(db: AsyncSession, user: User, condition_id: UUID) -> None:
        profile = await _get_profile(db, user)
        result = await db.execute(
            select(ChronicCondition).where(
                ChronicCondition.condition_id == condition_id,
                ChronicCondition.profile_id == profile.profile_id
            )
        )
        condition = result.scalar_one_or_none()
        if not condition:
            raise NotFoundError("Chronic condition")
        await db.delete(condition)

    # ─── Medications ──────────────────────────────────────────────────────────

    @staticmethod
    async def list_medications(db: AsyncSession, user: User) -> list[MedicationOut]:
        profile = await _get_profile(db, user)
        result = await db.execute(
            select(Medication).where(Medication.profile_id == profile.profile_id)
        )
        return [MedicationOut.from_orm(m) for m in result.scalars().all()]

    @staticmethod
    async def create_medication(db: AsyncSession, user: User, payload: MedicationCreate) -> MedicationOut:
        profile = await _get_profile(db, user)
        med = Medication(
            profile_id=profile.profile_id,
            medicine_name=payload.medicine_name,
            dosage=payload.dosage,
            frequency=payload.frequency,
            prescribed_by=payload.prescribed_by,
        )
        db.add(med)
        await db.flush()
        return MedicationOut.from_orm(med)

    @staticmethod
    async def update_medication(db: AsyncSession, user: User, medication_id: UUID, payload: MedicationUpdate) -> MedicationOut:
        profile = await _get_profile(db, user)
        result = await db.execute(
            select(Medication).where(
                Medication.medication_id == medication_id,
                Medication.profile_id == profile.profile_id
            )
        )
        med = result.scalar_one_or_none()
        if not med:
            raise NotFoundError("Medication")
        for field, value in payload.model_dump(exclude_none=True, by_alias=False).items():
            setattr(med, field, value)
        return MedicationOut.from_orm(med)

    @staticmethod
    async def delete_medication(db: AsyncSession, user: User, medication_id: UUID) -> None:
        profile = await _get_profile(db, user)
        result = await db.execute(
            select(Medication).where(
                Medication.medication_id == medication_id,
                Medication.profile_id == profile.profile_id
            )
        )
        med = result.scalar_one_or_none()
        if not med:
            raise NotFoundError("Medication")
        await db.delete(med)
