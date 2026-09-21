import { HelpCircle, Home, MapPinned, Stethoscope } from "lucide-react";
import { Joyride, STATUS, type EventData, type Step } from "react-joyride";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/utils/cn";

const navItems = [
  { to: "/", label: "처음 화면", icon: Home },
  { to: "/triage", label: "진료 안내", icon: Stethoscope },
];

const guideSteps: Step[] = [
  {
    target: '[data-tour="map-summary"]',
    title: "1. 지도를 먼저 봅니다",
    content:
      "지도에는 기본 지역 기준 병원이 먼저 보이고, 위치가 잡히면 내 위치 기준으로 바뀝니다.",
    placement: "bottom",
    skipBeacon: true,
  },
  {
    target: '[data-tour="location-status"]',
    title: "2. 내 위치 상태입니다",
    content:
      "큰 파란색 표시는 현재 위치입니다. 위치 권한을 허용하면 주변 병원을 자동으로 찾습니다.",
    placement: "bottom",
    skipBeacon: true,
  },
  {
    target: '[data-tour="facility-list"]',
    title: "3. 가까운 병원 목록입니다",
    content:
      "아래 패널에서 가까운 병원을 고르면 지도에서 위치를 확인할 수 있습니다.",
    placement: "top",
    skipBeacon: true,
  },
  {
    target: '[data-tour="symptom-open-button"]',
    title: "4. 증상으로 병원을 안내받습니다",
    content: "이 버튼을 누르면 증상을 입력하고 필요한 진료 방향과 주변 병원을 확인할 수 있습니다.",
    placement: "top",
    skipBeacon: true,
  },
];

export function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const [runGuide, setRunGuide] = useState(false);
  const [pendingGuide, setPendingGuide] = useState(false);
  const didAutoStartGuide = useRef(false);

  const startGuide = useCallback(() => {
    setRunGuide(false);
    if (location.pathname !== "/triage") {
      setPendingGuide(true);
      navigate("/triage");
      return;
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
    setPendingGuide(true);
  }, [location.pathname, navigate]);

  function handleJoyrideEvent(data: EventData) {
    if (data.status === STATUS.FINISHED || data.status === STATUS.SKIPPED) {
      setRunGuide(false);
    }
  }

  useEffect(() => {
    if (!pendingGuide || location.pathname !== "/triage") return;
    let started = false;

    function runWhenReady() {
      if (started) return;
      started = true;
      setPendingGuide(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
      window.setTimeout(() => setRunGuide(true), 250);
    }

    function handleTriageReady() {
      runWhenReady();
    }

    const fallbackTimer = window.setTimeout(runWhenReady, 1800);
    window.addEventListener("triage-ready-for-guide", handleTriageReady);

    return () => {
      window.clearTimeout(fallbackTimer);
      window.removeEventListener("triage-ready-for-guide", handleTriageReady);
    };
  }, [location.pathname, pendingGuide]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (didAutoStartGuide.current) return;
      didAutoStartGuide.current = true;
      startGuide();
    }, 500);

    return () => window.clearTimeout(timer);
  }, [startGuide]);

  return (
    <div className="min-h-dvh bg-slate-200 text-slate-950">
      <Joyride
        continuous
        run={runGuide}
        steps={guideSteps}
        onEvent={handleJoyrideEvent}
        options={{
          buttons: ["back", "primary", "skip"],
          overlayColor: "rgba(15, 23, 42, 0.45)",
          primaryColor: "#1d4ed8",
          scrollOffset: 120,
          showProgress: true,
          spotlightPadding: 14,
          spotlightRadius: 18,
          textColor: "#0f172a",
          width: 340,
          zIndex: 10000,
        }}
        locale={{
          back: "이전",
          close: "닫기",
          last: "끝내기",
          next: "다음",
          nextWithProgress: "다음 ({current}/{total})",
          skip: "건너뛰기",
        }}
        styles={{
          tooltip: {
            borderRadius: 18,
            fontSize: 17,
            lineHeight: 1.55,
          },
          tooltipTitle: {
            fontSize: 20,
            fontWeight: 900,
          },
          buttonPrimary: {
            borderRadius: 12,
            fontSize: 16,
            fontWeight: 900,
            padding: "10px 16px",
          },
          buttonBack: {
            color: "#334155",
            fontSize: 16,
            fontWeight: 800,
            marginRight: 8,
          },
          buttonSkip: {
            color: "#475569",
            fontSize: 16,
            fontWeight: 800,
          },
        }}
      />

      <div className="mx-auto min-h-dvh w-full max-w-[430px] bg-[#f5f8fb] shadow-2xl shadow-slate-400/30">
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <NavLink to="/" className="flex min-w-0 items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm">
                  <MapPinned className="h-6 w-6" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-lg font-black tracking-tight">
                    지역 병원 길잡이
                  </span>
                  <span className="block truncate text-sm font-semibold text-slate-600">
                    증상 입력 후 병원 확인
                  </span>
                </span>
              </NavLink>

              <button
                type="button"
                onClick={startGuide}
                className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-2xl border-2 border-blue-200 bg-blue-50 px-3 text-sm font-black text-blue-800 transition-colors hover:bg-blue-100"
              >
                <HelpCircle className="h-5 w-5" />
                도움말
              </button>
            </div>

            <nav className="mt-3 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === "/"}
                    className={({ isActive }) =>
                      cn(
                        "flex min-h-11 items-center justify-center gap-2 rounded-xl text-base font-black transition-colors",
                        isActive
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-slate-700 hover:bg-white hover:text-blue-700",
                      )
                    }
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </header>

        <Outlet context={{ startGuide }} />
      </div>
    </div>
  );
}
