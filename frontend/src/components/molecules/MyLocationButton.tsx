import { LocateFixed, Maximize2 } from "lucide-react";

import { Button } from "@/components/ui/button";

interface MyLocationButtonProps {
  hasUser: boolean;
  bottomPx: number;
  onPanToUser: () => void;
  onFitAll: () => void;
}

export function MyLocationButton({
  hasUser,
  bottomPx,
  onPanToUser,
  onFitAll,
}: MyLocationButtonProps) {
  return (
    <div
      className="absolute right-3 z-20 flex flex-col gap-2"
      style={{ bottom: bottomPx }}
    >
      {hasUser && (
        <Button
          type="button"
          className="h-12 w-12 rounded-full border-2 border-white bg-blue-700 p-0 text-white shadow-xl shadow-blue-200 hover:bg-blue-800"
          onClick={onPanToUser}
          title="내 위치로 이동"
          aria-label="내 위치로 이동"
        >
          <LocateFixed className="h-5 w-5" />
        </Button>
      )}
      <Button
        type="button"
        variant="secondary"
        className="h-12 w-12 rounded-full border-2 border-slate-300 bg-white p-0 text-slate-950 shadow-md hover:bg-blue-50"
        onClick={onFitAll}
        title="병원 마커 전체 보기"
        aria-label="병원 마커 전체 보기"
      >
        <Maximize2 className="h-5 w-5" />
      </Button>
    </div>
  );
}
