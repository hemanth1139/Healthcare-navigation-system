import {
  GovernmentScheme,
  SchemeQuery,
  MultiDocEligibilityResult,
} from "@/types/scheme";
import { api, USE_MOCK_API } from "./api";

export const MOCK_SCHEMES: GovernmentScheme[] = [];
export const MOCK_ELIGIBILITY_RESULTS: Record<string, MultiDocEligibilityResult> = {};

export const schemeApi = {
  getSchemes: async (
    categoryFilter?: string,
    searchQuery?: string
  ): Promise<GovernmentScheme[]> => {
    if (!USE_MOCK_API) {
      try {
        const params: Record<string, string> = {};
        if (categoryFilter && categoryFilter !== "All") params.category = categoryFilter;
        if (searchQuery && searchQuery.trim()) params.search = searchQuery;
        const { data } = await api.get<GovernmentScheme[]>("/schemes", { params });
        if (data && Array.isArray(data)) return data;
      } catch (err) {
        console.warn("[API] Backend /schemes query failed:", err);
      }
    }

    let results = [...MOCK_SCHEMES];
    if (categoryFilter && categoryFilter !== "All") {
      results = results.filter((s) => s.category === categoryFilter);
    }
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      results = results.filter(
        (s) =>
          s.scheme_name.toLowerCase().includes(q) ||
          s.department.toLowerCase().includes(q) ||
          s.benefits.toLowerCase().includes(q) ||
          s.eligibility.toLowerCase().includes(q)
      );
    }
    return results;
  },

  getSchemeById: async (schemeId: string): Promise<GovernmentScheme | null> => {
    if (!USE_MOCK_API) {
      try {
        const { data } = await api.get<GovernmentScheme>(`/schemes/${schemeId}`);
        if (data) return data;
      } catch (err) {
        console.warn(`[API] Backend /schemes/${schemeId} query failed:`, err);
      }
    }

    return MOCK_SCHEMES.find((s) => s.scheme_id === schemeId) || null;
  },

  querySchemeEligibility: async (
    userQuestion: string,
    schemeId?: string
  ): Promise<{ query: SchemeQuery; eligibilityResult: MultiDocEligibilityResult }> => {
    if (!USE_MOCK_API) {
      try {
        const { data } = await api.post("/schemes/query", {
          query_text: userQuestion,
          scoped_scheme_id: schemeId,
        });

        if (data) {
          const rawEligibility = data.eligibility_result || data.eligibilityResult;
          const query: SchemeQuery = {
            query_id: data.query_id || data.queryId || `q_${Date.now()}`,
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
            })),
            queried_at: new Date().toISOString(),
          };

          return { query, eligibilityResult };
        }
      } catch (err) {
        console.warn("[API] Backend RAG /schemes/query failed:", err);
      }
    }

    const fallbackQueryId = `q_${Date.now()}`;
    const fallbackEligibility: MultiDocEligibilityResult = {
      query_id: fallbackQueryId,
      scheme_id: schemeId,
      user_question: userQuestion,
      overall_status: "INSUFFICIENT_INFORMATION",
      overall_explanation:
        "Unable to determine eligibility from available records. Please ensure your documents are uploaded or consult official government scheme portals.",
      criteria_breakdown: [],
      missing_information: ["Income certificate / BPL document verification", "Demographic details"],
      all_evidence_sources: [],
      queried_at: new Date().toISOString(),
    };

    const fallbackQuery: SchemeQuery = {
      query_id: fallbackQueryId,
      scheme_id: schemeId,
      user_question: userQuestion,
      ai_response: fallbackEligibility.overall_explanation,
      retrieved_chunks: [],
      confidence_score: 0.5,
      is_low_confidence: true,
      eligibility_result: fallbackEligibility,
    };

    return { query: fallbackQuery, eligibilityResult: fallbackEligibility };
  },
};
