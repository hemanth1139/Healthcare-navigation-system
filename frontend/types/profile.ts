export type GenderOption = "Male" | "Female" | "Other" | "Prefer not to say";

export type BloodGroupOption =
  | "A+"
  | "A-"
  | "B+"
  | "B-"
  | "O+"
  | "O-"
  | "AB+"
  | "AB-"
  | "Unknown";

export type EmploymentStatusOption =
  | "Government Employee"
  | "Private Sector Employee"
  | "Self-Employed"
  | "Unemployed/Homemaker"
  | "Retired/Pensioner"
  | "Student";

export type RationCardTypeOption = "BPL" | "APL" | "None";

export type DisabilityStatusOption = "Yes" | "No";

export type PregnancyStatusOption = "Yes" | "No";

export type AllergySeverity = "Mild" | "Moderate" | "Severe";

export interface PatientProfile {
  profile_id: string;
  patient_name?: string;
  date_of_birth?: string;
  gender?: GenderOption;
  blood_group?: BloodGroupOption;
  height_cm?: number;
  weight_kg?: number;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  annual_income?: number;
  employment_status?: EmploymentStatusOption;
  family_size?: number;
  ration_card_type?: RationCardTypeOption;
  disability_status?: DisabilityStatusOption;
  pregnancy_status?: PregnancyStatusOption;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
}

export interface Allergy {
  allergy_id: string;
  allergy_name: string;
  severity: AllergySeverity;
  notes?: string;
}

export interface ChronicCondition {
  condition_id: string;
  condition_name: string;
  diagnosed_year?: number;
  notes?: string;
}

export interface Medication {
  medication_id: string;
  medicine_name: string;
  dosage: string;
  frequency: string;
  prescribed_by?: string;
}

export interface FullPatientRecord {
  profile: PatientProfile;
  allergies: Allergy[];
  chronicConditions: ChronicCondition[];
  medications: Medication[];
}
