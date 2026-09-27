export interface Hospital {
  hospital_id: string;
  google_place_id: string;
  hospital_name: string;
  address: string;
  city?: string;
  state?: string;
  latitude: number;
  longitude: number;
  phone?: string;
  website?: string;
  google_maps_url?: string;
  hospital_type?: "Government" | "Private" | "Teaching / Medical College" | "Other" | string;
  specialties: string[];
  has_emergency_room?: boolean;
  rating?: number;
}

export interface HospitalRecommendation {
  recommendation_id: string;
  prediction_id: string;
  hospital_id: string;
  distance_km: number;
  estimated_time?: string;
}

export interface HospitalWithDistance extends Hospital {
  distance_km: number;
  estimated_time?: string;
}

