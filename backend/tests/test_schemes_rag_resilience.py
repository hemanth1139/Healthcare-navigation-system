"""
Comprehensive RAG pipeline & Scheme Service Resilience Regression Tests.
Verifies that POST /api/v1/schemes/query and scheme services never fail with unhandled
exceptions or AttributeError on NoneType eligibility_result under all failure conditions.
"""

import pytest
from uuid import uuid4
from unittest.mock import patch, AsyncMock
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from app.core.database import Base
from app.models.user import User
from app.models.profile import PatientProfile
from app.models.scheme import GovernmentScheme, SchemeQuery
from app.schemas.scheme import SchemeQueryRequest, SchemeQueryOut, MultiDocEligibilityResultOut
from app.services.scheme_service import SchemeService, _normalize_rag_response
from app.rag.pipeline import RAGPipeline


@pytest.fixture
async def test_db_session():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    session_maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with session_maker() as session:
        # Seed test scheme
        sch = GovernmentScheme(
            scheme_id="scheme_C01",
            scheme_name="Ayushman Bharat PM-JAY",
            category="Central Government",
            coverage_amount="5,00,000 per family/year",
            benefits="Cashless secondary and tertiary hospitalization cover across India.",
            eligibility_criteria={"income_ceiling": "BPL / SECC 2011 Deprivation criteria"},
            key_covered_conditions=["Cardiology", "Oncology", "Orthopedics"],
            key_exclusions=["Cosmetic surgery", "OPD care"],
            official_url="https://pmjay.gov.in"
        )
        session.add(sch)
        await session.commit()
        yield session

    await engine.dispose()


@pytest.mark.asyncio
async def test_normalize_rag_response_with_none():
    """Test that _normalize_rag_response converts None into a valid structured dict."""
    res = _normalize_rag_response(None, "Am I eligible for PM-JAY?")
    assert isinstance(res, dict)
    assert "ai_response" in res
    assert "eligibility_result" in res
    assert isinstance(res["eligibility_result"], dict)
    assert res["eligibility_result"]["overall_status"] == "INSUFFICIENT_INFORMATION"


@pytest.mark.asyncio
async def test_normalize_rag_response_with_none_eligibility_result():
    """Test that _normalize_rag_response handles eligibility_result=None without crashing."""
    raw = {
        "ai_response": "Some general text",
        "retrieved_chunks": [],
        "confidence_score": 0.0,
        "is_low_confidence": True,
        "eligibility_result": None,
    }
    res = _normalize_rag_response(raw, "Is cosmetic surgery covered?")
    assert isinstance(res, dict)
    assert isinstance(res["eligibility_result"], dict)
    assert res["eligibility_result"]["overall_status"] == "INFORMATIONAL"
    assert res["eligibility_result"]["overall_explanation"] == "Some general text"


@pytest.mark.asyncio
async def test_normalize_rag_response_with_valid_dict():
    """Test that _normalize_rag_response preserves existing valid eligibility_result."""
    raw = {
        "ai_response": "You are eligible.",
        "retrieved_chunks": [{"chunk_id": "c1", "scheme_name": "PM-JAY", "excerpt": "Rules", "official_url": "https://pmjay.gov.in"}],
        "confidence_score": 0.95,
        "is_low_confidence": False,
        "eligibility_result": {
            "query_id": "q_123",
            "scheme_id": "scheme_C01",
            "query_type": "PERSONAL_ELIGIBILITY",
            "user_question": "Am I eligible?",
            "interview_state": "COMPLETED",
            "current_question": None,
            "progress": {"answered": 2, "total_required": 2},
            "match_percentage": 100,
            "overall_status": "ELIGIBLE",
            "overall_explanation": "You meet all income criteria.",
            "criteria_breakdown": [],
            "missing_information": [],
            "structured_missing_criteria": [],
            "all_evidence_sources": [],
            "profile_complete": True,
            "missing_required_fields": [],
            "profile_completion_status": "complete",
            "schemes": [],
            "queried_at": "2026-10-03T00:00:00Z"
        }
    }
    res = _normalize_rag_response(raw, "Am I eligible?")
    assert res["eligibility_result"]["overall_status"] == "ELIGIBLE"
    assert res["confidence_score"] == 0.95


