import {
  GovernmentScheme,
  SchemeQuery,
  MultiDocEligibilityResult,
  CriterionResult,
  EvidenceSource,
  InformationSource,
  EligibilityStatus,
} from "@/types/scheme";
import { api } from "./api";

interface RawScheme {
  schemeId?: string;
  scheme_id?: string;
  schemeName?: string;
  scheme_name?: string;
  department?: string;
  category?: string;
  state?: string;
  cashless?: boolean;
  coverageAmount?: string;
  coverage_amount?: string;
  benefits_summary?: string;
  matched_criteria?: string[];
  pending_criteria?: string[];
  eligibility?: string;
  benefits?: string;
  officialUrl?: string;
  official_url?: string;
  lastUpdated?: string;
  last_updated?: string;
  eligibilityCriteria?: GovernmentScheme["eligibility_criteria"];
  eligibility_criteria?: GovernmentScheme["eligibility_criteria"];
  keyCoveredConditions?: string[];
  key_covered_conditions?: string[];
  keyExclusions?: string[];
  key_exclusions?: string[];
  chunks?: string[];
}

interface RawChunk {
  chunk_id?: string;
  chunkId?: string;
  scheme_name?: string;
  schemeName?: string;
  excerpt?: string;
  official_url?: string;
  officialUrl?: string;
}

interface RawCriterion {
  criterion_id?: string;
  criterionId?: string;
  criterion_name?: string;
  criterionName?: string;
  criterion_result?: CriterionResult;
  criterionResult?: CriterionResult;
  patient_value?: string;
  patientValue?: string;
  required_value?: string;
  requiredValue?: string;
  explanation?: string;
  source?: InformationSource;
  field_key?: string;
  fieldKey?: string;
  question_prompt?: string;
  questionPrompt?: string;
  input_type?: string;
  inputType?: string;
  supporting_evidence?: EvidenceSource[];
  supportingEvidence?: EvidenceSource[];
  is_missing_info?: boolean;
  isMissingInfo?: boolean;
}

interface RawMissingCriterion {
  criterion_id?: string;
  criterionId?: string;
  field_key?: string;
  fieldKey?: string;
  label?: string;
  question?: string;
  input_type?: string;
  inputType?: string;
  options?: string[];
  status?: string;
  patient_value?: string;
  patientValue?: string;
  source?: InformationSource;
}

interface RawEvidence {
  chunk_id?: string;
  chunkId?: string;
  document_title?: string;
  documentTitle?: string;
  page_number?: number;
  pageNumber?: number;
  excerpt?: string;
  official_url?: string;
  officialUrl?: string;
  relevance_score?: number;
  relevanceScore?: number;
  scheme_id?: string;
  schemeId?: string;
  scheme_name?: string;
  schemeName?: string;
  government_level?: string;
  governmentLevel?: string;
  status?: string;
  match_percentage?: number;
  matchPercentage?: number;
  coverage_amount?: string;
  coverageAmount?: string;
  benefits_summary?: string;
  benefitsSummary?: string;
  matched_criteria?: string[];
  matchedCriteria?: string[];
  pending_criteria?: string[];
  pendingCriteria?: string[];
  relevance_score_float?: number;
}

interface RawEligibilityPayload {
  query_id?: string;
  queryId?: string;
  scheme_id?: string;
  schemeId?: string;
  user_question?: string;
  userQuestion?: string;
  overall_status?: EligibilityStatus;
  overallStatus?: EligibilityStatus;
  overall_explanation?: string;
  overallExplanation?: string;
  query_type?: string;
  queryType?: string;
  match_percentage?: number | null;
  matchPercentage?: number | null;
  relevance_score?: number | null;
  relevanceScore?: number | null;
  schemes?: Record<string, unknown>[];
  criteria_breakdown?: RawCriterion[];
  criteriaBreakdown?: RawCriterion[];
  missing_information?: string[];
  missingInformation?: string[];
  structured_missing_criteria?: RawMissingCriterion[];
  structuredMissingCriteria?: RawMissingCriterion[];
  all_evidence_sources?: RawEvidence[];
  allEvidenceSources?: RawEvidence[];
  queried_at?: string;
  queriedAt?: string;
}

