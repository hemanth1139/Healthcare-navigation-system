"""
Government Scheme service — seeds scheme tables, manages search queries,
and links RAG query results to database history logs.
"""

from uuid import UUID
from datetime import date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, desc
from typing import List, Optional, Dict, Any

from app.models.user import User
from app.models.profile import PatientProfile
from app.models.scheme import GovernmentScheme, SchemeQuery
from app.schemas.scheme import (
    GovernmentSchemeOut,
    SchemeQueryRequest,
    SchemeQueryOut,
    EligibilityEvaluationRequest,
    EligibilityContinueRequest,
)
from app.rag.pipeline import RAGPipeline
from app.services.profile_service import ProfileService
from app.core.exceptions import NotFoundError, ForbiddenError


async def _get_profile(db: AsyncSession, user: User) -> PatientProfile:
    """Fetch the patient profile for the user."""
    result = await db.execute(
        select(PatientProfile).where(PatientProfile.user_id == user.user_id)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise NotFoundError("Patient profile")
    return profile


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
            if category_filter == "Central Government":
                query = query.where(
                    or_(
                        GovernmentScheme.category == "Central Government",
                        GovernmentScheme.state.ilike("%Central%"),
                        GovernmentScheme.state.ilike("%All India%"),
                    )
                )
            elif category_filter == "State Government":
                query = query.where(
                    and_(
                        ~GovernmentScheme.state.ilike("%All India%"),
                        GovernmentScheme.category == "State Government"
                    )
                ) if False else query.where(GovernmentScheme.category == category_filter)
            else:
                query = query.where(GovernmentScheme.category == category_filter)

        if search_query and search_query.strip():
            term = f"%{search_query.strip()}%"
            query = query.where(
                or_(
                    GovernmentScheme.scheme_name.ilike(term),
                    GovernmentScheme.department.ilike(term),
                    GovernmentScheme.eligibility.ilike(term),
                    GovernmentScheme.benefits.ilike(term),
                    GovernmentScheme.state.ilike(term),
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
        db: AsyncSession,
        payload: SchemeQueryRequest,
        current_user: Optional[User] = None
    ) -> SchemeQueryOut:
        """Queries the RAG pipeline, stores the query details, and returns response."""
        profile = None
        patient_ctx = None

        if current_user:
            try:
                profile = await _get_profile(db, current_user)
                patient_ctx = await ProfileService.get_patient_context(db, current_user.user_id)
            except Exception:
                profile = None

        # 1. Run RAG Pipeline query (vector similarity search + Gemini decomposition)
        rag_res = await RAGPipeline.query(
            query_text=payload.query_text,
            scoped_scheme_id=payload.scoped_scheme_id,
            patient_context=patient_ctx,
            additional_info=payload.additional_info,
        )

        # 2. Correlate top match chunk back to a database scheme
        scheme_id = payload.scoped_scheme_id or (
            rag_res.get("eligibility_result", {}).get("scheme_id") if rag_res.get("eligibility_result") else None
        )
        if not scheme_id and rag_res.get("retrieved_chunks"):
            scheme_id = rag_res["retrieved_chunks"][0].get("scheme_id")
        if not scheme_id:
            scheme_id = "scheme_C01"

        # Parse conversation_id if valid UUID
        conv_uuid = None
        if payload.conversation_id:
            try:
                conv_uuid = UUID(payload.conversation_id)
            except Exception:
                conv_uuid = None

        # 3. Save query log to DB
        q_log = SchemeQuery(
            profile_id=profile.profile_id if profile else None,
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

    @staticmethod
    async def evaluate_scheme_eligibility(
        db: AsyncSession,
        current_user: User,
        scheme_id: str,
        payload: EligibilityEvaluationRequest
    ) -> SchemeQueryOut:
        """Evaluates eligibility specifically for a scoped government scheme using authenticated patient context."""
        profile = await _get_profile(db, current_user)
        patient_ctx = await ProfileService.get_patient_context(db, current_user.user_id)

        if payload.patient_context_override:
            patient_ctx.update(payload.patient_context_override)

        scheme = await SchemeService.get_scheme_by_id(db, scheme_id)

        q_text = payload.user_question or f"Am I eligible for {scheme.scheme_name}?"

        rag_res = await RAGPipeline.query(
            query_text=q_text,
            scoped_scheme_id=scheme_id,
            patient_context=patient_ctx,
            additional_info=payload.additional_info,
            uploaded_document_id=payload.uploaded_document_id,
        )

        q_log = SchemeQuery(
            profile_id=profile.profile_id,
            scheme_id=scheme_id,
            user_question=q_text,
            ai_response=rag_res["ai_response"],
            retrieved_chunks=rag_res["retrieved_chunks"],
            eligibility_result=rag_res.get("eligibility_result"),
            confidence_score=rag_res["confidence_score"]
        )
        db.add(q_log)
        await db.flush()

        return SchemeQueryOut.from_orm(q_log, rag_res["retrieved_chunks"])

    @staticmethod
    async def continue_scheme_eligibility(
        db: AsyncSession,
        current_user: User,
        payload: EligibilityContinueRequest
    ) -> SchemeQueryOut:
        """Continues an existing eligibility inquiry by supplying missing criteria / uploaded documents."""
        profile = await _get_profile(db, current_user)
        
        try:
            target_uuid = UUID(payload.query_id)
        except ValueError:
            raise NotFoundError(f"Eligibility query '{payload.query_id}'")

        res = await db.execute(
            select(SchemeQuery).where(
                SchemeQuery.query_id == target_uuid,
                SchemeQuery.profile_id == profile.profile_id
            )
        )
        q_log = res.scalar_one_or_none()
        if not q_log:
            raise NotFoundError(f"Eligibility query '{payload.query_id}'")

        patient_ctx = await ProfileService.get_patient_context(db, current_user.user_id)

        # Merge previously established criteria answers with new inputs
        merged_info: Dict[str, Any] = {}
        if q_log.eligibility_result and isinstance(q_log.eligibility_result, dict):
            prev_breakdown = q_log.eligibility_result.get("criteria_breakdown", [])
            for prev_c in prev_breakdown:
                f_key = prev_c.get("field_key")
                p_val = prev_c.get("patient_value")
                if f_key and p_val and p_val != "Not specified" and prev_c.get("criterion_result") != "UNKNOWN":
                    merged_info[f_key] = p_val

        if payload.additional_info:
            merged_info.update(payload.additional_info)

        if payload.criterion_id and payload.answer:
            c_id = payload.criterion_id.lower()
            ans = str(payload.answer)
            if "age" in c_id or "70" in c_id:
                if "70" in ans or "above" in ans or "70_plus" in ans:
                    merged_info["age"] = 72
                elif "60" in ans:
                    merged_info["age"] = 65
                else:
                    merged_info["age"] = 55
            elif "residency" in c_id or "state" in c_id:
                merged_info["state"] = ans
            elif "income" in c_id or "bpl" in c_id or "socio" in c_id:
                if any(kw in ans.lower() for kw in ["up to", "bpl", "secc", "yes", "low", "1,20,000"]):
                    merged_info["annual_income"] = "50000"
                elif any(kw in ans.lower() for kw in ["above", "high", "exceed", "no"]):
                    merged_info["annual_income"] = "250000"
                else:
                    merged_info["annual_income"] = ans
            else:
                merged_info[payload.criterion_id] = ans

        # Clean prompt presentation
        combined_text = q_log.user_question

        rag_res = await RAGPipeline.query(
            query_text=combined_text,
            scoped_scheme_id=q_log.scheme_id,
            patient_context=patient_ctx,
            additional_info=merged_info,
            uploaded_document_id=payload.uploaded_document_id,
        )

        # Update existing query log
        q_log.user_question = combined_text
        q_log.ai_response = rag_res["ai_response"]
        q_log.retrieved_chunks = rag_res["retrieved_chunks"]
        q_log.eligibility_result = rag_res.get("eligibility_result")
        q_log.confidence_score = rag_res["confidence_score"]

        await db.flush()

        return SchemeQueryOut.from_orm(q_log, rag_res["retrieved_chunks"])

    @staticmethod
    async def list_user_queries(
        db: AsyncSession,
        current_user: User
    ) -> List[SchemeQueryOut]:
        """Lists past scheme eligibility queries performed by the authenticated patient."""
        profile = await _get_profile(db, current_user)

        res = await db.execute(
            select(SchemeQuery)
            .where(SchemeQuery.profile_id == profile.profile_id)
            .order_by(desc(SchemeQuery.created_at))
        )
        queries = res.scalars().all()
        return [SchemeQueryOut.from_orm(q) for q in queries]

    @staticmethod
    async def get_user_query(
        db: AsyncSession,
        current_user: User,
        query_id: UUID
    ) -> SchemeQueryOut:
        """Fetches a specific eligibility query, strictly checking patient ownership."""
        profile = await _get_profile(db, current_user)

        res = await db.execute(
            select(SchemeQuery).where(
                SchemeQuery.query_id == query_id,
                SchemeQuery.profile_id == profile.profile_id
            )
        )
        q = res.scalar_one_or_none()
        if not q:
            # Check if exists under another user to return 404/403
            other_check = await db.execute(select(SchemeQuery).where(SchemeQuery.query_id == query_id))
            if other_check.scalar_one_or_none():
                raise ForbiddenError("You do not have permission to view this eligibility query report.")
            raise NotFoundError(f"Eligibility query '{query_id}'")

        return SchemeQueryOut.from_orm(q)
