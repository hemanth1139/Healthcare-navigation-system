import { HospitalWithDistance } from "@/types/hospital";
import { api, USE_MOCK_API } from "./api";

export const MOCK_HOSPITALS: HospitalWithDistance[] = [];

export const hospitalApi = {
  getHospitals: async (
    specialistFilter?: string,
    maxDistanceKm?: number
  ): Promise<HospitalWithDistance[]> => {
    if (!USE_MOCK_API) {
      try {
        const payload: Record<string, any> = {
          latitude: 13.0827,
          longitude: 80.2707,
        };
        if (specialistFilter && specialistFilter.trim()) {
          payload.specialist = specialistFilter.trim();
        }
        if (maxDistanceKm && maxDistanceKm > 0) {
          payload.maxDistanceKm = maxDistanceKm;
        }

        const { data } = await api.post<HospitalWithDistance[]>("/hospitals/nearby", payload);
        if (data && Array.isArray(data)) {
          return data;
        }
      } catch (err) {
        console.warn("[API] Failed to fetch hospitals from backend:", err);
      }
    }

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
