"""
Government Schemes API router — /api/v1/schemes/*
"""

from uuid import UUID
from fastapi import APIRouter
from typing import List

from app.dependencies import DBSession, CurrentUser
from app.schemas.scheme import GovernmentSchemeOut, SchemeQueryRequest, SchemeQueryOut
from app.services.scheme_service import SchemeService

router = APIRouter(prefix="/schemes", tags=["Government Healthcare Schemes (RAG)"])


@router.get("", response_model=List[GovernmentSchemeOut])
async def list_schemes(db: DBSession, current_user: CurrentUser):
    """Retrieve all available government healthcare schemes."""
    return await SchemeService.list_schemes(db)


@router.get("/{scheme_id}", response_model=GovernmentSchemeOut)
async def get_scheme_by_id(
    scheme_id: UUID, db: DBSession, current_user: CurrentUser
):
    """Fetch details of a single government healthcare scheme."""
    scheme = await SchemeService.get_scheme_by_id(db, scheme_id)
    return GovernmentSchemeOut.from_orm(scheme)


@router.post("/query", response_model=SchemeQueryOut)
async def query_scheme(
    payload: SchemeQueryRequest, db: DBSession, current_user: CurrentUser
):
    """Execute RAG question-answering over government health scheme context."""
    return await SchemeService.query_scheme(db, payload)
