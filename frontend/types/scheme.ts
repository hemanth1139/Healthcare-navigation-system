// Phase 1: Updated scheme types with multi-document RAG eligibility reasoning

export type EligibilityStatus =
  | "ELIGIBLE"
  | "NOT_ELIGIBLE"
  | "POSSIBLY_ELIGIBLE"
  | "INSUFFICIENT_INFORMATION"
  | "PROFILE_DATA_REQUIRED"
  | "COVERED"
  | "NOT_COVERED"
  | "INFORMATIONAL";

export type CriterionResult = "PASS" | "FAIL" | "UNKNOWN" | "NOT_REQUIRED";

export interface EvidenceSource {
  chunk_id: string;
  document_title: string;          // e.g. "PM-JAY Master Operational Guidelines 2024"
  page_number?: number;
  excerpt: string;                 // Relevant text chunk retrieved from ChromaDB
  official_url: string;
  relevance_score?: number;        // 0.0 to 1.0
}

export type InformationSource =
  | "USER_PROVIDED_DURING_INTERVIEW"
  | "USER_PROVIDED"
  | "DOCUMENT_VERIFIED"
  | "PROFILE_CONTEXT"
  | "OFFICIAL_RULE"
  | "UNKNOWN";

export interface MissingCriterionItem {
  criterion_id: string;
  field_key: string;
  label: string;
  question: string;
  input_type: "MCQ" | "BOOLEAN" | "NUMBER" | "DATE" | "TEXT" | "MULTI_SELECT" | "text" | "currency" | "number" | "select";
  options?: string[];
  status: "UNKNOWN" | "PROVIDED" | "PASS" | "FAIL" | "NOT_REQUIRED";
  patient_value?: string;
  source: InformationSource;
}

export interface EligibilityCriterion {
  criterion_id: string;
  criterion_name: string;          // e.g. "Age Requirement", "Income Limit"
  criterion_result: CriterionResult;
  required?: boolean;              // True if essential for determining eligibility
  patient_value?: string;          // e.g. "72 years old"
  required_value?: string;         // e.g. "70 years and above"
  explanation: string;
  source?: InformationSource;
  field_key?: string;
  question_prompt?: string;
  input_type?: string;
  options?: string[];
  supporting_evidence: EvidenceSource[];
  is_missing_info?: boolean;       // True when patient info is insufficient to evaluate
}

export interface MultiDocEligibilityResult {
  query_id: string;
  consultation_id?: string;
  scheme_id?: string;
  query_type?: "PERSONAL_ELIGIBILITY" | "COVERAGE" | "REQUIREMENTS" | "GENERAL_INFORMATION" | "COVERAGE_QUERY" | "REQUIREMENTS_QUERY" | string;
  user_question: string;
  interview_state?: "QUESTIONS_REQUIRED" | "COMPLETED" | "INITIAL" | string;
  current_question?: MissingCriterionItem | null;
  progress?: {
    answered: number;
    total_required: number;
  } | null;
  match_percentage?: number | null; // e.g. 100, 80
  overall_status: EligibilityStatus;
  overall_explanation: string;
  criteria_breakdown: EligibilityCriterion[];
  missing_information?: string[];  // List of missing patient data fields needed
  structured_missing_criteria?: MissingCriterionItem[];
  all_evidence_sources: EvidenceSource[];
  queried_at: string;              // ISO timestamp
}

export interface GovernmentScheme {
  scheme_id: string;
  scheme_name: string;
  department: string;
  category?: string;
  state?: string;
  cashless?: boolean;
  coverage_amount?: string;
  eligibility: string;
  benefits: string;
  official_url: string;
  last_updated: string;
  eligibility_criteria?: {
    income_limit_per_annum_inr?: string;
    bpl_or_secc_required?: string;
    age_group?: string;
    target_beneficiaries?: string;
    required_documents?: string[];
  };
  key_covered_conditions?: string[];
  key_exclusions?: string[];
  chunks?: string[];
}

// Kept for backward compat — use MultiDocEligibilityResult for full Phase 1 flow
export interface RetrievedChunk {
  chunk_id: string;
  scheme_name: string;
  excerpt: string;
  official_url: string;
}

export interface SchemeQuery {
  query_id: string;
  profile_id?: string;
  conversation_id?: string;
  scheme_id?: string;
  user_question: string;
  ai_response: string;
  retrieved_chunks: RetrievedChunk[];
  confidence_score: number;
  is_low_confidence?: boolean;
  eligibility_result?: MultiDocEligibilityResult; // Phase 1: full decomposed result
  created_at?: string;
}
