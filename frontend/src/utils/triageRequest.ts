import type { TriageRequest } from "@/types/api/triage";
import type { Coords } from "@/types/common";

interface BuildTriageRequestParams {
  symptom: string;
  coords: Coords | null;
  sido: string;
  sigungu: string;
}

export function buildTriageRequest({
  symptom,
  coords,
  sido,
  sigungu,
}: BuildTriageRequestParams): TriageRequest {
  if (coords) {
    return {
      symptom,
      lat: coords.lat,
      lng: coords.lng,
    };
  }

  return {
    symptom,
    sido,
    sigungu,
  };
}
