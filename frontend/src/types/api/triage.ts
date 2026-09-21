export interface TriageRequest {
  symptom: string;
  lat?: number;
  lng?: number;
  sido?: string;
  sigungu?: string;
}

export type Severity = "clinic" | "hospital" | "emergency";

export interface Triage {
  department: string;
  severity: Severity;
  severity_label: string;
  reason: string;
  caution: string;
}

export interface Facility {
  name: string | null;
  type?: string;
  sido?: string;
  sigungu?: string;
  address?: string;
  phone?: string;
  departments?: string;
  is_24h?: "Y" | null;
  lat?: number | null;
  lng?: number | null;
  distance_km?: number | null;
  kind?: "hospital" | "emergency";
  message?: string;
}

export interface TriageResponse {
  triage: Triage;
  facilities: Facility[];
  resolved_region: { sido: string; sigungu: string };
  notice: string | null;
}

export interface NearbyRequest {
  lat: number;
  lng: number;
  radius_km?: number;
  limit?: number;
}

export interface NearbyResponse {
  facilities: Facility[];
}
