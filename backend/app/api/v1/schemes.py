"""
Government Schemes API router — /api/v1/schemes/*
"""

from fastapi import APIRouter, Query
from typing import List, Optional

from app.dependencies import DBSession, CurrentUser
from app.schemas.scheme import GovernmentSchemeOut, SchemeQueryRequest, SchemeQueryOut
from app.services.scheme_service import SchemeService

router = APIRouter(prefix="/schemes", tags=["Government Healthcare Schemes (RAG)"])


@router.get("", response_model=List[GovernmentSchemeOut])
async def list_schemes(
    db: DBSession,
    category: Optional[str] = Query(None, description="Category filter (e.g., State Government, Central Government, Maternal Health, Senior Care)"),
    search: Optional[str] = Query(None, description="Search keyword in scheme name or description")
):
    """Retrieve available government healthcare schemes with optional category and keyword search."""
    return await SchemeService.list_schemes(db, category_filter=category, search_query=search)


@router.get("/{scheme_id}", response_model=GovernmentSchemeOut)
async def get_scheme_by_id(
    scheme_id: str, db: DBSession
):
    """Fetch details of a single government healthcare scheme by scheme_id."""
    scheme = await SchemeService.get_scheme_by_id(db, scheme_id)
    return GovernmentSchemeOut.from_orm(scheme)


@router.post("/query", response_model=SchemeQueryOut)
async def query_scheme(
    payload: SchemeQueryRequest, db: DBSession
):
    """Execute RAG question-answering and multi-document eligibility reasoning over healthcare scheme context."""
    return await SchemeService.query_scheme(db, payload)
