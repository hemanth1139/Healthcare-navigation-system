// Phase 1: Mock data for clinical rule-engine Severity & Urgency Assessment
// and Specialist Recommendations

import {
  SeverityUrgencyAssessment,
  SpecialistRecommendation,
  TriggeredRedFlag,
} from "@/types/assessment";

export const MOCK_RED_FLAGS: TriggeredRedFlag[] = [];

export const MOCK_ASSESSMENTS: SeverityUrgencyAssessment[] = [];

export const MOCK_SPECIALIST_RECOMMENDATIONS: SpecialistRecommendation[] = [];

// Assessment API Service
export const assessmentApi = {
  getLatestAssessment: async (): Promise<SeverityUrgencyAssessment | null> => {
    return MOCK_ASSESSMENTS.length > 0 ? MOCK_ASSESSMENTS[MOCK_ASSESSMENTS.length - 1] : null;
  },

  getAssessmentByConsultation: async (
    consultationId: string
  ): Promise<SeverityUrgencyAssessment | null> => {
    return MOCK_ASSESSMENTS.find((a) => a.consultation_id === consultationId) || null;
  },

  getAllAssessments: async (): Promise<SeverityUrgencyAssessment[]> => {
    return MOCK_ASSESSMENTS;
  },

  getSpecialistRecommendation: async (
    assessmentId: string
  ): Promise<SpecialistRecommendation | null> => {
    return MOCK_SPECIALIST_RECOMMENDATIONS.find((s) => s.assessment_id === assessmentId) || null;
  },

  // Submitting structured symptoms to rule engine
  runRuleEngineAssessment: async (
    consultationId: string
  ): Promise<{ assessment: SeverityUrgencyAssessment | null; specialist: SpecialistRecommendation | null }> => {
    return { assessment: null, specialist: null };
  },
};
