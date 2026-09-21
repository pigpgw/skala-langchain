import type { InternalAxiosRequestConfig } from "axios";

export function setCommonHeaders(config: InternalAxiosRequestConfig) {
  config.headers.set("Accept", "application/json");
  return config;
}
