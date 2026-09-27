"""
Pydantic Schemas for Uploaded Scheme Documents.
"""

from uuid import UUID
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class UploadedDocumentBase(BaseModel):
    category: str = "OTHER"
    scheme_query_id: Optional[UUID] = None


class UploadedDocumentCreate(UploadedDocumentBase):
    pass


class UploadedDocumentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    document_id: UUID
    profile_id: UUID
    scheme_query_id: Optional[UUID] = None
    file_name: str
    file_type: Optional[str] = None
    category: str
    cloudinary_url: str
    upload_date: datetime
    processing_status: str
