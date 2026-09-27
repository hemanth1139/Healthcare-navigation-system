"""
Document Service — Patient-Uploaded Scheme Documents Lifecycle.
Handles upload, retrieval, download, and deletion of supporting documents
(e.g., Income Certificate, Eligibility Certificate, Aadhaar, Ration Card)
with strict user-profile ownership and authorization checks.
"""

import os
from uuid import UUID
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.document import UploadedDocument
from app.models.profile import PatientProfile
from app.models.user import User
from app.schemas.document import UploadedDocumentOut
from app.utils.cloudinary import FileUploadManager
from app.core.exceptions import NotFoundError, ForbiddenError, ValidationError

ALLOWED_CATEGORIES = {
    "INCOME_CERTIFICATE",
    "ELIGIBILITY_CERTIFICATE",
    "CASTE_CERTIFICATE",
    "AADHAAR_CARD",
    "RATION_CARD",
    "DISABILITY_CERTIFICATE",
    "BIRTH_CERTIFICATE",
    "OTHER",
}

ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".doc", ".docx"}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB


class DocumentService:

    @staticmethod
    async def _get_patient_profile(db: AsyncSession, user: User) -> PatientProfile:
        """Finds patient profile for authenticated user, creating one if not present."""
        res = await db.execute(select(PatientProfile).where(PatientProfile.user_id == user.user_id))
        profile = res.scalar_one_or_none()
        if not profile:
            profile = PatientProfile(user_id=user.user_id)
            db.add(profile)
            await db.flush()
        return profile

    @staticmethod
    async def create_document(
        db: AsyncSession,
        user: User,
        file_name: str,
        file_content: bytes,
        content_type: Optional[str] = None,
        category: str = "OTHER",
        scheme_query_id: Optional[UUID] = None,
    ) -> UploadedDocumentOut:
        """
        Validates, uploads file to storage, and persists UploadedDocument record.
        """
        # 1. Validation
        if not file_name or not file_content:
            raise ValidationError("File content and file name are required.")

        if len(file_content) > MAX_FILE_SIZE_BYTES:
            raise ValidationError("File size exceeds 10MB limit.")

        ext = os.path.splitext(file_name)[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise ValidationError(f"Unsupported file type '{ext}'. Allowed types: PDF, PNG, JPG, JPEG, DOC, DOCX.")

        normalized_cat = category.strip().upper().replace(" ", "_")
        if normalized_cat not in ALLOWED_CATEGORIES:
            normalized_cat = "OTHER"

        profile = await DocumentService._get_patient_profile(db, user)

        # Determine file type string
        file_type = "pdf" if ext == ".pdf" else "image" if ext in [".png", ".jpg", ".jpeg"] else "document"

        # 2. Upload to storage
        uploaded_url, public_id = None, None
        try:
            uploaded_url, public_id = FileUploadManager.upload_file(file_name, file_content)
        except Exception as e:
            raise ValidationError(f"Storage upload failed: {str(e)}")

        # 3. Persist to Database with rollback safeguard
        try:
            doc = UploadedDocument(
                profile_id=profile.profile_id,
                scheme_query_id=scheme_query_id,
                file_name=file_name,
                file_type=file_type,
                category=normalized_cat,
                cloudinary_url=uploaded_url,
                cloudinary_public_id=public_id,
                processing_status="AVAILABLE",
            )
            db.add(doc)
            await db.commit()
            await db.refresh(doc)
            return UploadedDocumentOut.model_validate(doc)
        except Exception as db_err:
            await db.rollback()
            # Clean up orphaned uploaded storage file
            if uploaded_url:
                FileUploadManager.delete_file(uploaded_url, public_id)
            raise ValidationError(f"Database error during document registration: {str(db_err)}")

    @staticmethod
    async def list_documents(db: AsyncSession, user: User) -> List[UploadedDocumentOut]:
        """
        Returns all scheme documents uploaded by the authenticated user.
        Strict user-ownership isolation.
        """
        profile = await DocumentService._get_patient_profile(db, user)
        res = await db.execute(
            select(UploadedDocument)
            .where(UploadedDocument.profile_id == profile.profile_id)
            .order_by(UploadedDocument.upload_date.desc())
        )
        docs = res.scalars().all()
        return [UploadedDocumentOut.model_validate(d) for d in docs]

    @staticmethod
    async def get_document(db: AsyncSession, user: User, document_id: UUID) -> UploadedDocument:
        """
        Retrieves a single document with strict ownership check.
        """
        profile = await DocumentService._get_patient_profile(db, user)
        res = await db.execute(
            select(UploadedDocument).where(UploadedDocument.document_id == document_id)
        )
        doc = res.scalar_one_or_none()
        if not doc:
            raise NotFoundError("Scheme document")

        # Authorization / Ownership check
        if doc.profile_id != profile.profile_id:
            raise ForbiddenError("You do not have permission to access this document.")

        return doc

    @staticmethod
    async def delete_document(db: AsyncSession, user: User, document_id: UUID) -> None:
        """
        Deletes stored file from storage and removes database record.
        """
        doc = await DocumentService.get_document(db, user, document_id)

        # 1. Delete from storage
        if doc.cloudinary_url:
            FileUploadManager.delete_file(doc.cloudinary_url, doc.cloudinary_public_id)

        # 2. Delete database record
        await db.delete(doc)
        await db.commit()

    @staticmethod
    async def get_document_file_info(db: AsyncSession, user: User, document_id: UUID):
        """
        Returns document metadata and local path if present for downloading.
        """
        doc = await DocumentService.get_document(db, user, document_id)
        local_path = FileUploadManager.get_local_path_if_exists(doc.cloudinary_url, doc.cloudinary_public_id)
        return doc, local_path
