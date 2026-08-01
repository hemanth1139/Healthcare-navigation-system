import { MedicalRecord, RecordCategory } from "@/types/record";

const delay = (ms: number = 300) => new Promise((resolve) => setTimeout(resolve, ms));

let MOCK_RECORDS: MedicalRecord[] = [
  {
    record_id: "rec_01",
    profile_id: "usr_demo",
    file_name: "Complete_Blood_Count_CBC_Report_Mar2026.pdf",
    cloudinary_url: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&auto=format&fit=crop&q=60",
    file_type: "pdf",
    category: "Lab Report",
    upload_date: "2026-03-12T10:30:00Z",
    is_pii_redacted: true,
    fhir_resource_type: "DiagnosticReport",
    file_size_bytes: 1420000,
    notes: "Routine quarterly CBC blood panel. Hemoglobin and platelet counts within normal limits.",
  },
  {
    record_id: "rec_02",
    profile_id: "usr_demo",
    file_name: "Chest_XRay_PA_View_Scanned.png",
    cloudinary_url: "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800&auto=format&fit=crop&q=60",
    file_type: "image/png",
    category: "Scan / Imaging",
    upload_date: "2026-03-01T14:15:00Z",
    is_pii_redacted: true,
    fhir_resource_type: "DiagnosticReport",
    file_size_bytes: 3850000,
    notes: "Chest radiography for acute bronchitis check. Clear lung fields without infiltrates.",
  },
  {
    record_id: "rec_03",
    profile_id: "usr_demo",
    file_name: "Dr_Sharma_Cardiology_Prescription_Feb2026.jpg",
    cloudinary_url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=60",
    file_type: "image/jpeg",
    category: "Prescription",
    upload_date: "2026-02-18T09:00:00Z",
    is_pii_redacted: true,
    fhir_resource_type: "MedicationRequest",
    file_size_bytes: 980000,
    notes: "Prescribed Telmisartan 40mg once daily for BP maintenance.",
  },
  {
    record_id: "rec_04",
    profile_id: "usr_demo",
    file_name: "Hospital_Discharge_Summary_Jan2026.pdf",
    cloudinary_url: "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=800&auto=format&fit=crop&q=60",
    file_type: "pdf",
    category: "Discharge Summary",
    upload_date: "2026-01-20T16:45:00Z",
    is_pii_redacted: false,
    fhir_resource_type: "DocumentReference",
    file_size_bytes: 2650000,
    notes: "3-day inpatient observation for viral gastroenteritis.",
  },
  {
    record_id: "rec_05",
    profile_id: "usr_demo",
    file_name: "Lipid_Profile_Cholesterol_Test_Dec2025.pdf",
    cloudinary_url: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&auto=format&fit=crop&q=60",
    file_type: "pdf",
    category: "Lab Report",
    upload_date: "2025-12-10T11:20:00Z",
    is_pii_redacted: true,
    fhir_resource_type: "Observation",
    file_size_bytes: 1150000,
    notes: "Total cholesterol: 185 mg/dL, HDL: 48 mg/dL, LDL: 110 mg/dL.",
  },
  {
    record_id: "rec_06",
    profile_id: "usr_demo",
    file_name: "Lumbar_Spine_MRI_Scan_Nov2025.png",
    cloudinary_url: "https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=800&auto=format&fit=crop&q=60",
    file_type: "image/png",
    category: "Scan / Imaging",
    upload_date: "2025-11-05T13:10:00Z",
    is_pii_redacted: true,
    fhir_resource_type: "DiagnosticReport",
    file_size_bytes: 5200000,
    notes: "Mild L4-L5 disc bulge without nerve root compression.",
  },
  {
    record_id: "rec_07",
    profile_id: "usr_demo",
    file_name: "Diabetes_HbA1c_Blood_Test_Oct2025.pdf",
    cloudinary_url: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&auto=format&fit=crop&q=60",
    file_type: "pdf",
    category: "Lab Report",
    upload_date: "2025-10-15T08:30:00Z",
    is_pii_redacted: true,
    fhir_resource_type: "Observation",
    file_size_bytes: 890000,
    notes: "HbA1c level: 6.2% (Prediabetes monitoring).",
  },
  {
    record_id: "rec_08",
    profile_id: "usr_demo",
    file_name: "Ophthalmology_Eye_Checkup_Prescription.jpg",
    cloudinary_url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=60",
    file_type: "image/jpeg",
    category: "Prescription",
    upload_date: "2025-09-22T15:00:00Z",
    is_pii_redacted: false,
    fhir_resource_type: "MedicationRequest",
    file_size_bytes: 1050000,
    notes: "Prescription for anti-allergy eye drops and glass power update.",
  },
];

export const recordApi = {
  getRecords: async (
    categoryFilter?: string,
    sortBy: string = "newest"
  ): Promise<MedicalRecord[]> => {
    await delay(300);
    let results = [...MOCK_RECORDS];

    if (categoryFilter && categoryFilter !== "All") {
      results = results.filter((r) => r.category === categoryFilter);
    }

    results.sort((a, b) => {
      const dateA = new Date(a.upload_date).getTime();
      const dateB = new Date(b.upload_date).getTime();
      return sortBy === "oldest" ? dateA - dateB : dateB - dateA;
    });

    return results;
  },

  getRecordById: async (recordId: string): Promise<MedicalRecord | null> => {
    await delay(200);
    return MOCK_RECORDS.find((r) => r.record_id === recordId) || null;
  },

  uploadRecord: async (
    file: File,
    category: RecordCategory,
    notes?: string
  ): Promise<MedicalRecord> => {
    await delay(800);

    const ext = file.name.split(".").pop()?.toLowerCase();
    const fileType = ext === "pdf" ? "pdf" : "image/jpeg";

    const newRecord: MedicalRecord = {
      record_id: `rec_${Date.now()}`,
      profile_id: "usr_demo",
      file_name: file.name,
      cloudinary_url:
        fileType === "pdf"
          ? "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&auto=format&fit=crop&q=60"
          : URL.createObjectURL(file),
      file_type: fileType,
      category: category,
      upload_date: new Date().toISOString(),
      is_pii_redacted: true, // Presidio PII pipeline automated redaction
      fhir_resource_type:
        category === "Prescription"
          ? "MedicationRequest"
          : category === "Lab Report"
          ? "DiagnosticReport"
          : category === "Scan / Imaging"
          ? "DiagnosticReport"
          : "DocumentReference",
      file_size_bytes: file.size,
      notes: notes || "Uploaded document successfully indexed into FHIR system.",
    };

    MOCK_RECORDS = [newRecord, ...MOCK_RECORDS];
    return newRecord;
  },

  deleteRecord: async (recordId: string): Promise<void> => {
    await delay(300);
    MOCK_RECORDS = MOCK_RECORDS.filter((r) => r.record_id !== recordId);
  },
};
