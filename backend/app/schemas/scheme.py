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
    scheme_id: Optional[str] = Field(None, alias="schemeId")
    scheme_name: Optional[str] = Field(None, alias="schemeName")
    government_level: Optional[str] = Field(None, alias="governmentLevel")
    status: Optional[str] = Field(None, alias="status")
    match_percentage: Optional[int] = Field(None, alias="matchPercentage")
    coverage_amount: Optional[str] = Field(None, alias="coverageAmount")
    benefits_summary: Optional[str] = Field(None, alias="benefitsSummary")
    matched_criteria: List[str] = Field(default_factory=list, alias="matchedCriteria")
    pending_criteria: List[str] = Field(default_factory=list, alias="pendingCriteria")
    page_number: Optional[int] = Field(None, alias="pageNumber")
    excerpt: str
    official_url: str = Field(..., alias="officialUrl")
    relevance_score: Optional[float] = Field(None, alias="relevanceScore")

    model_config = {"populate_by_name": True, "extra": "ignore"}


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

    model_config = {"populate_by_name": True, "extra": "ignore"}


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

    model_config = {"populate_by_name": True, "extra": "ignore"}


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
    profile_complete: Optional[bool] = Field(None, alias="profileComplete")
    missing_required_fields: Optional[List[str]] = Field(default_factory=list, alias="missingRequiredFields")
    profile_completion_status: Optional[str] = Field(None, alias="profileCompletionStatus") # "complete" | "incomplete"
    schemes: Optional[List[Dict[str, Any]]] = Field(None, alias="schemes")
    queried_at: str = Field(..., alias="queriedAt")

    model_config = {"populate_by_name": True, "extra": "ignore"}


class RetrievedChunkOut(BaseModel):
    chunk_id: str = Field(..., alias="chunkId")
    scheme_name: str = Field(..., alias="schemeName")
    excerpt: str
    official_url: str = Field(..., alias="officialUrl")

    model_config = {"populate_by_name": True, "extra": "ignore"}


class SchemeQueryRequest(BaseModel):
    conversation_id: Optional[str] = Field(None, alias="conversationId")
    query_text: str = Field(..., alias="queryText")
    scoped_scheme_id: Optional[str] = Field(None, alias="scopedSchemeId")
    additional_info: Optional[Dict[str, Any]] = Field(None, alias="additionalInfo")

    model_config = {"populate_by_name": True, "extra": "ignore"}


class EligibilityEvaluationRequest(BaseModel):
    user_question: Optional[str] = Field(None, alias="userQuestion")
    scoped_scheme_id: Optional[str] = Field(None, alias="scopedSchemeId")
    patient_context_override: Optional[Dict[str, Any]] = Field(None, alias="patientContextOverride")
    additional_info: Optional[Dict[str, Any]] = Field(None, alias="additionalInfo")
    uploaded_document_id: Optional[str] = Field(None, alias="uploadedDocumentId")

    model_config = {"populate_by_name": True, "extra": "ignore"}


