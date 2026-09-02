// Phase 1: Mock data for clinical rule-engine Severity & Urgency Assessment
// and Specialist Recommendations

import {
  SeverityUrgencyAssessment,
  SpecialistRecommendation,
  TriggeredRedFlag,
} from "@/types/assessment";

const delay = (ms: number = 300) => new Promise((resolve) => setTimeout(resolve, ms));

// Sample triggered red flags
export const MOCK_RED_FLAGS: TriggeredRedFlag[] = [
  {
    rule_id: "rf_001",
    rule_name: "Chest Pain with Diaphoresis",
    description:
      "Chest pain accompanied by sweating is a classic presentation of acute coronary syndrome (ACS). Immediate emergency assessment is required.",
    literature_reference: "NICE CG95: Chest Pain of Recent Onset (2016)",
  },
  {
    rule_id: "rf_002",
    rule_name: "Sudden Onset Severe Headache",
    description:
      "Thunderclap headache reaching maximum intensity within 60 seconds may indicate subarachnoid hemorrhage. Requires immediate CT scan and neurological assessment.",
    literature_reference: "BMJ Best Practice: Subarachnoid Haemorrhage (2024)",
  },
  {
    rule_id: "rf_003",
    rule_name: "Shortness of Breath at Rest",
    description:
      "Dyspnea at rest with SpO2 < 94% or rapid deterioration may indicate pulmonary embolism, acute heart failure, or severe pneumonia.",
    literature_reference: "ESC Guidelines on Acute Pulmonary Embolism (2019)",
  },
];

// Sample assessments
export const MOCK_ASSESSMENTS: SeverityUrgencyAssessment[] = [
  {
    assessment_id: "assess_001",
    consultation_id: "cons_001",
    urgency_level: "EMERGENCY",
    urgency_label: "Immediate Emergency — Call 108 Now",
    urgency_explanation:
      "Your reported symptoms of chest pain radiating to the left arm with sweating match multiple high-priority clinical red flags associated with Acute Coronary Syndrome (ACS). This requires immediate emergency medical attention and should not be managed at home.",
    recommended_action:
      "Call emergency services (108 / 112) immediately or have someone drive you to the nearest Emergency Department. Do NOT drive yourself.",
    triggered_red_flags: [MOCK_RED_FLAGS[0]],
    assessed_at: "2026-08-01T15:30:00Z",
  },
  {
    assessment_id: "assess_002",
    consultation_id: "cons_002",
    urgency_level: "URGENT",
    urgency_label: "Seek Medical Care Within 24 Hours",
    urgency_explanation:
      "Your symptoms of sudden onset severe headache with stiff neck and mild fever are concerning. While this may be due to viral illness, the possibility of meningitis or subarachnoid hemorrhage must be excluded promptly.",
    recommended_action:
      "Visit an urgent care clinic or hospital emergency department within the next few hours. Avoid delaying if symptoms worsen.",
    triggered_red_flags: [MOCK_RED_FLAGS[1]],
    assessed_at: "2026-07-31T20:15:00Z",
  },
  {
    assessment_id: "assess_003",
    consultation_id: "cons_003",
    urgency_level: "NON_URGENT",
    urgency_label: "Schedule a GP Appointment",
    urgency_explanation:
      "Your reported symptoms of mild tension-type headache with fatigue and mild dehydration do not trigger any emergency clinical red flags. These symptoms are likely stress-related or due to dehydration.",
    recommended_action:
      "Schedule an appointment with your General Practitioner (GP) within the next 2–3 days. Rest, hydrate adequately, and monitor for worsening symptoms.",
    triggered_red_flags: [],
    assessed_at: "2026-08-01T09:30:00Z",
  },
  {
    assessment_id: "assess_004",
    consultation_id: "cons_004",
    urgency_level: "ROUTINE",
    urgency_label: "Routine Care — No Urgency",
    urgency_explanation:
      "Your reported symptoms of mild seasonal allergies with nasal congestion and watery eyes are consistent with allergic rhinitis. No red flags were identified.",
    recommended_action:
      "You may self-manage with over-the-counter antihistamines. Consult a doctor if symptoms persist beyond two weeks or worsen.",
    triggered_red_flags: [],
    assessed_at: "2026-07-26T16:00:00Z",
  },
];

