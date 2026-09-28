"""
Comprehensive Government Healthcare Schemes & RAG Integration Tests.
Validates:
1. Scheme listing from database
2. Search by keywords and categories
3. Scheme details
4. Patient context integration (DOB/age, state, gender)
5. Missing criteria -> INSUFFICIENT_INFORMATION / POSSIBLY_ELIGIBLE
6. Fully eligible criteria -> ELIGIBLE
7. Ineligible criteria -> NOT_ELIGIBLE (with failure explanation)
8. Multi-document evidence retrieval and source traceability
9. Query persistence and history retrieval
10. Query continuation
11. User isolation and direct URL access protection
"""

import pytest
from httpx import AsyncClient, ASGITransport
from datetime import date
from sqlalchemy import delete
from app.main import app
from app.models.scheme import GovernmentScheme
from app.models.profile import PatientProfile
from app.rag.vectorstore import VectorStore
from app.rag.embeddings import EmbeddingService

pytestmark = pytest.mark.asyncio


import uuid

async def _get_auth_headers(ac: AsyncClient, email: str | None = None) -> dict:
    """Helper to register/login a user and get auth header."""
    rand_id = uuid.uuid4().hex[:8]
    actual_email = email or f"raguser_{rand_id}@example.com"
    phone = f"+919{int(uuid.uuid4().int % 1000000000):09d}"
    reg_payload = {
        "fullName": "RAG Test User",
        "email": actual_email,
        "phone": phone,
        "password": "StrongPassword123!",
    }
    res = await ac.post("/api/v1/auth/register", json=reg_payload)
    if res.status_code == 201:
        token = res.json()["tokens"]["accessToken"]
    else:
        res_login = await ac.post("/api/v1/auth/login", json={"email": actual_email, "password": "StrongPassword123!"})
        token = res_login.json()["tokens"]["accessToken"]
    return {"Authorization": f"Bearer {token}"}


