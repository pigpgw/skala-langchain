import { formatCoord } from "@/utils/format";
import type { GeoStatus } from "@/hooks/useGeolocation";
import type { Coords } from "@/types/common";

interface GeoStatusLineProps {
  status: GeoStatus;
  coords: Coords | null;
}

export function GeoStatusLine({ status, coords }: GeoStatusLineProps) {
  if (status === "pending") {
    return (
      <p className="text-2xl font-black text-blue-800">
        내 위치를 확인하고 있습니다. 위치 허용 창이 나오면 허용을 눌러주세요.
      </p>
    );
  }

  if (status === "ready" && coords) {
    return (
      <p className="text-2xl font-black text-blue-800">
        내 위치를 기준으로 병원을 찾습니다.
        <span className="mt-2 block text-lg font-bold text-slate-600">
          {formatCoord(coords.lat)}, {formatCoord(coords.lng)}
        </span>
      </p>
    );
  }

  return (
    <p className="text-2xl font-black text-amber-900">
      광주 기준 위치로 병원을 찾습니다.
      <span className="mt-2 block text-lg font-bold text-slate-600">
        위치 권한이 허용되면 실제 위치 기준으로 바뀝니다.
      </span>
    </p>
  );
}
