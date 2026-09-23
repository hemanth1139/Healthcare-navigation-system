import { MedicalRecord, RecordCategory } from "@/types/record";
import { api, USE_MOCK_API } from "./api";

let MOCK_RECORDS: MedicalRecord[] = [];

export const recordApi = {
  getRecords: async (
    categoryFilter?: string,
    sortBy: string = "newest"
  ): Promise<MedicalRecord[]> => {
    if (!USE_MOCK_API) {
      try {
        const { data } = await api.get<any[]>("/records");
        if (data && Array.isArray(data)) {
          let list: MedicalRecord[] = data.map((r) => ({
            record_id: String(r.record_id || r.recordId),
            profile_id: String(r.profile_id || r.profileId || ""),
            file_name: r.file_name || r.fileName || "record",
            cloudinary_url: r.cloudinary_url || r.file_url || "",
            file_type: r.file_type || "pdf",
            category: r.category || "Lab Report",
            upload_date: r.upload_date || new Date().toISOString(),
            is_pii_redacted: r.is_pii_redacted ?? true,
            fhir_resource_type: r.fhir_resource_type || "DiagnosticReport",
            file_size_bytes: r.file_size_bytes || 0,
            notes: r.notes || "",
          }));

          if (categoryFilter && categoryFilter !== "All") {
            list = list.filter((r) => r.category === categoryFilter);
          }

          list.sort((a, b) => {
            const dateA = new Date(a.upload_date).getTime();
            const dateB = new Date(b.upload_date).getTime();
            return sortBy === "oldest" ? dateA - dateB : dateB - dateA;
          });

          return list;
        }
      } catch (err) {
        console.warn("[API] Failed to fetch medical records from backend:", err);
      }
    }

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
    if (!USE_MOCK_API) {
      try {
        const { data } = await api.get<any>(`/records/${recordId}`);
        if (data) {
          return {
            record_id: String(data.record_id || data.recordId),
            profile_id: String(data.profile_id || data.profileId || ""),
            file_name: data.file_name || data.fileName || "record",
            cloudinary_url: data.cloudinary_url || data.file_url || "",
            file_type: data.file_type || "pdf",
            category: data.category || "Lab Report",
            upload_date: data.upload_date || new Date().toISOString(),
            is_pii_redacted: data.is_pii_redacted ?? true,
            fhir_resource_type: data.fhir_resource_type || "DiagnosticReport",
            file_size_bytes: data.file_size_bytes || 0,
            notes: data.notes || "",
          };
        }
      } catch (err) {
        console.warn("[API] Failed to fetch record by id from backend:", err);
      }
    }

    return MOCK_RECORDS.find((r) => r.record_id === recordId) || null;
  },

  uploadRecord: async (
    file: File,
    category: RecordCategory,
    notes?: string
  ): Promise<MedicalRecord> => {
    if (!USE_MOCK_API) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("recordType", category);

        const { data } = await api.post("/records/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        if (data) {
          return {
            record_id: String(data.record_id || data.recordId),
            profile_id: String(data.profile_id || data.profileId || ""),
            file_name: data.file_name || file.name,
            cloudinary_url: data.cloudinary_url || URL.createObjectURL(file),
            file_type: data.file_type || "pdf",
            category: category,
            upload_date: data.upload_date || new Date().toISOString(),
            is_pii_redacted: true,
            fhir_resource_type: "DiagnosticReport",
            file_size_bytes: file.size,
            notes: notes || "",
          };
        }
      } catch (err) {
        console.warn("[API] Failed to upload record to backend:", err);
      }
    }

    const ext = file.name.split(".").pop()?.toLowerCase();
    const fileType = ext === "pdf" ? "pdf" : "image/jpeg";

    const newRecord: MedicalRecord = {
      record_id: `rec_${Date.now()}`,
      profile_id: "usr_active",
      file_name: file.name,
      cloudinary_url: URL.createObjectURL(file),
      file_type: fileType,
      category: category,
      upload_date: new Date().toISOString(),
      is_pii_redacted: true,
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
    MOCK_RECORDS = MOCK_RECORDS.filter((r) => r.record_id !== recordId);
  },
};
