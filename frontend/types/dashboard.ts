export interface PatientSummary {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  gender?: string;
  bloodGroup?: string;
  age?: number;
  city?: string;
  state?: string;
  allergies: string[];
  chronicConditions: string[];
  medications: string[];
  isProfileCompleted: boolean;
}

export interface LatestAssessment {
  predictionId: string;
  conversationId: string;
  predictedDisease: string;
  confidenceScore: number;
  severity: "low" | "moderate" | "high" | "emergency" | string;
  urgencyLevel: string;
  emergencyFlag: boolean;
  explanation?: string;
  specialist?: string;
  assessedAt: string;
}

export interface SpecialistRecommendationSummary {
  specialist: string;
  reason?: string;
  conversationId?: string;
  predictionId?: string;
}

export interface RecentConsultationItem {
  conversationId: string;
  date: string;
  formattedTime: string;
  status: string;
  primarySymptom: string;
  predictedDisease?: string;
  confidenceScore?: number;
  severity?: string;
  urgencyLevel?: string;
  emergencyFlag: boolean;
  specialist?: string;
}

export interface RecentSchemeQueryItem {
  queryId: string;
  schemeId?: string;
  schemeName: string;
  userQuestion: string;
  overallStatus: "ELIGIBLE" | "NOT_ELIGIBLE" | "POSSIBLY_ELIGIBLE" | "INSUFFICIENT_INFORMATION" | string;
  overallExplanation?: string;
  queriedAt: string;
}

export interface HospitalSummaryItem {
  hospitalId: string;
  hospitalName: string;
  city?: string;
  state?: string;
  rating?: number;
  hasEmergencyRoom: boolean;
  distanceKm?: number;
  estimatedTime?: number;
  googleMapsUrl?: string;
}

export interface DashboardMetrics {
  totalConsultations: number;
  totalSchemesChecked: number;
  emergencyAlertsCount: number;
  activeSchemesCount: number;
}

export interface DashboardResponse {
  patientSummary: PatientSummary;
  metrics: DashboardMetrics;
  latestAssessment: LatestAssessment | null;
  specialistRecommendation: SpecialistRecommendationSummary | null;
  recentConsultations: RecentConsultationItem[];
  recentSchemeQueries: RecentSchemeQueryItem[];
  recommendedHospitals: HospitalSummaryItem[];
}
