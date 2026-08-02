export type SeverityLevel = "low" | "moderate" | "high" | "emergency";

export interface DiseasePrediction {
  prediction_id: string;
  conversation_id: string;
  predicted_disease: string;
  confidence_score: number; // e.g. 0.84 for 84%
  prediction_model: string; // e.g. "XGBoost-Clinical-v2.1"
  predicted_at: string;
}

export interface DifferentialDisease {
  disease_name: string;
  confidence_score: number; // 0.0 to 1.0
  is_top_match?: boolean;
  description?: string;
  category?: string;
}

export interface ShapExplanation {
  shap_id: string;
  prediction_id: string;
  feature_name: string; // e.g. "fever_duration_days"
  plain_language_label: string; // e.g. "Duration of fever"
  contribution_score: number; // positive increases likelihood, negative decreases
}

export interface SeverityAssessment {
  assessment_id: string;
  prediction_id: string;
  severity: SeverityLevel;
  urgency_level: string; // e.g. "Low Urgency", "Immediate Emergency Triage"
  emergency_flag: boolean;
  explanation: string;
}

export interface FullPredictionReport {
  prediction: DiseasePrediction;
  differential: DifferentialDisease[];
  shapExplanations: ShapExplanation[];
  severityAssessment: SeverityAssessment;
  recommendedSpecialistCategory?: string;
}
