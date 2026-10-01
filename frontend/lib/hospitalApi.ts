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
  maxResults?: number;  // Maximum number of results to return (default 50 for OSM)
}

/**
 * Maps clinician/specialist titles (e.g. "Cardiologist (Emergency Medicine)")
 * to standard hospital department values (e.g. "Cardiology").
 */
export function normalizeSpecialty(input?: string | null): string {
  if (!input) return "";
  const low = input.toLowerCase().trim();
  if (low === "all" || low === "") return "";
  if (low.includes("cardio") || low.includes("heart") || low.includes("cardiac")) return "Cardiology";
  if (low.includes("neuro") || low.includes("brain") || low.includes("stroke") || low.includes("spine")) return "Neurology";
  if (low.includes("ortho") || low.includes("bone") || low.includes("joint") || low.includes("musculoskeletal")) return "Orthopedics";
  if (low.includes("pulmon") || low.includes("chest") || low.includes("respiratory") || low.includes("lung") || low.includes("asthma")) return "Pulmonology";
  if (low.includes("gastro") || low.includes("digest") || low.includes("liver") || low.includes("stomach")) return "Gastroenterology";
  if (low.includes("pediatr") || low.includes("child") || low.includes("infant")) return "Pediatrics";
  if (low.includes("oncol") || low.includes("cancer")) return "Oncology";
  if (low.includes("transplant")) return "Multi-Organ Transplant";
  if (low.includes("emerg") || low.includes("trauma")) return "Emergency";
  if (low.includes("general") || low.includes("physician") || low.includes("internal")) return "General Medicine";
  return input.trim();
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
    if (params.maxResults) {
      payload.max_results = params.maxResults;
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

  /**
   * Geocode address to coordinates (Nominatim - free)
   */
  geocodeAddress: async (address: string): Promise<{ latitude: number; longitude: number; display_name: string } | null> => {
    try {
      const { data } = await api.post("/hospitals/geocode", { address });
      return data;
    } catch (error) {
      console.error("[hospitalApi] Geocoding failed:", error);
      return null;
    }
  },

  /**
   * Reverse geocode coordinates to address (Nominatim - free)
   */
  reverseGeocode: async (lat: number, lon: number): Promise<{ display_name: string; address: any } | null> => {
    try {
      const { data } = await api.get(`/hospitals/reverse-geocode?lat=${lat}&lon=${lon}`);
      return data;
    } catch (error) {
      console.error("[hospitalApi] Reverse geocoding failed:", error);
      return null;
    }
  },

  /**
   * Get route between two points (OSRM - free)
   */
  getRoute: async (
    startLat: number,
    startLon: number,
    endLat: number,
    endLon: number,
    profile: string = "driving"
  ): Promise<{ distance_km: number; duration_minutes: number; geometry?: any } | null> => {
    try {
      const { data } = await api.post("/hospitals/route", {
        start_lat: startLat,
        start_lon: startLon,
        end_lat: endLat,
        end_lon: endLon,
        profile,
      });
      return data;
    } catch (error) {
      console.error("[hospitalApi] Routing failed:", error);
      return null;
    }
  },
};