// Sample specialist recommendations
export const MOCK_SPECIALIST_RECOMMENDATIONS: SpecialistRecommendation[] = [
  {
    recommendation_id: "spec_001",
    assessment_id: "assess_001",
    specialist_category: "Cardiologist",
    specialist_description:
      "A specialist in diseases of the heart and cardiovascular system including diagnosis and treatment of heart attacks, arrhythmias, and heart failure.",
    recommendation_reason:
      "Chest pain with diaphoresis and radiation to left arm strongly suggests a cardiac etiology. Immediate cardiology assessment is required.",
    urgency_level: "EMERGENCY",
    fallback_to_gp: false,
  },
  {
    recommendation_id: "spec_002",
    assessment_id: "assess_002",
    specialist_category: "Neurologist",
    specialist_description:
      "A specialist in disorders of the nervous system including brain, spinal cord, and peripheral nerves.",
    recommendation_reason:
      "Sudden severe headache with neck stiffness requires neurological evaluation to exclude subarachnoid hemorrhage or meningitis.",
    urgency_level: "URGENT",
    fallback_to_gp: false,
  },
  {
    recommendation_id: "spec_003",
    assessment_id: "assess_003",
    specialist_category: "General Physician",
    specialist_description:
      "A General Physician (GP) provides comprehensive primary care and manages common illnesses, referrals, and preventive health.",
    recommendation_reason:
      "Tension headache with mild fatigue and dehydration is appropriate for GP-level primary care management.",
    urgency_level: "NON_URGENT",
    fallback_to_gp: true,
  },
  {
    recommendation_id: "spec_004",
    assessment_id: "assess_004",
    specialist_category: "Allergist / Immunologist",
    specialist_description:
      "Allergist-immunologists diagnose and treat allergic diseases, asthma, immunodeficiency, and related conditions.",
    recommendation_reason:
      "Nasal congestion and watery eyes consistent with allergic rhinitis may benefit from specialist allergy testing if symptoms are recurrent.",
    urgency_level: "ROUTINE",
    fallback_to_gp: false,
  },
];

// Mock API
export const assessmentApi = {
  getLatestAssessment: async (): Promise<SeverityUrgencyAssessment | null> => {
    await delay(300);
    return MOCK_ASSESSMENTS[2]; // NON_URGENT example for dashboard
  },

  getAssessmentByConsultation: async (
    consultationId: string
  ): Promise<SeverityUrgencyAssessment | null> => {
    await delay(200);
    return MOCK_ASSESSMENTS.find((a) => a.consultation_id === consultationId) || null;
  },

  getAllAssessments: async (): Promise<SeverityUrgencyAssessment[]> => {
    await delay(300);
    return MOCK_ASSESSMENTS;
  },

  getSpecialistRecommendation: async (
    assessmentId: string
  ): Promise<SpecialistRecommendation | null> => {
    await delay(200);
    return MOCK_SPECIALIST_RECOMMENDATIONS.find((s) => s.assessment_id === assessmentId) || null;
  },

  // Simulate submitting structured symptoms to rule engine
  runRuleEngineAssessment: async (
    consultationId: string
  ): Promise<{ assessment: SeverityUrgencyAssessment; specialist: SpecialistRecommendation }> => {
    await delay(800); // Simulate processing time
    const assessment = {
      ...MOCK_ASSESSMENTS[2],
      assessment_id: `assess_${Date.now()}`,
      consultation_id: consultationId,
      assessed_at: new Date().toISOString(),
    };
    const specialist = {
      ...MOCK_SPECIALIST_RECOMMENDATIONS[2],
      recommendation_id: `spec_${Date.now()}`,
      assessment_id: assessment.assessment_id,
    };
    return { assessment, specialist };
  },
};
