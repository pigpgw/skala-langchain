import { LocateFixed, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

interface MyLocationButtonProps {
  hasUser: boolean;
  bottomPx: number;
  onRequestLocation: () => void;
  onPanToUser: () => void;
}

export function MyLocationButton({
  hasUser,
  bottomPx,
  onRequestLocation,
  onPanToUser,
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
        variant={hasUser ? "secondary" : "default"}
        className={[
          "h-12 w-12 rounded-full p-0 shadow-md",
          hasUser
            ? "border-2 border-slate-300 bg-white text-slate-950 hover:bg-blue-50"
            : "border-2 border-white bg-blue-700 text-white shadow-xl shadow-blue-200 hover:bg-blue-800",
        ].join(" ")}
        onClick={onRequestLocation}
        title="현재 위치 다시 찾기"
        aria-label="현재 위치 다시 찾기"
      >
        <RefreshCw className="h-5 w-5" />
      </Button>
    </div>
  );
}
