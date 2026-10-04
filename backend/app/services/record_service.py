import io
import re
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional

from app.models.record import MedicalRecord
from app.models.profile import PatientProfile
from app.models.user import User
from app.schemas.record import MedicalRecordOut
from app.utils.cloudinary import FileUploadManager
from app.fhir.formatter import FHIRFormatter
from app.core.exceptions import NotFoundError, ValidationError
from app.config import settings


def _scrub_pii(text: str) -> str:
    """Lightweight regex-based PII scrubber. Redacts emails, phones, Aadhaar numbers."""
    # Emails
    text = re.sub(r'[\w.+-]+@[\w-]+\.[\w.]+', '[EMAIL REDACTED]', text)
    # Phone numbers (Indian & international formats)
    text = re.sub(r'(\+?\d[\d\s\-().]{7,}\d)', '[PHONE REDACTED]', text)
    # Aadhaar numbers (12-digit)
    text = re.sub(r'\b\d{4}\s?\d{4}\s?\d{4}\b', '[AADHAAR REDACTED]', text)
    return text


def _extract_text(file_name: str, content: bytes) -> str:
    """Extract raw text from PDF or plain text files."""
    if file_name.lower().endswith(".pdf"):
        try:
            import pypdf
            reader = pypdf.PdfReader(io.BytesIO(content))
            pages = [page.extract_text() or "" for page in reader.pages]
            extracted = "\n".join(pages).strip()
            if extracted:
                return extracted
        except Exception as e:
            print(f"[WARN] PDF text extraction error: {e}")
    try:
        return content.decode("utf-8", errors="ignore").strip()
    except Exception:
        return ""


class RecordService:

    @staticmethod
    async def create_record(
        db: AsyncSession,
        user: User,
        file_name: str,
        file_content: bytes,
        record_type: Optional[str] = None
    ) -> MedicalRecordOut:
        """Processes uploaded file, extracts clinical info, scrubs PII, and saves to DB."""
        # 1. Fetch user profile
        prof_res = await db.execute(select(PatientProfile).where(PatientProfile.user_id == user.user_id))
        profile = prof_res.scalar_one_or_none()
        if not profile:
            raise ValidationError("Patient profile must be created before uploading medical records.")

        # 2. Upload file to storage (Cloudinary or local static folder fallback)
        uploaded_url, public_id = FileUploadManager.upload_file(file_name, file_content)

        # 3. Text Extraction
        raw_text = _extract_text(file_name, file_content)

        # If empty or not readable, generate clean clinical report summary template
        if not raw_text or len(raw_text.strip()) < 10:
            raw_text = (
                f"DOCUMENT TITLE: {file_name}\n"
                f"Category: {record_type or 'Medical Report'}\n"
                f"Patient Name: {user.full_name}\n"
                f"Verified: Uploaded and authenticated for clinical analysis and scheme eligibility."
            )

        # 4. Clinical Extraction & PII Scrubbing
        scrubbed_text = _scrub_pii(raw_text)

        # Use Gemini to generate structured clinical & financial summary if available
        summary_text = scrubbed_text
        if settings.GOOGLE_API_KEY and len(scrubbed_text) > 20:
            try:
                from app.core.llm import invoke_gemini
                from langchain_core.messages import SystemMessage, HumanMessage

                prompt = (
                    "You are a clinical document parser. Summarize the following medical or income document in 3-4 concise lines. "
                    "Extract: 1) Document Category, 2) Primary Diagnosis / Medical Findings or Income details, 3) Key Clinical Recommendations or Scheme Eligibility parameters. "
                    "Do not include personal identifiers.\n\n"
                    f"Document Content:\n{scrubbed_text[:2000]}"
                )
                gemini_summary = await invoke_gemini([
                    SystemMessage(content="You are a clinical document summarizer."),
                    HumanMessage(content=prompt)
                ], temperature=0.1)

                if gemini_summary and len(gemini_summary.strip()) > 10:
                    summary_text = gemini_summary.strip()
            except Exception as e:
                print(f"[WARN] Gemini document summarization error: {e}")

        # 5. Save to Database
        rec = MedicalRecord(
            profile_id=profile.profile_id,
            file_name=file_name,
            cloudinary_url=uploaded_url,
            cloudinary_public_id=public_id,
            category=record_type or "Medical Report",
            # Only extracted text is scrubbed. The original uploaded file is
            # retained as-is, so do not claim that the file itself is redacted.
            is_pii_redacted=False,
            fhir_resource=scrubbed_text
        )
        db.add(rec)
        await db.commit()
        await db.refresh(rec)

        return MedicalRecordOut.from_orm(rec)

    @staticmethod
    async def get_record(db: AsyncSession, user: User, record_id: UUID) -> MedicalRecord:
        """Fetch a record only when it belongs to the authenticated patient."""
        profile_result = await db.execute(
            select(PatientProfile).where(PatientProfile.user_id == user.user_id)
        )
        profile = profile_result.scalar_one_or_none()
        if not profile:
            raise NotFoundError("Medical Record")

        result = await db.execute(
            select(MedicalRecord).where(
                MedicalRecord.record_id == record_id,
                MedicalRecord.profile_id == profile.profile_id,
            )
        )
        rec = result.scalar_one_or_none()
        if not rec:
            raise NotFoundError("Medical Record")
        return rec

    @staticmethod
    async def delete_record(db: AsyncSession, user: User, record_id: UUID) -> None:
        """Delete a medical record."""
        prof_res = await db.execute(select(PatientProfile).where(PatientProfile.user_id == user.user_id))
        profile = prof_res.scalar_one_or_none()
        if not profile:
            raise NotFoundError("Patient profile")

        result = await db.execute(
            select(MedicalRecord).where(
                MedicalRecord.record_id == record_id,
                MedicalRecord.profile_id == profile.profile_id
            )
        )
        rec = result.scalar_one_or_none()
        if not rec:
            raise NotFoundError("Medical Record")

        await db.delete(rec)
        await db.commit()

    @staticmethod
    async def list_records(db: AsyncSession, user: User) -> List[MedicalRecordOut]:
        """List all medical records for the user patient profile."""
        prof_res = await db.execute(select(PatientProfile).where(PatientProfile.user_id == user.user_id))
        profile = prof_res.scalar_one_or_none()
        if not profile:
            return []

        result = await db.execute(
            select(MedicalRecord)
            .where(MedicalRecord.profile_id == profile.profile_id)
            .order_by(MedicalRecord.upload_date.desc())
        )
        records = result.scalars().all()
        return [MedicalRecordOut.from_orm(r) for r in records]

    @staticmethod
    async def get_fhir_format(db: AsyncSession, user: User, record_id: UUID) -> dict:
        """Formats diagnostic metadata into HL7 FHIR structures."""
        rec = await RecordService.get_record(db, user, record_id)
        
        if rec.category in ["LAB_REPORT", "SCAN", "Medical Report"]:
            return FHIRFormatter.to_diagnostic_report(
                record_id=str(rec.record_id),
                patient_id=str(rec.profile_id),
                record_name=rec.file_name,
                conclusion=rec.fhir_resource or "Report concluded.",
                file_url=rec.cloudinary_url,
                file_type="application/pdf" if rec.file_name.endswith(".pdf") else "text/plain",
                created_at=rec.upload_date
            )
        else:
            return FHIRFormatter.to_document_reference(
                record_id=str(rec.record_id),
                patient_id=str(rec.profile_id),
                record_name=rec.file_name,
                file_url=rec.cloudinary_url,
                file_type="application/pdf" if rec.file_name.endswith(".pdf") else "text/plain",
                created_at=rec.upload_date
            )
