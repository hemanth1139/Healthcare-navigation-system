import { SpecialistRecommendation } from "@/types/specialist";

const delay = (ms: number = 300) => new Promise((resolve) => setTimeout(resolve, ms));

export const MOCK_SPECIALIST_RECOMMENDATIONS: Record<string, SpecialistRecommendation> = {
  pred_101: {
    recommendation_id: "rec_spec_101",
    prediction_id: "pred_101",
    specialist: "Neurology & General Medicine",
    reason:
      "Based on your reported tension-type headache, persistent neck stiffness, and mild viral syndrome, evaluation by a Neurologist or Primary Care Physician is recommended.",
    urgency_note: "Routine consultation within 3 - 5 days.",
    associated_symptoms: ["Tension Headache", "Neck Muscle Tightness", "Viral Fever"],
  },
  pred_emergency_102: {
    recommendation_id: "rec_spec_102",
    prediction_id: "pred_emergency_102",
    specialist: "Interventional Cardiology & ER Unit",
    reason:
      "CRITICAL MATCH: Based on acute substernal chest pressure radiating to your left arm and sudden breathlessness, immediate emergency assessment by a Cardiologist is required.",
    urgency_note: "Immediate Emergency Escalation — Seek ER Facility Now.",
    associated_symptoms: ["Chest Tightness", "Arm Pain Radiation", "Shortness of Breath"],
  },
};

export const specialistApi = {
  getRecommendation: async (predictionId: string): Promise<SpecialistRecommendation> => {
    await delay(250);
    return (
      MOCK_SPECIALIST_RECOMMENDATIONS[predictionId] ||
      MOCK_SPECIALIST_RECOMMENDATIONS["pred_101"]
    );
  },
};
