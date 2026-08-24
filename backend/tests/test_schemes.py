"""
Government Schemes RAG API integration tests.
"""

import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.models.scheme import GovernmentScheme
from app.rag.vectorstore import VectorStore
from app.rag.embeddings import EmbeddingService

pytestmark = pytest.mark.asyncio


async def _get_auth_headers(ac: AsyncClient) -> dict:
    """Helper to register/login a user and get auth header."""
    reg_payload = {
        "fullName": "RAG Test User",
        "email": "ragtest@example.com",
        "phone": "+15554445555",
        "password": "ragtestpassword123",
    }
    res = await ac.post("/api/v1/auth/register", json=reg_payload)
    token = res.json()["tokens"]["accessToken"]
    return {"Authorization": f"Bearer {token}"}


async def _seed_test_schemes(db_session):
    """Seed test database and vector store with RAG contents."""
    # Seed 3 database items
    s1 = GovernmentScheme(
        scheme_name="Ayushman Bharat PM-JAY",
        department="National Health Authority",
        eligibility="SECC 2011 lists",
        benefits="Hospitalization coverage up to 5 Lakhs",
        official_url="https://pmjay.gov.in"
    )
    s2 = GovernmentScheme(
        scheme_name="Central Government Health Scheme (CGHS)",
        department="Ministry of Health",
        eligibility="Central gov employees",
        benefits="Comprehensive medical care",
        official_url="https://cghs.nic.in"
    )
    s3 = GovernmentScheme(
        scheme_name="Tamil Nadu CMCHIS",
        department="Tamil Nadu Government",
        eligibility="Income under 1.2 Lakhs",
        benefits="Cashless cover up to 5 Lakhs",
        official_url="https://www.cmchistn.com"
    )
    db_session.add_all([s1, s2, s3])
    await db_session.commit()
    await db_session.refresh(s1)
    
    # Seed vector store indices
    v_store = VectorStore()
    v_store.clear()
    
    emb = await EmbeddingService.get_embedding("Ayushman Bharat PM-JAY coverage details")
    v_store.add_texts(
        ["Ayushman Bharat PM-JAY provides distinct secondary and tertiary healthcare coverage up to ₹5,00,000 per family per year."],
        [emb],
        [{"scheme_id": str(s1.scheme_id), "scheme_name": "Ayushman Bharat PM-JAY", "official_url": "https://pmjay.gov.in"}]
    )


async def test_schemes_and_rag_query_flow(db_session):
    """Verify listing schemes, loading details, and running RAG Q&A queries."""
    # 1. Seed test database and vector indices
    await _seed_test_schemes(db_session)

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        headers = await _get_auth_headers(ac)

        # 2. Start a conversation session (needed for conversation_id reference in queries)
        res_conv = await ac.post(
            "/api/v1/conversations",
            json={"language": "en", "inputType": "text"},
            headers=headers,
        )
        conversation_id = res_conv.json()["conversationId"]

        # 3. List schemes (should return the seeded items)
        res_list = await ac.get("/api/v1/schemes", headers=headers)
        assert res_list.status_code == 200
        schemes = res_list.json()
        assert len(schemes) >= 3
        assert "schemeId" in schemes[0]
        assert "schemeName" in schemes[0]
        
        scheme_id = schemes[0]["schemeId"]

        # 4. Retrieve specific scheme details
        res_detail = await ac.get(f"/api/v1/schemes/{scheme_id}", headers=headers)
        assert res_detail.status_code == 200
        assert res_detail.json()["schemeId"] == scheme_id
        assert res_detail.json()["schemeName"] != ""

        # 5. Perform a RAG query query
        payload = {
            "conversationId": conversation_id,
            "queryText": "Ayushman Bharat PM-JAY coverage details"
        }
        res_query = await ac.post("/api/v1/schemes/query", json=payload, headers=headers)
        assert res_query.status_code == 200
        query_data = res_query.json()
        
        # Verify RAG responses fields
        assert "queryId" in query_data
        assert "userQuestion" in query_data
        assert "aiResponse" in query_data
        assert "retrievedChunks" in query_data
        assert "confidenceScore" in query_data
        
        assert query_data["userQuestion"] == "Ayushman Bharat PM-JAY coverage details"
        assert len(query_data["retrievedChunks"]) >= 1
        assert query_data["retrievedChunks"][0]["schemeName"] == "Ayushman Bharat PM-JAY"
        assert query_data["retrievedChunks"][0]["excerpt"] != ""
        assert query_data["retrievedChunks"][0]["officialUrl"] != ""
