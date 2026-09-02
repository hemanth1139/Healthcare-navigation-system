// Phase 1: Clinical Rule-Engine Severity & Urgency Assessment types
// Replaces ML-based SeverityAssessment in types/prediction.ts

export type UrgencyLevel = "EMERGENCY" | "URGENT" | "NON_URGENT" | "ROUTINE";

export interface TriggeredRedFlag {
  rule_id: string;
  rule_name: string;                // e.g. "Chest Pain with Diaphoresis"
  description: string;             // Brief clinical explanation
  literature_reference?: string;   // e.g. "NICE CG95: Chest Pain of Recent Onset"
}

export interface SeverityUrgencyAssessment {
  assessment_id: string;
  consultation_id: string;
  urgency_level: UrgencyLevel;
  urgency_label: string;            // Human-readable: "Immediate Emergency", "Seek Care Within 24h", etc.
  urgency_explanation: string;      // Full clinical explanation
  recommended_action: string;       // What the patient should do next
  triggered_red_flags: TriggeredRedFlag[];
  assessed_at: string;              // ISO timestamp
}

// Specialist recommendation produced after severity assessment
export interface SpecialistRecommendation {
  recommendation_id: string;
  assessment_id: string;
  specialist_category: string;      // e.g. "Cardiologist", "General Physician"
  specialist_description: string;
  recommendation_reason: string;
  urgency_level: UrgencyLevel;
  fallback_to_gp: boolean;          // True if no specific specialty could be determined
}
