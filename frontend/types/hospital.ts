export interface Hospital {
  hospital_id: string;
  google_place_id: string;
  hospital_name: string;
  address: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  phone: string;
  website?: string;
  specialties: string[]; // e.g. ["Cardiology", "Neurology", "General Medicine"]
  has_emergency_room: boolean;
  rating?: number;
}

export interface HospitalRecommendation {
  recommendation_id: string;
  prediction_id: string;
  hospital_id: string;
  distance_km: number;
  estimated_time: string; // e.g. "12 mins drive"
}

export interface HospitalWithDistance extends Hospital {
  distance_km: number;
  estimated_time: string;
}
