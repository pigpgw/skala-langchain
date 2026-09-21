import { EmergencyBanner } from "@/components/organisms/EmergencyBanner";
import { SeverityBadge } from "@/components/molecules/SeverityBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TriageResponse } from "@/types/api/triage";

interface TriageSummaryProps {
  result: TriageResponse;
}

export function TriageSummary({ result }: TriageSummaryProps) {
  const { triage, resolved_region, notice } = result;

  return (
    <section className="flex flex-col gap-4 px-4 py-4">
      {triage.severity === "emergency" && <EmergencyBanner />}
      <Card className="border-2 border-slate-200 bg-white shadow-lg shadow-slate-200">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-2xl text-slate-950">판단 결과</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 p-4 pt-0 text-lg leading-8 font-semibold text-slate-700">
          <p className="flex flex-wrap items-center gap-3">
            <SeverityBadge
              severity={triage.severity}
              label={triage.severity_label}
            />
            <strong className="text-slate-950">
              추천 진료과: {triage.department}
            </strong>
          </p>
          <p>{triage.reason}</p>
          <p>{triage.caution}</p>
          <p className="text-base font-bold text-slate-600">
            검색 지역: {resolved_region.sido} {resolved_region.sigungu}
          </p>
          {notice && (
            <p className="text-base font-bold text-slate-600">{notice}</p>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
