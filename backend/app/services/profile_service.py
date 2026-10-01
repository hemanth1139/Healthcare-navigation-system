"""
Profile service — CRUD for patient profile, allergies, conditions, medications.
"""

from datetime import date
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

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

    @staticmethod
    async def get_patient_context(db: AsyncSession, user_id: UUID) -> dict:
        """
        Extracts structured demographic and clinical context for RAG pipeline eligibility evaluation.
        """
        stmt = (
            select(PatientProfile)
            .where(PatientProfile.user_id == user_id)
            .options(
                selectinload(PatientProfile.chronic_conditions),
                selectinload(PatientProfile.allergies),
                selectinload(PatientProfile.medications),
            )
        )
        res = await db.execute(stmt)
        profile = res.scalar_one_or_none()
        if not profile:
            return {}

        age = None
        if profile.date_of_birth:
            today = date.today()
            age = today.year - profile.date_of_birth.year - (
                (today.month, today.day) < (profile.date_of_birth.month, profile.date_of_birth.day)
            )

        return {
            "age": age,
            "gender": profile.gender,
            "state": profile.state,
            "city": profile.city,
            "date_of_birth": profile.date_of_birth.isoformat() if profile.date_of_birth else None,
            "conditions": [c.condition_name for c in (profile.chronic_conditions or [])],
            "medications": [m.medicine_name for m in (profile.medications or [])],
            "blood_group": profile.blood_group,
        }

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

    # ─── Context Aggregator ───────────────────────────────────────────────────

    @staticmethod
    async def get_patient_context(db: AsyncSession, user_id: UUID) -> dict:
        """
        Module 3 Context Aggregator.
        Eagerly loads profile, allergies, chronic conditions, and active medications
        in a single database query to format context for LLM & RAG engines.
        """
        stmt = (
            select(PatientProfile)
            .options(
                selectinload(PatientProfile.allergies),
                selectinload(PatientProfile.chronic_conditions),
                selectinload(PatientProfile.medications),
                selectinload(PatientProfile.medical_records),
                selectinload(PatientProfile.user),
            )
            .where(PatientProfile.user_id == user_id)
        )
        result = await db.execute(stmt)
        profile = result.scalar_one_or_none()
        if not profile:
            return {"context_summary": "Patient demographic data not populated."}

        age = None
        if profile.date_of_birth:
            today = date.today()
            dob = profile.date_of_birth
            age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))

        bmi = None
        if profile.height_cm and profile.weight_kg and profile.height_cm > 0:
            height_m = float(profile.height_cm) / 100.0
            bmi = round(float(profile.weight_kg) / (height_m ** 2), 1)

        allergies = [a.allergy_name for a in (profile.allergies or [])]
        chronic_conditions = [c.condition_name for c in (profile.chronic_conditions or [])]
        medications = [f"{m.medicine_name} ({m.dosage or 'N/A'})" for m in (profile.medications or [])]
        records = profile.medical_records or []

        summary_parts = []
        if profile.user and profile.user.full_name:
            summary_parts.append(f"Name: {profile.user.full_name}")
        if age is not None:
            summary_parts.append(f"Age: {age}")
        if profile.gender:
            summary_parts.append(f"Gender: {profile.gender}")
        if profile.blood_group:
            summary_parts.append(f"Blood Group: {profile.blood_group}")
        if profile.state:
            summary_parts.append(f"State: {profile.state}")
        if bmi is not None:
            summary_parts.append(f"BMI: {bmi}")
        if chronic_conditions:
            summary_parts.append(f"Chronic Conditions: {', '.join(chronic_conditions)}")
        if medications:
            summary_parts.append(f"Active Medications: {', '.join(medications)}")
        if allergies:
            summary_parts.append(f"Known Allergies: {', '.join(allergies)}")
        if records:
            doc_snippets = []
            for r in records[:4]:
                content_snip = (r.fhir_resource or "").replace("\n", " ").strip()
                if len(content_snip) > 120:
                    content_snip = content_snip[:120] + "..."
                doc_snippets.append(f"[{r.category or 'Document'}: {r.file_name} - {content_snip}]")
            summary_parts.append(f"Uploaded Medical Documents: {' | '.join(doc_snippets)}")

        context_summary = " | ".join(summary_parts) if summary_parts else "No background clinical history."

        return {
            "user_id": str(user_id),
            "age": age,
            "gender": profile.gender,
            "state": profile.state,
            "blood_group": profile.blood_group,
            "bmi": bmi,
            "allergies": allergies,
            "chronic_conditions": chronic_conditions,
            "medications": medications,
            "uploaded_documents_count": len(records),
            "context_summary": context_summary,
        }

