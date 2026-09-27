"""
Comprehensive End-to-End Test Suite for Symptom Assessment Module.
Validates Tests across Intake, Cumulative Extraction, Throat Pain, Rules, Urgency, Specialist, Database, and Multi-user Isolation.
"""

import pytest
import asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.main import app
from app.core.database import Base
from app.dependencies import get_db
from app.ml.rule_based_predictor import (
    predict_disease,
    normalize_symptom,
    normalize_symptom_list,
    extract_cumulative_symptoms,
)

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="session")
async def test_engine():
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()

@pytest.fixture
async def test_db_session(test_engine):
    async_session = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        yield session

@pytest.fixture
async def client(test_db_session):
    async def override_get_db():
        yield test_db_session

    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


# ─── Unit Tests: Rule Engine & Normalization ─────────────────────────────────

def test_symptom_normalization():
    """Verify natural language symptoms normalize to canonical keys."""
    assert normalize_symptom("throat pain") == "throat_pain"
    assert normalize_symptom("sore throat") == "throat_pain"
    assert normalize_symptom("pain in left arm") == "left_arm_radiation"
    assert normalize_symptom("shooting down left arm") == "left_arm_radiation"
    assert normalize_symptom("high temperature") == "fever"
    assert normalize_symptom("crushing chest pain") == "chest_pain"
    assert normalize_symptom("stiff neck") == "stiff_neck"

def test_cumulative_symptom_extraction_and_preservation():
    """Verify cumulative extraction across multi-turn messages preserves throat pain, nausea, and body aches."""
    messages = [
        {"sender": "user", "content": "I have throat pain."},
        {"sender": "assistant", "content": "When did it start?"},
        {"sender": "user", "content": "I also have nausea."},
        {"sender": "assistant", "content": "Any other symptoms?"},
        {"sender": "user", "content": "I have body aches too."}
    ]
    res = extract_cumulative_symptoms(messages)
    assert res["primary_symptom"] == "Throat Pain"
    assert "Nausea" in res["associated_symptoms"]
    assert "Body Aches" in res["associated_symptoms"]
    assert "throat_pain" in res["all_symptoms"]
    assert "nausea" in res["all_symptoms"]
    assert "body_aches" in res["all_symptoms"]

def test_symptom_explicit_correction():
    """Verify user can explicitly correct or negate a previous symptom."""
    messages = [
        {"sender": "user", "content": "I have throat pain."},
        {"sender": "assistant", "content": "When did it start?"},
        {"sender": "user", "content": "Actually, I don't have throat pain. I have headache instead."},
    ]
    res = extract_cumulative_symptoms(messages)
    assert "throat_pain" not in res["all_symptoms"]
    assert "headache" in res["all_symptoms"]

def test_pharyngitis_rule_matching():
    """Verify throat pain with nausea and body aches matches Pharyngitis/URI rule."""
    res = predict_disease(["throat_pain", "nausea", "body_aches"])
    assert "Pharyngitis" in res["predicted_disease"] or "Upper Respiratory" in res["predicted_disease"]
    assert res["urgency_level"] in ["NON_URGENT", "ROUTINE"]
    assert "ENT Specialist" in res["specialist"] or "General Physician" in res["specialist"]
    assert "Throat Pain" in res["triggered_rules"]

def test_emergency_rule_acs():
    """Verify ACS triggers EMERGENCY urgency and Cardiologist."""
    res = predict_disease(["chest_pain", "left_arm_radiation", "shortness_of_breath"])
    assert res["urgency_level"] == "EMERGENCY"
    assert res["emergency_flag"] is True
    assert "Cardiologist" in res["specialist"]
    assert len(res["triggered_rules"]) >= 2

def test_urgent_rule_appendicitis():
    """Verify Appendicitis triggers URGENT and General Surgeon."""
    res = predict_disease(["abdominal_pain", "fever", "nausea"])
    assert res["urgency_level"] == "URGENT"
    assert res["emergency_flag"] is False
    assert "General Surgeon" in res["specialist"]

def test_routine_rule_viral_syndrome():
    """Verify simple viral fever triggers ROUTINE and General Physician."""
    res = predict_disease(["fever", "body_aches", "fatigue"])
    assert res["urgency_level"] == "ROUTINE"
    assert "General Physician" in res["specialist"]


# ─── Integration Tests: Multi-turn Chat & Cumulative Data Integrity ──────────

