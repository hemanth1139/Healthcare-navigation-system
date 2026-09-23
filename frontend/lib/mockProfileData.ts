import {
  FullPatientRecord,
  PatientProfile,
  Allergy,
  ChronicCondition,
  Medication,
} from "@/types/profile";
import { api, USE_MOCK_API } from "./api";

let MOCK_PATIENT_RECORD: FullPatientRecord = {
  profile: {
    profile_id: "",
    patient_name: "",
    date_of_birth: "",
    gender: "Male",
    blood_group: "O+",
    height_cm: 0,
    weight_kg: 0,
    address: "",
    city: "",
    state: "",
    pincode: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
  },
  allergies: [],
  chronicConditions: [],
  medications: [],
};

export const profileApi = {
  getRecord: async (): Promise<FullPatientRecord> => {
    if (!USE_MOCK_API) {
      try {
        const [profRes, algRes, condRes, medRes] = await Promise.all([
          api.get("/profile"),
          api.get("/profile/allergies"),
          api.get("/profile/conditions"),
          api.get("/profile/medications"),
        ]);
        const p = profRes.data;
        return {
          profile: {
            profile_id: p.profile_id || p.profileId || "",
            patient_name: p.patient_name || p.patientName || "",
            date_of_birth: p.date_of_birth || p.dateOfBirth || "",
            gender: p.gender || "Male",
            blood_group: p.blood_group || p.bloodGroup || "O+",
            height_cm: p.height_cm ?? p.heightCm ?? 0,
            weight_kg: p.weight_kg ?? p.weightKg ?? 0,
            address: p.address || "",
            city: p.city || "",
            state: p.state || "",
            pincode: p.pincode || "",
            emergency_contact_name: p.emergency_contact_name || p.emergencyContactName || "",
            emergency_contact_phone: p.emergency_contact_phone || p.emergencyContactPhone || "",
          },
          allergies: (algRes.data || []).map((a: any) => ({
            allergy_id: a.allergy_id || a.allergyId,
            allergy_name: a.allergy_name || a.allergyName,
            severity: a.severity,
            notes: a.notes,
          })),
          chronicConditions: (condRes.data || []).map((c: any) => ({
            condition_id: c.condition_id || c.conditionId,
            condition_name: c.condition_name || c.conditionName,
            diagnosed_year: c.diagnosed_year || c.diagnosedYear,
            notes: c.notes,
          })),
          medications: (medRes.data || []).map((m: any) => ({
            medication_id: m.medication_id || m.medicationId,
            medicine_name: m.medicine_name || m.medicineName,
            dosage: m.dosage,
            frequency: m.frequency,
            prescribed_by: m.prescribed_by || m.prescribedBy,
          })),
        };
      } catch (err) {
        console.warn("[API] Backend profile query failed, using empty profile:", err);
      }
    }

    return JSON.parse(JSON.stringify(MOCK_PATIENT_RECORD));
  },

  updateProfile: async (updated: Partial<PatientProfile>): Promise<PatientProfile> => {
    if (!USE_MOCK_API) {
      try {
        const { data } = await api.put("/profile", updated);
        if (data) {
          MOCK_PATIENT_RECORD.profile = { ...MOCK_PATIENT_RECORD.profile, ...data };
          return MOCK_PATIENT_RECORD.profile;
        }
      } catch (err) {
        console.warn("[API] Backend updateProfile failed:", err);
      }
    }

    MOCK_PATIENT_RECORD.profile = {
      ...MOCK_PATIENT_RECORD.profile,
      ...updated,
    };
    return JSON.parse(JSON.stringify(MOCK_PATIENT_RECORD.profile));
  },

  // Allergy CRUD
  addAllergy: async (allergy: Omit<Allergy, "allergy_id">): Promise<Allergy> => {
    if (!USE_MOCK_API) {
      try {
        const { data } = await api.post("/profile/allergies", allergy);
        if (data) {
          const newA = {
            allergy_id: data.allergy_id || data.allergyId,
            allergy_name: data.allergy_name || data.allergyName,
            severity: data.severity,
            notes: data.notes,
          };
          MOCK_PATIENT_RECORD.allergies.push(newA);
          return newA;
        }
      } catch (err) {
        console.warn("[API] Backend addAllergy failed:", err);
      }
    }

    const newAllergy: Allergy = {
      ...allergy,
      allergy_id: `alg_${Date.now()}`,
    };
    MOCK_PATIENT_RECORD.allergies.push(newAllergy);
    return newAllergy;
  },

  updateAllergy: async (allergy: Allergy): Promise<Allergy> => {
    if (!USE_MOCK_API) {
      try {
        await api.put(`/profile/allergies/${allergy.allergy_id}`, allergy);
      } catch (err) {
        console.warn("[API] Backend updateAllergy failed:", err);
      }
    }
    MOCK_PATIENT_RECORD.allergies = MOCK_PATIENT_RECORD.allergies.map((a) =>
      a.allergy_id === allergy.allergy_id ? allergy : a
    );
    return allergy;
  },

  deleteAllergy: async (allergyId: string): Promise<void> => {
    if (!USE_MOCK_API) {
      try {
        await api.delete(`/profile/allergies/${allergyId}`);
      } catch (err) {
        console.warn("[API] Backend deleteAllergy failed:", err);
      }
    }
    MOCK_PATIENT_RECORD.allergies = MOCK_PATIENT_RECORD.allergies.filter(
      (a) => a.allergy_id !== allergyId
    );
  },

  // Chronic Condition CRUD
  addCondition: async (
    condition: Omit<ChronicCondition, "condition_id">
  ): Promise<ChronicCondition> => {
    if (!USE_MOCK_API) {
      try {
        const { data } = await api.post("/profile/conditions", condition);
        if (data) {
          const newC = {
            condition_id: data.condition_id || data.conditionId,
            condition_name: data.condition_name || data.conditionName,
            diagnosed_year: data.diagnosed_year || data.diagnosedYear,
            notes: data.notes,
          };
          MOCK_PATIENT_RECORD.chronicConditions.push(newC);
          return newC;
        }
      } catch (err) {
        console.warn("[API] Backend addCondition failed:", err);
      }
    }

    const newCondition: ChronicCondition = {
      ...condition,
      condition_id: `con_${Date.now()}`,
    };
    MOCK_PATIENT_RECORD.chronicConditions.push(newCondition);
    return newCondition;
  },

  updateCondition: async (condition: ChronicCondition): Promise<ChronicCondition> => {
    if (!USE_MOCK_API) {
      try {
        await api.put(`/profile/conditions/${condition.condition_id}`, condition);
      } catch (err) {
        console.warn("[API] Backend updateCondition failed:", err);
      }
    }
    MOCK_PATIENT_RECORD.chronicConditions = MOCK_PATIENT_RECORD.chronicConditions.map((c) =>
      c.condition_id === condition.condition_id ? condition : c
    );
    return condition;
  },

  deleteCondition: async (conditionId: string): Promise<void> => {
    if (!USE_MOCK_API) {
      try {
        await api.delete(`/profile/conditions/${conditionId}`);
      } catch (err) {
        console.warn("[API] Backend deleteCondition failed:", err);
      }
    }
    MOCK_PATIENT_RECORD.chronicConditions = MOCK_PATIENT_RECORD.chronicConditions.filter(
      (c) => c.condition_id !== conditionId
    );
  },

  // Medication CRUD
  addMedication: async (
    medication: Omit<Medication, "medication_id">
  ): Promise<Medication> => {
    if (!USE_MOCK_API) {
      try {
        const { data } = await api.post("/profile/medications", medication);
        if (data) {
          const newM = {
            medication_id: data.medication_id || data.medicationId,
            medicine_name: data.medicine_name || data.medicineName,
            dosage: data.dosage,
            frequency: data.frequency,
            prescribed_by: data.prescribed_by || data.prescribedBy,
          };
          MOCK_PATIENT_RECORD.medications.push(newM);
          return newM;
        }
      } catch (err) {
        console.warn("[API] Backend addMedication failed:", err);
      }
    }

    const newMed: Medication = {
      ...medication,
      medication_id: `med_${Date.now()}`,
    };
    MOCK_PATIENT_RECORD.medications.push(newMed);
    return newMed;
  },

  updateMedication: async (medication: Medication): Promise<Medication> => {
    if (!USE_MOCK_API) {
      try {
        await api.put(`/profile/medications/${medication.medication_id}`, medication);
      } catch (err) {
        console.warn("[API] Backend updateMedication failed:", err);
      }
    }
    MOCK_PATIENT_RECORD.medications = MOCK_PATIENT_RECORD.medications.map((m) =>
      m.medication_id === medication.medication_id ? medication : m
    );
    return medication;
  },

  deleteMedication: async (medicationId: string): Promise<void> => {
    if (!USE_MOCK_API) {
      try {
        await api.delete(`/profile/medications/${medicationId}`);
      } catch (err) {
        console.warn("[API] Backend deleteMedication failed:", err);
      }
    }
    MOCK_PATIENT_RECORD.medications = MOCK_PATIENT_RECORD.medications.filter(
      (m) => m.medication_id !== medicationId
    );
  },
};

