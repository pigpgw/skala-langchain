import type { Facility } from "@/types/api/triage";
import type { Coords } from "@/types/common";
import { DEFAULT_MAP_CENTER } from "@/constants/location";
import type { Kakao, KakaoLatLngBounds, KakaoMapInstance } from "./types";

const USER_PIN =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" viewBox="0 0 72 72">' +
      '<circle cx="36" cy="36" r="30" fill="#1d4ed8" stroke="#ffffff" stroke-width="8"/>' +
      '<circle cx="36" cy="36" r="18" fill="#ffffff"/>' +
      '<circle cx="36" cy="36" r="9" fill="#1d4ed8"/>' +
      '<path d="M36 4v10M36 58v10M4 36h10M58 36h10" stroke="#1d4ed8" stroke-width="5" stroke-linecap="round"/>' +
      "</svg>",
  );

const USER_PIN_SIZE = 52;
const HOSPITAL_PIN_WIDTH = 40;
const HOSPITAL_PIN_HEIGHT = 48;
const EMERGENCY_PIN_WIDTH = 44;
const EMERGENCY_PIN_HEIGHT = 52;

const HOSPITAL_PIN =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="52" height="62" viewBox="0 0 52 62">' +
      '<path d="M26 2C13.3 2 3 12.3 3 25c0 17.2 23 35 23 35s23-17.8 23-35C49 12.3 38.7 2 26 2z" fill="#2563eb" stroke="#ffffff" stroke-width="4"/>' +
      '<circle cx="26" cy="25" r="14" fill="#ffffff"/>' +
      '<path d="M18 25h16M26 17v16" stroke="#2563eb" stroke-width="5" stroke-linecap="round"/>' +
      "</svg>",
  );

const EMERGENCY_PIN =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="58" height="68" viewBox="0 0 58 68">' +
      '<path d="M29 2C15.2 2 4 13.2 4 27c0 18.7 25 39 25 39s25-20.3 25-39C54 13.2 42.8 2 29 2z" fill="#dc2626" stroke="#ffffff" stroke-width="4"/>' +
      '<circle cx="29" cy="27" r="16" fill="#ffffff"/>' +
      '<path d="M20 27h18M29 18v18" stroke="#dc2626" stroke-width="6" stroke-linecap="round"/>' +
      "</svg>",
  );

export interface FacilityMarkerHandle {
  key: string;
  pos: unknown;
  marker: unknown;
  infoWindow: unknown;
}

export function createMap(kakao: Kakao, el: HTMLDivElement): KakaoMapInstance {
  const map = new kakao.maps.Map(el, {
    center: new kakao.maps.LatLng(
      DEFAULT_MAP_CENTER.lat,
      DEFAULT_MAP_CENTER.lng,
    ),
    level: 7,
  });

  map.addControl(
    new kakao.maps.MapTypeControl(),
    kakao.maps.ControlPosition.TOPRIGHT,
  );
  map.addControl(
    new kakao.maps.ZoomControl(),
    kakao.maps.ControlPosition.RIGHT,
  );

  return map;
}

export function createBounds(kakao: Kakao): KakaoLatLngBounds {
  return new kakao.maps.LatLngBounds();
}

export function addUserMarker(
  kakao: Kakao,
  map: KakaoMapInstance,
  user: Coords,
) {
  const userPos = new kakao.maps.LatLng(user.lat, user.lng);
  const userMarker = new kakao.maps.Marker({
    map,
    position: userPos,
    image: new kakao.maps.MarkerImage(
      USER_PIN,
      new kakao.maps.Size(USER_PIN_SIZE, USER_PIN_SIZE),
      {
        offset: new kakao.maps.Point(USER_PIN_SIZE / 2, USER_PIN_SIZE / 2),
      },
    ),
    zIndex: 1000,
  });

  new kakao.maps.InfoWindow({
    content:
      '<div style="padding:10px 16px;font-size:18px;font-weight:900;color:#1d4ed8;white-space:nowrap">내 위치</div>',
  }).open(map, userMarker);

  return userPos;
}

