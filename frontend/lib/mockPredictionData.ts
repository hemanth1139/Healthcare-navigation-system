import { FullPredictionReport } from "@/types/prediction";

const delay = (ms: number = 300) => new Promise((resolve) => setTimeout(resolve, ms));

export const MOCK_NORMAL_PREDICTION: FullPredictionReport = {
  prediction: {
    prediction_id: "pred_101",
    conversation_id: "conv_88192",
    predicted_disease: "Tension-Type Headache & Viral Syndrome",
    confidence_score: 0.78,
    prediction_model: "XGBoost-Clinical-v2.4",
    predicted_at: new Date().toISOString(),
  },
  differential: [
    {
      disease_name: "Tension-Type Headache & Mild Stress",
      confidence_score: 0.78,
      is_top_match: true,
      description: "Characterized by dull, aching head pain, neck muscle tightness, and fatigue.",
      category: "Neurology / Primary Care",
    },
    {
      disease_name: "Acute Viral Upper Respiratory Infection",
      confidence_score: 0.62,
      is_top_match: false,
      description: "Low-grade fever accompanied by head heaviness and mild sinus pressure.",
      category: "General Medicine",
    },
    {
      disease_name: "Dehydration & Ocular Strain",
      confidence_score: 0.35,
      is_top_match: false,
      description: "Headache triggered by insufficient fluid intake and screen exposure.",
      category: "Preventive Health",
    },
    {
      disease_name: "Acute Sinusitis",
      confidence_score: 0.18,
      is_top_match: false,
      description: "Inflammation of paranasal sinuses causing forehead tightness.",
      category: "ENT",
    },
  ],
  shapExplanations: [
    {
      shap_id: "shp_1",
      prediction_id: "pred_101",
      feature_name: "fever_duration_days",
      plain_language_label: "Duration of mild fever (< 2 days)",
      contribution_score: 0.34,
    },
    {
      shap_id: "shp_2",
      prediction_id: "pred_101",
      feature_name: "headache_severity_scale",
      plain_language_label: "Headache severity rating (4/10)",
      contribution_score: 0.28,
    },
    {
      shap_id: "shp_3",
      prediction_id: "pred_101",
      feature_name: "neck_muscle_stiffness",
      plain_language_label: "Neck & shoulder tightness",
      contribution_score: 0.19,
    },
    {
      shap_id: "shp_4",
      prediction_id: "pred_101",
      feature_name: "fluid_intake_24h",
      plain_language_label: "Recent fluid intake level",
      contribution_score: -0.12,
    },
    {
      shap_id: "shp_5",
      prediction_id: "pred_101",
      feature_name: "absence_of_nausea",
      plain_language_label: "Absence of nausea or vomiting",
      contribution_score: -0.22,
    },
  ],
  severityAssessment: {
    assessment_id: "sev_101",
    prediction_id: "pred_101",
    severity: "moderate",
    urgency_level: "Moderate Urgency - Routine Navigation",
    emergency_flag: false,
    explanation:
      "Your symptoms indicate a routine, non-emergency viral or tension headache pattern. Rest, hydration, and primary physician guidance are recommended.",
  },
  recommendedSpecialistCategory: "General Physician / Neurologist",
};

export const MOCK_EMERGENCY_PREDICTION: FullPredictionReport = {
  prediction: {
    prediction_id: "pred_emergency_102",
    conversation_id: "conv_emergency_991",
    predicted_disease: "Acute Coronary Syndrome / Ischemic Cardiac Event",
    confidence_score: 0.91,
    prediction_model: "XGBoost-EmergencyTriage-v3.0",
    predicted_at: new Date().toISOString(),
  },
  differential: [
    {
      disease_name: "Acute Coronary Syndrome (ACS)",
      confidence_score: 0.91,
      is_top_match: true,
      description: "Severe substernal chest pressure radiating to left arm with breathlessness.",
      category: "Cardiology Emergency",
    },
    {
      disease_name: "Acute Pulmonary Embolism",
      confidence_score: 0.54,
      is_top_match: false,
      description: "Sudden onset dyspnea and chest discomfort.",
      category: "Pulmonology Emergency",
    },
    {
      disease_name: "Severe Gastroesophageal Reflux",
      confidence_score: 0.22,
      is_top_match: false,
      description: "Retrosternal burning pain resembling cardiac distress.",
      category: "Gastroenterology",
    },
  ],
  shapExplanations: [
    {
      shap_id: "shp_e1",
      prediction_id: "pred_emergency_102",
      feature_name: "chest_pressure_substernal",
      plain_language_label: "Substernal chest tightness & pressure",
      contribution_score: 0.52,
    },
    {
      shap_id: "shp_e2",
      prediction_id: "pred_emergency_102",
      feature_name: "radiation_left_arm",
      plain_language_label: "Pain radiation to left arm",
      contribution_score: 0.41,
    },
    {
      shap_id: "shp_e3",
      prediction_id: "pred_emergency_102",
      feature_name: "shortness_of_breath_acute",
      plain_language_label: "Sudden shortness of breath",
      contribution_score: 0.38,
    },
    {
      shap_id: "shp_e4",
      prediction_id: "pred_emergency_102",
      feature_name: "diaphoresis_cold_sweat",
      plain_language_label: "Cold sweating & dizziness",
      contribution_score: 0.29,
    },
  ],
  severityAssessment: {
    assessment_id: "sev_emergency_102",
    prediction_id: "pred_emergency_102",
    severity: "emergency",
    urgency_level: "CRITICAL EMERGENCY ESCALATION",
    emergency_flag: true,
    explanation:
      "CRITICAL EMERGENCY ALERT: Chest tightness radiating to arm combined with dyspnea requires immediate evaluation at an Emergency Trauma Center.",
  },
  recommendedSpecialistCategory: "Interventional Cardiologist / ER Trauma Unit",
};

const MOCK_ALL_REPORTS: Record<string, FullPredictionReport> = {
  pred_101: MOCK_NORMAL_PREDICTION,
  pred_emergency_102: MOCK_EMERGENCY_PREDICTION,
};

export const predictionApi = {
  getReport: async (predictionId: string): Promise<FullPredictionReport> => {
    await delay(300);
    return MOCK_ALL_REPORTS[predictionId] || MOCK_NORMAL_PREDICTION;
  },

  getAllReports: async (): Promise<FullPredictionReport[]> => {
    await delay(300);
    return Object.values(MOCK_ALL_REPORTS);
  },
};
