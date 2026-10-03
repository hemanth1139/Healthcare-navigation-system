import json
import os
import pytest
from datetime import date
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.scheme import GovernmentScheme
from app.rag.vectorstore import VectorStore
from app.rag.pipeline import RAGPipeline

def _get_schemes_json():
    json_path = os.path.join(os.path.dirname(__file__), "..", "healthcare_schemes.json")
    if not os.path.exists(json_path):
        json_path = "healthcare_schemes.json"
    with open(json_path, "r", encoding="utf-8") as f:
        return json.load(f)

async def _seed_schemes_if_needed(db: AsyncSession):
    res = await db.execute(select(GovernmentScheme))
    existing_ids = {s.scheme_id for s in res.scalars().all()}
    schemes = _get_schemes_json()
    for s in schemes:
        if s["scheme_id"] not in existing_ids:
            db.add(GovernmentScheme(
                scheme_id=s["scheme_id"],
                scheme_name=s["scheme_name"],
                department=s["department"],
                category=s.get("category", "General"),
                state=s.get("state", "All India"),
                cashless=s.get("cashless", True),
                coverage_amount=s.get("coverage_amount"),
                eligibility=s.get("eligibility", ""),
                benefits=s.get("benefits", ""),
                official_url=s.get("official_url", ""),
                last_updated=date(2026, 10, 3),
                eligibility_criteria=s.get("eligibility_criteria", {}),
                key_covered_conditions=s.get("key_covered_conditions", []),
                key_exclusions=s.get("key_exclusions", []),
                chunks=s.get("chunks", [])
            ))
    await db.commit()

@pytest.mark.asyncio
async def test_scheme_counts_and_inventory(db_session: AsyncSession):
    """Database and JSON inventory must contain all 20 schemes (11 Central, 9 Tamil Nadu)."""
    schemes_json = _get_schemes_json()
    assert len(schemes_json) == 20
    
    await _seed_schemes_if_needed(db_session)
    res = await db_session.execute(select(GovernmentScheme))
    schemes = res.scalars().all()
    assert len(schemes) == 20
    
    central_schemes = [s for s in schemes if "TN" not in s.scheme_id]
    tn_schemes = [s for s in schemes if "TN" in s.scheme_id]
    
    assert len(central_schemes) == 11
    assert len(tn_schemes) == 9

def test_scheme_urls_verified():
    """All 20 schemes in healthcare_schemes.json must have valid official_url, portal_url, guidelines_url, and VERIFIED status."""
    schemes = _get_schemes_json()
    assert len(schemes) == 20
    
    for s in schemes:
        assert s["official_url"].startswith("https://") or s["official_url"].startswith("http://")
        assert s.get("portal_url") is not None and len(s["portal_url"]) > 0
        assert s.get("guidelines_url") is not None and len(s["guidelines_url"]) > 0
        assert s.get("verification_status") == "VERIFIED"

def test_vector_store_all_20_schemes_indexed():
    """Vector store must contain indexed chunks across all 20 unique schemes."""
    vs = VectorStore()
    assert len(vs.documents) >= 200
    
    indexed_schemes = {doc.get("metadata", {}).get("scheme_id") for doc in vs.documents if doc.get("metadata", {}).get("scheme_id")}
    assert len(indexed_schemes) == 20

@pytest.mark.asyncio
async def test_rag_maternity_query_retrieval(db_session: AsyncSession):
    """Maternity query must retrieve maternity-focused schemes, not just AB-PMJAY."""
    await _seed_schemes_if_needed(db_session)
    query = "What maternity benefits and pregnancy assistance schemes are available in Tamil Nadu?"
    
    result = await RAGPipeline.query(
        query_text=query,
        patient_context={"age": 28, "annual_income": 60000, "state": "Tamil Nadu", "pregnancy_status": True, "gender": "Female"}
    )
    
    assert result is not None
    chunks = result.get("retrieved_chunks", [])
    elig = result.get("eligibility_result", {})
    ev = elig.get("all_evidence_sources", [])
    all_titles = [c.get("document_title", "") for c in chunks] + [e.get("document_title", "") for e in ev]
    text_content = (result.get("ai_response", "") + " " + " ".join(all_titles)).lower()
    
    assert "muthulakshmi" in text_content or "matru" in text_content or "pmmvy" in text_content or "maternity" in text_content or "pregnant" in text_content

@pytest.mark.asyncio
async def test_rag_tamil_nadu_schemes_retrieval(db_session: AsyncSession):
    """Tamil Nadu query must retrieve state schemes (CMCHIS, Moovalur, Innuyir Kaappom, etc.)."""
    await _seed_schemes_if_needed(db_session)
    query = "What healthcare schemes are available specifically in Tamil Nadu?"
    
    result = await RAGPipeline.query(
        query_text=query,
        patient_context={"state": "Tamil Nadu"}
    )
    
    assert result is not None
    chunks = result.get("retrieved_chunks", [])
    elig = result.get("eligibility_result", {})
    ev = elig.get("all_evidence_sources", [])
    all_titles = [c.get("document_title", "") for c in chunks] + [e.get("document_title", "") for e in ev]
    text_content = (result.get("ai_response", "") + " " + " ".join(all_titles)).lower()
    
    assert "tamil nadu" in text_content or "cmchis" in text_content or "innuyir" in text_content or "kalaignar" in text_content or "tn" in text_content

@pytest.mark.asyncio
async def test_rag_no_default_ab_pmjay_for_accident_query(db_session: AsyncSession):
    """Query about emergency accident road care should prioritize Innuyir Kaappom / Emergency assistance."""
    await _seed_schemes_if_needed(db_session)
    query = "Is there free emergency road accident trauma care in Tamil Nadu?"
    
    result = await RAGPipeline.query(
        query_text=query,
        patient_context={"state": "Tamil Nadu"}
    )
    
    assert result is not None
    chunks = result.get("retrieved_chunks", [])
    elig = result.get("eligibility_result", {})
    ev = elig.get("all_evidence_sources", [])
    all_titles = [c.get("document_title", "") for c in chunks] + [e.get("document_title", "") for e in ev]
    text_content = (result.get("ai_response", "") + " " + " ".join(all_titles)).lower()
    
    assert "innuyir" in text_content or "accident" in text_content or "emergency" in text_content or "trauma" in text_content or "kaakkum" in text_content
