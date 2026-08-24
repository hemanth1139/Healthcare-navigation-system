"""
Government Schemes Pydantic schemas — request/response models.
"""

from pydantic import BaseModel, Field
from typing import List, Optional


class GovernmentSchemeOut(BaseModel):
    scheme_id: str = Field(..., alias="schemeId")
    scheme_name: str = Field(..., alias="schemeName")
    department: str
    eligibility: str
    benefits: str
    official_url: str = Field(..., alias="officialUrl")
    last_updated: str = Field(..., alias="lastUpdated")

    model_config = {"populate_by_name": True, "from_attributes": True}

    @classmethod
    def from_orm(cls, scheme) -> "GovernmentSchemeOut":
        return cls(
            schemeId=str(scheme.scheme_id),
            schemeName=scheme.scheme_name,
            department=scheme.department or "Ministry of Health",
            eligibility=scheme.eligibility or "General public eligibility.",
            benefits=scheme.benefits or "Financial health assistance.",
            officialUrl=scheme.official_url or "",
            lastUpdated=scheme.last_updated.strftime("%B %Y") if scheme.last_updated else "Current"
        )


class RetrievedChunkOut(BaseModel):
    chunk_id: str = Field(..., alias="chunkId")
    scheme_name: str = Field(..., alias="schemeName")
    excerpt: str
    official_url: str = Field(..., alias="officialUrl")

    model_config = {"populate_by_name": True}


class SchemeQueryRequest(BaseModel):
    conversation_id: str = Field(..., alias="conversationId")
    query_text: str = Field(..., alias="queryText")

    model_config = {"populate_by_name": True}


class SchemeQueryOut(BaseModel):
    query_id: str = Field(..., alias="queryId")
    conversation_id: Optional[str] = Field(None, alias="conversationId")
    scheme_id: Optional[str] = Field(None, alias="schemeId")
    user_question: str = Field(..., alias="userQuestion")
    ai_response: str = Field(..., alias="aiResponse")
    retrieved_chunks: List[RetrievedChunkOut] = Field(..., alias="retrievedChunks")
    confidence_score: float = Field(..., alias="confidenceScore")
    is_low_confidence: bool = Field(False, alias="isLowConfidence")

    model_config = {"populate_by_name": True, "from_attributes": True}

    @classmethod
    def from_orm(cls, q, chunks: List[dict]) -> "SchemeQueryOut":
        # Format chunks
        ret_chunks = [
            RetrievedChunkOut(
                chunkId=c["chunk_id"],
                schemeName=c["scheme_name"],
                excerpt=c["excerpt"],
                officialUrl=c["official_url"]
            ) for c in chunks
        ]
        
        return cls(
            queryId=str(q.query_id),
            conversationId=str(q.conversation_id),
            schemeId=str(q.scheme_id) if q.scheme_id else None,
            userQuestion=q.user_question,
            aiResponse=q.ai_response or "",
            retrievedChunks=ret_chunks,
            confidenceScore=float(q.confidence_score) if q.confidence_score else 0.0,
            isLowConfidence=float(q.confidence_score) < 0.65 if q.confidence_score else True
        )
