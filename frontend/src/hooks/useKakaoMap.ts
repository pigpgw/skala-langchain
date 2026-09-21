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
import type { FacilityMarkerHandle } from "@/lib/kakao/map";

interface KakaoMapDeps {
  user: Coords | null;
  facilities: Facility[];
  focus: Facility | null;
  fitUser: boolean;
}

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
  const facilityMarkersRef = useRef<Map<string, FacilityMarkerHandle>>(
    new Map(),
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    userRef.current = deps.user;
  }, [deps.user]);

  function closeFacilityInfoWindows() {
    facilityMarkersRef.current.forEach((handle) => {
      const infoWindow = handle.infoWindow as { close?: () => void };
      infoWindow.close?.();
    });
  }

  function centerDefault(kakao: Kakao, map: KakaoMapInstance) {
    map.setCenter(
      new kakao.maps.LatLng(DEFAULT_MAP_CENTER.lat, DEFAULT_MAP_CENTER.lng),
    );
    map.setLevel(7);
  }

  function relayoutMap(
    kakao: Kakao,
    map: KakaoMapInstance,
    bounds: KakaoLatLngBounds,
    userPos: unknown,
  ) {
    const hasFacility = deps.facilities.some((facility) => facility.lat != null);

    map.relayout?.();

    if (hasFacility) {
      map.setBounds(bounds, 40, 40, 40, 40);
      const maxLevel = deps.fitUser ? 8 : 9;
      if (map.getLevel() > maxLevel) map.setLevel(maxLevel);
      if (userPos && deps.fitUser) {
        map.setCenter(userPos);
        if (map.getLevel() > 7) map.setLevel(7);
      }
      return;
    }

    if (userPos) {
      map.setCenter(userPos);
      map.setLevel(5);
      return;
    }

    centerDefault(kakao, map);
  }

  useEffect(() => {
    let cancelled = false;

    loadKakaoSdk()
      .then((kakao) => {
        if (cancelled || !ref.current) return;
        setError(null);
        kakaoRef.current = kakao;

        const bounds = createBounds(kakao);
        const map = createMap(kakao, ref.current);
        let userPos: unknown = null;
        boundsRef.current = bounds;
        mapRef.current = map;
        facilityMarkersRef.current = new Map();

        if (deps.user) {
          userPos = addUserMarker(kakao, map, deps.user);
          bounds.extend(userPos);
        }

        deps.facilities.forEach((facility) => {
          const handle = addFacilityMarker(kakao, map, facility);
          if (!handle) return;
          facilityMarkersRef.current.set(handle.key, handle);
          bounds.extend(handle.pos);
        });

        relayoutMap(kakao, map, bounds, userPos);
        window.requestAnimationFrame(() => {
          if (!cancelled) relayoutMap(kakao, map, bounds, userPos);
        });
        window.setTimeout(() => {
          if (!cancelled) relayoutMap(kakao, map, bounds, userPos);
        }, 350);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "카카오맵 SDK 로드 실패");
      });

    return () => {
      cancelled = true;
    };
  }, [ref, deps.user, deps.facilities, deps.fitUser]);

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
    mapRef.current.setLevel(5);
  }

  function fitAll() {
    const map = mapRef.current;
    const bounds = boundsRef.current;
    if (!map || !bounds || bounds.isEmpty()) return;
    map.setBounds(bounds, 40, 40, 40, 40);
    if (map.getLevel() > 9) map.setLevel(9);
  }

  return { panToUser, fitAll, error };
}
