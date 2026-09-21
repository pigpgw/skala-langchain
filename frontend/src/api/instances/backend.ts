import axios, { type AxiosRequestConfig } from "axios";

import { env } from "@/lib/env";
import { normalizeError } from "../interceptors/error";
import { setCommonHeaders } from "../interceptors/request";
import { unwrapData } from "../interceptors/response";

const instance = axios.create({
  baseURL: env.API_BASE_URL,
  timeout: 15_000,
});

instance.interceptors.request.use(setCommonHeaders);
instance.interceptors.response.use(unwrapData, normalizeError);

export const backendApi = {
  get: <T>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    instance.get(url, config) as Promise<T>,
  post: <T>(
    url: string,
    body?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> => instance.post(url, body, config) as Promise<T>,
};
