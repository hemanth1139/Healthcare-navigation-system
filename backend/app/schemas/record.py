"""
Medical Records Pydantic schemas — request/response shapes.
"""

from pydantic import BaseModel, Field
from datetime import datetime
from uuid import UUID
from typing import Optional, Dict, Any


class MedicalRecordOut(BaseModel):
    record_id: str = Field(..., alias="recordId")
    profile_id: str = Field(..., alias="profileId")
    record_name: str = Field(..., alias="recordName")
    record_type: str = Field(..., alias="recordType")
    original_file_url: str = Field(..., alias="originalFileUrl")
    anonymized_text_content: Optional[str] = Field(None, alias="anonymizedTextContent")
    created_at: str = Field(..., alias="createdAt")

    model_config = {"populate_by_name": True, "from_attributes": True}

    @classmethod
    def from_orm(cls, rec) -> "MedicalRecordOut":
        return cls(
            recordId=str(rec.record_id),
            profileId=str(rec.profile_id),
            recordName=rec.file_name,
            recordType=rec.category or "LAB_REPORT",
            originalFileUrl=rec.cloudinary_url,
            anonymizedTextContent=rec.fhir_resource,
            createdAt=rec.upload_date.isoformat()
        )