async def _seed_test_schemes(db_session):
    """Seed test database and vector store with RAG contents."""
    await db_session.execute(delete(GovernmentScheme))
    await db_session.commit()

    s1 = GovernmentScheme(
        scheme_id="scheme_C01",
        scheme_name="Ayushman Bharat PM-JAY",
        department="National Health Authority",
        state="Central / All India",
        category="Central Government",
        coverage_amount="Up to ₹5 lakh per eligible family per year",
        cashless=True,
        eligibility="SECC 2011 and BPL categories",
        benefits="Cashless secondary and tertiary hospitalization cover",
        official_url="https://pmjay.gov.in/",
        last_updated=date(2026, 3, 1),
        eligibility_criteria={
            "income_limit_per_annum_inr": "SECC 2011 Deprivation Criteria",
            "bpl_or_secc_required": "Yes",
            "age_group": "All Ages",
            "target_beneficiaries": "Poor and vulnerable families",
            "required_documents": ["Aadhaar", "Ration Card"],
        },
        key_covered_conditions=["Secondary & Tertiary Surgery", "Oncology", "Cardiology"],
        key_exclusions=["Elective cosmetic surgery", "Routine OPD outside packages"],
        chunks=[
            "AB-PMJAY covers secondary and tertiary hospitalization up to 5 Lakhs per family.",
            "Cosmetic surgery and non-therapeutic procedures are strictly excluded under PM-JAY guidelines.",
        ],
    )
    s2 = GovernmentScheme(
        scheme_id="scheme_C02",
        scheme_name="Ayushman Vay Vandana Card (PM-JAY for 70+)",
        department="National Health Authority",
        state="Central / All India",
        category="Central Government",
        coverage_amount="Up to ₹5 lakh per eligible senior citizen family unit",
        cashless=True,
        eligibility="All Indian citizens aged 70 years and above irrespective of income",
        benefits="Dedicated Ayushman card for senior citizens aged 70+",
        official_url="https://pmjay.gov.in/",
        last_updated=date(2026, 3, 1),
        eligibility_criteria={
            "income_limit_per_annum_inr": "No income ceiling for 70+ category",
            "bpl_or_secc_required": "No",
            "age_group": "Senior Citizens (70 years and above)",
            "target_beneficiaries": "All Indian citizens aged 70+",
            "required_documents": ["Aadhaar", "Age Proof"],
        },
        key_covered_conditions=["Hospitalization", "Cardiac procedures", "Geriatric Care"],
        key_exclusions=["Cosmetic surgery", "Non-approved treatment"],
        chunks=[
            "Ayushman Vay Vandana Card covers all Indians aged 70+ under PM-JAY regardless of income.",
            "Applicants must provide Aadhaar for age verification proving age 70 years or above.",
        ],
    )
    s3 = GovernmentScheme(
        scheme_id="scheme_TN01",
        scheme_name="Chief Minister Comprehensive Health Insurance Scheme (TN CMCHIS)",
        department="Government of Tamil Nadu",
        state="Tamil Nadu",
        category="State Government",
        coverage_amount="Up to ₹5 lakh per family per year",
        cashless=True,
        eligibility="Resident of Tamil Nadu with family income below ₹1,20,000 per annum",
        benefits="Cashless treatment across empaneled network hospitals in Tamil Nadu",
        official_url="https://www.cmchistn.com/",
        last_updated=date(2026, 3, 1),
        eligibility_criteria={
            "income_limit_per_annum_inr": "₹1,20,000 / annum",
            "bpl_or_secc_required": "Income certificate or VAO certification",
            "age_group": "All Ages",
            "target_beneficiaries": "Families residing in Tamil Nadu with low annual income",
            "required_documents": ["Ration Card", "VAO Income Certificate", "Aadhaar"],
        },
        key_covered_conditions=["Multi-specialty surgeries", "Dialysis", "Cardiology"],
        key_exclusions=["Cosmetic surgery", "Routine checkups"],
        chunks=[
            "CMCHIS provides cashless coverage for eligible residents of Tamil Nadu.",
            "Annual family income must be verified under 1.2 Lakhs via Village Administrative Officer certificate.",
        ],
    )

    db_session.add_all([s1, s2, s3])
    await db_session.commit()

    # Seed vector store indices
    v_store = VectorStore()
    v_store.clear()

    for s in [s1, s2, s3]:
        for chk in s.chunks:
            emb = await EmbeddingService.get_embedding(f"{s.scheme_name} {chk}")
            v_store.add_texts(
                [chk],
                [emb],
                [{"scheme_id": s.scheme_id, "scheme_name": s.scheme_name, "official_url": s.official_url}],
            )


async def test_scheme_listing_and_search(db_session):
    """TEST 1 & TEST 2: Listing schemes and searching with keyword & category filters."""
    await _seed_test_schemes(db_session)

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        headers = await _get_auth_headers(ac, "user1@example.com")

        # 1. List all schemes
        res = await ac.get("/api/v1/schemes", headers=headers)
        assert res.status_code == 200
        schemes = res.json()
        assert len(schemes) >= 3

        # 2. Search keyword 'Vandana'
        res_search = await ac.get("/api/v1/schemes?search=Vandana", headers=headers)
        assert res_search.status_code == 200
        search_data = res_search.json()
        assert len(search_data) >= 1
        assert "Vay Vandana" in search_data[0]["schemeName"]

        # 3. Filter category 'State Government'
        res_cat = await ac.get("/api/v1/schemes?category=State%20Government", headers=headers)
        assert res_cat.status_code == 200
        cat_data = res_cat.json()
        assert len(cat_data) >= 1
        assert "Tamil Nadu" in cat_data[0]["schemeName"] or cat_data[0]["category"] == "State Government"


