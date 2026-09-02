// Phase 1: Updated scheme types with multi-document RAG eligibility reasoning

export type EligibilityStatus =
  | "ELIGIBLE"
  | "NOT_ELIGIBLE"
  | "POSSIBLY_ELIGIBLE"
  | "INSUFFICIENT_INFORMATION";

export type CriterionResult = "PASS" | "FAIL" | "UNKNOWN";

export interface EvidenceSource {
  chunk_id: string;
  document_title: string;          // e.g. "PM-JAY Master Operational Guidelines 2024"
  page_number?: number;
  excerpt: string;                 // Relevant text chunk retrieved from ChromaDB
  official_url: string;
  relevance_score?: number;        // 0.0 to 1.0
}

export interface EligibilityCriterion {
  criterion_id: string;
  criterion_name: string;          // e.g. "Age Requirement", "Income Limit"
  criterion_result: CriterionResult;
  patient_value?: string;          // e.g. "72 years old"
  required_value?: string;         // e.g. "70 years and above"
  explanation: string;
  supporting_evidence: EvidenceSource[];
  is_missing_info?: boolean;       // True when patient info is insufficient to evaluate
}

export interface MultiDocEligibilityResult {
  query_id: string;
  consultation_id?: string;
  scheme_id?: string;
  user_question: string;
  overall_status: EligibilityStatus;
  overall_explanation: string;
  criteria_breakdown: EligibilityCriterion[];
  missing_information?: string[];  // List of missing patient data fields needed
  all_evidence_sources: EvidenceSource[];
  queried_at: string;              // ISO timestamp
}

export interface GovernmentScheme {
  scheme_id: string;
  scheme_name: string;
  department: string;
  category?: string;
  coverage_amount?: string;
  eligibility: string;
  benefits: string;
  official_url: string;
  last_updated: string;
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
  conversation_id?: string;
  scheme_id?: string;
  user_question: string;
  ai_response: string;
  retrieved_chunks: RetrievedChunk[];
  confidence_score: number;
  is_low_confidence?: boolean;
  eligibility_result?: MultiDocEligibilityResult; // Phase 1: full decomposed result
}
