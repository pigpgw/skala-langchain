import { ArrowLeft, Home, MapPinned } from "lucide-react";
import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <main className="flex min-h-[calc(100vh-7rem)] items-center px-4 py-8">
      <section className="w-full rounded-3xl border-2 border-slate-200 bg-white p-6 text-center shadow-lg shadow-slate-200">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-700">
          <MapPinned className="h-9 w-9" />
        </div>
        <p className="mt-6 text-2xl font-black text-blue-800">404</p>
        <h1 className="mt-2 text-4xl leading-tight font-black text-slate-950">
          길을 찾지 못했습니다
        </h1>
        <p className="mt-4 text-lg leading-8 font-semibold text-slate-700">
          주소가 잘못되었거나 사라진 화면입니다. 처음 화면으로 돌아가 다시
          시작할 수 있습니다.
        </p>
        <div className="mt-7 grid gap-3">
          <Link
            to="/"
            className="inline-flex min-h-14 items-center justify-center gap-3 rounded-2xl bg-blue-700 px-5 text-xl font-black text-white shadow-lg shadow-blue-200 transition-colors hover:bg-blue-800"
          >
            <Home className="h-6 w-6" />
            처음 화면으로
          </Link>
          <Link
            to="/triage"
            className="inline-flex min-h-14 items-center justify-center gap-3 rounded-2xl border-2 border-slate-300 bg-white px-5 text-xl font-black text-slate-800 transition-colors hover:border-blue-400 hover:text-blue-800"
          >
            <ArrowLeft className="h-6 w-6" />
            진료 안내로
          </Link>
        </div>
      </section>
    </main>
  );
}
