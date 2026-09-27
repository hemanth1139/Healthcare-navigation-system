// Patient-Uploaded Scheme Supporting Document Types

export type DocumentCategory =
  | "INCOME_CERTIFICATE"
  | "ELIGIBILITY_CERTIFICATE"
  | "CASTE_CERTIFICATE"
  | "AADHAAR_CARD"
  | "RATION_CARD"
  | "DISABILITY_CERTIFICATE"
  | "BIRTH_CERTIFICATE"
  | "OTHER";

export type DocumentProcessingStatus =
  | "AVAILABLE"
  | "PROCESSING"
  | "VERIFIED"
  | "FAILED"
  | "PENDING";

export interface SchemeDocument {
  document_id: string;
  profile_id: string;
  scheme_query_id?: string | null;
  file_name: string;
  file_type?: string | null;
  category: string;
  cloudinary_url: string;
  upload_date: string;
  processing_status: string;
}

export const DOCUMENT_CATEGORIES: { value: DocumentCategory; label: string; description: string }[] = [
  {
    value: "INCOME_CERTIFICATE",
    label: "Income Certificate",
    description: "Official annual household income verification from state revenue authority.",
  },
  {
    value: "ELIGIBILITY_CERTIFICATE",
    label: "Eligibility Certificate",
    description: "Specific scheme entitlement, BPL card, or PM-JAY eligibility letter.",
  },
  {
    value: "CASTE_CERTIFICATE",
    label: "Caste / Category Certificate",
    description: "Community/caste certificate for reserved healthcare quotas and subsidies.",
  },
  {
    value: "AADHAAR_CARD",
    label: "Aadhaar Card",
    description: "Government identity verification document.",
  },
  {
    value: "RATION_CARD",
    label: "Ration Card (NFSA / State)",
    description: "Food security card establishing household economic status.",
  },
  {
    value: "DISABILITY_CERTIFICATE",
    label: "Disability Certificate",
    description: "UDID or medical board certified disability documentation.",
  },
  {
    value: "BIRTH_CERTIFICATE",
    label: "Birth Certificate / Age Proof",
    description: "Proof of age for maternal, newborn, or senior citizen benefits.",
  },
  {
    value: "OTHER",
    label: "Other Supporting Document",
    description: "Additional proofs requested by the hospital or scheme nodal officer.",
  },
];
