// Phase 1: Updated history types — replaces prediction-centric model with
// consultation-based history covering symptom sessions, assessments, specialist
// recommendations, hospital lookups, scheme queries, and document uploads.

import { UrgencyLevel } from "@/types/assessment";

export type ConsultationHistoryType =
  | "symptom_consultation"
  | "scheme_query"
  | "document_upload";

export type HistoryItemType = ConsultationHistoryType | "All";

export type UrgencyBadge = UrgencyLevel | null;

export interface ConsultationSummary {
  consultation_id: string;
  primary_symptom: string;
  urgency_level: UrgencyLevel;
  urgency_label: string;           // e.g. "Non-Urgent"
  specialist_recommended: string;  // e.g. "General Physician"
  hospital_found: boolean;
  consultation_date: string;       // ISO timestamp
  total_turns: number;
}

export interface SchemeQuerySummary {
  query_id: string;
  scheme_name: string;
  user_question: string;
  overall_status: "ELIGIBLE" | "NOT_ELIGIBLE" | "POSSIBLY_ELIGIBLE" | "INSUFFICIENT_INFORMATION";
  queried_at: string;
}

export interface DocumentUploadSummary {
  document_id: string;
  document_type_label: string;
  file_name: string;
  scheme_name?: string;
  uploaded_at: string;
  processing_status: string;
}

// Unified history item for timeline display
export interface HistoryItem {
  id: string;
  type: ConsultationHistoryType;
  title: string;
  subtitle: string;
  timestamp: string;               // ISO string
  relativeGroup: "Today" | "Yesterday" | "This Week" | "Earlier";
  urgency?: UrgencyBadge;
  linkTo: string;
  detailsPayload?: {
    // Symptom consultation
    primary_symptom?: string;
    urgency_level?: UrgencyLevel;
    urgency_label?: string;
    specialist_recommended?: string;
    total_turns?: number;
    // Scheme query
    scheme_name?: string;
    user_question?: string;
    overall_status?: string;
    ai_answer_excerpt?: string;
    // Document upload
    document_type_label?: string;
    file_name?: string;
    processing_status?: string;
  };
}

export type HistoryTypeFilter = "All" | ConsultationHistoryType;
export type HistoryDateRange = "7d" | "30d" | "all";
