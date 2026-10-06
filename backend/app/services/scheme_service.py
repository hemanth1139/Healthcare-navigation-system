"""
Government Scheme service — seeds scheme tables, manages search queries,
and links RAG query results to database history logs.
"""

import logging
from uuid import UUID, uuid4
from datetime import date, datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, desc, cast, String
from typing import List, Optional, Dict, Any
from app.core.cache import rag_cache

logger = logging.getLogger("app.services.scheme_service")


def _normalize_rag_response(
    rag_res: Any,
    query_text: str,
    scoped_scheme_id: Optional[str] = None,
) -> Dict[str, Any]:
    """Ensures rag_res is a valid dictionary conforming to the expected RAG output structure."""
    now_iso = datetime.now(timezone.utc).isoformat()
    if not isinstance(rag_res, dict):
        q_id_fallback = str(uuid4())
        return {
            "ai_response": "We encountered an unexpected issue analyzing government scheme eligibility. Please try asking about a specific scheme or provide your demographic details.",
            "retrieved_chunks": [],
            "confidence_score": 0.0,
            "is_low_confidence": True,
            "follow_up_suggestions": [
                "What schemes are available in Tamil Nadu?",
                "Am I eligible for PM-JAY?",
                "What are the senior citizen healthcare schemes?"
            ],
            "eligibility_result": {
                "query_id": q_id_fallback,
                "scheme_id": scoped_scheme_id,
                "query_type": "ERROR_FALLBACK",
                "user_question": query_text,
                "interview_state": "COMPLETED",
                "current_question": None,
                "progress": None,
                "match_percentage": None,
                "overall_status": "INSUFFICIENT_INFORMATION",
                "overall_explanation": "Unable to complete full eligibility assessment at this moment. Please retry.",
                "criteria_breakdown": [],
                "missing_information": [],
                "structured_missing_criteria": [],
                "all_evidence_sources": [],
                "profile_complete": False,
                "missing_required_fields": [],
                "profile_completion_status": "incomplete",
                "schemes": [],
                "queried_at": now_iso,
            },
            "profile_complete": False,
            "missing_required_fields": [],
            "profile_completion_status": "incomplete",
            "schemes": [],
        }

    ai_response = str(rag_res.get("ai_response") or "")
    retrieved_chunks = rag_res.get("retrieved_chunks") if isinstance(rag_res.get("retrieved_chunks"), list) else []
    try:
        confidence_score = float(rag_res.get("confidence_score", 0.0))
    except (ValueError, TypeError):
        confidence_score = 0.0

    is_low_confidence = bool(rag_res.get("is_low_confidence", confidence_score < 0.65))
    follow_up_suggestions = rag_res.get("follow_up_suggestions") if isinstance(rag_res.get("follow_up_suggestions"), list) else []

    elig_res = rag_res.get("eligibility_result")
    if not isinstance(elig_res, dict):
        elig_res = {
            "query_id": str(uuid4()),
            "scheme_id": scoped_scheme_id,
            "query_type": "GENERAL_INFORMATION",
            "user_question": query_text,
            "interview_state": "COMPLETED",
            "current_question": None,
            "progress": None,
            "match_percentage": None,
            "overall_status": "INFORMATIONAL",
            "overall_explanation": ai_response or "Scheme information retrieved.",
            "criteria_breakdown": [],
            "missing_information": [],
            "structured_missing_criteria": [],
            "all_evidence_sources": [],
            "profile_complete": True,
            "missing_required_fields": [],
            "profile_completion_status": "complete",
            "schemes": [],
            "queried_at": now_iso,
        }

    return {
        "ai_response": ai_response,
        "retrieved_chunks": retrieved_chunks,
        "confidence_score": confidence_score,
        "is_low_confidence": is_low_confidence,
        "follow_up_suggestions": follow_up_suggestions,
        "eligibility_result": elig_res,
        "profile_complete": rag_res.get("profile_complete"),
        "missing_required_fields": rag_res.get("missing_required_fields") or [],
        "profile_completion_status": rag_res.get("profile_completion_status"),
        "schemes": rag_res.get("schemes") or [],
    }

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
        # Generate cache key
        cache_key = f"schemes_list:{category_filter or 'all'}:{search_query or 'none'}"
        cached = rag_cache.get(cache_key)
        if cached:
            logger.info("[SchemeService] Cache hit for schemes list")
            return cached
        
        query = select(GovernmentScheme).order_by(GovernmentScheme.scheme_name.asc())

        if category_filter and category_filter != "All":
            norm_cat = category_filter.strip().lower()
            if norm_cat in ["central", "central government"]:
                query = query.where(
                    or_(
                        GovernmentScheme.category.ilike("%Central%"),
                        GovernmentScheme.state.ilike("%Central%"),
                        GovernmentScheme.state.ilike("%All India%"),
                    )
                )
            elif norm_cat in ["state", "state government", "tamil nadu"]:
                query = query.where(
                    or_(
                        GovernmentScheme.category.ilike("%State%"),
                        GovernmentScheme.state.ilike("%Tamil Nadu%"),
                    )
                )
            elif norm_cat in ["health ministry", "ministry of health"]:
                query = query.where(
                    or_(
                        GovernmentScheme.department.ilike("%Health%"),
                        GovernmentScheme.department.ilike("%Family Welfare%"),
                        GovernmentScheme.department.ilike("%National Health%"),
                    )
                )
            elif norm_cat in ["senior care", "senior", "elderly"]:
                query = query.where(
                    or_(
                        GovernmentScheme.scheme_name.ilike("%Vay Vandana%"),
                        GovernmentScheme.scheme_name.ilike("%Elderly%"),
                        GovernmentScheme.scheme_name.ilike("%Pension%"),
                        GovernmentScheme.eligibility.ilike("%70%"),
                        GovernmentScheme.eligibility.ilike("%60%"),
                        GovernmentScheme.eligibility.ilike("%senior%"),
                        GovernmentScheme.eligibility.ilike("%elderly%"),
                        GovernmentScheme.benefits.ilike("%senior%"),
                        GovernmentScheme.benefits.ilike("%elderly%"),
                    )
                )
            elif norm_cat in ["maternal health", "maternal", "maternity", "women & child"]:
                query = query.where(
                    or_(
                        GovernmentScheme.scheme_name.ilike("%Matru%"),
                        GovernmentScheme.scheme_name.ilike("%Matritva%"),
                        GovernmentScheme.scheme_name.ilike("%Janani%"),
                        GovernmentScheme.scheme_name.ilike("%Maternity%"),
                        GovernmentScheme.scheme_name.ilike("%Baby%"),
                        GovernmentScheme.eligibility.ilike("%pregnant%"),
                        GovernmentScheme.eligibility.ilike("%matern%"),
                        GovernmentScheme.eligibility.ilike("%lactating%"),
                        GovernmentScheme.benefits.ilike("%pregnant%"),
                        GovernmentScheme.benefits.ilike("%matern%"),
                        GovernmentScheme.benefits.ilike("%delivery%"),
                    )
                )
            else:
                query = query.where(
                    or_(
                        GovernmentScheme.category.ilike(f"%{category_filter}%"),
                        GovernmentScheme.department.ilike(f"%{category_filter}%"),
                        GovernmentScheme.scheme_name.ilike(f"%{category_filter}%"),
                    )
                )

        if search_query and search_query.strip():
            raw_term = search_query.strip().lower()
            terms_to_match = [f"%{raw_term}%"]
            if "heart" in raw_term or "cardiac" in raw_term:
                terms_to_match.extend(["%cardio%", "%cardiac%", "%heart%"])
            elif "pregnant" in raw_term or "baby" in raw_term or "pregnancy" in raw_term:
                terms_to_match.extend(["%matern%", "%delivery%", "%infant%", "%baby%"])
            elif "sugar" in raw_term or "diabetes" in raw_term:
                terms_to_match.extend(["%diabet%", "%sugar%"])
            elif "kidney" in raw_term or "renal" in raw_term:
                terms_to_match.extend(["%dialysis%", "%nephro%", "%kidney%"])
            elif "cancer" in raw_term or "tumor" in raw_term:
                terms_to_match.extend(["%oncol%", "%cancer%"])

            search_conditions = []
            for t in set(terms_to_match):
                search_conditions.extend([
                    GovernmentScheme.scheme_name.ilike(t),
                    GovernmentScheme.department.ilike(t),
                    GovernmentScheme.eligibility.ilike(t),
                    GovernmentScheme.benefits.ilike(t),
                    GovernmentScheme.state.ilike(t),
                    cast(GovernmentScheme.key_covered_conditions, String).ilike(t),
                    cast(GovernmentScheme.eligibility_criteria, String).ilike(t),
                ])
            query = query.where(or_(*search_conditions))

        result = await db.execute(query)
        schemes = result.scalars().all()
        result_list = [GovernmentSchemeOut.from_orm(s) for s in schemes]
        
        # Cache result for 5 minutes (300 seconds)
        rag_cache.set(cache_key, result_list, ttl_seconds=300)
        
        return result_list

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
            except Exception as e:
                logger.warning(f"[SchemeService] Could not retrieve profile/context: {e}")
                profile = None
                patient_ctx = None

        # 1. Run RAG Pipeline query (vector similarity search + Gemini decomposition)
        try:
            raw_rag_res = await RAGPipeline.query(
                query_text=payload.query_text,
                scoped_scheme_id=payload.scoped_scheme_id,
                patient_context=patient_ctx,
                additional_info=payload.additional_info,
            )
        except Exception as exc:
            logger.error(f"[SchemeService] RAGPipeline.query failed for query '{payload.query_text[:50]}': {exc}", exc_info=True)
            raw_rag_res = None

        rag_res = _normalize_rag_response(raw_rag_res, payload.query_text, payload.scoped_scheme_id)

        # 2. Correlate top match chunk back to a database scheme
        elig_res = rag_res.get("eligibility_result")
        query_type = elig_res.get("query_type", "") if isinstance(elig_res, dict) else ""
        
        if query_type == "MULTI_SCHEME_ELIGIBILITY_QUERY" and isinstance(elig_res, dict):
            scheme_id = elig_res.get("scheme_id")
        else:
            scheme_id = payload.scoped_scheme_id or (
                elig_res.get("scheme_id") if isinstance(elig_res, dict) else None
            )
            if not scheme_id and rag_res.get("retrieved_chunks"):
                top_chk = rag_res["retrieved_chunks"][0]
                if isinstance(top_chk, dict):
                    scheme_id = top_chk.get("scheme_id")
            if not scheme_id:
                scheme_id = "scheme_C01"

        # Parse conversation_id if valid UUID
        conv_uuid = None
        if payload.conversation_id:
            try:
                conv_uuid = UUID(str(payload.conversation_id).strip())
            except Exception:
                conv_uuid = None

        # 3. Save query log to DB
        q_id = uuid4()
        if isinstance(elig_res, dict):
            elig_res["query_id"] = str(q_id)
            elig_res["queryId"] = str(q_id)

        q_log = SchemeQuery(
            query_id=q_id,
            profile_id=profile.profile_id if profile else None,
            conversation_id=conv_uuid,
            scheme_id=scheme_id,
            user_question=payload.query_text,
            ai_response=rag_res["ai_response"],
            retrieved_chunks=rag_res["retrieved_chunks"],
            eligibility_result=elig_res,
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

        try:
            raw_rag_res = await RAGPipeline.query(
                query_text=q_text,
                scoped_scheme_id=scheme_id,
                patient_context=patient_ctx,
                additional_info=payload.additional_info,
                uploaded_document_id=payload.uploaded_document_id,
            )
        except Exception as exc:
            logger.error(f"[SchemeService] evaluate_scheme_eligibility failed for {scheme_id}: {exc}", exc_info=True)
            raw_rag_res = None

        rag_res = _normalize_rag_response(raw_rag_res, q_text, scheme_id)

        q_id = uuid4()
        elig_res = rag_res.get("eligibility_result")
        if isinstance(elig_res, dict):
            elig_res["query_id"] = str(q_id)
            elig_res["queryId"] = str(q_id)

        q_log = SchemeQuery(
            query_id=q_id,
            profile_id=profile.profile_id,
            scheme_id=scheme_id,
            user_question=q_text,
            ai_response=rag_res["ai_response"],
            retrieved_chunks=rag_res["retrieved_chunks"],
            eligibility_result=elig_res,
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
        
        target_uuid = None
        try:
            target_uuid = UUID(str(payload.query_id).strip())
        except (ValueError, AttributeError):
            target_uuid = None

        q_log = None
        if target_uuid:
            res = await db.execute(
                select(SchemeQuery).where(
                    SchemeQuery.query_id == target_uuid,
                    or_(
                        SchemeQuery.profile_id == profile.profile_id,
                        SchemeQuery.profile_id == None
                    )
                )
            )
            q_log = res.scalar_one_or_none()

        if not q_log:
            # Fallback 1: Look up by query_id in recent queries
            res = await db.execute(
                select(SchemeQuery)
                .where(
                    or_(
                        SchemeQuery.profile_id == profile.profile_id,
                        SchemeQuery.profile_id == None
                    )
                )
                .order_by(desc(SchemeQuery.created_at))
                .limit(10)
            )
            recent_queries = res.scalars().all()
            for rq in recent_queries:
                if rq.eligibility_result and isinstance(rq.eligibility_result, dict):
                    if rq.eligibility_result.get("query_id") == payload.query_id or rq.eligibility_result.get("queryId") == payload.query_id:
                        q_log = rq
                        break

            # Fallback 2: If query_id is an ephemeral string like "q_..." and still not matched, link to the most recent query
            if not q_log and recent_queries and str(payload.query_id).startswith("q_"):
                q_log = recent_queries[0]

        if not q_log:
            raise NotFoundError(f"Eligibility query '{payload.query_id}'")

        if not q_log.profile_id:
            q_log.profile_id = profile.profile_id

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
            elif "employment" in c_id:
                if "government" in ans.lower():
                    merged_info["employment_status"] = "Government Employee"
                elif "private" in ans.lower():
                    merged_info["employment_status"] = "Private Sector Employee"
                elif "self" in ans.lower():
                    merged_info["employment_status"] = "Self-Employed"
                elif "unemployed" in ans.lower() or "homemaker" in ans.lower():
                    merged_info["employment_status"] = "Unemployed/Homemaker"
                elif "retired" in ans.lower() or "pensioner" in ans.lower():
                    merged_info["employment_status"] = "Retired/Pensioner"
                elif "student" in ans.lower():
                    merged_info["employment_status"] = "Student"
                else:
                    merged_info["employment_status"] = ans
            elif "disability" in c_id:
                if any(kw in ans.lower() for kw in ["yes", "disabled", "autism", "cerebral", "disability"]):
                    merged_info["disability_status"] = "Yes"
                else:
                    merged_info["disability_status"] = "No"
            elif "pregnancy" in c_id:
                if any(kw in ans.lower() for kw in ["yes", "pregnant", "expecting"]):
                    merged_info["pregnancy_status"] = "Yes"
                else:
                    merged_info["pregnancy_status"] = "No"
            else:
                merged_info[payload.criterion_id] = ans

        # Clean prompt presentation
        combined_text = q_log.user_question

        try:
            raw_rag_res = await RAGPipeline.query(
                query_text=combined_text,
                scoped_scheme_id=q_log.scheme_id,
                patient_context=patient_ctx,
                additional_info=merged_info,
                uploaded_document_id=payload.uploaded_document_id,
            )
        except Exception as exc:
            logger.error(f"[SchemeService] continue_scheme_eligibility failed for query {payload.query_id}: {exc}", exc_info=True)
            raw_rag_res = None

        rag_res = _normalize_rag_response(raw_rag_res, combined_text, q_log.scheme_id)

        # Update existing query log
        elig_res = rag_res.get("eligibility_result")
        if isinstance(elig_res, dict):
            elig_res["query_id"] = str(q_log.query_id)
            elig_res["queryId"] = str(q_log.query_id)

        q_log.user_question = combined_text
        q_log.ai_response = rag_res["ai_response"]
        q_log.retrieved_chunks = rag_res["retrieved_chunks"]
        q_log.eligibility_result = elig_res
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
