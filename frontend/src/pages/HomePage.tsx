import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  MapPinned,
  PhoneCall,
} from "lucide-react";
import { Link, useOutletContext } from "react-router-dom";

import type { TourOutletContext } from "@/types/tour";

const steps = [
  {
    title: "1. 증상을 적습니다",
    desc: "기침, 열, 복통처럼 지금 불편한 증상을 편하게 적습니다.",
    icon: ClipboardList,
  },
  {
    title: "2. 안내를 받습니다",
    desc: "어느 진료과를 가면 좋을지와 주의할 점을 확인합니다.",
    icon: CheckCircle2,
  },
  {
    title: "3. 가까운 병원을 봅니다",
    desc: "지도와 목록에서 가까운 병원, 응급실, 길찾기를 확인합니다.",
    icon: MapPinned,
  },
];

export function HomePage() {
  const { startGuide } = useOutletContext<TourOutletContext>();

  return (
    <main className="px-4 py-6">
      <section className="space-y-6">
        <div>
          <p className="mb-4 inline-flex rounded-full bg-blue-100 px-4 py-2 text-base font-black text-blue-800">
            쉽고 크게 보는 병원 안내
          </p>
          <h1 className="text-4xl leading-[1.12] font-black tracking-tight text-slate-950">
            어디가 아픈지 적으면
            <span className="block text-blue-700">
              가야 할 곳을 안내합니다.
            </span>
          </h1>
          <p className="mt-5 text-lg leading-8 font-semibold text-slate-700">
            복잡한 화면 없이 증상 입력, 진료 안내, 가까운 병원 확인을 차례대로
            보여줍니다. 큰 글씨와 넓은 지도로 보호자와 함께 보기 쉽게
            만들었습니다.
          </p>

          <div className="mt-7 grid gap-3">
            <Link
              to="/triage"
              className="inline-flex min-h-14 items-center justify-center gap-3 rounded-2xl bg-blue-700 px-5 text-xl font-black text-white shadow-lg shadow-blue-200 transition-colors hover:bg-blue-800"
            >
              진료 안내 시작
              <ArrowRight className="h-6 w-6" />
            </Link>
            <button
              type="button"
              onClick={startGuide}
              className="inline-flex min-h-14 items-center justify-center rounded-2xl border-2 border-slate-300 bg-white px-5 text-xl font-black text-slate-800 transition-colors hover:border-blue-400 hover:text-blue-800"
            >
              사용 방법 보기
            </button>
          </div>

          <div className="mt-6 rounded-3xl border-2 border-red-200 bg-red-50 p-5">
            <div className="flex gap-3">
              <PhoneCall className="mt-1 h-7 w-7 shrink-0 text-red-600" />
              <div>
                <h2 className="text-xl font-black text-red-800">
                  응급 상황이면 먼저 119
                </h2>
                <p className="mt-2 text-base leading-7 font-semibold text-red-700">
                  의식 저하, 심한 흉통, 호흡 곤란, 마비 증상이 있으면 화면
                  안내보다 119 또는 가까운 응급실이 우선입니다.
                </p>
              </div>
            </div>
          </div>
        </div>

        <aside className="rounded-3xl border-2 border-slate-200 bg-white p-5 shadow-lg shadow-slate-200">
          <h2 className="text-2xl font-black">화면은 이렇게 진행됩니다</h2>
          <div className="mt-4 space-y-3">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="rounded-2xl bg-slate-50 p-4">
                  <div className="flex gap-3">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                      <Icon className="h-7 w-7" />
                    </span>
                    <div>
                      <h3 className="text-xl font-black">{step.title}</h3>
                      <p className="mt-1 text-base leading-6 font-semibold text-slate-600">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>
      </section>
    </main>
  );
}
