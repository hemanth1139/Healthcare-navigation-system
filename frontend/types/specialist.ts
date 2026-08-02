export interface SpecialistRecommendation {
  recommendation_id: string;
  prediction_id: string;
  specialist: string; // e.g. "Neurologist", "Pulmonologist", "Interventional Cardiologist"
  reason: string; // Plain-language clinical rationale
  urgency_note?: string;
  associated_symptoms?: string[];
}
