import {
  GovernmentScheme,
  SchemeQuery,
  MultiDocEligibilityResult,
} from "@/types/scheme";
import { api } from "./api";

export const schemeApi = {
  getSchemes: async (
    categoryFilter?: string,
    searchQuery?: string
  ): Promise<GovernmentScheme[]> => {
    try {
      const params: Record<string, string> = {};
      if (categoryFilter && categoryFilter !== "All") params.category = categoryFilter;
      if (searchQuery && searchQuery.trim()) params.search = searchQuery.trim();
      const { data } = await api.get<any[]>("/schemes", { params });
      if (data && Array.isArray(data)) {
        return data.map((s: any) => ({
          scheme_id: s.schemeId || s.scheme_id,
          scheme_name: s.schemeName || s.scheme_name,
          department: s.department,
          category: s.category,
          state: s.state,
          cashless: s.cashless,
          coverage_amount: s.coverageAmount || s.coverage_amount,
          eligibility: s.eligibility,
          benefits: s.benefits,
          official_url: s.officialUrl || s.official_url,
          last_updated: s.lastUpdated || s.last_updated,
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
      const { data } = await api.get<any>(`/schemes/${schemeId}`);
      if (!data) return null;
      return {
        scheme_id: data.schemeId || data.scheme_id,
        scheme_name: data.schemeName || data.scheme_name,
        department: data.department,
        category: data.category,
        state: data.state,
        cashless: data.cashless,
        coverage_amount: data.coverageAmount || data.coverage_amount,
        eligibility: data.eligibility,
        benefits: data.benefits,
        official_url: data.officialUrl || data.official_url,
        last_updated: data.lastUpdated || data.last_updated,
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
    additionalInfo?: Record<string, any>
  ): Promise<{ query: SchemeQuery; eligibilityResult: MultiDocEligibilityResult }> => {
    try {
      const { data } = await api.post("/schemes/query", {
        query_text: userQuestion,
        scoped_scheme_id: schemeId,
        additional_info: additionalInfo,
      });

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
        scheme_id: data.scheme_id || data.schemeId || schemeId,
        user_question: data.user_question || data.userQuestion || userQuestion,
        ai_response: data.ai_response || data.aiResponse || "",
        retrieved_chunks: (data.retrieved_chunks || data.retrievedChunks || []).map((c: any) => ({
          chunk_id: c.chunk_id || c.chunkId || "chk_1",
          scheme_name: c.scheme_name || c.schemeName || "Government Scheme",
          excerpt: c.excerpt || "",
          official_url: c.official_url || c.officialUrl || "https://pmjay.gov.in",
        })),
        confidence_score: data.confidence_score ?? data.confidenceScore ?? 0.85,
        is_low_confidence: data.is_low_confidence ?? data.isLowConfidence ?? false,
        eligibility_result: rawEligibility,
        created_at: data.created_at || data.createdAt,
      };

      const eligibilityResult: MultiDocEligibilityResult = rawEligibility || {
        query_id: query.query_id,
        scheme_id: query.scheme_id,
        user_question: query.user_question,
        overall_status: "POSSIBLY_ELIGIBLE",
        overall_explanation: query.ai_response,
        criteria_breakdown: [],
        all_evidence_sources: query.retrieved_chunks.map((c, i) => ({
          chunk_id: c.chunk_id,
          document_title: c.scheme_name,
          page_number: i + 1,
          excerpt: c.excerpt,
          official_url: c.official_url,
          relevance_score: 0.85,
        })),
        queried_at: new Date().toISOString(),
      };

      return { query, eligibilityResult };
    } catch (err) {
      console.error("[API] Scheme query failed:", err);
      throw err;
    }
  },

  evaluateScopedEligibility: async (
    schemeId: string,
    userQuestion?: string,
    additionalInfo?: Record<string, any>,
    uploadedDocumentId?: string
  ): Promise<{ query: SchemeQuery; eligibilityResult: MultiDocEligibilityResult }> => {
    try {
      const { data } = await api.post(`/schemes/${schemeId}/eligibility/query`, {
        user_question: userQuestion,
        scoped_scheme_id: schemeId,
        additional_info: additionalInfo,
        uploaded_document_id: uploadedDocumentId,
      });

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
        scheme_id: data.scheme_id || data.schemeId || schemeId,
        user_question: data.user_question || data.userQuestion || userQuestion || "Eligibility Check",
        ai_response: data.ai_response || data.aiResponse || "",
        retrieved_chunks: (data.retrieved_chunks || data.retrievedChunks || []).map((c: any) => ({
          chunk_id: c.chunk_id || c.chunkId || "chk_1",
          scheme_name: c.scheme_name || c.schemeName || "Government Scheme",
          excerpt: c.excerpt || "",
          official_url: c.official_url || c.officialUrl || "https://pmjay.gov.in",
        })),
        confidence_score: data.confidence_score ?? data.confidenceScore ?? 0.85,
        is_low_confidence: data.is_low_confidence ?? data.isLowConfidence ?? false,
        eligibility_result: rawEligibility,
        created_at: data.created_at || data.createdAt,
      };

      const eligibilityResult: MultiDocEligibilityResult = {
        query_id: rawEligibility?.query_id || rawEligibility?.queryId || query.query_id,
        scheme_id: rawEligibility?.scheme_id || rawEligibility?.schemeId || query.scheme_id,
        user_question: rawEligibility?.user_question || rawEligibility?.userQuestion || query.user_question,
        overall_status: rawEligibility?.overall_status || rawEligibility?.overallStatus || "POSSIBLY_ELIGIBLE",
        overall_explanation: rawEligibility?.overall_explanation || rawEligibility?.overallExplanation || query.ai_response,
        criteria_breakdown: (rawEligibility?.criteria_breakdown || rawEligibility?.criteriaBreakdown || []).map((c: any) => ({
          criterion_id: c.criterion_id || c.criterionId,
          criterion_name: c.criterion_name || c.criterionName,
          criterion_result: c.criterion_result || c.criterionResult,
          patient_value: c.patient_value || c.patientValue,
          required_value: c.required_value || c.requiredValue,
          explanation: c.explanation,
          source: c.source,
          field_key: c.field_key || c.fieldKey,
          question_prompt: c.question_prompt || c.questionPrompt,
          input_type: c.input_type || c.inputType,
          supporting_evidence: c.supporting_evidence || c.supportingEvidence || [],
          is_missing_info: c.is_missing_info ?? c.isMissingInfo ?? false,
        })),
        missing_information: rawEligibility?.missing_information || rawEligibility?.missingInformation || [],
        structured_missing_criteria: (rawEligibility?.structured_missing_criteria || rawEligibility?.structuredMissingCriteria || []).map((m: any) => ({
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
        all_evidence_sources: (rawEligibility?.all_evidence_sources || rawEligibility?.allEvidenceSources || []).map((e: any) => ({
          chunk_id: e.chunk_id || e.chunkId,
          document_title: e.document_title || e.documentTitle,
          page_number: e.page_number || e.pageNumber,
          excerpt: e.excerpt,
          official_url: e.official_url || e.officialUrl,
          relevance_score: e.relevance_score || e.relevanceScore,
        })),
        queried_at: rawEligibility?.queried_at || rawEligibility?.queriedAt || new Date().toISOString(),
      };

      return { query, eligibilityResult };
    } catch (err) {
      console.error(`[API] Scoped eligibility evaluation failed for ${schemeId}:`, err);
      throw err;
    }
  },

  continueEligibility: async (
    queryId: string,
    additionalInfo: Record<string, any>,
    uploadedDocumentId?: string
  ): Promise<{ query: SchemeQuery; eligibilityResult: MultiDocEligibilityResult }> => {
    try {
      const { data } = await api.post("/schemes/eligibility/continue", {
        query_id: queryId,
        additional_info: additionalInfo,
        uploaded_document_id: uploadedDocumentId,
      });

      const rawEligibility = data.eligibility_result || data.eligibilityResult;
      const backendQueryId = data.query_id || data.queryId;
      if (rawEligibility && backendQueryId) {
        rawEligibility.query_id = backendQueryId;
        rawEligibility.queryId = backendQueryId;
      }
      const query: SchemeQuery = {
        query_id: backendQueryId || queryId,
        profile_id: data.profile_id || data.profileId,
        conversation_id: data.conversation_id || data.conversationId,
        scheme_id: data.scheme_id || data.schemeId,
        user_question: data.user_question || data.userQuestion || "Continued Check",
        ai_response: data.ai_response || data.aiResponse || "",
        retrieved_chunks: (data.retrieved_chunks || data.retrievedChunks || []).map((c: any) => ({
          chunk_id: c.chunk_id || c.chunkId || "chk_1",
          scheme_name: c.scheme_name || c.schemeName || "Government Scheme",
          excerpt: c.excerpt || "",
          official_url: c.official_url || c.officialUrl || "https://pmjay.gov.in",
        })),
        confidence_score: data.confidence_score ?? data.confidenceScore ?? 0.85,
        is_low_confidence: data.is_low_confidence ?? data.isLowConfidence ?? false,
        eligibility_result: rawEligibility,
        created_at: data.created_at || data.createdAt,
      };

      const eligibilityResult: MultiDocEligibilityResult = {
        query_id: rawEligibility?.query_id || rawEligibility?.queryId || query.query_id,
        scheme_id: rawEligibility?.scheme_id || rawEligibility?.schemeId || query.scheme_id,
        user_question: rawEligibility?.user_question || rawEligibility?.userQuestion || query.user_question,
        overall_status: rawEligibility?.overall_status || rawEligibility?.overallStatus || "POSSIBLY_ELIGIBLE",
        overall_explanation: rawEligibility?.overall_explanation || rawEligibility?.overallExplanation || query.ai_response,
        criteria_breakdown: (rawEligibility?.criteria_breakdown || rawEligibility?.criteriaBreakdown || []).map((c: any) => ({
          criterion_id: c.criterion_id || c.criterionId,
          criterion_name: c.criterion_name || c.criterionName,
          criterion_result: c.criterion_result || c.criterionResult,
          patient_value: c.patient_value || c.patientValue,
          required_value: c.required_value || c.requiredValue,
          explanation: c.explanation,
          source: c.source,
          field_key: c.field_key || c.fieldKey,
          question_prompt: c.question_prompt || c.questionPrompt,
          input_type: c.input_type || c.inputType,
          supporting_evidence: c.supporting_evidence || c.supportingEvidence || [],
          is_missing_info: c.is_missing_info ?? c.isMissingInfo ?? false,
        })),
        missing_information: rawEligibility?.missing_information || rawEligibility?.missingInformation || [],
        structured_missing_criteria: (rawEligibility?.structured_missing_criteria || rawEligibility?.structuredMissingCriteria || []).map((m: any) => ({
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
        all_evidence_sources: (rawEligibility?.all_evidence_sources || rawEligibility?.allEvidenceSources || []).map((e: any) => ({
          chunk_id: e.chunk_id || e.chunkId,
          document_title: e.document_title || e.documentTitle,
          page_number: e.page_number || e.pageNumber,
          excerpt: e.excerpt,
          official_url: e.official_url || e.officialUrl,
          relevance_score: e.relevance_score || e.relevanceScore,
        })),
        queried_at: rawEligibility?.queried_at || rawEligibility?.queriedAt || new Date().toISOString(),
      };

      return { query, eligibilityResult };
    } catch (err) {
      console.error(`[API] Continue eligibility query failed for ${queryId}:`, err);
      throw err;
    }
  },

  getUserQueryHistory: async (): Promise<SchemeQuery[]> => {
    try {
      const { data } = await api.get<any[]>("/schemes/queries");
      if (Array.isArray(data)) {
        return data.map((d: any) => ({
          query_id: d.queryId || d.query_id,
          profile_id: d.profileId || d.profile_id,
          conversation_id: d.conversationId || d.conversation_id,
          scheme_id: d.schemeId || d.scheme_id,
          user_question: d.userQuestion || d.user_question,
          ai_response: d.aiResponse || d.ai_response,
          retrieved_chunks: (d.retrievedChunks || d.retrieved_chunks || []).map((c: any) => ({
            chunk_id: c.chunkId || c.chunk_id,
            scheme_name: c.schemeName || c.scheme_name,
            excerpt: c.excerpt,
            official_url: c.officialUrl || c.official_url,
          })),
          confidence_score: d.confidenceScore ?? d.confidence_score ?? 0.85,
          is_low_confidence: d.isLowConfidence ?? d.is_low_confidence ?? false,
          eligibility_result: d.eligibilityResult || d.eligibility_result,
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
      const { data } = await api.get<any>(`/schemes/queries/${queryId}`);
      if (!data) return null;
      return {
        query_id: data.queryId || data.query_id,
        profile_id: data.profileId || data.profile_id,
        conversation_id: data.conversationId || data.conversation_id,
        scheme_id: data.schemeId || data.scheme_id,
        user_question: data.userQuestion || data.user_question,
        ai_response: data.aiResponse || data.ai_response,
        retrieved_chunks: (data.retrievedChunks || data.retrieved_chunks || []).map((c: any) => ({
          chunk_id: c.chunkId || c.chunk_id,
          scheme_name: c.schemeName || c.scheme_name,
          excerpt: c.excerpt,
          official_url: c.officialUrl || c.official_url,
        })),
        confidence_score: data.confidenceScore ?? data.confidence_score ?? 0.85,
        is_low_confidence: data.is_low_confidence ?? data.isLowConfidence ?? false,
        eligibility_result: data.eligibilityResult || data.eligibility_result,
        created_at: data.createdAt || data.created_at,
      };
    } catch (err) {
      console.error(`[API] Could not fetch query ${queryId}:`, err);
      return null;
    }
  },
};
