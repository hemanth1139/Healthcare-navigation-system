import {
  FullPatientRecord,
  PatientProfile,
  Allergy,
  ChronicCondition,
  Medication,
} from "@/types/profile";

const delay = (ms: number = 300) => new Promise((resolve) => setTimeout(resolve, ms));

let MOCK_PATIENT_RECORD: FullPatientRecord = {
  profile: {
    profile_id: "prf_778129",
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
    await delay(300);
    return JSON.parse(JSON.stringify(MOCK_PATIENT_RECORD));
  },

  updateProfile: async (updated: Partial<PatientProfile>): Promise<PatientProfile> => {
    await delay(500);
    MOCK_PATIENT_RECORD.profile = {
      ...MOCK_PATIENT_RECORD.profile,
      ...updated,
    };
    return JSON.parse(JSON.stringify(MOCK_PATIENT_RECORD.profile));
  },

  // Allergy CRUD
  addAllergy: async (allergy: Omit<Allergy, "allergy_id">): Promise<Allergy> => {
    await delay(400);
    const newAllergy: Allergy = {
      ...allergy,
      allergy_id: `alg_${Date.now()}`,
    };
    MOCK_PATIENT_RECORD.allergies.push(newAllergy);
    return newAllergy;
  },

  updateAllergy: async (allergy: Allergy): Promise<Allergy> => {
    await delay(400);
    MOCK_PATIENT_RECORD.allergies = MOCK_PATIENT_RECORD.allergies.map((a) =>
      a.allergy_id === allergy.allergy_id ? allergy : a
    );
    return allergy;
  },

  deleteAllergy: async (allergyId: string): Promise<void> => {
    await delay(300);
    MOCK_PATIENT_RECORD.allergies = MOCK_PATIENT_RECORD.allergies.filter(
      (a) => a.allergy_id !== allergyId
    );
  },

  // Chronic Condition CRUD
  addCondition: async (
    condition: Omit<ChronicCondition, "condition_id">
  ): Promise<ChronicCondition> => {
    await delay(400);
    const newCondition: ChronicCondition = {
      ...condition,
      condition_id: `con_${Date.now()}`,
    };
    MOCK_PATIENT_RECORD.chronicConditions.push(newCondition);
    return newCondition;
  },

  updateCondition: async (condition: ChronicCondition): Promise<ChronicCondition> => {
    await delay(400);
    MOCK_PATIENT_RECORD.chronicConditions = MOCK_PATIENT_RECORD.chronicConditions.map((c) =>
      c.condition_id === condition.condition_id ? condition : c
    );
    return condition;
  },

  deleteCondition: async (conditionId: string): Promise<void> => {
    await delay(300);
    MOCK_PATIENT_RECORD.chronicConditions = MOCK_PATIENT_RECORD.chronicConditions.filter(
      (c) => c.condition_id !== conditionId
    );
  },

  // Medication CRUD
  addMedication: async (
    medication: Omit<Medication, "medication_id">
  ): Promise<Medication> => {
    await delay(400);
    const newMed: Medication = {
      ...medication,
      medication_id: `med_${Date.now()}`,
    };
    MOCK_PATIENT_RECORD.medications.push(newMed);
    return newMed;
  },

  updateMedication: async (medication: Medication): Promise<Medication> => {
    await delay(400);
    MOCK_PATIENT_RECORD.medications = MOCK_PATIENT_RECORD.medications.map((m) =>
      m.medication_id === medication.medication_id ? medication : m
    );
    return medication;
  },

  deleteMedication: async (medicationId: string): Promise<void> => {
    await delay(300);
    MOCK_PATIENT_RECORD.medications = MOCK_PATIENT_RECORD.medications.filter(
      (m) => m.medication_id !== medicationId
    );
  },
};
