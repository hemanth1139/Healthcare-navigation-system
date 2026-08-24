"""
Government Scheme service — seeds scheme tables, manages search queries,
and links RAG query results to database history logs.
"""

from uuid import UUID
from datetime import date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional

from app.models.scheme import GovernmentScheme, SchemeQuery
from app.schemas.scheme import GovernmentSchemeOut, SchemeQueryRequest, SchemeQueryOut
from app.rag.pipeline import RAGPipeline
from app.core.exceptions import NotFoundError


class SchemeService:

    @staticmethod
    async def list_schemes(db: AsyncSession) -> List[GovernmentSchemeOut]:
        """List all available government healthcare schemes."""
        result = await db.execute(select(GovernmentScheme).order_by(GovernmentScheme.scheme_name.asc()))
        schemes = result.scalars().all()
        return [GovernmentSchemeOut.from_orm(s) for s in schemes]

    @staticmethod
    async def get_scheme_by_id(db: AsyncSession, scheme_id: UUID) -> GovernmentScheme:
        """Get individual scheme details."""
        result = await db.execute(select(GovernmentScheme).where(GovernmentScheme.scheme_id == scheme_id))
        scheme = result.scalar_one_or_none()
        if not scheme:
            raise NotFoundError("Government scheme")
        return scheme

    @staticmethod
    async def query_scheme(
        db: AsyncSession, payload: SchemeQueryRequest
    ) -> SchemeQueryOut:
        """Queries the RAG pipeline, stores the query details, and returns response."""
        # 1. Run RAG Pipeline query (vector similarity search + LLM generation)
        rag_res = await RAGPipeline.query(payload.query_text)

        # 2. Correlate top match chunk back to a database scheme
        scheme_id = None
        if rag_res["retrieved_chunks"]:
            top_match_name = rag_res["retrieved_chunks"][0]["scheme_name"]
            scheme_res = await db.execute(
                select(GovernmentScheme).where(GovernmentScheme.scheme_name == top_match_name)
            )
            matched_scheme = scheme_res.scalar_one_or_none()
            if matched_scheme:
                scheme_id = matched_scheme.scheme_id

        # 3. Save query log to DB
        q_log = SchemeQuery(
            conversation_id=UUID(payload.conversation_id),
            scheme_id=scheme_id,
            user_question=payload.query_text,
            ai_response=rag_res["ai_response"],
            retrieved_chunks=rag_res["retrieved_chunks"], # JSON field
            confidence_score=rag_res["confidence_score"]
        )
        db.add(q_log)
        await db.flush()

        # 4. Return formatted schema output
        return SchemeQueryOut.from_orm(q_log, rag_res["retrieved_chunks"])
