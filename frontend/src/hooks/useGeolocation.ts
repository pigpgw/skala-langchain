import { useCallback, useEffect, useState } from "react";

import { DEFAULT_MAP_CENTER } from "@/constants/location";
import { getCurrentPosition } from "@/lib/geolocation";
import type { Coords } from "@/types/common";

export type GeoStatus = "pending" | "ready" | "fallback";
const MAX_USABLE_ACCURACY_M = 3000;

export function useGeolocation(): {
  status: GeoStatus;
  coords: Coords | null;
  errorMessage: string | null;
  requestLocation: () => void;
} {
  const [status, setStatus] = useState<GeoStatus>("pending");
  const [coords, setCoords] = useState<Coords | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const requestLocation = useCallback(() => {
    setStatus("pending");
    setCoords(null);
    setErrorMessage(null);

    getCurrentPosition()
      .then((nextCoords) => {
        if (
          nextCoords.accuracy != null &&
          nextCoords.accuracy > MAX_USABLE_ACCURACY_M
        ) {
          setCoords(DEFAULT_MAP_CENTER);
          setStatus("fallback");
          setErrorMessage(
            `현재 위치 오차가 약 ${Math.round(nextCoords.accuracy)}m라 정확한 내 위치로 사용하지 않았습니다.`,
          );
          return;
        }

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
