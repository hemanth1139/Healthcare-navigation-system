import pytest
import uuid
from datetime import date
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.profile import PatientProfile
from app.models.user import User
from app.services.profile_service import ProfileService
from app.rag.pipeline import RAGPipeline

pytestmark = pytest.mark.asyncio

async def test_profile_context_extraction_full(db_session: AsyncSession):
    """ProfileService.get_patient_context must accurately extract all demographic, financial, and clinical fields."""
    user = User(
        user_id=uuid.uuid4(),
        email=f"profile_test_{uuid.uuid4().hex[:6]}@example.com",
        password_hash="hashed_pw_test",
        full_name="Test Patient"
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    
    profile = PatientProfile(
        profile_id=uuid.uuid4(),
        user_id=user.user_id,
        date_of_birth=date(1990, 5, 15),
        gender="Female",
        state="Tamil Nadu",
        city="Chennai",
        annual_income=72000.0,
        employment_status="Unemployed",
        family_size=4,
        ration_card_type="PHH",
        disability_status="No",
        pregnancy_status="Yes"
    )
    db_session.add(profile)
    await db_session.commit()
    
    context = await ProfileService.get_patient_context(db_session, user.user_id)
    assert context is not None
    assert context["state"] == "Tamil Nadu"
    assert context["annual_income"] == 72000.0
    assert context["employment_status"] == "Unemployed"
    assert context["pregnancy_status"] in [True, "Yes"]
    assert context["disability_status"] in [False, "No"]
    assert context["ration_card_type"] == "PHH"
    assert context["family_size"] == 4
    assert context["age"] is not None and 30 <= context["age"] <= 40

async def test_scheme_eval_with_complete_profile(db_session: AsyncSession):
    """When a complete profile is available, the RAG assessment marks profile_complete=True."""
    patient_ctx = {
        "age": 32,
        "state": "Tamil Nadu",
        "annual_income": 60000.0,
        "employment_status": "Self-Employed",
        "family_size": 3,
        "ration_card_type": "PHH",
        "disability_status": False,
        "pregnancy_status": False,
        "gender": "Male"
    }
    
    result = await RAGPipeline.query(
        query_text="Am I eligible for Chief Minister's Comprehensive Health Insurance Scheme?",
        patient_context=patient_ctx,
        scoped_scheme_id="scheme_TN01"
    )
    
    assert result is not None
    assert result.get("profile_complete") is True
    assert result.get("profile_completion_status") == "complete"
    assert len(result.get("missing_required_fields", [])) == 0

async def test_scheme_eval_with_incomplete_profile(db_session: AsyncSession):
    """When required profile fields are missing, profile_complete is False and missing fields are returned."""
    # Incomplete patient context: missing annual_income and ration_card_type
    patient_ctx = {
        "age": 35,
        "state": "Tamil Nadu",
        "gender": "Male"
    }
    
    result = await RAGPipeline.query(
        query_text="Am I eligible for CMCHIS?",
        patient_context=patient_ctx,
        scoped_scheme_id="scheme_TN01"
    )
    
    assert result is not None
    assert result.get("profile_complete") is False
    assert result.get("profile_completion_status") == "incomplete"
    missing = result.get("missing_required_fields", [])
    assert len(missing) > 0
    assert any("income" in f.lower() or "financial" in f.lower() or "ration" in f.lower() for f in missing)

async def test_user_profile_data_isolation(db_session: AsyncSession):
    """User A cannot access User B's patient context."""
    user_a = User(user_id=uuid.uuid4(), email=f"user_a_{uuid.uuid4().hex[:6]}@example.com", password_hash="pw1", full_name="User A")
    user_b = User(user_id=uuid.uuid4(), email=f"user_b_{uuid.uuid4().hex[:6]}@example.com", password_hash="pw2", full_name="User B")
    db_session.add_all([user_a, user_b])
    await db_session.commit()
    await db_session.refresh(user_a)
    await db_session.refresh(user_b)
    
    prof_a = PatientProfile(profile_id=uuid.uuid4(), user_id=user_a.user_id, annual_income=50000.0, state="Tamil Nadu")
    prof_b = PatientProfile(profile_id=uuid.uuid4(), user_id=user_b.user_id, annual_income=500000.0, state="Karnataka")
    db_session.add_all([prof_a, prof_b])
    await db_session.commit()
    
    ctx_a = await ProfileService.get_patient_context(db_session, user_a.user_id)
    ctx_b = await ProfileService.get_patient_context(db_session, user_b.user_id)
    
    assert ctx_a["annual_income"] == 50000.0
    assert ctx_a["state"] == "Tamil Nadu"
    assert ctx_b["annual_income"] == 500000.0
    assert ctx_b["state"] == "Karnataka"
