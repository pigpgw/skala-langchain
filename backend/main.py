"""FastAPI 엔드포인트 — React 프론트에서 호출하는 triage API."""

from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from backend.chain import nearby_facilities, run_triage
from backend.geo import GeocodeError, coord_to_region

app = FastAPI(title="지역 응급·병원 길잡이 API")
BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIST = BASE_DIR / "frontend" / "dist"

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


class TriageRequest(BaseModel):
    symptom: str
    lat: float | None = None
    lng: float | None = None
    sido: str | None = None
    sigungu: str | None = None


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/nearby")
def nearby(lat: float, lng: float, radius_km: float = 30.0, limit: int = 10):
    return {"facilities": nearby_facilities(lat, lng, radius_km, limit)}


@app.post("/api/triage")
def triage(req: TriageRequest):
    if not req.symptom.strip():
        raise HTTPException(status_code=400, detail="symptom이 필요합니다")

    if req.lat is not None and req.lng is not None:
        try:
            sido, sigungu = coord_to_region(req.lat, req.lng)
        except GeocodeError as e:
            raise HTTPException(status_code=502, detail=str(e)) from e
    elif req.sido:
        sido, sigungu = req.sido, req.sigungu or ""
    else:
        raise HTTPException(status_code=400, detail="위치 정보가 필요합니다 (lat/lng 또는 sido/sigungu)")

    try:
        return run_triage(req.symptom, sido, sigungu, req.lat, req.lng)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"triage 처리 실패: {e}") from e


if FRONTEND_DIST.exists():
    app.mount(
        "/assets",
        StaticFiles(directory=FRONTEND_DIST / "assets"),
        name="frontend-assets",
    )


@app.get("/{full_path:path}")
def serve_frontend(full_path: str):
    index_path = FRONTEND_DIST / "index.html"
    target_path = FRONTEND_DIST / full_path

    if target_path.is_file():
        return FileResponse(target_path)
    if index_path.exists():
        return FileResponse(index_path)

    raise HTTPException(status_code=404, detail="frontend build not found")
