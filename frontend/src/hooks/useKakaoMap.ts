import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";

import {
  addFacilityMarker,
  addUserMarker,
  createBounds,
  createMap,
  facilityKey,
  openFacilityInfo,
  panToCoords,
  panToFacility,
} from "@/lib/kakao/map";
import { DEFAULT_MAP_CENTER } from "@/constants/location";
import { loadKakaoSdk } from "@/lib/kakao/loader";
import type { Facility } from "@/types/api/triage";
import type { Coords } from "@/types/common";
import type {
  Kakao,
  KakaoLatLngBounds,
  KakaoMapInstance,
} from "@/lib/kakao/types";
import type { FacilityMarkerHandle, UserMarkerHandle } from "@/lib/kakao/map";

interface KakaoMapDeps {
  user: Coords | null;
  facilities: Facility[];
  focus: Facility | null;
  fitUser: boolean;
  viewportBottomPx: number;
  onVisibleFacilitiesChange?: (facilities: Facility[]) => void;
}

const FULL_VIEW_MAX_LEVEL = 9;
const USER_FOCUS_LEVEL = 5;
const DEFAULT_REGION_LEVEL = 7;

export function useKakaoMap(
  ref: RefObject<HTMLDivElement | null>,
  deps: KakaoMapDeps,
): {
  panToUser: () => void;
  fitAll: () => void;
  error: string | null;
} {
  const kakaoRef = useRef<Kakao | null>(null);
  const mapRef = useRef<KakaoMapInstance | null>(null);
  const boundsRef = useRef<KakaoLatLngBounds | null>(null);
  const userRef = useRef<Coords | null>(deps.user);
  const userMarkerRef = useRef<UserMarkerHandle | null>(null);
  const facilityMarkersRef = useRef<Map<string, FacilityMarkerHandle>>(
    new Map(),
  );
  const [error, setError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    userRef.current = deps.user;
  }, [deps.user]);

  function closeFacilityInfoWindows() {
    const userInfoWindow = userMarkerRef.current?.infoWindow as
      | { close?: () => void }
      | undefined;
    userInfoWindow?.close?.();
    facilityMarkersRef.current.forEach((handle) => {
      const infoWindow = handle.infoWindow as { close?: () => void };
      infoWindow.close?.();
    });
  }

  function clearMarkers() {
    closeFacilityInfoWindows();

    const userMarker = userMarkerRef.current?.marker as
      | { setMap?: (map: null) => void }
      | undefined;
    userMarker?.setMap?.(null);
    userMarkerRef.current = null;

    facilityMarkersRef.current.forEach((handle) => {
      const marker = handle.marker as { setMap?: (map: null) => void };
      marker.setMap?.(null);
    });
    facilityMarkersRef.current = new Map();
  }

  function centerDefault(kakao: Kakao, map: KakaoMapInstance) {
    map.setCenter(
      new kakao.maps.LatLng(DEFAULT_MAP_CENTER.lat, DEFAULT_MAP_CENTER.lng),
    );
    map.setLevel(DEFAULT_REGION_LEVEL);
  }

  function relayoutMap(
    kakao: Kakao,
    map: KakaoMapInstance,
    bounds: KakaoLatLngBounds,
    userHandle: UserMarkerHandle | null,
  ) {
    const hasFacility = deps.facilities.some((facility) => facility.lat != null);

    map.relayout?.();

    if (userHandle && deps.fitUser) {
      map.setCenter(userHandle.pos);
      map.setLevel(USER_FOCUS_LEVEL);
      return;
    }

    if (hasFacility) {
      map.setBounds(bounds, 40, 40, 40, 40);
      return;
    }

    if (userHandle) {
      map.setCenter(userHandle.pos);
      map.setLevel(USER_FOCUS_LEVEL);
      return;
    }

    centerDefault(kakao, map);
  }

  function updateVisibleFacilities() {
    const map = mapRef.current;
    if (!map) return;

    const mapBounds = map.getBounds?.();
    if (!mapBounds?.contain) {
      deps.onVisibleFacilitiesChange?.(deps.facilities);
      return;
    }

    const visibleFacilities = deps.facilities.filter((facility) => {
      if (facility.lat == null || facility.lng == null || !kakaoRef.current) {
        return false;
      }

      const pos = new kakaoRef.current.maps.LatLng(facility.lat, facility.lng);
      return mapBounds.contain(pos);
    });

    deps.onVisibleFacilitiesChange?.(visibleFacilities);
  }

  useEffect(() => {
    let cancelled = false;

    loadKakaoSdk()
      .then((kakao) => {
        if (cancelled || !ref.current) return;
        setError(null);
        kakaoRef.current = kakao;

        if (!mapRef.current) {
          ref.current.replaceChildren();
          mapRef.current = createMap(
            kakao,
            ref.current,
            deps.user ?? DEFAULT_MAP_CENTER,
          );
        }
        setMapReady(true);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "카카오맵 SDK 로드 실패");
      });

    return () => {
      cancelled = true;
    };
  }, [ref]);

  useEffect(() => {
    if (!mapReady) return;
    const kakao = kakaoRef.current;
    const map = mapRef.current;
    if (!kakao || !map) return;

    clearMarkers();

    const bounds = createBounds(kakao);
    let userHandle: UserMarkerHandle | null = null;
    boundsRef.current = bounds;

    if (deps.user) {
      userHandle = addUserMarker(kakao, map, deps.user);
      userMarkerRef.current = userHandle;
      bounds.extend(userHandle.pos);
    }

    deps.facilities.forEach((facility) => {
      const handle = addFacilityMarker(kakao, map, facility);
      if (!handle) return;
      facilityMarkersRef.current.set(handle.key, handle);
      bounds.extend(handle.pos);
    });

    relayoutMap(kakao, map, bounds, userHandle);
    window.requestAnimationFrame(() => {
      relayoutMap(kakao, map, bounds, userHandle);
      updateVisibleFacilities();
    });
    const timer = window.setTimeout(() => {
      relayoutMap(kakao, map, bounds, userHandle);
      updateVisibleFacilities();
    }, 350);

    return () => {
      window.clearTimeout(timer);
    };
  }, [mapReady, deps.user, deps.facilities, deps.fitUser]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    mapRef.current.relayout?.();
    window.requestAnimationFrame(updateVisibleFacilities);
  }, [mapReady, deps.viewportBottomPx]);

  useEffect(() => {
    if (!mapReady || !kakaoRef.current || !mapRef.current) return;

    const kakao = kakaoRef.current;
    const map = mapRef.current;
    const handler = () => updateVisibleFacilities();

    kakao.maps.event.addListener(map, "idle", handler);
    window.requestAnimationFrame(handler);

    return () => {
      kakao.maps.event.removeListener(map, "idle", handler);
    };
  }, [mapReady, deps.facilities, deps.onVisibleFacilitiesChange]);

  useEffect(() => {
    if (!deps.focus || !mapRef.current || !kakaoRef.current) return;
    panToFacility(kakaoRef.current, mapRef.current, deps.focus);
    const handle = facilityMarkersRef.current.get(facilityKey(deps.focus));
    if (handle) {
      closeFacilityInfoWindows();
      openFacilityInfo(mapRef.current, handle);
    }
  }, [deps.focus]);

  function panToUser() {
    if (!mapRef.current || !kakaoRef.current || !userRef.current) return;
    panToCoords(kakaoRef.current, mapRef.current, userRef.current);
    mapRef.current.setLevel(USER_FOCUS_LEVEL);
    window.requestAnimationFrame(updateVisibleFacilities);
  }

  function fitAll() {
    const map = mapRef.current;
    const bounds = boundsRef.current;
    if (!map || !bounds || bounds.isEmpty()) return;
    map.setBounds(bounds, 40, 40, 40, 40);
    if (map.getLevel() > FULL_VIEW_MAX_LEVEL) map.setLevel(FULL_VIEW_MAX_LEVEL);
  }

  return { panToUser, fitAll, error };
}
