export interface GovernmentScheme {
  scheme_id: string;
  scheme_name: string;
  department: string;
  eligibility: string;
  benefits: string;
  official_url: string;
  last_updated: string; // e.g. "March 2026"
  category?: string;
  coverage_amount?: string;
}

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
  confidence_score: number; // 0.0 to 1.0 (e.g. 0.84 = 84%)
  is_low_confidence?: boolean;
}
