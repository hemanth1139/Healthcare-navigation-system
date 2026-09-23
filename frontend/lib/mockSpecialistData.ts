import { SpecialistRecommendation } from "@/types/specialist";
import { api, USE_MOCK_API } from "./api";

export const MOCK_SPECIALIST_RECOMMENDATIONS: Record<string, SpecialistRecommendation> = {};

export const specialistApi = {
  getRecommendation: async (predictionId: string): Promise<SpecialistRecommendation> => {
    if (!USE_MOCK_API) {
      try {
        const { data } = await api.get(`/predictions/${predictionId}`);
        if (data?.specialist) {
          return {
            recommendation_id: data.specialist.recommendation_id || `rec_${predictionId}`,
            prediction_id: predictionId,
            specialist: data.specialist.specialist || "General Physician",
            reason: data.specialist.reason || "Consultation with a qualified medical specialist is advised.",
            urgency_note: data.severity || "Standard consultation advised.",
            associated_symptoms: data.symptoms || [],
          };
        }
      } catch (err) {
        console.warn("[API] Failed to fetch specialist recommendation from API:", err);
      }
    }

    return (
      MOCK_SPECIALIST_RECOMMENDATIONS[predictionId] || {
        recommendation_id: `rec_${predictionId}`,
        prediction_id: predictionId,
        specialist: "General Physician",
        reason: "Clinical assessment required for further specialty referral.",
        urgency_note: "Schedule a routine consultation.",
        associated_symptoms: [],
      }
    );
  },
};