interface RawQueryResponse {
  query_id?: string;
  queryId?: string;
  profile_id?: string;
  profileId?: string;
  conversation_id?: string;
  conversationId?: string;
  scheme_id?: string;
  schemeId?: string;
  user_question?: string;
  userQuestion?: string;
  ai_response?: string;
  aiResponse?: string;
  retrieved_chunks?: RawChunk[];
  retrievedChunks?: RawChunk[];
  confidence_score?: number;
  confidenceScore?: number;
  is_low_confidence?: boolean;
  isLowConfidence?: boolean;
  eligibility_result?: RawEligibilityPayload;
  eligibilityResult?: RawEligibilityPayload;
  created_at?: string;
  createdAt?: string;
}

function mapQueryAndEligibility(
  data: RawQueryResponse,
  fallbackQuestion: string,
  fallbackSchemeId?: string
): { query: SchemeQuery; eligibilityResult: MultiDocEligibilityResult } {
  const rawEligibility = data.eligibility_result || data.eligibilityResult;
  const backendQueryId = data.query_id || data.queryId;
  if (rawEligibility && backendQueryId) {
    rawEligibility.query_id = backendQueryId;
    rawEligibility.queryId = backendQueryId;
  }
  const query: SchemeQuery = {
    query_id: backendQueryId || `q_${Date.now()}`,
    profile_id: data.profile_id || data.profileId,
    conversation_id: data.conversation_id || data.conversationId,
    scheme_id: data.scheme_id || data.schemeId || fallbackSchemeId,
    user_question: data.user_question || data.userQuestion || fallbackQuestion,
    ai_response: data.ai_response || data.aiResponse || "",
    retrieved_chunks: (data.retrieved_chunks || data.retrievedChunks || []).map((c: RawChunk) => ({
      chunk_id: c.chunk_id || c.chunkId || "chk_1",
      scheme_name: c.scheme_name || c.schemeName || "Government Scheme",
      excerpt: c.excerpt || "",
      official_url: c.official_url || c.officialUrl || "https://pmjay.gov.in",
    })),
    confidence_score: data.confidence_score ?? data.confidenceScore ?? 0.85,
    is_low_confidence: data.is_low_confidence ?? data.isLowConfidence ?? false,
    eligibility_result: rawEligibility as unknown as MultiDocEligibilityResult,
    created_at: data.created_at || data.createdAt,
  };

  const eligibilityResult: MultiDocEligibilityResult = {
    query_id: rawEligibility?.query_id || rawEligibility?.queryId || query.query_id,
    scheme_id: rawEligibility?.scheme_id || rawEligibility?.schemeId || query.scheme_id,
    query_type: rawEligibility?.query_type || rawEligibility?.queryType,
    user_question: rawEligibility?.user_question || rawEligibility?.userQuestion || query.user_question,
    overall_status: (rawEligibility?.overall_status || rawEligibility?.overallStatus || "POSSIBLY_ELIGIBLE") as EligibilityStatus,
    overall_explanation: rawEligibility?.overall_explanation || rawEligibility?.overallExplanation || query.ai_response,
    match_percentage: rawEligibility?.match_percentage ?? rawEligibility?.matchPercentage ?? null,
    relevance_score: rawEligibility?.relevance_score ?? rawEligibility?.relevanceScore ?? null,
    criteria_breakdown: (rawEligibility?.criteria_breakdown || rawEligibility?.criteriaBreakdown || []).map((c: RawCriterion) => ({
      criterion_id: c.criterion_id || c.criterionId || "",
      criterion_name: c.criterion_name || c.criterionName || "Criterion",
      criterion_result: (c.criterion_result || c.criterionResult || "UNKNOWN") as CriterionResult,
      patient_value: c.patient_value || c.patientValue,
      required_value: c.required_value || c.requiredValue,
      explanation: c.explanation || "",
      source: c.source,
      field_key: c.field_key || c.fieldKey,
      question_prompt: c.question_prompt || c.questionPrompt,
      input_type: c.input_type || c.inputType,
      supporting_evidence: c.supporting_evidence || c.supportingEvidence || [],
      is_missing_info: c.is_missing_info ?? c.isMissingInfo ?? false,
    })),
    missing_information: rawEligibility?.missing_information || rawEligibility?.missingInformation || [],
    structured_missing_criteria: (rawEligibility?.structured_missing_criteria || rawEligibility?.structuredMissingCriteria || []).map((m: RawMissingCriterion) => ({
      criterion_id: m.criterion_id || m.criterionId,
      field_key: m.field_key || m.fieldKey,
      label: m.label,
      question: m.question,
      input_type: m.input_type || m.inputType || "text",
      options: m.options,
      status: m.status || "UNKNOWN",
      patient_value: m.patient_value || m.patientValue,
      source: m.source || "UNKNOWN",
    })),
    all_evidence_sources: (rawEligibility?.all_evidence_sources || rawEligibility?.allEvidenceSources || []).map((e: RawEvidence) => ({
      ...e,
      chunk_id: e.chunk_id || e.chunkId || "chk_1",
      document_title: e.document_title || e.documentTitle || "Official Document",
      scheme_id: e.scheme_id || e.schemeId,
      scheme_name: e.scheme_name || e.schemeName,
      government_level: e.government_level || e.governmentLevel,
      status: e.status,
      match_percentage: e.match_percentage ?? e.matchPercentage,
      coverage_amount: e.coverage_amount || e.coverageAmount,
      benefits_summary: e.benefits_summary || e.benefitsSummary,
      matched_criteria: e.matched_criteria || e.matchedCriteria,
      pending_criteria: e.pending_criteria || e.pendingCriteria,
      page_number: e.page_number || e.pageNumber,
      excerpt: e.excerpt || "",
      official_url: e.official_url || e.officialUrl || "https://pmjay.gov.in",
      relevance_score: e.relevance_score || e.relevanceScore,
    })),
    schemes: rawEligibility?.schemes || [],
    queried_at: rawEligibility?.queried_at || rawEligibility?.queriedAt || new Date().toISOString(),
  };

  return { query, eligibilityResult };
}

