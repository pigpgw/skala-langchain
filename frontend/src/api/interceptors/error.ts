import axios from "axios";
import type { FastApiErrorBody } from "@/types/api/common";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function normalizeError(error: unknown): Promise<never> {
  if (axios.isAxiosError<FastApiErrorBody>(error)) {
    const detail = error.response?.data?.detail;
    const message =
      typeof detail === "string"
        ? detail
        : Array.isArray(detail)
          ? detail.map((d) => d.msg).join(", ")
          : error.response
            ? "요청 처리 중 오류가 발생했습니다"
            : "서버에 연결할 수 없습니다";

    return Promise.reject(new ApiError(error.response?.status ?? 0, message));
  }

  return Promise.reject(error);
}
