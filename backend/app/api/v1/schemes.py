"""
Government Schemes API router — /api/v1/schemes/*
"""

from uuid import UUID
from fastapi import APIRouter, Query, Depends
from typing import List, Optional

from app.dependencies import DBSession, CurrentUser, get_current_user_optional
from app.models.user import User
from app.schemas.scheme import (
    GovernmentSchemeOut,
    SchemeQueryRequest,
    SchemeQueryOut,
    EligibilityEvaluationRequest,
    EligibilityContinueRequest,
)
from app.services.scheme_service import SchemeService

router = APIRouter(prefix="/schemes", tags=["Government Healthcare Schemes (RAG)"])


@router.get("", response_model=List[GovernmentSchemeOut])
async def list_schemes(
    db: DBSession,
    category: Optional[str] = Query(None, description="Category filter (e.g., State Government, Central Government, Senior Care)"),
    search: Optional[str] = Query(None, description="Search keyword in scheme name, description, benefits, or eligibility")
):
    """Retrieve available government healthcare schemes with optional category and keyword search."""
    return await SchemeService.list_schemes(db, category_filter=category, search_query=search)


@router.get("/queries", response_model=List[SchemeQueryOut])
async def list_user_queries(
    db: DBSession,
    current_user: CurrentUser
):
    """List previous government scheme eligibility queries for the authenticated patient profile."""
    return await SchemeService.list_user_queries(db, current_user)


@router.get("/queries/{query_id}", response_model=SchemeQueryOut)
async def get_user_query(
    query_id: UUID,
    db: DBSession,
    current_user: CurrentUser
):
    """Fetch details and grounded evidence for a specific eligibility query with access authorization."""
    return await SchemeService.get_user_query(db, current_user, query_id)


@router.get("/{scheme_id}", response_model=GovernmentSchemeOut)
async def get_scheme_by_id(
    scheme_id: str, db: DBSession
):
    """Fetch details of a single government healthcare scheme by scheme_id."""
    scheme = await SchemeService.get_scheme_by_id(db, scheme_id)
    return GovernmentSchemeOut.from_orm(scheme)


@router.post("/query", response_model=SchemeQueryOut)
async def query_scheme(
    payload: SchemeQueryRequest,
    db: DBSession,
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Execute general RAG question-answering and multi-document eligibility reasoning over healthcare scheme context."""
    return await SchemeService.query_scheme(db, payload, current_user)


@router.post("/{scheme_id}/eligibility/query", response_model=SchemeQueryOut)
async def evaluate_scheme_eligibility(
    scheme_id: str,
    payload: EligibilityEvaluationRequest,
    db: DBSession,
    current_user: CurrentUser
):
    """Execute authenticated, grounded eligibility evaluation for a specific scheme using patient context."""
    return await SchemeService.evaluate_scheme_eligibility(db, current_user, scheme_id, payload)


@router.post("/eligibility/continue", response_model=SchemeQueryOut)
async def continue_scheme_eligibility(
    payload: EligibilityContinueRequest,
    db: DBSession,
    current_user: CurrentUser
):
    """Provide additional patient data or uploaded document to complete an ongoing eligibility check."""
    return await SchemeService.continue_scheme_eligibility(db, current_user, payload)
