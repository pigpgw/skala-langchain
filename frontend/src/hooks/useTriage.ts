import { useState } from "react";

import { ApiError } from "@/api/interceptors/error";
import { triageApi } from "@/api/triage";
import type { TriageRequest, TriageResponse } from "@/types/api/triage";

export function useTriage(): {
  result: TriageResponse | null;
  isLoading: boolean;
  error: ApiError | null;
  submit: (req: TriageRequest) => Promise<void>;
  reset: () => void;
} {
  const [result, setResult] = useState<TriageResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  async function submit(req: TriageRequest) {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await triageApi.submit(req);
      setResult(data);
    } catch (err) {
      setError(err instanceof ApiError ? err : new ApiError(0, "요청 실패"));
    } finally {
      setIsLoading(false);
    }
  }

  function reset() {
    setError(null);
    setResult(null);
  }

  return { result, isLoading, error, submit, reset };
}
