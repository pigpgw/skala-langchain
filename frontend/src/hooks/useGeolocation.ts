import { useCallback, useEffect, useState } from "react";

import { DEFAULT_MAP_CENTER } from "@/constants/location";
import { getCurrentPosition } from "@/lib/geolocation";
import type { Coords } from "@/types/common";

export type GeoStatus = "pending" | "ready" | "fallback";

export function useGeolocation(): {
  status: GeoStatus;
  coords: Coords | null;
  errorMessage: string | null;
  requestLocation: () => void;
} {
  const [status, setStatus] = useState<GeoStatus>("pending");
  const [coords, setCoords] = useState<Coords | null>(DEFAULT_MAP_CENTER);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const requestLocation = useCallback(() => {
    setStatus("pending");
    setErrorMessage(null);

    getCurrentPosition()
      .then((nextCoords) => {
        setCoords(nextCoords);
        setStatus("ready");
      })
      .catch((error: unknown) => {
        const message =
          error instanceof Error && error.message
            ? error.message
            : "현재 브라우저에서 위치를 가져오지 못했습니다.";

        setCoords(DEFAULT_MAP_CENTER);
        setStatus("fallback");
        setErrorMessage(message);
      });
  }, []);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  return { status, coords, errorMessage, requestLocation };
}
