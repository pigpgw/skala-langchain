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
  controlsBottomPx: number;
  viewportBottomPx: number;
  onVisibleFacilitiesChange: (facilities: Facility[]) => void;
  onRequestLocation: () => void;
}

export function FacilityMap({
  user,
  facilities,
  fitUser,
  focus,
  controlsBottomPx,
  viewportBottomPx,
  onVisibleFacilitiesChange,
  onRequestLocation,
}: FacilityMapProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const { panToUser, error } = useKakaoMap(ref, {
    user,
    facilities,
    fitUser,
    focus,
    viewportBottomPx,
    onVisibleFacilitiesChange,
  });

  return (
    <div className="relative h-full min-w-0 bg-blue-50">
      <div
        ref={ref}
        className="absolute left-0 right-0 top-0 bg-blue-50"
        style={{ bottom: viewportBottomPx }}
      />
      {error && (
        <p className="absolute left-3 right-3 top-3 rounded-2xl border-2 border-red-200 bg-white px-4 py-3 text-base font-black text-red-700 shadow-sm">
          {error}
        </p>
      )}
      <MapLegend bottomPx={controlsBottomPx} />
      <MyLocationButton
        hasUser={Boolean(user)}
        bottomPx={controlsBottomPx}
        onRequestLocation={onRequestLocation}
        onPanToUser={panToUser}
      />
    </div>
  );
}

function MapLegend({ bottomPx }: { bottomPx: number }) {
  return (
    <div
      className="absolute left-3 z-20 rounded-2xl border-2 border-slate-200 bg-white/90 px-3 py-2 text-xs font-black text-slate-800 shadow-lg"
      style={{ bottom: bottomPx }}
    >
      <div className="flex items-center gap-2">
        <span className="h-3 w-3 rounded-full bg-red-600" />
        24시간
      </div>
      <div className="mt-1 flex items-center gap-2">
        <span className="h-3 w-3 rounded-full bg-blue-700" />
        일반
      </div>
      <div className="mt-1 flex items-center gap-2">
        <span className="h-3 w-3 rounded-full border-2 border-white bg-blue-600 shadow-sm ring-1 ring-blue-200" />
        내 위치
      </div>
    </div>
  );
}
