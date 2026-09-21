"""
Government Scheme service — seeds scheme tables, manages search queries,
and links RAG query results to database history logs.
"""

from uuid import UUID
from datetime import date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from typing import List, Optional

from app.models.scheme import GovernmentScheme, SchemeQuery
from app.schemas.scheme import GovernmentSchemeOut, SchemeQueryRequest, SchemeQueryOut
from app.rag.pipeline import RAGPipeline
from app.core.exceptions import NotFoundError


class SchemeService:

    @staticmethod
    async def list_schemes(
        db: AsyncSession,
        category_filter: Optional[str] = None,
        search_query: Optional[str] = None
    ) -> List[GovernmentSchemeOut]:
        """List available government healthcare schemes with optional category & keyword filtering."""
        query = select(GovernmentScheme).order_by(GovernmentScheme.scheme_name.asc())

        if category_filter and category_filter != "All":
            query = query.where(GovernmentScheme.category == category_filter)

        if search_query and search_query.strip():
            term = f"%{search_query.strip()}%"
            query = query.where(
                or_(
                    GovernmentScheme.scheme_name.ilike(term),
                    GovernmentScheme.department.ilike(term),
                    GovernmentScheme.eligibility.ilike(term),
                    GovernmentScheme.benefits.ilike(term),
                )
            )

        result = await db.execute(query)
        schemes = result.scalars().all()
        return [GovernmentSchemeOut.from_orm(s) for s in schemes]

    @staticmethod
    async def get_scheme_by_id(db: AsyncSession, scheme_id: str) -> GovernmentScheme:
        """Get individual scheme details by scheme_id string."""
        result = await db.execute(select(GovernmentScheme).where(GovernmentScheme.scheme_id == scheme_id))
        scheme = result.scalar_one_or_none()
        if not scheme:
            raise NotFoundError(f"Government scheme with ID '{scheme_id}'")
        return scheme

    @staticmethod
    async def query_scheme(
        db: AsyncSession, payload: SchemeQueryRequest
    ) -> SchemeQueryOut:
        """Queries the RAG pipeline, stores the query details, and returns response."""
        # 1. Run RAG Pipeline query (vector similarity search + LLM generation)
        rag_res = await RAGPipeline.query(
            query_text=payload.query_text,
            scoped_scheme_id=payload.scoped_scheme_id
        )

        # 2. Correlate top match chunk back to a database scheme
        scheme_id = payload.scoped_scheme_id
        if not scheme_id and rag_res["retrieved_chunks"]:
            top_match_name = rag_res["retrieved_chunks"][0]["scheme_name"]
            scheme_res = await db.execute(
                select(GovernmentScheme).where(GovernmentScheme.scheme_name == top_match_name)
            )
            matched_scheme = scheme_res.scalar_one_or_none()
            if matched_scheme:
                scheme_id = matched_scheme.scheme_id

        # Parse conversation_id if valid UUID
        conv_uuid = None
        if payload.conversation_id:
            try:
                conv_uuid = UUID(payload.conversation_id)
            except Exception:
                conv_uuid = None

        # 3. Save query log to DB
        q_log = SchemeQuery(
            conversation_id=conv_uuid,
            scheme_id=scheme_id,
            user_question=payload.query_text,
            ai_response=rag_res["ai_response"],
            retrieved_chunks=rag_res["retrieved_chunks"],
            eligibility_result=rag_res.get("eligibility_result"),
            confidence_score=rag_res["confidence_score"]
        )
        db.add(q_log)
        await db.flush()

        # 4. Return formatted schema output
        return SchemeQueryOut.from_orm(q_log, rag_res["retrieved_chunks"])
