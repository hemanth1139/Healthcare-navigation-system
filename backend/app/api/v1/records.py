"""
Medical Records API router — /api/v1/records/*
"""

from uuid import UUID
from fastapi import APIRouter, UploadFile, File, Form
from typing import List, Optional

from app.dependencies import DBSession, CurrentUser
from app.schemas.record import MedicalRecordOut
from app.services.record_service import RecordService

router = APIRouter(prefix="/records", tags=["Medical Records & HL7 FHIR (PII Scrubbing)"])


@router.post("/upload", response_model=MedicalRecordOut, status_code=201)
async def upload_record(
    db: DBSession,
    current_user: CurrentUser,
    file: UploadFile = File(...),
    recordType: Optional[str] = Form(None)
):
    """Uploads a clinical diagnostic file, scrubs patient PII, and stores metadata."""
    content = await file.read()
    return await RecordService.create_record(
        db=db,
        user=current_user,
        file_name=file.filename,
        file_content=content,
        record_type=recordType
    )


@router.get("", response_model=List[MedicalRecordOut])
async def list_records(db: DBSession, current_user: CurrentUser):
    """Retrieve all diagnostic records uploaded by the user patient."""
    return await RecordService.list_records(db, current_user)


@router.get("/{record_id}", response_model=MedicalRecordOut)
async def get_record(
    record_id: UUID, db: DBSession, current_user: CurrentUser
):
    """Get metadata for a single medical record."""
    rec = await RecordService.get_record(db, current_user, record_id)
    return MedicalRecordOut.from_orm(rec)


@router.get("/{record_id}/fhir")
async def get_fhir_format(
    record_id: UUID, db: DBSession, current_user: CurrentUser
):
    """Fetch the diagnostic record formatted as an HL7 FHIR resource."""
    return await RecordService.get_fhir_format(db, current_user, record_id)
