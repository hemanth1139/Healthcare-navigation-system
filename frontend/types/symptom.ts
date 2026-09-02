// Phase 1: Structured symptom types extracted from Gemini 2.5 Flash conversational intake

export type SeverityIndicator = "mild" | "moderate" | "severe" | "critical";

export interface AssociatedSymptom {
  name: string;
  present: boolean;
  duration?: string;
}

export interface RiskFactor {
  factor: string;
  value: string;
}

export interface StructuredSymptomPayload {
  symptom_id: string;
  consultation_id: string;
  primary_symptom: string;
  associated_symptoms: AssociatedSymptom[];
  duration: string;          // e.g. "3 days"
  onset: string;             // e.g. "Sudden onset", "Gradual"
  severity_indicator: SeverityIndicator;
  severity_score?: number;   // 1–10
  risk_factors: RiskFactor[];
  is_complete: boolean;      // True when Gemini considers intake complete
  extracted_at: string;      // ISO timestamp
}
