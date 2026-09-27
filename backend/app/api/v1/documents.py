"""
Scheme Documents API router — /api/v1/documents/*
Patient supporting document lifecycle for healthcare scheme eligibility and verification.
"""

from uuid import UUID
from fastapi import APIRouter, UploadFile, File, Form, Response
from fastapi.responses import FileResponse, RedirectResponse
from typing import List, Optional
import os

from app.dependencies import DBSession, CurrentUser
from app.schemas.document import UploadedDocumentOut
from app.services.document_service import DocumentService

router = APIRouter(prefix="/documents", tags=["Scheme Supporting Documents (Patient)"])


@router.post("", response_model=UploadedDocumentOut, status_code=201)
async def upload_scheme_document(
    db: DBSession,
    current_user: CurrentUser,
    file: UploadFile = File(...),
    category: Optional[str] = Form("OTHER"),
    scheme_query_id: Optional[UUID] = Form(None)
):
    """
    Upload a supporting document for scheme eligibility verification.
    Accepts PDF, PNG, JPG, JPEG, DOC, DOCX up to 10MB.
    """
    content = await file.read()
    return await DocumentService.create_document(
        db=db,
        user=current_user,
        file_name=file.filename or "uploaded_document",
        file_content=content,
        content_type=file.content_type,
        category=category or "OTHER",
        scheme_query_id=scheme_query_id,
    )


@router.get("", response_model=List[UploadedDocumentOut])
async def list_scheme_documents(db: DBSession, current_user: CurrentUser):
    """
    Retrieve all scheme documents uploaded by the authenticated patient.
    """
    return await DocumentService.list_documents(db, current_user)


@router.get("/{document_id}", response_model=UploadedDocumentOut)
async def get_scheme_document(
    document_id: UUID, db: DBSession, current_user: CurrentUser
):
    """
    Get metadata for a specific uploaded document. Validates user ownership.
    """
    doc = await DocumentService.get_document(db, current_user, document_id)
    return UploadedDocumentOut.model_validate(doc)


@router.get("/{document_id}/download")
async def download_scheme_document(
    document_id: UUID, db: DBSession, current_user: CurrentUser
):
    """
    Download or stream the uploaded document. Enforces ownership authorization.
    """
    doc, local_path = await DocumentService.get_document_file_info(db, current_user, document_id)

    if local_path and os.path.exists(local_path):
        return FileResponse(
            path=local_path,
            filename=doc.file_name,
            media_type="application/octet-stream"
        )

    # If hosted on Cloudinary CDN, redirect securely
    if doc.cloudinary_url and doc.cloudinary_url.startswith("http"):
        return RedirectResponse(url=doc.cloudinary_url)

    return Response(status_code=404, content="Document file source not found")


@router.delete("/{document_id}", status_code=204)
async def delete_scheme_document(
    document_id: UUID, db: DBSession, current_user: CurrentUser
):
    """
    Permanently delete an uploaded document from storage and database.
    """
    await DocumentService.delete_document(db, current_user, document_id)
    return None