@pytest.mark.asyncio
async def test_multi_turn_throat_pain_nausea_body_aches_flow(client: AsyncClient):
    """
    Exact user scenario test:
    1. User reports 'throat pain'
    2. User reports 'nausea'
    3. User reports 'body aches'
    Verify all 3 symptoms persist into the final assessment, database record, and history.
    """
    # 1. Register User
    reg_res = await client.post("/api/v1/auth/register", json={
        "email": "throat_patient@example.com",
        "password": "Password123!",
        "fullName": "Throat Patient",
        "phone": "9876543219"
    })
    tokens = reg_res.json()["tokens"]
    token = tokens.get("accessToken") or tokens.get("access_token")
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Start Conversation
    conv_res = await client.post("/api/v1/conversations", json={"language": "en", "input_type": "text"}, headers=headers)
    conv_id = conv_res.json()["conversationId"]

    # 3. Message 1: Throat pain
    m1_res = await client.post(f"/api/v1/conversations/{conv_id}/messages", json={
        "message": "I have throat pain."
    }, headers=headers)
    assert m1_res.status_code == 200
    m1_data = m1_res.json()
    assert "Throat Pain" in m1_data["symptomsIdentified"]

    # 4. Message 2: Nausea
    m2_res = await client.post(f"/api/v1/conversations/{conv_id}/messages", json={
        "message": "I also have nausea."
    }, headers=headers)
    assert m2_res.status_code == 200
    m2_data = m2_res.json()
    assert "Throat Pain" in m2_data["symptomsIdentified"]
    assert "Nausea" in m2_data["symptomsIdentified"]

    # 5. Message 3: Body aches
    m3_res = await client.post(f"/api/v1/conversations/{conv_id}/messages", json={
        "message": "I have body aches too."
    }, headers=headers)
    assert m3_res.status_code == 200
    m3_data = m3_res.json()
    # ALL THREE symptoms must be preserved
    assert "Throat Pain" in m3_data["symptomsIdentified"]
    assert "Nausea" in m3_data["symptomsIdentified"]
    assert "Body Aches" in m3_data["symptomsIdentified"]

    # 6. Verify prediction database record
    pred_res = await client.get(f"/api/v1/predictions/{conv_id}", headers=headers)
    assert pred_res.status_code == 200
    pred_data = pred_res.json()
    assert pred_data["primary_symptom"] == "Throat Pain"
    assert "Nausea" in pred_data["associated_symptoms"]
    assert "Body Aches" in pred_data["associated_symptoms"]
    assert "Throat Pain" in pred_data["symptoms_used"]
    assert "Nausea" in pred_data["symptoms_used"]
    assert "Body Aches" in pred_data["symptoms_used"]
    assert "Pharyngitis" in pred_data["predicted_disease"] or "Respiratory" in pred_data["predicted_disease"]

    # 7. Check History
    hist_res = await client.get("/api/v1/history", headers=headers)
    assert hist_res.status_code == 200
    hist = hist_res.json()
    assert len(hist) >= 1


@pytest.mark.asyncio
async def test_knee_pain_single_turn_flow(client: AsyncClient):
    """
    Test 1 reproduction: User says 'I have knee pain'.
    Expected:
    - Primary symptom: Knee Pain
    - Symptoms list: ['Knee Pain']
    - No Throat Pain
    - Urgency: ROUTINE or NON_URGENT
    - Specialist: Orthopedic Specialist / General Physician (not ENT)
    """
    reg_res = await client.post("/api/v1/auth/register", json={
        "email": "knee_patient@example.com",
        "password": "Password123!",
        "fullName": "Knee Patient",
        "phone": "9876543218"
    })
    tokens = reg_res.json()["tokens"]
    token = tokens.get("accessToken") or tokens.get("access_token")
    headers = {"Authorization": f"Bearer {token}"}

    conv_res = await client.post("/api/v1/conversations", json={"language": "en", "input_type": "text"}, headers=headers)
    conv_id = conv_res.json()["conversationId"]

    m_res = await client.post(f"/api/v1/conversations/{conv_id}/messages", json={
        "message": "I have knee pain"
    }, headers=headers)
    assert m_res.status_code == 200
    m_data = m_res.json()

    assert "Knee Pain" in m_data["symptomsIdentified"]
    assert "Throat Pain" not in m_data["symptomsIdentified"]

    pred_res = await client.get(f"/api/v1/predictions/{conv_id}", headers=headers)
    assert pred_res.status_code == 200
    pred_data = pred_res.json()
    assert pred_data["primary_symptom"] == "Knee Pain"
    assert "Throat Pain" not in pred_data.get("symptoms_used", [])
    assert "ENT Specialist" not in pred_data["specialist"]["specialist"]
    assert "Orthopedic" in pred_data["specialist"]["specialist"] or "General Physician" in pred_data["specialist"]["specialist"]


@pytest.mark.asyncio
async def test_conversation_isolation_between_sessions(client: AsyncClient):
    """
    Test 6 reproduction:
    Session A reports Throat Pain.
    Session B reports Knee Pain.
    Verify both sessions maintain isolated independent symptom profiles.
    """
    reg_res = await client.post("/api/v1/auth/register", json={
        "email": "iso_patient@example.com",
        "password": "Password123!",
        "fullName": "Iso Patient",
        "phone": "9876543217"
    })
    tokens = reg_res.json()["tokens"]
    token = tokens.get("accessToken") or tokens.get("access_token")
    headers = {"Authorization": f"Bearer {token}"}

    # Session A: Throat Pain
    conv_a = (await client.post("/api/v1/conversations", json={"language": "en", "input_type": "text"}, headers=headers)).json()["conversationId"]
    await client.post(f"/api/v1/conversations/{conv_a}/messages", json={"message": "I have throat pain"}, headers=headers)
    pred_a = (await client.get(f"/api/v1/predictions/{conv_a}", headers=headers)).json()
    assert pred_a["primary_symptom"] == "Throat Pain"

    # Session B: Knee Pain (new check)
    conv_b = (await client.post("/api/v1/conversations", json={"language": "en", "input_type": "text"}, headers=headers)).json()["conversationId"]
    assert conv_b != conv_a
    await client.post(f"/api/v1/conversations/{conv_b}/messages", json={"message": "I have knee pain"}, headers=headers)
    pred_b = (await client.get(f"/api/v1/predictions/{conv_b}", headers=headers)).json()
    assert pred_b["primary_symptom"] == "Knee Pain"
    assert "Throat Pain" not in pred_b.get("symptoms_used", [])

    # Verify Session A is still Throat Pain
    pred_a_recheck = (await client.get(f"/api/v1/predictions/{conv_a}", headers=headers)).json()
    assert pred_a_recheck["primary_symptom"] == "Throat Pain"

