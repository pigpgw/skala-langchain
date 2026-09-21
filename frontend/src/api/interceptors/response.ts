import type { AxiosResponse } from "axios";

export function unwrapData<T>(response: AxiosResponse<T>): T {
  return response.data;
}
