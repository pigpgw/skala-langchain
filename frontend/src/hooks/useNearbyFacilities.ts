import { useEffect, useState } from "react";

import { triageApi } from "@/api/triage";
import type { Facility } from "@/types/api/triage";
import type { Coords } from "@/types/common";

export function useNearbyFacilities(coords: Coords | null): {
  facilities: Facility[] | null;
  isLoading: boolean;
} {
  const [facilities, setFacilities] = useState<Facility[] | null>(null);

  useEffect(() => {
    if (!coords) return;

    let cancelled = false;
    setFacilities(null);

    triageApi
      .getNearby({ lat: coords.lat, lng: coords.lng })
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
