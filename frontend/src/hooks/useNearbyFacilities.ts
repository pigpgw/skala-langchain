import { useEffect, useState } from "react";

import { triageApi } from "@/api/triage";
import type { Facility } from "@/types/api/triage";
import type { Coords } from "@/types/common";

const PRIMARY_RADIUS_KM = 5;
const FALLBACK_RADIUS_KM = 10;
const NEARBY_LIMIT = 5;

export function useNearbyFacilities(coords: Coords | null): {
  facilities: Facility[] | null;
  isLoading: boolean;
} {
  const [facilities, setFacilities] = useState<Facility[] | null>(null);

  useEffect(() => {
    if (!coords) {
      setFacilities(null);
      return;
    }

    let cancelled = false;
    setFacilities(null);

    triageApi
      .getNearby({
        lat: coords.lat,
        lng: coords.lng,
        radius_km: PRIMARY_RADIUS_KM,
        limit: NEARBY_LIMIT,
      })
      .then((data) => {
        if (data.facilities?.length) return data;

        return triageApi.getNearby({
          lat: coords.lat,
          lng: coords.lng,
          radius_km: FALLBACK_RADIUS_KM,
          limit: NEARBY_LIMIT,
        });
      })
      .then((data) => {
        if (cancelled) return;
        setFacilities(data.facilities || []);
      })
      .catch(() => {
        if (cancelled) return;
        setFacilities([]);
      });

    return () => {
      cancelled = true;
    };
  }, [coords]);

  return { facilities, isLoading: coords !== null && facilities === null };
}
