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

export function getCurrentPosition(timeout = 12000): Promise<Coords> {
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

    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (error) => reject(new Error(geolocationErrorMessage(error))),
      {
        enableHighAccuracy: true,
        maximumAge: 30000,
        timeout,
      },
    );
  });
}
