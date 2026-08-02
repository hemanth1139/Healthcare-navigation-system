import { SeverityLevel } from "@/types/prediction";

export type HistoryItemType = "conversation" | "prediction" | "record" | "scheme_query";

export interface HistoryItem {
  id: string;
  type: HistoryItemType;
  title: string;
  subtitle: string;
  timestamp: string; // ISO string
  relativeGroup: "Today" | "Yesterday" | "This Week" | "Earlier";
  severity?: SeverityLevel;
  thumbnail?: string;
  linkTo: string;
  detailsPayload?: {
    disease_name?: string;
    confidence_score?: number;
    category?: string;
    file_type?: string;
    file_size_bytes?: number;
    user_question?: string;
    ai_answer_excerpt?: string;
    last_message_excerpt?: string;
  };
}

export type HistoryTypeFilter = "All" | "conversation" | "prediction" | "record" | "scheme_query";
export type HistoryDateRange = "7d" | "30d" | "all";
