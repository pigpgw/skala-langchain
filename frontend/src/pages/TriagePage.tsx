import { ClipboardList, ListChecks, Stethoscope } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";

import { FacilityList } from "@/components/organisms/FacilityList";
import { FacilityMap } from "@/components/organisms/FacilityMap";
import { SymptomForm } from "@/components/organisms/SymptomForm";
import { SeverityBadge } from "@/components/molecules/SeverityBadge";
import { DEFAULT_MAP_CENTER } from "@/constants/location";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useNearbyFacilities } from "@/hooks/useNearbyFacilities";
import { useTriage } from "@/hooks/useTriage";
import { buildTriageRequest } from "@/utils/triageRequest";
import type { SymptomFormValues } from "@/components/organisms/SymptomForm";
import type { Facility } from "@/types/api/triage";

type PanelView = "nearby" | "symptom" | "result";

const MIN_SHEET_HEIGHT = 184;
const SHEET_HEADER_HEIGHT = 116;

function getSheetStops() {
  const viewportHeight =
    typeof window === "undefined" ? 760 : window.innerHeight;
  const max = Math.max(300, Math.min(620, viewportHeight - 190));
  const mid = Math.max(MIN_SHEET_HEIGHT, Math.min(390, Math.round(max * 0.68)));

  return {
    min: MIN_SHEET_HEIGHT,
    mid,
    max,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function TriagePage() {
  const { status: geoStatus, coords } = useGeolocation();
  const nearbySearchCoords = coords ?? DEFAULT_MAP_CENTER;
  const { facilities: nearby } = useNearbyFacilities(nearbySearchCoords);
  const { result, isLoading, error, submit } = useTriage();
  const [focus, setFocus] = useState<Facility | null>(null);
  const [panelView, setPanelView] = useState<PanelView>("nearby");
  const [sheetHeight, setSheetHeight] = useState(() => getSheetStops().mid);
  const [isDraggingSheet, setIsDraggingSheet] = useState(false);
  const dragRef = useRef({ moved: false, startHeight: 0, startY: 0 });
  const sheetHeightRef = useRef(sheetHeight);

  const mapFacilities = useMemo(
    () => (result ? result.facilities : nearby || []),
    [nearby, result],
  );
  const sortedFacilities = useMemo(
    () =>
      [...mapFacilities].sort(
        (a, b) => (a.distance_km ?? 9999) - (b.distance_km ?? 9999),
      ),
    [mapFacilities],
  );
  const caption = result
    ? "증상 안내 결과"
    : nearby === null
      ? "주변 병원 확인 중"
      : mapFacilities.length > 0
        ? `가까운 병원 ${mapFacilities.length}곳`
        : "주변 병원 없음";
  const visiblePanelView =
    result && panelView === "symptom" && !isLoading ? "result" : panelView;
  const contentMaxHeight = Math.max(80, sheetHeight - SHEET_HEADER_HEIGHT);

  useEffect(() => {
    sheetHeightRef.current = sheetHeight;
  }, [sheetHeight]);

  useEffect(() => {
    function syncSheetHeight() {
      const stops = getSheetStops();
      setSheetHeight((current) => clamp(current, stops.min, stops.max));
    }

    syncSheetHeight();
    window.addEventListener("resize", syncSheetHeight);

    return () => window.removeEventListener("resize", syncSheetHeight);
  }, []);

  useEffect(() => {
    if (nearby === null) return;

    const timer = window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent("triage-ready-for-guide"));
    }, 900);

    return () => window.clearTimeout(timer);
  }, [nearby]);

  function handleSubmit(values: SymptomFormValues) {
    void submit(
      buildTriageRequest({
        symptom: values.symptom,
        coords,
        sido: values.sido,
        sigungu: values.sigungu,
      }),
    );
  }

  function snapSheet(nextHeight: number) {
    const stops = getSheetStops();
    const snapPoints = [stops.min, stops.mid, stops.max];
    const nearest = snapPoints.reduce((best, point) =>
      Math.abs(point - nextHeight) < Math.abs(best - nextHeight) ? point : best,
    );

    setSheetHeight(nearest);
  }

  function handleSheetPointerDown(e: PointerEvent<HTMLButtonElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDraggingSheet(true);
    dragRef.current = {
      moved: false,
      startHeight: sheetHeight,
      startY: e.clientY,
    };
  }

  function handleSheetPointerMove(e: PointerEvent<HTMLButtonElement>) {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    const stops = getSheetStops();
    const nextHeight =
      dragRef.current.startHeight + (dragRef.current.startY - e.clientY);
    const didMove = Math.abs(e.clientY - dragRef.current.startY) > 6;
    dragRef.current.moved = dragRef.current.moved || didMove;

    const clampedHeight = clamp(nextHeight, stops.min, stops.max);
    sheetHeightRef.current = clampedHeight;
    setSheetHeight(clampedHeight);
  }

  function handleSheetPointerUp(e: PointerEvent<HTMLButtonElement>) {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setIsDraggingSheet(false);
    snapSheet(sheetHeightRef.current);
  }

  function handleSheetClick() {
    if (dragRef.current.moved) {
      dragRef.current.moved = false;
      return;
    }

    const stops = getSheetStops();
    const nextHeight =
      sheetHeight < (stops.min + stops.mid) / 2
        ? stops.mid
        : sheetHeight < (stops.mid + stops.max) / 2
          ? stops.max
          : stops.min;

    setSheetHeight(nextHeight);
  }

  function handleSheetKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    const stops = getSheetStops();

    if (e.key === "ArrowUp") {
      e.preventDefault();
      snapSheet(sheetHeight >= stops.mid ? stops.max : stops.mid);
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      snapSheet(sheetHeight <= stops.mid ? stops.min : stops.mid);
    }
  }

  return (
    <main className="relative h-[calc(100dvh-8.75rem)] overflow-hidden bg-slate-100">
      <section data-tour="map-section" className="absolute inset-0">
        <FacilityMap
          user={coords}
          facilities={mapFacilities}
          fitUser={!result}
          focus={focus}
        />
      </section>

      <div className="absolute left-3 right-3 top-3 z-30">
        <div
          data-tour="map-summary"
          className="inline-flex max-w-full flex-wrap items-center gap-2 rounded-full border-2 border-blue-200 bg-white/90 px-3 py-2 text-xs font-black shadow-lg"
        >
          <span className="rounded-full bg-blue-700 px-2.5 py-1 text-white">
            {mapFacilities.length > 0 ? `${mapFacilities.length}곳` : "확인 중"}
          </span>
          <span className="text-slate-800">{caption}</span>
          <LocationSummary status={geoStatus} />
        </div>
      </div>

      <section
        className={[
          "absolute bottom-0 left-0 right-0 z-40 rounded-t-[2rem] border-t-2 border-slate-200 bg-white shadow-2xl shadow-slate-500/30",
          isDraggingSheet ? "" : "transition-[height] duration-150 ease-out",
        ].join(" ")}
        style={{ height: sheetHeight }}
      >
        <button
          type="button"
          aria-label="하단 패널 높이 조절"
          className="flex w-full touch-none cursor-grab justify-center px-4 py-2 active:cursor-grabbing"
          onPointerDown={handleSheetPointerDown}
          onPointerMove={handleSheetPointerMove}
          onPointerUp={handleSheetPointerUp}
          onPointerCancel={handleSheetPointerUp}
          onClick={handleSheetClick}
          onKeyDown={handleSheetKeyDown}
        >
          <span className="h-1.5 w-14 rounded-full bg-slate-300" />
        </button>
        <div className="px-4 pb-4 pt-3">
          <PanelTabs
            current={visiblePanelView}
            hasResult={Boolean(result)}
            onChange={setPanelView}
          />

          <div
            className="mt-3 overflow-y-auto overscroll-contain pr-1"
            style={{ maxHeight: contentMaxHeight }}
          >
            {visiblePanelView === "nearby" && (
              <NearbyPanel
                facilities={sortedFacilities}
                user={coords}
                focus={focus}
                onFocus={setFocus}
                onOpenSymptom={() => setPanelView("symptom")}
              />
            )}

            {visiblePanelView === "symptom" && (
              <SymptomPanel
                isLoading={isLoading}
                errorMessage={error?.message ?? null}
                onSubmit={handleSubmit}
              />
            )}

            {visiblePanelView === "result" && result && (
              <ResultPanel
                department={result.triage.department}
                severity={result.triage.severity}
                severityLabel={result.triage.severity_label}
                reason={result.triage.reason}
                caution={result.triage.caution}
                facilities={sortedFacilities}
                user={coords}
                focus={focus}
                onFocus={setFocus}
              />
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function PanelTabs({
  current,
  hasResult,
  onChange,
}: {
  current: PanelView;
  hasResult: boolean;
  onChange: (view: PanelView) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2 rounded-2xl bg-slate-100 p-1.5">
      <PanelTab
        active={current === "nearby"}
        icon={ListChecks}
        label="병원"
        onClick={() => onChange("nearby")}
      />
      <PanelTab
        active={current === "symptom"}
        icon={ClipboardList}
        label="증상 안내"
        tour="symptom-open-button"
        onClick={() => onChange("symptom")}
      />
      <PanelTab
        active={current === "result"}
        disabled={!hasResult}
        icon={Stethoscope}
        label="결과"
        onClick={() => onChange("result")}
      />
    </div>
  );
}

function LocationSummary({
  status,
}: {
  status: ReturnType<typeof useGeolocation>["status"];
}) {
  const label =
    status === "ready"
      ? "실제 위치 기준"
      : status === "pending"
        ? "위치 확인 중"
        : "광주 기준 위치";

  return (
    <div
      data-tour="location-status"
      className="flex flex-wrap items-center gap-2"
    >
      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">
        {label}
      </span>
    </div>
  );
}

function PanelTab({
  active,
  disabled = false,
  icon: Icon,
  label,
  tour,
  onClick,
}: {
  active: boolean;
  disabled?: boolean;
  icon: typeof ListChecks;
  label: string;
  tour?: string;
  onClick: () => void;
}) {
  return (
    <button
      data-tour={tour}
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={[
        "flex min-h-11 items-center justify-center gap-1.5 rounded-xl text-base font-black transition-colors",
        active ? "bg-blue-700 text-white shadow-sm" : "bg-white text-slate-700",
        disabled ? "opacity-45" : "hover:text-blue-800",
      ].join(" ")}
    >
      <Icon className="h-5 w-5" />
      {label}
    </button>
  );
}

function NearbyPanel({
  facilities,
  user,
  focus,
  onFocus,
  onOpenSymptom,
}: {
  facilities: Facility[];
  user: FacilityListUser;
  focus: Facility | null;
  onFocus: (facility: Facility) => void;
  onOpenSymptom: () => void;
}) {
  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={onOpenSymptom}
        className="flex min-h-14 w-full items-center justify-center rounded-2xl bg-blue-700 px-4 text-xl font-black text-white shadow-lg shadow-blue-200"
      >
        증상 입력하고 병원 안내받기
      </button>
      <FacilityList
        title="가까운 병원"
        facilities={facilities}
        user={user}
        focus={focus}
        onFocus={onFocus}
      />
    </div>
  );
}

type FacilityListUser = Parameters<typeof FacilityList>[0]["user"];

function SymptomPanel({
  isLoading,
  errorMessage,
  onSubmit,
}: {
  isLoading: boolean;
  errorMessage: string | null;
  onSubmit: (values: SymptomFormValues) => void;
}) {
  return (
    <div
      data-tour="symptom-card"
      className="rounded-3xl border-2 border-slate-200 bg-white p-4"
    >
      <div className="mb-4 rounded-2xl border-2 border-red-200 bg-red-50 px-4 py-3">
        <p className="text-sm leading-6 font-black text-red-800">
          심한 흉통, 호흡 곤란, 의식 저하, 한쪽 마비가 있으면 먼저 119에
          연락하세요.
        </p>
      </div>
      <SymptomForm
        isLoading={isLoading}
        onSubmit={onSubmit}
      />
      {errorMessage && (
        <p className="mt-4 rounded-2xl border-2 border-red-200 bg-red-50 px-4 py-3 text-base font-black text-red-800">
          {errorMessage}
        </p>
      )}
    </div>
  );
}

function ResultPanel({
  department,
  severity,
  severityLabel,
  reason,
  caution,
  facilities,
  user,
  focus,
  onFocus,
}: {
  department: string;
  severity: Parameters<typeof SeverityBadge>[0]["severity"];
  severityLabel: string;
  reason: string;
  caution: string;
  facilities: Facility[];
  user: FacilityListUser;
  focus: Facility | null;
  onFocus: (facility: Facility) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="rounded-3xl border-2 border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-2">
          <SeverityBadge severity={severity} label={severityLabel} />
          <strong className="text-lg font-black text-slate-950">
            {department}
          </strong>
        </div>
        <p className="mt-3 text-base leading-7 font-semibold text-slate-700">
          {reason}
        </p>
        <p className="mt-2 text-base leading-7 font-black text-red-800">
          {caution}
        </p>
      </div>
      <FacilityList
        title="추천 병원"
        facilities={facilities}
        user={user}
        focus={focus}
        onFocus={onFocus}
      />
    </div>
  );
}