export const schemeApi = {
  getSchemes: async (
    categoryFilter?: string,
    searchQuery?: string
  ): Promise<GovernmentScheme[]> => {
    try {
      const params: Record<string, string> = {};
      if (categoryFilter && categoryFilter !== "All") params.category = categoryFilter;
      if (searchQuery && searchQuery.trim()) params.search = searchQuery.trim();
      const { data } = await api.get<RawScheme[]>("/schemes", { params });
      if (data && Array.isArray(data)) {
        return data.map((s: RawScheme) => ({
          scheme_id: s.schemeId || s.scheme_id || "",
          scheme_name: s.schemeName || s.scheme_name || "",
          department: s.department || "",
          category: s.category,
          state: s.state,
          cashless: s.cashless,
          coverage_amount: s.coverageAmount || s.coverage_amount,
          eligibility: s.eligibility || "",
          benefits: s.benefits || "",
          official_url: s.officialUrl || s.official_url || "",
          last_updated: s.lastUpdated || s.last_updated || "",
          eligibility_criteria: s.eligibilityCriteria || s.eligibility_criteria,
          key_covered_conditions: s.keyCoveredConditions || s.key_covered_conditions,
          key_exclusions: s.keyExclusions || s.key_exclusions,
          chunks: s.chunks,
        }));
      }
      return [];
    } catch (err) {
      console.error("[API] Failed to fetch schemes:", err);
      throw err;
    }
  },

  getSchemeById: async (schemeId: string): Promise<GovernmentScheme | null> => {
    try {
      const { data } = await api.get<RawScheme>(`/schemes/${schemeId}`);
      if (!data) return null;
      return {
        scheme_id: data.schemeId || data.scheme_id || schemeId,
        scheme_name: data.schemeName || data.scheme_name || "",
        department: data.department || "",
        category: data.category,
        state: data.state,
        cashless: data.cashless,
        coverage_amount: data.coverageAmount || data.coverage_amount,
        eligibility: data.eligibility || "",
        benefits: data.benefits || "",
        official_url: data.officialUrl || data.official_url || "",
        last_updated: data.lastUpdated || data.last_updated || "",
        eligibility_criteria: data.eligibilityCriteria || data.eligibility_criteria,
        key_covered_conditions: data.keyCoveredConditions || data.key_covered_conditions,
        key_exclusions: data.keyExclusions || data.key_exclusions,
        chunks: data.chunks,
      };
    } catch (err) {
      console.error(`[API] Failed to fetch scheme ${schemeId}:`, err);
      return null;
    }
  },

  querySchemeEligibility: async (
    userQuestion: string,
    schemeId?: string,
    additionalInfo?: Record<string, unknown>
  ): Promise<{ query: SchemeQuery; eligibilityResult: MultiDocEligibilityResult }> => {
    try {
      const { data } = await api.post<RawQueryResponse>("/schemes/query", {
        query_text: userQuestion,
        scoped_scheme_id: schemeId,
        additional_info: additionalInfo,
      });

      return mapQueryAndEligibility(data, userQuestion, schemeId);
    } catch (err) {
      console.error("[API] Scheme query failed:", err);
      throw err;
    }
  },

  evaluateScopedEligibility: async (
    schemeId: string,
    userQuestion?: string,
    additionalInfo?: Record<string, unknown>,
    uploadedDocumentId?: string
  ): Promise<{ query: SchemeQuery; eligibilityResult: MultiDocEligibilityResult }> => {
    try {
      const { data } = await api.post<RawQueryResponse>(`/schemes/${schemeId}/eligibility/query`, {
        user_question: userQuestion,
        scoped_scheme_id: schemeId,
        additional_info: additionalInfo,
        uploaded_document_id: uploadedDocumentId,
      });

      return mapQueryAndEligibility(data, userQuestion || "Eligibility Check", schemeId);
    } catch (err) {
      console.error(`[API] Scoped eligibility evaluation failed for ${schemeId}:`, err);
      throw err;
    }
  },

  continueEligibility: async (
    queryId: string,
    additionalInfo: Record<string, unknown>,
    uploadedDocumentId?: string
  ): Promise<{ query: SchemeQuery; eligibilityResult: MultiDocEligibilityResult }> => {
    try {
      const { data } = await api.post<RawQueryResponse>("/schemes/eligibility/continue", {
        query_id: queryId,
        additional_info: additionalInfo,
        uploaded_document_id: uploadedDocumentId,
      });

      return mapQueryAndEligibility(data, "Continued Check");
    } catch (err) {
      console.error(`[API] Continue eligibility query failed for ${queryId}:`, err);
      throw err;
    }
  },

  getUserQueryHistory: async (): Promise<SchemeQuery[]> => {
    try {
      const { data } = await api.get<RawQueryResponse[]>("/schemes/queries");
      if (Array.isArray(data)) {
        return data.map((d: RawQueryResponse) => ({
          query_id: d.queryId || d.query_id || "",
          profile_id: d.profileId || d.profile_id,
          conversation_id: d.conversationId || d.conversation_id,
          scheme_id: d.schemeId || d.scheme_id,
          user_question: d.userQuestion || d.user_question || "",
          ai_response: d.aiResponse || d.ai_response || "",
          retrieved_chunks: (d.retrievedChunks || d.retrieved_chunks || []).map((c: RawChunk) => ({
            chunk_id: c.chunkId || c.chunk_id || "chk_1",
            scheme_name: c.schemeName || c.scheme_name || "Scheme",
            excerpt: c.excerpt || "",
            official_url: c.officialUrl || c.official_url || "https://pmjay.gov.in",
          })),
          confidence_score: d.confidenceScore ?? d.confidence_score ?? 0.85,
          is_low_confidence: d.isLowConfidence ?? d.is_low_confidence ?? false,
          eligibility_result: (d.eligibilityResult || d.eligibility_result) as unknown as MultiDocEligibilityResult,
          created_at: d.createdAt || d.created_at,
        }));
      }
      return [];
    } catch (err) {
      console.warn("[API] Could not fetch scheme query history:", err);
      return [];
    }
  },

  getQueryById: async (queryId: string): Promise<SchemeQuery | null> => {
    try {
      const { data } = await api.get<RawQueryResponse>(`/schemes/queries/${queryId}`);
      if (!data) return null;
      return {
        query_id: data.queryId || data.query_id || queryId,
        profile_id: data.profileId || data.profile_id,
        conversation_id: data.conversationId || data.conversation_id,
        scheme_id: data.schemeId || data.scheme_id,
        user_question: data.userQuestion || data.user_question || "",
        ai_response: data.aiResponse || data.ai_response || "",
        retrieved_chunks: (data.retrievedChunks || data.retrieved_chunks || []).map((c: RawChunk) => ({
          chunk_id: c.chunkId || c.chunk_id || "chk_1",
          scheme_name: c.schemeName || c.scheme_name || "Scheme",
          excerpt: c.excerpt || "",
          official_url: c.officialUrl || c.official_url || "https://pmjay.gov.in",
        })),
        confidence_score: data.confidenceScore ?? data.confidence_score ?? 0.85,
        is_low_confidence: data.isLowConfidence ?? data.is_low_confidence ?? false,
        eligibility_result: (data.eligibilityResult || data.eligibility_result) as unknown as MultiDocEligibilityResult,
        created_at: data.createdAt || data.created_at,
      };
    } catch (err) {
      console.error(`[API] Could not fetch query ${queryId}:`, err);
      return null;
    }
  },
};
