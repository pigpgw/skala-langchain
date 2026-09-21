import { backendApi } from "./instances/backend";
import type {
  NearbyRequest,
  NearbyResponse,
  TriageRequest,
  TriageResponse,
} from "@/types/api/triage";

export const triageApi = {
  submit: (body: TriageRequest) =>
    backendApi.post<TriageResponse>("/api/triage", body),
  getNearby: (params: NearbyRequest) =>
    backendApi.get<NearbyResponse>("/api/nearby", { params }),
};
