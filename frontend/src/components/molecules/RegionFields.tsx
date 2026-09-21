import { SIDO_OPTIONS } from "@/constants/region";

interface RegionFieldsProps {
  sido: string;
  sigungu: string;
  onSidoChange: (value: string) => void;
  onSigunguChange: (value: string) => void;
}

export function RegionFields({
  sido,
  sigungu,
  onSidoChange,
  onSigunguChange,
}: RegionFieldsProps) {
  return (
    <div className="grid gap-3">
      <label className="flex flex-col gap-2 text-base font-black text-slate-950">
        시도
        <select
          className="h-12 rounded-2xl border-2 border-slate-300 bg-white px-4 text-base font-bold text-slate-950 outline-none focus-visible:border-blue-600 focus-visible:ring-4 focus-visible:ring-blue-100"
          value={sido}
          onChange={(e) => onSidoChange(e.target.value)}
        >
          {SIDO_OPTIONS.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-2 text-base font-black text-slate-950">
        시군구
        <input
          className="h-12 rounded-2xl border-2 border-slate-300 bg-white px-4 text-base font-bold text-slate-950 outline-none placeholder:text-slate-400 focus-visible:border-blue-600 focus-visible:ring-4 focus-visible:ring-blue-100"
          value={sigungu}
          onChange={(e) => onSigunguChange(e.target.value)}
          placeholder="예: 나주시"
        />
      </label>
    </div>
  );
}
