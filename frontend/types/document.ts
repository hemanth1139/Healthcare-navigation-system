// Phase 1: Eligibility document upload types for government scheme supporting documents

export type DocumentType =
  | "income_certificate"
  | "caste_certificate"
  | "aadhaar_card"
  | "ration_card"
  | "disability_certificate"
  | "birth_certificate"
  | "other";

export type DocumentProcessingStatus =
  | "pending"
  | "processing"
  | "verified"
  | "rejected"
  | "requires_reupload";

export interface SchemeDocument {
  document_id: string;
  profile_id: string;
  scheme_id?: string;          // Optional: linked to a specific scheme eligibility check
  document_type: DocumentType;
  document_type_label: string; // Human-readable label e.g. "Income Certificate"
  file_name: string;
  file_size_bytes: number;
  mime_type: string;           // e.g. "application/pdf", "image/jpeg"
  cloudinary_url?: string;     // Cloudinary storage URL
  processing_status: DocumentProcessingStatus;
  uploaded_at: string;         // ISO timestamp
  verified_at?: string;
}
