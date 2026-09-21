import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/utils/cn";
import { formatDistance } from "@/utils/format";
import type { Facility } from "@/types/api/triage";
import type { Coords } from "@/types/common";

interface FacilityCardProps {
  facility: Facility;
  user: Coords | null;
  active: boolean;
  onClick: () => void;
}

export function FacilityCard({
  facility,
  user,
  active,
  onClick,
}: FacilityCardProps) {
  if (!facility.name) {
    return (
      <Card className="border-2 border-slate-200 bg-white">
        <CardContent className="pt-4 text-base font-bold text-slate-700">
          {facility.message}
        </CardContent>
      </Card>
    );
  }

  const kind =
    facility.kind || (facility.is_24h === "Y" ? "emergency" : "hospital");
  const destination = `${encodeURIComponent(facility.name)},${facility.lat},${facility.lng}`;
  const distance = formatDistance(facility.distance_km);
  const directionUrl =
    facility.lat != null && facility.lng != null
      ? user
        ? `https://map.kakao.com/link/from/${encodeURIComponent("내 위치")},${user.lat},${user.lng}/to/${destination}`
        : `https://map.kakao.com/link/to/${destination}`
      : null;

  return (
    <Card
      className={cn(
        "cursor-pointer border-2 border-slate-200 bg-white transition-colors hover:border-blue-500",
        active && "border-blue-600 bg-blue-50",
      )}
      onClick={onClick}
    >
      <CardHeader className="p-4 pb-2">
        <CardTitle className="flex flex-wrap items-center gap-2 text-xl leading-7 text-slate-950">
          {facility.name}
          <Badge variant={kind === "emergency" ? "emergency" : "default"}>
            {facility.type || (kind === "emergency" ? "응급실" : "의료기관")}
          </Badge>
          {facility.is_24h === "Y" && <Badge variant="hospital">24시간</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 p-4 pt-0 text-base font-semibold text-slate-700">
        {facility.departments && (
          <p className="text-blue-800">{facility.departments}</p>
        )}
        <p>{facility.address}</p>
        <p>
          {facility.phone}
          {distance && <strong className="text-blue-700"> · {distance}</strong>}
        </p>
        {directionUrl && (
          <a
            className="inline-flex min-h-11 items-center rounded-xl bg-blue-700 px-4 text-base font-black text-white hover:bg-blue-800"
            href={directionUrl}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            길찾기
          </a>
        )}
      </CardContent>
    </Card>
  );
}
