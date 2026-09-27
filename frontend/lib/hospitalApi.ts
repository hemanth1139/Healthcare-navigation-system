import { HospitalWithDistance, Hospital } from "@/types/hospital";
import { api } from "./api";

export interface NearbyHospitalsQueryParams {
  latitude?: number | null;
  longitude?: number | null;
  locationQuery?: string;
  search?: string;
  specialist?: string;
  specialty?: string;
  hospitalType?: string;
  maxDistanceKm?: number;
  sortBy?: "distance" | "name" | "rating" | string;
}

export const hospitalApi = {
  /**
   * Fetch nearby hospitals from real backend
   */
  getNearbyHospitals: async (params: NearbyHospitalsQueryParams): Promise<HospitalWithDistance[]> => {
    const payload: Record<string, any> = {};

    if (params.latitude !== undefined && params.latitude !== null) {
      payload.latitude = params.latitude;
    }
    if (params.longitude !== undefined && params.longitude !== null) {
      payload.longitude = params.longitude;
    }
    if (params.locationQuery && params.locationQuery.trim()) {
      payload.location_query = params.locationQuery.trim();
    }
    if (params.search && params.search.trim()) {
      payload.search = params.search.trim();
    }
    if (params.specialist && params.specialist.trim()) {
      payload.specialist = params.specialist.trim();
    }
    if (params.specialty && params.specialty.trim()) {
      payload.specialty = params.specialty.trim();
    }
    if (params.hospitalType && params.hospitalType.trim() && params.hospitalType !== "All") {
      payload.hospital_type = params.hospitalType.trim();
    }
    if (params.maxDistanceKm && params.maxDistanceKm > 0) {
      payload.max_distance_km = params.maxDistanceKm;
    }
    if (params.sortBy) {
      payload.sort_by = params.sortBy;
    }

    const { data } = await api.post<HospitalWithDistance[]>("/hospitals/nearby", payload);
    return Array.isArray(data) ? data : [];
  },

  /**
   * Fetch hospital details by ID
   */
  getHospitalById: async (hospitalId: string): Promise<Hospital> => {
    const { data } = await api.get<Hospital>(`/hospitals/${hospitalId}`);
    return data;
  },
};