@pytest.mark.asyncio
async def test_query_scheme_resilience_when_rag_returns_none(test_db_session: AsyncSession):
    """Test that SchemeService.query_scheme never raises AttributeError when RAGPipeline returns None."""
    with patch.object(RAGPipeline, "query", new_callable=AsyncMock) as mock_query:
        mock_query.return_value = None

        req = SchemeQueryRequest(query_text="What schemes am I eligible for?")
        out = await SchemeService.query_scheme(test_db_session, req)

        assert out is not None
        assert isinstance(out, SchemeQueryOut)
        assert out.user_question == "What schemes am I eligible for?"
        assert out.eligibility_result is not None
        assert out.eligibility_result.overall_status == "INSUFFICIENT_INFORMATION"


@pytest.mark.asyncio
async def test_query_scheme_resilience_when_eligibility_result_is_none(test_db_session: AsyncSession):
    """Test that SchemeService.query_scheme never raises AttributeError when eligibility_result is None."""
    with patch.object(RAGPipeline, "query", new_callable=AsyncMock) as mock_query:
        mock_query.return_value = {
            "ai_response": "No relevant government healthcare scheme found.",
            "retrieved_chunks": [],
            "confidence_score": 0.0,
            "is_low_confidence": True,
            "follow_up_suggestions": ["What schemes are available in Tamil Nadu?"],
            "eligibility_result": None
        }

        req = SchemeQueryRequest(query_text="Unrelated query about car repairs")
        out = await SchemeService.query_scheme(test_db_session, req)

        assert out is not None
        assert isinstance(out, SchemeQueryOut)
        assert out.eligibility_result is not None
        assert out.eligibility_result.overall_status == "INFORMATIONAL"


@pytest.mark.asyncio
async def test_query_scheme_resilience_when_rag_raises_exception(test_db_session: AsyncSession):
    """Test that SchemeService.query_scheme gracefully handles unhandled exceptions from RAG."""
    with patch.object(RAGPipeline, "query", new_callable=AsyncMock) as mock_query:
        mock_query.side_effect = RuntimeError("Gemini API connection timed out")

        req = SchemeQueryRequest(query_text="Tell me about PM-JAY")
        out = await SchemeService.query_scheme(test_db_session, req)

        assert out is not None
        assert isinstance(out, SchemeQueryOut)
        assert out.eligibility_result is not None


@pytest.mark.asyncio
async def test_from_orm_with_malformed_eligibility_data():
    """Test that SchemeQueryOut.from_orm handles invalid, non-dict, or partial eligibility data."""
    q = SchemeQuery(
        query_id=uuid4(),
        user_question="Test question",
        ai_response="Test response",
        retrieved_chunks=[],
        eligibility_result="Not a dict", # type: ignore
        confidence_score=0.8
    )
    out = SchemeQueryOut.from_orm(q)
    assert out.query_id == str(q.query_id)
    assert out.eligibility_result is None


@pytest.mark.asyncio
async def test_open_ended_demographics_required():
    """Test that open-ended inquiry returns PROFILE_DATA_REQUIRED when no profile context is present."""
    res = await RAGPipeline.query(
        query_text="What schemes am I eligible for?",
        patient_context=None,
        additional_info=None
    )
    assert isinstance(res, dict)
    assert res.get("eligibility_result") is not None
    assert res["eligibility_result"]["overall_status"] == "PROFILE_DATA_REQUIRED"
    assert len(res["eligibility_result"]["missing_information"]) > 0


@pytest.mark.asyncio
async def test_senior_citizen_eligibility_evaluated():
    """Test senior citizen qualification when age >= 70 is provided."""
    res = await RAGPipeline.query(
        query_text="Am I eligible for senior citizen scheme?",
        scoped_scheme_id="scheme_C01",
        patient_context={"age": 72, "state": "Tamil Nadu"},
        additional_info={"age": 72}
    )
    assert isinstance(res, dict)
    assert res.get("eligibility_result") is not None
    assert res["eligibility_result"]["overall_status"] in ["ELIGIBLE", "POSSIBLY_ELIGIBLE", "COVERED", "INFORMATIONAL", "INSUFFICIENT_INFORMATION"]
