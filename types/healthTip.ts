export type HealthTipCategory =
  | "General Wellness"
  | "Nutrition"
  | "Seasonal"
  | "Chronic Condition Management";

export interface HealthTip {
  tip_id: string;
  title: string;
  summary: string;
  full_content: string;
  category: HealthTipCategory;
  target_condition?: string; // e.g. "Diabetes", "Hypertension"
  icon_type: "water" | "apple" | "sun" | "activity" | "shield" | "heart";
  read_time: string; // e.g. "2 min read"
}
