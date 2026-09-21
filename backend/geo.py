"""Kakao Local 역지오코딩 — 좌표(lat/lng)를 시도·시군구로 변환.

KAKAO_REST_API_KEY는 서버 환경변수에만 둔다 (프론트에 노출 금지).
"""

import os

import httpx

KAKAO_GEO_URL = "https://dapi.kakao.com/v2/local/geo/coord2regioncode.json"


class GeocodeError(RuntimeError):
    pass


def coord_to_region(lat: float, lng: float) -> tuple[str, str]:
    """(sido, sigungu)를 반환. sigungu가 없는 행정구역(세종 등)이면 빈 문자열."""
    key = os.getenv("KAKAO_REST_API_KEY")
    if not key:
        raise GeocodeError("KAKAO_REST_API_KEY가 설정되지 않았습니다")

    try:
        resp = httpx.get(
            KAKAO_GEO_URL,
            params={"x": lng, "y": lat},
            headers={"Authorization": f"KakaoAK {key}"},
            timeout=3.0,
        )
        resp.raise_for_status()
        docs = resp.json().get("documents", [])
    except (httpx.HTTPError, ValueError) as e:
        raise GeocodeError(f"역지오코딩 요청 실패: {e}") from e

    # region_type "B"(법정동) 기준을 우선 사용, 없으면 첫 결과
    region = next((d for d in docs if d.get("region_type") == "B"), docs[0] if docs else None)
    if not region:
        raise GeocodeError("좌표에 해당하는 행정구역을 찾지 못했습니다")

    return region["region_1depth_name"], region.get("region_2depth_name") or ""
