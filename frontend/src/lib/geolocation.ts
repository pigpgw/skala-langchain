import type { Coords } from "@/types/common";

function geolocationErrorMessage(error: GeolocationPositionError) {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return "위치 권한이 거부되었습니다. 브라우저 주소창의 위치 권한을 허용해 주세요.";
    case error.POSITION_UNAVAILABLE:
      return "현재 기기에서 위치 정보를 확인할 수 없습니다.";
    case error.TIMEOUT:
      return "위치 확인 시간이 초과되었습니다. 다시 시도해 주세요.";
    default:
      return error.message || "현재 위치를 가져오지 못했습니다.";
  }
}

const PRECISE_ACCURACY_M = 100;
const ACCEPTABLE_ACCURACY_M = 1000;
const MIN_WAIT_MS = 2500;

function toCoords(pos: GeolocationPosition): Coords {
  return {
    lat: pos.coords.latitude,
    lng: pos.coords.longitude,
    accuracy: pos.coords.accuracy,
  };
}

export function getCurrentPosition(timeout = 15000): Promise<Coords> {
  return new Promise((resolve, reject) => {
    if (!window.isSecureContext) {
      reject(
        new Error(
          "위치 기능은 HTTPS 또는 localhost 같은 보안 컨텍스트에서만 사용할 수 있습니다.",
        ),
      );
      return;
    }

    if (!("geolocation" in navigator)) {
      reject(new Error("이 브라우저는 위치 정보를 지원하지 않습니다."));
      return;
    }

    let best: Coords | null = null;
    let settled = false;
    let watchId: number | null = null;
    const startedAt = Date.now();

    function cleanup() {
      if (watchId != null) {
        navigator.geolocation.clearWatch(watchId);
      }
      window.clearTimeout(timeoutId);
    }

    function finish(coords: Coords) {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(coords);
    }

    function fail(error: GeolocationPositionError) {
      if (settled) return;
      if (best) {
        finish(best);
        return;
      }
      settled = true;
      cleanup();
      reject(new Error(geolocationErrorMessage(error)));
    }

    const timeoutId = window.setTimeout(() => {
      if (best) {
        finish(best);
        return;
      }
      settled = true;
      if (watchId != null) navigator.geolocation.clearWatch(watchId);
      reject(new Error("위치 확인 시간이 초과되었습니다. 다시 시도해 주세요."));
    }, timeout);

    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const coords = toCoords(pos);
        const accuracy = coords.accuracy ?? Number.POSITIVE_INFINITY;

        if (!best || accuracy < (best.accuracy ?? Number.POSITIVE_INFINITY)) {
          best = coords;
        }

        if (accuracy <= PRECISE_ACCURACY_M) {
          finish(coords);
          return;
        }

        if (
          accuracy <= ACCEPTABLE_ACCURACY_M &&
          Date.now() - startedAt >= MIN_WAIT_MS
        ) {
          finish(coords);
        }
      },
      fail,
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout,
      },
    );
  });
}
