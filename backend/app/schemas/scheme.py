"""
Government Schemes Pydantic schemas — request/response models.
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any


class GovernmentSchemeOut(BaseModel):
    scheme_id: str = Field(..., alias="schemeId")
    scheme_name: str = Field(..., alias="schemeName")
    department: str
    category: Optional[str] = "Central Government"
    coverage_amount: Optional[str] = Field(None, alias="coverageAmount")
    state: Optional[str] = "Central / All India"
    cashless: Optional[bool] = True
    eligibility: str
    benefits: str
    official_url: str = Field(..., alias="officialUrl")
    last_updated: str = Field(..., alias="lastUpdated")
    eligibility_criteria: Optional[Dict[str, Any]] = Field(None, alias="eligibilityCriteria")
    key_covered_conditions: Optional[List[str]] = Field(None, alias="keyCoveredConditions")
    key_exclusions: Optional[List[str]] = Field(None, alias="keyExclusions")
    chunks: Optional[List[str]] = Field(None, alias="chunks")

    model_config = {"populate_by_name": True, "from_attributes": True}

    @classmethod
    def from_orm(cls, scheme) -> "GovernmentSchemeOut":
        return cls(
            schemeId=str(scheme.scheme_id),
            schemeName=scheme.scheme_name,
            department=scheme.department or "Ministry of Health",
            category=scheme.category or ("State Government" if scheme.state and "Central" not in scheme.state else "Central Government"),
            coverageAmount=scheme.coverage_amount or "Coverage per rules",
            state=scheme.state or "Central / All India",
            cashless=scheme.cashless if scheme.cashless is not None else True,
            eligibility=scheme.eligibility or "General public eligibility.",
            benefits=scheme.benefits or "Financial health assistance.",
            officialUrl=scheme.official_url or "",
            lastUpdated=scheme.last_updated.strftime("%B %Y") if scheme.last_updated else "Current",
            eligibilityCriteria=getattr(scheme, "eligibility_criteria", None),
            keyCoveredConditions=getattr(scheme, "key_covered_conditions", None),
            keyExclusions=getattr(scheme, "key_exclusions", None),
            chunks=getattr(scheme, "chunks", None)
        )


class EvidenceSourceOut(BaseModel):
    chunk_id: str = Field(..., alias="chunkId")
    document_title: str = Field(..., alias="documentTitle")
    page_number: Optional[int] = Field(None, alias="pageNumber")
    excerpt: str
    official_url: str = Field(..., alias="officialUrl")
    relevance_score: Optional[float] = Field(None, alias="relevanceScore")

    model_config = {"populate_by_name": True}


class MissingCriterionItem(BaseModel):
    criterion_id: str = Field(..., alias="criterionId")
    field_key: str = Field(..., alias="fieldKey")
    label: str
    question: str
    input_type: str = Field("MCQ", alias="inputType") # "MCQ" | "BOOLEAN" | "NUMBER" | "DATE" | "TEXT" | "MULTI_SELECT"
    options: Optional[List[str]] = None
    status: str = Field("UNKNOWN", alias="status") # "UNKNOWN" | "PROVIDED" | "PASS" | "FAIL" | "NOT_REQUIRED"
    patient_value: Optional[str] = Field(None, alias="patientValue")
    source: str = Field("UNKNOWN", alias="source") # "UNKNOWN" | "USER_PROVIDED_DURING_INTERVIEW" | "DOCUMENT_VERIFIED" | "PROFILE_CONTEXT" | "OFFICIAL_RULE"

    model_config = {"populate_by_name": True}


class EligibilityCriterionOut(BaseModel):
    criterion_id: str = Field(..., alias="criterionId")
    criterion_name: str = Field(..., alias="criterionName")
    criterion_result: str = Field(..., alias="criterionResult") # "PASS" | "FAIL" | "UNKNOWN" | "NOT_REQUIRED"
    required: bool = Field(True, alias="required")
    patient_value: Optional[str] = Field(None, alias="patientValue")
    required_value: Optional[str] = Field(None, alias="requiredValue")
    explanation: str
    source: Optional[str] = Field("UNKNOWN", alias="source") # "USER_PROVIDED_DURING_INTERVIEW" | "DOCUMENT_VERIFIED" | "PROFILE_CONTEXT" | "OFFICIAL_RULE" | "UNKNOWN"
    field_key: Optional[str] = Field(None, alias="fieldKey")
    question_prompt: Optional[str] = Field(None, alias="questionPrompt")
    input_type: Optional[str] = Field("MCQ", alias="inputType")
    options: Optional[List[str]] = Field(None, alias="options")
    supporting_evidence: List[EvidenceSourceOut] = Field(default_factory=list, alias="supportingEvidence")
    is_missing_info: Optional[bool] = Field(False, alias="isMissingInfo")

    model_config = {"populate_by_name": True}


class MultiDocEligibilityResultOut(BaseModel):
    query_id: str = Field(..., alias="queryId")
    consultation_id: Optional[str] = Field(None, alias="consultationId")
    scheme_id: Optional[str] = Field(None, alias="schemeId")
    query_type: str = Field("PERSONAL_ELIGIBILITY", alias="queryType") # "PERSONAL_ELIGIBILITY" | "COVERAGE" | "REQUIREMENTS" | "GENERAL_INFORMATION"
    user_question: str = Field(..., alias="userQuestion")
    interview_state: str = Field("COMPLETED", alias="interviewState") # "QUESTIONS_REQUIRED" | "COMPLETED" | "INITIAL"
    current_question: Optional[MissingCriterionItem] = Field(None, alias="currentQuestion")
    progress: Optional[Dict[str, int]] = Field(None, alias="progress") # {"answered": 1, "total_required": 2}
    match_percentage: Optional[int] = Field(None, alias="matchPercentage") # PASS / (PASS + FAIL + UNKNOWN) * 100
    overall_status: str = Field(..., alias="overallStatus") # "ELIGIBLE" | "NOT_ELIGIBLE" | "POSSIBLY_ELIGIBLE" | "INSUFFICIENT_INFORMATION" | "COVERED" | "NOT_COVERED" | "INFORMATIONAL"
    overall_explanation: str = Field(..., alias="overallExplanation")
    criteria_breakdown: List[EligibilityCriterionOut] = Field(default_factory=list, alias="criteriaBreakdown")
    missing_information: Optional[List[str]] = Field(default_factory=list, alias="missingInformation")
    structured_missing_criteria: Optional[List[MissingCriterionItem]] = Field(default_factory=list, alias="structuredMissingCriteria")
    all_evidence_sources: List[EvidenceSourceOut] = Field(default_factory=list, alias="allEvidenceSources")
    queried_at: str = Field(..., alias="queriedAt")

    model_config = {"populate_by_name": True}


class RetrievedChunkOut(BaseModel):
    chunk_id: str = Field(..., alias="chunkId")
    scheme_name: str = Field(..., alias="schemeName")
    excerpt: str
    official_url: str = Field(..., alias="officialUrl")

    model_config = {"populate_by_name": True}


class SchemeQueryRequest(BaseModel):
    conversation_id: Optional[str] = Field(None, alias="conversationId")
    query_text: str = Field(..., alias="queryText")
    scoped_scheme_id: Optional[str] = Field(None, alias="scopedSchemeId")
    additional_info: Optional[Dict[str, Any]] = Field(None, alias="additionalInfo")

    model_config = {"populate_by_name": True}


class EligibilityEvaluationRequest(BaseModel):
    user_question: Optional[str] = Field(None, alias="userQuestion")
    scoped_scheme_id: Optional[str] = Field(None, alias="scopedSchemeId")
    patient_context_override: Optional[Dict[str, Any]] = Field(None, alias="patientContextOverride")
    additional_info: Optional[Dict[str, Any]] = Field(None, alias="additionalInfo")
    uploaded_document_id: Optional[str] = Field(None, alias="uploadedDocumentId")

    model_config = {"populate_by_name": True}


class EligibilityContinueRequest(BaseModel):
    query_id: str = Field(..., alias="queryId")
    additional_info: Dict[str, Any] = Field(..., alias="additionalInfo")
    uploaded_document_id: Optional[str] = Field(None, alias="uploadedDocumentId")
    criterion_id: Optional[str] = Field(None, alias="criterionId")
    answer: Optional[str] = Field(None, alias="answer")

    model_config = {"populate_by_name": True}


class SchemeQueryOut(BaseModel):
    query_id: str = Field(..., alias="queryId")
    profile_id: Optional[str] = Field(None, alias="profileId")
    conversation_id: Optional[str] = Field(None, alias="conversationId")
    scheme_id: Optional[str] = Field(None, alias="schemeId")
    user_question: str = Field(..., alias="userQuestion")
    ai_response: str = Field(..., alias="aiResponse")
    retrieved_chunks: List[RetrievedChunkOut] = Field(default_factory=list, alias="retrievedChunks")
    confidence_score: float = Field(..., alias="confidenceScore")
    is_low_confidence: bool = Field(False, alias="isLowConfidence")
    eligibility_result: Optional[MultiDocEligibilityResultOut] = Field(None, alias="eligibilityResult")
    created_at: Optional[str] = Field(None, alias="createdAt")

    model_config = {"populate_by_name": True, "from_attributes": True}

    @classmethod
    def from_orm(cls, q, chunks: List[dict] = None) -> "SchemeQueryOut":
        ret_chunks = []
        raw_chunks = chunks or q.retrieved_chunks or []
        for c in raw_chunks:
            ret_chunks.append(
                RetrievedChunkOut(
                    chunkId=c.get("chunk_id", ""),
                    schemeName=c.get("scheme_name", ""),
                    excerpt=c.get("excerpt", ""),
                    officialUrl=c.get("official_url", "")
                )
            )

        elig_res = None
        if getattr(q, "eligibility_result", None):
            try:
                elig_res = MultiDocEligibilityResultOut(**q.eligibility_result)
            except Exception:
                elig_res = None

        created_iso = None
        if getattr(q, "created_at", None):
            created_iso = q.created_at.isoformat()

        return cls(
            queryId=str(q.query_id),
            profileId=str(q.profile_id) if getattr(q, "profile_id", None) else None,
            conversationId=str(q.conversation_id) if q.conversation_id else None,
            schemeId=str(q.scheme_id) if q.scheme_id else None,
            userQuestion=q.user_question,
            aiResponse=q.ai_response or "",
            retrievedChunks=ret_chunks,
            confidenceScore=float(q.confidence_score) if q.confidence_score else 0.0,
            isLowConfidence=float(q.confidence_score) < 0.65 if q.confidence_score else True,
            eligibilityResult=elig_res,
            createdAt=created_iso
        )

