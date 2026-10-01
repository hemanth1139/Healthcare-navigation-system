"""
Document Service — Patient-Uploaded Scheme Documents Lifecycle.
Handles upload, retrieval, download, and deletion of supporting documents
(e.g., Income Certificate, Eligibility Certificate, Aadhaar, Ration Card)
with strict user-profile ownership and authorization checks.
"""

import os
import re
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

ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".doc", ".docx", ".txt"}

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

            # 4. Extract, Chunk, Embed, and Index Once into VectorStore
            try:
                await DocumentService._extract_and_index_document(
                    doc_id=str(doc.document_id),
                    profile_id=str(profile.profile_id),
                    file_name=file_name,
                    file_content=file_content,
                    category=normalized_cat,
                )
            except Exception as index_err:
                print(f"[WARN] Non-blocking document indexing warning: {index_err}")

            return UploadedDocumentOut.model_validate(doc)
        except Exception as db_err:
            await db.rollback()
            # Clean up orphaned uploaded storage file
            if uploaded_url:
                FileUploadManager.delete_file(uploaded_url, public_id)
            raise ValidationError(f"Database error during document registration: {str(db_err)}")

    @staticmethod
    async def _extract_and_index_document(
        doc_id: str,
        profile_id: str,
        file_name: str,
        file_content: bytes,
        category: str
    ) -> None:
        """
        Extracts text from PDF/doc once, splits into chunks, computes embeddings,
        and saves indexed chunks into the vector store.
        """
        raw_text = ""
        if file_name.lower().endswith(".pdf"):
            try:
                import pypdf
                import io
                reader = pypdf.PdfReader(io.BytesIO(file_content))
                pages = [page.extract_text() or "" for page in reader.pages]
                raw_text = "\n".join(pages).strip()
            except Exception as e:
                print(f"[WARN] PDF text extraction error for {file_name}: {e}")

        if not raw_text:
            try:
                raw_text = file_content.decode("utf-8", errors="ignore").strip()
            except Exception:
                raw_text = ""

        if not raw_text or len(raw_text) < 10:
            raw_text = f"DOCUMENT: {file_name}\nCategory: {category}\nVerified patient document for healthcare and scheme eligibility."

        # Group complete sentences/paragraphs into approximately 300-500 token
        # chunks, with one sentence of overlap to preserve local context.
        units = [u.strip() for u in re.split(r"(?<=[.!?])\s+|\n{2,}", raw_text) if u.strip()]
        max_chars = 1800  # roughly 450 tokens for typical document text
        bounded_units = []
        for unit in units:
            if len(unit) <= max_chars:
                bounded_units.append(unit)
                continue
            # A malformed scan or long table row may contain no sentence breaks.
            # Split such units at word boundaries so chunk size remains bounded.
            fragment = []
            fragment_size = 0
            for word in unit.split():
                if fragment and fragment_size + len(word) + 1 > max_chars:
                    bounded_units.append(" ".join(fragment))
                    fragment = []
                    fragment_size = 0
                fragment.append(word)
                fragment_size += len(word) + (1 if len(fragment) > 1 else 0)
            if fragment:
                bounded_units.append(" ".join(fragment))

        chunks = []
        current = []
        current_size = 0
        for unit in bounded_units:
            if current and current_size + len(unit) > max_chars:
                chunks.append(" ".join(current).strip())
                current = current[-1:] if current and len(current[-1]) + len(unit) <= max_chars else []
                current_size = sum(len(part) for part in current)
            current.append(unit)
            current_size += len(unit)
        if current:
            chunks.append(" ".join(current).strip())
        if not chunks:
            chunks = [raw_text[:1800]]

        # Compute embeddings and store
        from app.rag.embeddings import EmbeddingService
        from app.rag.vectorstore import VectorStore
        vstore = VectorStore()

        embeddings = []
        metadatas = []
        for idx, c in enumerate(chunks):
            emb = await EmbeddingService.get_embedding(c)
            embeddings.append(emb)
            metadatas.append({
                "document_id": doc_id,
                "profile_id": profile_id,
                "file_name": file_name,
                "category": category,
                "chunk_index": idx,
                "total_chunks": len(chunks),
                "is_patient_document": True,
            })

        vstore.add_texts(chunks, embeddings, metadatas)
        print(f"[INFO] Successfully indexed {len(chunks)} chunks for document {doc_id} ({file_name}).")

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
        Deletes stored file from storage, cleans vector store chunks, and removes database record.
        """
        doc = await DocumentService.get_document(db, user, document_id)

        # 1. Delete from storage
        if doc.cloudinary_url:
            FileUploadManager.delete_file(doc.cloudinary_url, doc.cloudinary_public_id)

        # 2. Purge vector chunks from VectorStore
        try:
            from app.rag.vectorstore import VectorStore
            vstore = VectorStore()
            vstore.delete_by_document_id(str(document_id))
        except Exception as vec_err:
            print(f"[WARN] Error cleaning vector chunks: {vec_err}")

        # 3. Delete database record
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
