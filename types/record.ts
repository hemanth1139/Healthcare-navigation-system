export type RecordCategory =
  | "Prescription"
  | "Lab Report"
  | "Scan / Imaging"
  | "Discharge Summary"
  | "Other";

export type FhirResourceType =
  | "DiagnosticReport"
  | "DocumentReference"
  | "MedicationRequest"
  | "Observation";

export interface MedicalRecord {
  record_id: string;
  profile_id: string;
  file_name: string;
  cloudinary_url: string;
  file_type: "pdf" | "image/jpeg" | "image/png" | "image/webp";
  category: RecordCategory;
  upload_date: string;
  is_pii_redacted: boolean;
  fhir_resource_type: FhirResourceType;
  file_size_bytes?: number;
  notes?: string;
}

export interface UploadProgressState {
  record_id?: string;
  file_name: string;
  progress_pct: number;
  status: "uploading" | "redacting_pii" | "fhir_indexing" | "completed" | "error";
}
