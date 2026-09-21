import {
  FullPatientRecord,
  PatientProfile,
  Allergy,
  ChronicCondition,
  Medication,
} from "@/types/profile";
import { api, USE_MOCK_API } from "./api";

const delay = (ms: number = 300) => new Promise((resolve) => setTimeout(resolve, ms));

let MOCK_PATIENT_RECORD: FullPatientRecord = {
  profile: {
    profile_id: "prf_778129",
    patient_name: "Dr. Sarah Jenkins",
    date_of_birth: "1988-06-14",
    gender: "Female",
    blood_group: "O+",
    height_cm: 168,
    weight_kg: 62,
    address: "742 Evergreen Terrace, Suite 4B",
    city: "Kolkata",
    state: "West Bengal",
    pincode: "700001",
    emergency_contact_name: "Robert Jenkins (Husband)",
    emergency_contact_phone: "+91 98300 12345",
  },
  allergies: [
    {
      allergy_id: "alg_01",
      allergy_name: "Penicillin",
      severity: "Severe",
      notes: "Triggers anaphylactic reaction and hives. Use Cephalosporins alternative.",
    },
    {
      allergy_id: "alg_02",
      allergy_name: "Peanuts",
      severity: "Moderate",
      notes: "Causes mild swelling and rash. Carry oral antihistamines.",
    },
  ],
  chronicConditions: [
    {
      condition_id: "con_01",
      condition_name: "Type 2 Diabetes Mellitus",
      diagnosed_year: 2019,
      notes: "Managed with oral metformin and low-GI dietary care.",
    },
    {
      condition_id: "con_02",
      condition_name: "Mild Hypertension",
      diagnosed_year: 2021,
      notes: "Monitored bi-weekly. Target BP < 130/80 mmHg.",
    },
  ],
  medications: [
    {
      medication_id: "med_01",
      medicine_name: "Metformin Hydrochloride",
      dosage: "500 mg",
      frequency: "Twice daily after meals",
      prescribed_by: "Dr. Aris Thorne (Endocrinology)",
    },
    {
      medication_id: "med_02",
      medicine_name: "Telmisartan",
      dosage: "40 mg",
      frequency: "Once daily in the morning",
      prescribed_by: "Dr. Elena Vance (Cardiology)",
    },
  ],
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
            profile_id: p.profile_id || p.profileId || MOCK_PATIENT_RECORD.profile.profile_id,
            patient_name: p.patient_name || p.patientName || MOCK_PATIENT_RECORD.profile.patient_name,
            date_of_birth: p.date_of_birth || p.dateOfBirth || MOCK_PATIENT_RECORD.profile.date_of_birth,
            gender: p.gender || MOCK_PATIENT_RECORD.profile.gender,
            blood_group: p.blood_group || p.bloodGroup || MOCK_PATIENT_RECORD.profile.blood_group,
            height_cm: p.height_cm ?? p.heightCm ?? MOCK_PATIENT_RECORD.profile.height_cm,
            weight_kg: p.weight_kg ?? p.weightKg ?? MOCK_PATIENT_RECORD.profile.weight_kg,
            address: p.address || MOCK_PATIENT_RECORD.profile.address,
            city: p.city || MOCK_PATIENT_RECORD.profile.city,
            state: p.state || MOCK_PATIENT_RECORD.profile.state,
            pincode: p.pincode || MOCK_PATIENT_RECORD.profile.pincode,
            emergency_contact_name: p.emergency_contact_name || p.emergencyContactName || MOCK_PATIENT_RECORD.profile.emergency_contact_name,
            emergency_contact_phone: p.emergency_contact_phone || p.emergencyContactPhone || MOCK_PATIENT_RECORD.profile.emergency_contact_phone,
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
        console.warn("[API] Backend profile query failed, using local profile:", err);
      }
    }

    await delay(300);
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
        console.warn("[API] Backend updateProfile failed, updating local profile:", err);
      }
    }

    await delay(500);
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
        console.warn("[API] Backend addAllergy failed, using local fallback:", err);
      }
    }

    await delay(400);
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
    await delay(400);
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
    await delay(300);
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

    await delay(400);
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
    await delay(400);
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
    await delay(300);
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

    await delay(400);
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
    await delay(400);
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
    await delay(300);
    MOCK_PATIENT_RECORD.medications = MOCK_PATIENT_RECORD.medications.filter(
      (m) => m.medication_id !== medicationId
    );
  },
};