async def test_scheme_details_retrieval(db_session):
    """TEST 3: Retrieve individual scheme details by scheme_id."""
    await _seed_test_schemes(db_session)

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        headers = await _get_auth_headers(ac, "user2@example.com")

        res = await ac.get("/api/v1/schemes/scheme_C01", headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert data["schemeId"] == "scheme_C01"
        assert "Ayushman Bharat" in data["schemeName"]
        assert "officialUrl" in data
        assert data["cashless"] is True
        assert data["eligibilityCriteria"] is not None


async def test_senior_citizen_eligible_evaluation(db_session):
    """TEST 6: 72-year-old user checking Ayushman Vay Vandana 70+ -> ELIGIBLE."""
    await _seed_test_schemes(db_session)

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        headers = await _get_auth_headers(ac, "senior_user@example.com")

        # Set profile to age 72 (DOB 1952-01-01)
        await ac.put("/api/v1/profile", json={
            "dateOfBirth": "1952-01-01",
            "gender": "Male",
            "state": "Tamil Nadu",
            "city": "Chennai"
        }, headers=headers)

        res = await ac.post("/api/v1/schemes/scheme_C02/eligibility/query", json={
            "userQuestion": "Am I eligible for Ayushman Vay Vandana if I am 72 years old?"
        }, headers=headers)

        assert res.status_code == 200
        data = res.json()
        assert "eligibilityResult" in data
        elig = data["eligibilityResult"]
        assert elig["overallStatus"] in ["ELIGIBLE", "POSSIBLY_ELIGIBLE"]
        assert len(elig["criteriaBreakdown"]) >= 1
        assert any("70" in c["criterionName"] or "Age" in c["criterionName"] for c in elig["criteriaBreakdown"])
        assert len(elig["allEvidenceSources"]) >= 1
        assert "https://pmjay.gov.in" in elig["allEvidenceSources"][0]["officialUrl"]


async def test_cosmetic_exclusion_not_eligible(db_session):
    """TEST 7: Explicitly excluded cosmetic surgery query -> NOT_ELIGIBLE."""
    await _seed_test_schemes(db_session)

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        headers = await _get_auth_headers(ac, "cosmetic_user@example.com")

        res = await ac.post("/api/v1/schemes/scheme_C01/eligibility/query", json={
            "userQuestion": "Is elective cosmetic surgery covered under PM-JAY?"
        }, headers=headers)

        assert res.status_code == 200
        data = res.json()
        elig = data["eligibilityResult"]
        assert elig["overallStatus"] in ["NOT_COVERED", "NOT_ELIGIBLE"]
        assert any(c["criterionResult"] == "FAIL" for c in elig["criteriaBreakdown"])


async def test_query_history_and_patient_isolation(db_session):
    """TEST 10, 12, 13: Query persistence, user history listing, and cross-patient isolation."""
    await _seed_test_schemes(db_session)

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        headers_a = await _get_auth_headers(ac, "patient_a@example.com")
        headers_b = await _get_auth_headers(ac, "patient_b@example.com")

        # Patient A runs a query
        res_a = await ac.post("/api/v1/schemes/scheme_C01/eligibility/query", json={
            "userQuestion": "What is the income requirement for PM-JAY?"
        }, headers=headers_a)
        query_a_id = res_a.json()["queryId"]

        # Patient A can view history
        hist_a = await ac.get("/api/v1/schemes/queries", headers=headers_a)
        assert hist_a.status_code == 200
        queries_a = hist_a.json()
        assert len(queries_a) >= 1
        assert queries_a[0]["queryId"] == query_a_id

        # Patient B's history is empty (Isolation)
        hist_b = await ac.get("/api/v1/schemes/queries", headers=headers_b)
        assert hist_b.status_code == 200
        queries_b = hist_b.json()
        assert len(queries_b) == 0

        # Patient B tries to access Patient A's query by direct URL (Forbidden / Not Found)
        direct_b = await ac.get(f"/api/v1/schemes/queries/{query_a_id}", headers=headers_b)
        assert direct_b.status_code in [403, 404]


async def test_missing_information_multi_step_followup(db_session):
    """TESTS 1 to 7: Missing info detection, sequential natural answers, source attribution, and rule re-evaluation."""
    await _seed_test_schemes(db_session)

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        headers = await _get_auth_headers(ac, "followup_user@example.com")

        # Step 1: Initial query with blank profile -> QUESTIONS_REQUIRED (Residency unknown)
        res_init = await ac.post("/api/v1/schemes/scheme_TN01/eligibility/query", json={
            "userQuestion": "Am I eligible for TN CMCHIS?"
        }, headers=headers)
        assert res_init.status_code == 200
        data1 = res_init.json()
        query_id = data1["queryId"]
        elig1 = data1["eligibilityResult"]
        assert elig1["overallStatus"] == "INSUFFICIENT_INFORMATION"
        assert elig1["interviewState"] == "QUESTIONS_REQUIRED"
        assert elig1["currentQuestion"] is not None
        assert elig1["currentQuestion"]["inputType"] == "MCQ"
        assert "Tamil Nadu" in elig1["currentQuestion"]["options"]

        # Step 2: Patient answers Residency ("Tamil Nadu") via MCQ -> Residency PASS, next question is Income
        res_step2 = await ac.post("/api/v1/schemes/eligibility/continue", json={
            "queryId": query_id,
            "additionalInfo": {"state": "Tamil Nadu"}
        }, headers=headers)
        assert res_step2.status_code == 200
        elig2 = res_step2.json()["eligibilityResult"]
        assert elig2["interviewState"] == "QUESTIONS_REQUIRED"
        res_crit = next(c for c in elig2["criteriaBreakdown"] if "Residency" in c["criterionName"])
        assert res_crit["criterionResult"] == "PASS"
        assert res_crit["source"] == "USER_PROVIDED_DURING_INTERVIEW"
        # Next question is income
        assert elig2["currentQuestion"] is not None
        assert "Income" in elig2["currentQuestion"]["label"]

        # Step 3: Patient provides income exceeding threshold ("Above ₹1,20,000 / year") -> NOT_ELIGIBLE, 50% match
        res_step3 = await ac.post("/api/v1/schemes/eligibility/continue", json={
            "queryId": query_id,
            "additionalInfo": {"annual_income": "Above ₹1,20,000 / year"}
        }, headers=headers)
        assert res_step3.status_code == 200
        elig3 = res_step3.json()["eligibilityResult"]
        assert elig3["overallStatus"] == "NOT_ELIGIBLE"
        assert elig3["interviewState"] == "COMPLETED"
        assert elig3["matchPercentage"] == 50
        inc_crit = next(c for c in elig3["criteriaBreakdown"] if "Income" in c["criterionName"])
        assert inc_crit["criterionResult"] == "FAIL"

        # Step 4: Patient provides qualifying income ("Up to ₹1,20,000 / year") -> ELIGIBLE, 100% match
        res_step4 = await ac.post("/api/v1/schemes/eligibility/continue", json={
            "queryId": query_id,
            "additionalInfo": {"annual_income": "Up to ₹1,20,000 / year (or valid BPL / Ration Card)"}
        }, headers=headers)
        assert res_step4.status_code == 200
        elig4 = res_step4.json()["eligibilityResult"]
        assert elig4["overallStatus"] == "ELIGIBLE"
        assert elig4["interviewState"] == "COMPLETED"
        assert elig4["matchPercentage"] == 100
        inc_crit_pass = next(c for c in elig4["criteriaBreakdown"] if "Income" in c["criterionName"])
        assert inc_crit_pass["criterionResult"] == "PASS"
        assert inc_crit_pass["source"] == "USER_PROVIDED_DURING_INTERVIEW"

        # Step 5: Patient uploads verified document -> Source becomes DOCUMENT_VERIFIED
        res_step5 = await ac.post("/api/v1/schemes/eligibility/continue", json={
            "queryId": query_id,
            "additionalInfo": {"annual_income": "₹85,000 / year"},
            "uploadedDocumentId": "doc_income_cert_123"
        }, headers=headers)
        assert res_step5.status_code == 200
        elig5 = res_step5.json()["eligibilityResult"]
        assert elig5["overallStatus"] == "ELIGIBLE"
        inc_crit_doc = next(c for c in elig5["criteriaBreakdown"] if "Income" in c["criterionName"])
        assert inc_crit_doc["source"] == "DOCUMENT_VERIFIED"


async def test_ui_three_questions_matrix(db_session):
    """
    Validates the 3 exact questions from the UI:
    TEST A: 'Am I eligible for Ayushman Vay Vandana if I am 70+ years old?' -> PERSONAL_ELIGIBILITY, ELIGIBLE, 100% match, Income NOT_REQUIRED
    TEST B: 'Is cosmetic or aesthetic surgery covered under PM-JAY?' -> COVERAGE, NOT_COVERED, Missing Info []
    TEST C: 'What are the income and document requirements for Ayushman Bharat PM-JAY?' -> REQUIREMENTS, INFORMATIONAL
    """
    await _seed_test_schemes(db_session)

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        headers = await _get_auth_headers(ac, "ui_matrix_user@example.com")

        # TEST A: Personal Eligibility with age 70+
        res_a = await ac.post("/api/v1/schemes/scheme_C02/eligibility/query", json={
            "userQuestion": "Am I eligible for Ayushman Vay Vandana if I am 70+ years old?"
        }, headers=headers)
        assert res_a.status_code == 200
        data_a = res_a.json()
        elig_a = data_a["eligibilityResult"]
        assert elig_a["queryType"] == "PERSONAL_ELIGIBILITY"
        assert elig_a["overallStatus"] == "ELIGIBLE"
        assert elig_a["matchPercentage"] == 100
        assert elig_a["interviewState"] == "COMPLETED"
        # Income must be NOT_REQUIRED, not UNKNOWN
        income_crit = next(c for c in elig_a["criteriaBreakdown"] if "Income" in c["criterionName"])
        assert income_crit["criterionResult"] == "NOT_REQUIRED"
        assert income_crit["required"] is False
        assert len(elig_a["missingInformation"]) == 0

        # TEST B: Coverage Query for cosmetic surgery
        res_b = await ac.post("/api/v1/schemes/scheme_C01/eligibility/query", json={
            "userQuestion": "Is cosmetic or aesthetic surgery covered under PM-JAY?"
        }, headers=headers)
        assert res_b.status_code == 200
        data_b = res_b.json()
        elig_b = data_b["eligibilityResult"]
        assert elig_b["queryType"] in ["COVERAGE", "COVERAGE_QUERY"]
        assert elig_b["overallStatus"] == "NOT_COVERED"
        assert elig_b["interviewState"] == "COMPLETED"
        assert len(elig_b["missingInformation"]) == 0
        assert any(c["criterionResult"] == "FAIL" for c in elig_b["criteriaBreakdown"])

        # TEST C: Requirements Query for income & documents
        res_c = await ac.post("/api/v1/schemes/scheme_C01/eligibility/query", json={
            "userQuestion": "What are the income and document requirements for Ayushman Bharat PM-JAY?"
        }, headers=headers)
        assert res_c.status_code == 200
        data_c = res_c.json()
        elig_c = data_c["eligibilityResult"]
        assert elig_c["queryType"] in ["REQUIREMENTS", "REQUIREMENTS_QUERY"]
        assert elig_c["overallStatus"] == "INFORMATIONAL"
        assert elig_c["interviewState"] == "COMPLETED"
        assert len(elig_c["missingInformation"]) == 0


async def test_general_information_query(db_session):
    """TEST 6: General Scheme Information query -> GENERAL_INFORMATION, INFORMATIONAL."""
    await _seed_test_schemes(db_session)

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        headers = await _get_auth_headers(ac, "general_info_user@example.com")

        res = await ac.post("/api/v1/schemes/scheme_C01/eligibility/query", json={
            "userQuestion": "What is PM-JAY and what benefits does it provide?"
        }, headers=headers)
        assert res.status_code == 200
        data = res.json()
        elig = data["eligibilityResult"]
        assert elig["queryType"] == "GENERAL_INFORMATION"
        assert elig["overallStatus"] == "INFORMATIONAL"
        assert elig["interviewState"] == "COMPLETED"
        assert len(elig["missingInformation"]) == 0


async def test_unscoped_general_query_scheme_resolution_lock(db_session):
    """
    PHASE 1-24 VERIFICATION:
    When a user asks: 'Am I eligible for Ayushman Vay Vandana if I am 70+ years old?'
    without passing a scoped_scheme_id (e.g. from general search bar /schemes/query):
    1. The system MUST resolve and lock scheme_id to 'scheme_C02' (Ayushman Vay Vandana).
    2. It must NOT switch to TN CMCHIS.
    3. RAG must retrieve ONLY official Ayushman Vay Vandana chunks.
    4. Match percentage must be 100% and overallStatus must be ELIGIBLE.
    """
    await _seed_test_schemes(db_session)

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        headers = await _get_auth_headers(ac, "unscoped_user@example.com")

        res = await ac.post("/api/v1/schemes/query", json={
            "query_text": "Am I eligible for Ayushman Vay Vandana if I am 70+ years old?"
        }, headers=headers)
        assert res.status_code == 200
        data = res.json()

        # 1. Verify Scheme Identity is Locked to Ayushman Vay Vandana
        assert data["schemeId"] == "scheme_C02"
        elig = data["eligibilityResult"]
        assert elig["schemeId"] == "scheme_C02"
        assert "Vay Vandana" in elig["overallExplanation"]
        assert "CMCHIS" not in elig["overallExplanation"]
        assert "Tamil Nadu" not in elig["overallExplanation"]

        # 2. Verify RAG Evidence Sources belong strictly to Ayushman Vay Vandana
        assert len(elig["allEvidenceSources"]) >= 1
        for src in elig["allEvidenceSources"]:
            assert "Vay Vandana" in src["documentTitle"]
            assert "CMCHIS" not in src["documentTitle"]

        # 3. Verify Criteria and Match Percentage
        assert elig["overallStatus"] == "ELIGIBLE"
        assert elig["matchPercentage"] == 100
        assert elig["interviewState"] == "COMPLETED"
        assert len(elig["missingInformation"]) == 0


async def test_generic_multi_scheme_query_missing_profile_intake(db_session):
    """
    Test Case 3: Generic 'What schemes am I eligible for?' with no profile
    MUST return PROFILE_DATA_REQUIRED and structured intake questions for state, age, and annual income.
    """
    await _seed_test_schemes(db_session)

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        headers = await _get_auth_headers(ac, "generic_query_user@example.com")

        res = await ac.post("/api/v1/schemes/query", json={
            "query_text": "What schemes am I eligible for?"
        }, headers=headers)
        assert res.status_code == 200
        data = res.json()

        elig = data["eligibilityResult"]
        assert elig["queryType"] == "MULTI_SCHEME_ELIGIBILITY_QUERY"
        assert elig["overallStatus"] == "PROFILE_DATA_REQUIRED"
        assert elig["interviewState"] == "PROFILE_DATA_REQUIRED"
        assert len(elig["structuredMissingCriteria"]) == 3

        field_keys = [q["fieldKey"] for q in elig["structuredMissingCriteria"]]
        assert "state" in field_keys
        assert "age" in field_keys
        assert "annual_income" in field_keys


async def test_generic_multi_scheme_query_with_profile_evaluates_schemes(db_session):
    """
    Test Case 4: Generic 'What schemes am I eligible for?' with demographic info provided.
    Evaluates Tamil Nadu & Central schemes against official criteria and returns match breakdown.
    """
    await _seed_test_schemes(db_session)

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        headers = await _get_auth_headers(ac, "full_profile_user@example.com")

        res = await ac.post("/api/v1/schemes/query", json={
            "query_text": "What schemes am I eligible for?",
            "additional_info": {
                "state": "Tamil Nadu",
                "age": 72,
                "annual_income": "100000"
            }
        }, headers=headers)
        assert res.status_code == 200
        data = res.json()

        elig = data["eligibilityResult"]
        assert elig["queryType"] == "MULTI_SCHEME_ELIGIBILITY_QUERY"
        assert elig["overallStatus"] in ["ELIGIBLE", "POSSIBLY_ELIGIBLE"]
        assert elig["interviewState"] == "COMPLETED"
        assert len(elig["missingInformation"]) == 0
        assert "Tamil Nadu" in data["aiResponse"]
        assert len(data["retrievedChunks"]) >= 1




