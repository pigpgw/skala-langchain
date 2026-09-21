import { env } from "@/lib/env";
import type { Kakao } from "./types";

let sdkPromise: Promise<Kakao> | null = null;

export function loadKakaoSdk(): Promise<Kakao> {
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise((resolve, reject) => {
    const init = () => window.kakao?.maps.load(() => resolve(window.kakao));

    if (window.kakao?.maps) {
      init();
      return;
    }

    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${env.KAKAO_JS_KEY}&autoload=false`;
    script.onload = init;
    script.onerror = () => {
      sdkPromise = null;
      reject(
        new Error(
          "카카오맵 SDK 로드 실패 — JS 키와 Web 플랫폼 등록을 확인하세요",
        ),
      );
    };
    document.head.appendChild(script);
  });

  return sdkPromise;
}
