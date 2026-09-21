import { FacilityCard } from "@/components/molecules/FacilityCard";
import type { Facility } from "@/types/api/triage";
import type { Coords } from "@/types/common";

interface FacilityListProps {
  title: string;
  facilities: Facility[];
  user: Coords | null;
  focus: Facility | null;
  onFocus: (facility: Facility) => void;
}

export function FacilityList({
  title,
  facilities,
  user,
  focus,
  onFocus,
}: FacilityListProps) {
  return (
    <aside
      data-tour="facility-list"
      className="border-t-2 border-slate-200 bg-slate-50 p-4 text-left"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-xl font-black text-slate-950">{title}</h2>
        {facilities.length > 0 && (
          <span className="shrink-0 rounded-full bg-white px-3 py-1 text-sm font-black text-blue-800">
            {facilities.length}곳
          </span>
        )}
      </div>
      {facilities.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-4">
          <p className="text-xl font-black text-slate-800">
            주변 기관을 확인 중입니다
          </p>
          <p className="mt-2 text-base leading-7 font-semibold text-slate-600">
            위치 권한을 허용했거나 증상 안내를 받은 뒤 병원 목록이 표시됩니다.
          </p>
        </div>
      ) : (
        <div className="max-h-[360px] space-y-3 overflow-y-auto pr-1">
          {facilities.map((facility) => (
            <FacilityCard
              key={`${facility.name ?? "fallback"}-${facility.address ?? facility.message ?? ""}`}
              facility={facility}
              user={user}
              active={focus === facility}
              onClick={() => onFocus(facility)}
            />
          ))}
        </div>
      )}
    </aside>
  );
}
