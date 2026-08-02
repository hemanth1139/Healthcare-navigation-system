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

export type AllergySeverity = "Mild" | "Moderate" | "Severe";

export interface PatientProfile {
  profile_id: string;
  date_of_birth?: string;
  gender?: GenderOption;
  blood_group?: BloodGroupOption;
  height_cm?: number;
  weight_kg?: number;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
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