export function addFacilityMarker(
  kakao: Kakao,
  map: KakaoMapInstance,
  facility: Facility,
): FacilityMarkerHandle | null {
  if (facility.lat == null || facility.lng == null) return null;

  const key = facilityKey(facility);
  const kind =
    facility.kind || (facility.is_24h === "Y" ? "emergency" : "hospital");
  const isEmergency = kind === "emergency";
  const pos = new kakao.maps.LatLng(facility.lat, facility.lng);
  const marker = new kakao.maps.Marker({
    map,
    position: pos,
    image: new kakao.maps.MarkerImage(
      isEmergency ? EMERGENCY_PIN : HOSPITAL_PIN,
      new kakao.maps.Size(
        isEmergency ? EMERGENCY_PIN_WIDTH : HOSPITAL_PIN_WIDTH,
        isEmergency ? EMERGENCY_PIN_HEIGHT : HOSPITAL_PIN_HEIGHT,
      ),
      {
        offset: new kakao.maps.Point(
          isEmergency ? EMERGENCY_PIN_WIDTH / 2 : HOSPITAL_PIN_WIDTH / 2,
          isEmergency ? EMERGENCY_PIN_HEIGHT : HOSPITAL_PIN_HEIGHT,
        ),
      },
    ),
    zIndex: isEmergency ? 70 : 40,
  });
  const infoWindow = new kakao.maps.InfoWindow({
    content: facilityLabel(facility),
    removable: true,
  });

  kakao.maps.event.addListener(marker, "click", () => {
    infoWindow.open(map, marker);
  });

  return { key, pos, marker, infoWindow };
}

export function panToCoords(
  kakao: Kakao,
  map: KakaoMapInstance,
  coords: Coords,
) {
  map.panTo(new kakao.maps.LatLng(coords.lat, coords.lng));
}

export function panToFacility(
  kakao: Kakao,
  map: KakaoMapInstance,
  facility: Facility,
) {
  if (facility.lat == null || facility.lng == null) return;
  map.panTo(new kakao.maps.LatLng(facility.lat, facility.lng));
  map.setLevel(5);
}

function facilityLabel(f: Facility) {
  const kind = f.kind || (f.is_24h === "Y" ? "emergency" : "hospital");
  const typeText = f.type || (kind === "emergency" ? "응급실" : "의료기관");
  const color = kind === "emergency" ? "#dc2626" : "#2563eb";
  const bg = kind === "emergency" ? "#fef2f2" : "#eff6ff";
  const distance = f.distance_km != null ? `${f.distance_km}km` : "";
  const lines = [
    `<div style="font-size:18px;font-weight:900;line-height:1.35;color:#0f172a">${escapeHtml(f.name ?? "의료기관")}</div>`,
    `<div style="display:inline-flex;margin-top:6px;border-radius:999px;background:${bg};padding:5px 10px;color:${color};font-size:14px;font-weight:900">${typeText}${f.is_24h === "Y" ? " · 24시간" : ""}</div>`,
  ];

  if (f.departments) {
    lines.push(
      `<div style="margin-top:8px;font-size:15px;font-weight:800;line-height:1.45;color:#1e40af">${escapeHtml(f.departments)}</div>`,
    );
  }
  if (f.address) {
    lines.push(
      `<div style="margin-top:6px;font-size:15px;font-weight:700;line-height:1.45;color:#334155">${escapeHtml(f.address)}</div>`,
    );
  }
  if (f.phone || distance) {
    lines.push(
      `<div style="margin-top:8px;font-size:16px;font-weight:900;color:#0f172a">${escapeHtml(f.phone ?? "")}${f.phone && distance ? " · " : ""}<span style="color:#2563eb">${distance}</span></div>`,
    );
  }

  return `<div style="box-sizing:border-box;width:240px;padding:14px 16px;text-align:left">${lines.join("")}</div>`;
}

export function openFacilityInfo(
  map: KakaoMapInstance,
  handle: FacilityMarkerHandle,
) {
  const infoWindow = handle.infoWindow as {
    open: (map: KakaoMapInstance, marker: unknown) => void;
  };

  infoWindow.open(map, handle.marker);
}

export function facilityKey(facility: Facility) {
  return `${facility.name ?? "facility"}-${facility.address ?? ""}-${facility.lat ?? ""}-${facility.lng ?? ""}`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
