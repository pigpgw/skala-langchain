import { useRef } from "react";

import { MyLocationButton } from "@/components/molecules/MyLocationButton";
import { useKakaoMap } from "@/hooks/useKakaoMap";
import type { Facility } from "@/types/api/triage";
import type { Coords } from "@/types/common";

interface FacilityMapProps {
  user: Coords | null;
  facilities: Facility[];
  fitUser: boolean;
  focus: Facility | null;
}

export function FacilityMap({
  user,
  facilities,
  fitUser,
  focus,
}: FacilityMapProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const { panToUser, fitAll, error } = useKakaoMap(ref, {
    user,
    facilities,
    fitUser,
    focus,
  });

  return (
    <div className="relative h-full min-w-0 bg-blue-50">
      <div ref={ref} className="h-full w-full bg-blue-50" />
      {error && (
        <p className="absolute left-3 right-3 top-3 rounded-2xl border-2 border-red-200 bg-white px-4 py-3 text-base font-black text-red-700 shadow-sm">
          {error}
        </p>
      )}
      <MapLegend />
      <MyLocationButton
        hasUser={Boolean(user)}
        onPanToUser={panToUser}
        onFitAll={fitAll}
      />
    </div>
  );
}

function MapLegend() {
  return (
    <div className="absolute left-3 top-16 z-20 rounded-2xl border-2 border-slate-200 bg-white/90 px-3 py-2 text-xs font-black text-slate-800 shadow-lg">
      <div className="flex items-center gap-2">
        <span className="h-3 w-3 rounded-full bg-red-600" />
        24시간
      </div>
      <div className="mt-1 flex items-center gap-2">
        <span className="h-3 w-3 rounded-full bg-blue-700" />
        일반
      </div>
      <div className="mt-1 flex items-center gap-2">
        <span className="h-3 w-3 rounded-full border-2 border-blue-700 bg-white" />
        내 위치
      </div>
    </div>
  );
}
