import { HospitalWithDistance } from "@/types/hospital";

const delay = (ms: number = 300) => new Promise((resolve) => setTimeout(resolve, ms));

export const MOCK_HOSPITALS: HospitalWithDistance[] = [
  {
    hospital_id: "hosp_01",
    google_place_id: "ChIJ_z_019W_UjoR1",
    hospital_name: "Apollo Multispeciality Medical Center",
    address: "58 Canal Circular Road, Kadapara, Phoolagan",
    city: "Kolkata",
    state: "West Bengal",
    latitude: 22.5726,
    longitude: 88.3639,
    phone: "+91 33 2320 3040",
    website: "https://www.apollohospitals.com",
    specialties: ["Cardiology", "Neurology", "Pulmonology", "General Medicine", "ENT"],
    has_emergency_room: true,
    rating: 4.8,
    distance_km: 2.4,
    estimated_time: "8 mins drive",
  },
  {
    hospital_id: "hosp_02",
    google_place_id: "ChIJ_z_019W_UjoR2",
    hospital_name: "Fortis Healthcare & Neuro-Care Institute",
    address: "730 Anandapur, E.M. Bypass",
    city: "Kolkata",
    state: "West Bengal",
    latitude: 22.5186,
    longitude: 88.4011,
    phone: "+91 33 6628 4444",
    website: "https://www.fortishealthcare.com",
    specialties: ["Neurology", "General Medicine", "Orthopedics"],
    has_emergency_room: true,
    rating: 4.6,
    distance_km: 4.1,
    estimated_time: "14 mins drive",
  },
  {
    hospital_id: "hosp_03",
    google_place_id: "ChIJ_z_019W_UjoR3",
    hospital_name: "Ruby General Emergency Hospital",
    address: "Kasba Golpark, E.M. Bypass",
    city: "Kolkata",
    state: "West Bengal",
    latitude: 22.5122,
    longitude: 88.3989,
    phone: "+91 33 3987 1800",
    website: "https://www.rubyhospital.com",
    specialties: ["Cardiology", "Emergency Medicine", "General Surgery"],
    has_emergency_room: true,
    rating: 4.5,
    distance_km: 5.8,
    estimated_time: "18 mins drive",
  },
  {
    hospital_id: "hosp_04",
    google_place_id: "ChIJ_z_019W_UjoR4",
    hospital_name: "AMRI Hospital & Pulmonology Center",
    address: "JC-16 & 17, Salt Lake City, Sector III",
    city: "Kolkata",
    state: "West Bengal",
    latitude: 22.5697,
    longitude: 88.4124,
    phone: "+91 33 2335 7710",
    website: "https://www.amrihospitals.in",
    specialties: ["Pulmonology", "ENT", "Internal Medicine"],
    has_emergency_room: false,
    rating: 4.3,
    distance_km: 7.2,
    estimated_time: "22 mins drive",
  },
  {
    hospital_id: "hosp_05",
    google_place_id: "ChIJ_z_019W_UjoR5",
    hospital_name: "Desun Emergency & Cardiac Trauma Hospital",
    address: "Desun Hospital Complex, EM Bypass",
    city: "Kolkata",
    state: "West Bengal",
    latitude: 22.5089,
    longitude: 88.4002,
    phone: "+91 90511 00000",
    website: "https://www.desunhospital.com",
    specialties: ["Cardiology", "Emergency Medicine", "Neurology"],
    has_emergency_room: true,
    rating: 4.7,
    distance_km: 8.5,
    estimated_time: "26 mins drive",
  },
  {
    hospital_id: "hosp_06",
    google_place_id: "ChIJ_z_019W_UjoR6",
    hospital_name: "Peerless Hospital & Health Center",
    address: "360 Panchasayar, Garia",
    city: "Kolkata",
    state: "West Bengal",
    latitude: 22.4795,
    longitude: 88.3976,
    phone: "+91 33 4011 1222",
    website: "https://www.peerlesshospital.com",
    specialties: ["General Medicine", "Pediatrics", "Gastroenterology"],
    has_emergency_room: true,
    rating: 4.2,
    distance_km: 12.0,
    estimated_time: "32 mins drive",
  },
  {
    hospital_id: "hosp_07",
    google_place_id: "ChIJ_z_019W_UjoR7",
    hospital_name: "Woodlands Multispeciality Hospital",
    address: "8/5 Alipore Road",
    city: "Kolkata",
    state: "West Bengal",
    latitude: 22.5358,
    longitude: 88.3341,
    phone: "+91 33 2456 7000",
    website: "https://www.woodlandshospital.in",
    specialties: ["Neurology", "Cardiology", "Dermatology"],
    has_emergency_room: true,
    rating: 4.4,
    distance_km: 14.5,
    estimated_time: "38 mins drive",
  },
  {
    hospital_id: "hosp_08",
    google_place_id: "ChIJ_z_019W_UjoR8",
    hospital_name: "Narayana Superspeciality Hospital",
    address: "Andul Road, Howrah",
    city: "Howrah",
    state: "West Bengal",
    latitude: 22.5612,
    longitude: 88.2912,
    phone: "+91 33 7123 0000",
    website: "https://www.narayanahealth.org",
    specialties: ["Cardiology", "Neurology", "Oncology", "Pulmonology"],
    has_emergency_room: true,
    rating: 4.6,
    distance_km: 18.2,
    estimated_time: "45 mins drive",
  },
  {
    hospital_id: "hosp_09",
    google_place_id: "ChIJ_z_019W_UjoR9",
    hospital_name: "Suburban Community Clinic & ER Unit",
    address: "National Highway 12, Barasat",
    city: "North 24 Parganas",
    state: "West Bengal",
    latitude: 22.7214,
    longitude: 88.4812,
    phone: "+91 33 2552 1199",
    specialties: ["General Medicine", "Emergency Medicine"],
    has_emergency_room: true,
    rating: 4.1,
    distance_km: 24.0,
    estimated_time: "55 mins drive",
  },
];

export const hospitalApi = {
  getHospitals: async (
    specialistFilter?: string,
    maxDistanceKm?: number
  ): Promise<HospitalWithDistance[]> => {
    await delay(300);
    let results = [...MOCK_HOSPITALS];

    if (specialistFilter && specialistFilter.trim()) {
      const query = specialistFilter.toLowerCase();
      results = results.filter((h) =>
        h.specialties.some((s) => s.toLowerCase().includes(query) || query.includes(s.toLowerCase()))
      );
    }

    if (maxDistanceKm && maxDistanceKm > 0) {
      results = results.filter((h) => h.distance_km <= maxDistanceKm);
    }

    return results;
  },
};