class EligibilityContinueRequest(BaseModel):
    query_id: str = Field(..., alias="queryId")
    additional_info: Dict[str, Any] = Field(..., alias="additionalInfo")
    uploaded_document_id: Optional[str] = Field(None, alias="uploadedDocumentId")
    criterion_id: Optional[str] = Field(None, alias="criterionId")
    answer: Optional[str] = Field(None, alias="answer")

    model_config = {"populate_by_name": True, "extra": "ignore"}


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
    follow_up_suggestions: Optional[List[str]] = Field(None, alias="followUpSuggestions")
    eligibility_result: Optional[MultiDocEligibilityResultOut] = Field(None, alias="eligibilityResult")
    profile_complete: Optional[bool] = Field(None, alias="profileComplete")
    missing_required_fields: Optional[List[str]] = Field(default_factory=list, alias="missingRequiredFields")
    profile_completion_status: Optional[str] = Field(None, alias="profileCompletionStatus") # "complete" | "incomplete"
    schemes: Optional[List[Dict[str, Any]]] = Field(None, alias="schemes")
    created_at: Optional[str] = Field(None, alias="createdAt")

    model_config = {"populate_by_name": True, "from_attributes": True, "extra": "ignore"}

    @classmethod
    def from_orm(cls, q, chunks: List[dict] = None) -> "SchemeQueryOut":
        ret_chunks = []
        raw_chunks = chunks or getattr(q, "retrieved_chunks", None) or []
        for c in raw_chunks:
            if isinstance(c, dict):
                ret_chunks.append(
                    RetrievedChunkOut(
                        chunkId=str(c.get("chunk_id", c.get("chunkId", "chk_1"))),
                        schemeName=str(c.get("scheme_name", c.get("schemeName", "Government Scheme"))),
                        excerpt=str(c.get("excerpt", "")),
                        officialUrl=str(c.get("official_url", c.get("officialUrl", "")) or "https://pmjay.gov.in")
                    )
                )

        elig_res = None
        prof_complete = None
        missing_fields = []
        prof_status = None
        schemes_list = None

        raw_elig = getattr(q, "eligibility_result", None)
        if raw_elig and isinstance(raw_elig, dict):
            try:
                elig_dict = dict(raw_elig)
                q_id_str = str(getattr(q, "query_id", "q_unknown"))
                elig_dict["query_id"] = str(elig_dict.get("query_id") or elig_dict.get("queryId") or q_id_str)
                elig_dict["queryId"] = elig_dict["query_id"]
                
                # Extract profile completeness info
                prof_complete = elig_dict.get("profile_complete") if elig_dict.get("profile_complete") is not None else elig_dict.get("profileComplete")
                missing_fields = elig_dict.get("missing_required_fields") or elig_dict.get("missingRequiredFields") or elig_dict.get("missing_information") or []
                prof_status = elig_dict.get("profile_completion_status") or elig_dict.get("profileCompletionStatus")
                if prof_complete is None and prof_status:
                    prof_complete = (prof_status == "complete")
                elif prof_status is None and prof_complete is not None:
                    prof_status = "complete" if prof_complete else "incomplete"
                
                schemes_list = elig_dict.get("schemes")
                
                # Ensure mandatory fields have valid fallbacks
                if "user_question" not in elig_dict or not elig_dict["user_question"]:
                    elig_dict["user_question"] = getattr(q, "user_question", "Scheme Query")
                if "overall_status" not in elig_dict or not elig_dict["overall_status"]:
                    elig_dict["overall_status"] = "INFORMATIONAL"
                if "overall_explanation" not in elig_dict or not elig_dict["overall_explanation"]:
                    elig_dict["overall_explanation"] = getattr(q, "ai_response", "") or ""
                if "queried_at" not in elig_dict or not elig_dict["queried_at"]:
                    elig_dict["queried_at"] = datetime.now(timezone.utc).isoformat()
                    
                elig_res = MultiDocEligibilityResultOut(**elig_dict)
            except Exception:
                elig_res = None

        created_iso = None
        if getattr(q, "created_at", None):
            try:
                created_iso = q.created_at.isoformat()
            except Exception:
                created_iso = str(q.created_at)

        conf_raw = getattr(q, "confidence_score", 0.0)
        try:
            conf_score = float(conf_raw) if conf_raw is not None else 0.0
        except (ValueError, TypeError):
            conf_score = 0.0

        return cls(
            queryId=str(getattr(q, "query_id", "q_unknown")),
            profileId=str(q.profile_id) if getattr(q, "profile_id", None) else None,
            conversationId=str(q.conversation_id) if getattr(q, "conversation_id", None) else None,
            schemeId=str(q.scheme_id) if getattr(q, "scheme_id", None) else None,
            userQuestion=str(getattr(q, "user_question", "") or ""),
            aiResponse=str(getattr(q, "ai_response", "") or ""),
            retrievedChunks=ret_chunks,
            confidenceScore=conf_score,
            isLowConfidence=conf_score < 0.65,
            followUpSuggestions=getattr(q, "follow_up_suggestions", None),
            eligibilityResult=elig_res,
            profileComplete=prof_complete,
            missingRequiredFields=missing_fields,
            profileCompletionStatus=prof_status,
            schemes=schemes_list,
            createdAt=created_iso
        )

