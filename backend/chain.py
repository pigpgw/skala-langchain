"""지역 응급·병원 길잡이 체인 — 노트북(v1) 로직을 모듈로 추출.

core_chain: 판단 + 검색까지 (API JSON 응답용)
full_chain: core_chain | format_output (v1과 동일한 텍스트 출력, 회귀 검증 기준)
"""

import math
import os
from pathlib import Path

import pandas as pd
from dotenv import load_dotenv
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document
from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnableBranch, RunnableLambda, RunnablePassthrough
from pydantic import BaseModel, Field

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = Path(os.getenv("DATA_DIR", BASE_DIR / "data"))

load_dotenv(BASE_DIR / ".env")

PROVIDER = os.getenv("PROVIDER", "openai")

if PROVIDER == "openai":
    if not os.getenv("OPENAI_API_KEY"):
        raise RuntimeError("OPENAI_API_KEY가 필요합니다 (.env 또는 환경변수)")
    from langchain_openai import ChatOpenAI, OpenAIEmbeddings

    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
    embeddings = OpenAIEmbeddings()
else:
    if not os.getenv("GOOGLE_API_KEY"):
        raise RuntimeError("GOOGLE_API_KEY가 필요합니다 (.env 또는 환경변수)")
    from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings

    llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0)
    embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001")

# --- 데이터 로드 → Document → FAISS ---


def hospital_to_doc(row):
    content = (
        f"{row['sido']} {row['sigungu']}의 {row['type']} '{row['name']}'. "
        f"진료과목: {row['departments']}. 주소: {row['address']}. 전화: {row['phone']}"
    )
    return Document(
        page_content=content,
        metadata={
            "sido": row["sido"],
            "sigungu": row["sigungu"],
            "type": row["type"],
            "departments": row["departments"],
            "name": row["name"],
            "address": row["address"],
            "phone": row["phone"],
            "lat": float(row["lat"]),
            "lng": float(row["lng"]),
        },
    )


def er_to_doc(row):
    content = (
        f"{row['sido']} {row['sigungu']}의 응급의료기관 '{row['name']}'. "
        f"주소: {row['address']}. 전화: {row['phone']}. 24시간: {row['is_24h']}"
    )
    return Document(
        page_content=content,
        metadata={
            "sido": row["sido"],
            "sigungu": row["sigungu"],
            "name": row["name"],
            "address": row["address"],
            "phone": row["phone"],
            "is_24h": row["is_24h"],
            "lat": float(row["lat"]),
            "lng": float(row["lng"]),
        },
    )


hosp_df = pd.read_csv(DATA_DIR / "hospitals.csv")
er_df = pd.read_csv(DATA_DIR / "emergency_rooms.csv")

hosp_docs = [hospital_to_doc(r) for _, r in hosp_df.iterrows()]
er_docs = [er_to_doc(r) for _, r in er_df.iterrows()]

hospitals_vs = FAISS.from_documents(hosp_docs, embeddings)
er_vs = FAISS.from_documents(er_docs, embeddings)

# 지도 표시·거리 검색용 전체 목록 (kind로 일반/응급 구분)
ALL_FACILITIES = [{"kind": "hospital", **d.metadata} for d in hosp_docs] + [
    {"kind": "emergency", **d.metadata} for d in er_docs
]

hospital_retriever = hospitals_vs.as_retriever(search_kwargs={"k": 10})
er_retriever = er_vs.as_retriever(search_kwargs={"k": 10})

# --- 1단계: triage 체인 ---


class TriageResult(BaseModel):
    department: str = Field(
        description="표준 진료과목명 하나 (내과, 외과, 정형외과, 이비인후과, 피부과, 소아과, 산부인과, 안과, 치과, 신경과 등)"
    )
    severity: str = Field(description="'clinic'(동네 의원) / 'hospital'(종합병원 이상) / 'emergency'(즉시 응급실) 중 하나")
    reason: str = Field(description="판단 이유 2~3문장")
    caution: str = Field(description="주의사항. '본 안내는 의료 진단이 아닙니다' 문구 포함")


triage_parser = PydanticOutputParser(pydantic_object=TriageResult)

triage_prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "너는 의료 접근 안내 도우미이다. 지역 의료격차로 큰 병원 접근이 어려운 지방 거주자에게 "
            "어느 수준의 의료기관을 방문해야 하는지 안내한다.\n"
            "규칙:\n"
            "1. 질병을 진단하지 않는다. 방문해야 할 의료기관 수준만 안내한다.\n"
            "2. 생명이 위급할 수 있는 증상(흉통, 의식 저하, 호흡곤란, 심한 출혈, 마비, 심한 복통 등)은 반드시 severity를 emergency로 한다.\n"
            "3. 불확실하면 더 높은 수준(의원보다 병원, 병원보다 응급실)을 권한다.\n"
            "4. 단, 감기·가벼운 피부 트러블·경미한 통증처럼 일상적이고 경증인 증상은 clinic으로 한다. "
            "의원에서 충분히 진료 가능한 일을 큰 병원으로 보내는 것도 잘못된 안내이다.\n"
            "{format_instructions}",
        ),
        ("human", "증상: {symptom}\n거주 지역: {sido} {sigungu}"),
    ]
).partial(format_instructions=triage_parser.get_format_instructions())

triage_chain = triage_prompt | llm | triage_parser

# --- 2단계: severity 분기 + 검색 ---

SEVERITY_LABEL = {"clinic": "동네 의원", "hospital": "종합병원 이상", "emergency": "즉시 응급실"}
HOSPITAL_TYPES = ("병원", "종합병원", "상급종합병원")

SIDO_NORMALIZE = {
    "서울": "서울특별시",
    "부산": "부산광역시",
    "대구": "대구광역시",
    "인천": "인천광역시",
    "광주": "광주광역시",
    "대전": "대전광역시",
    "울산": "울산광역시",
    "세종": "세종특별자치시",
    "경기": "경기도",
    "강원": "강원특별자치도",
    "충북": "충청북도",
    "충남": "충청남도",
    "전북": "전북특별자치도",
    "전남": "전라남도",
    "경북": "경상북도",
    "경남": "경상남도",
    "제주": "제주특별자치도",
}


def normalize_input(x):
    return {**x, "sido": SIDO_NORMALIZE.get(x["sido"], x["sido"])}


# 행정구역 개편 대응: 카카오는 통합특별시(2026.7 출범)를 반환하지만 CSV는 구 시도 명칭을 쓴다
SIDO_LEGACY = {
    "전남광주통합특별시": ("전라남도", "광주광역시"),
}


def sido_candidates(sido: str) -> tuple:
    return SIDO_LEGACY.get(sido, (sido,))


def _match(d, *, sido=(), sigungu=None, types=None, dept=None):
    m = d.metadata
    if sido and m["sido"] not in sido:
        return False
    if sigungu and m["sigungu"] != sigungu:
        return False
    if types and m["type"] not in types:
        return False
    if dept and dept not in m.get("departments", ""):
        return False
    return True


def find_clinics(x):
    t = x["triage"]
    docs = hospital_retriever.invoke(f"{t.department} {x['symptom']}")
    hits = [d for d in docs if _match(d, sigungu=x["sigungu"], types=("의원",), dept=t.department)]
    if not hits:
        hits = [d for d in docs if _match(d, sido=sido_candidates(x["sido"]), types=("의원",), dept=t.department)]
    return hits[:3] or [Document(page_content="주변에서 해당 진료과 의원을 찾지 못했습니다. 인접 지역 검색을 권합니다.")]


def find_hospitals(x):
    t = x["triage"]
    docs = hospital_retriever.invoke(f"{t.department} {x['symptom']}")
    hits = [d for d in docs if _match(d, sido=sido_candidates(x["sido"]), types=HOSPITAL_TYPES, dept=t.department)]
    if not hits:
        hits = [d for d in docs if _match(d, types=HOSPITAL_TYPES, dept=t.department)]
    return hits[:3] or [Document(page_content="해당 진료과의 병원급 기관을 찾지 못했습니다. 종합병원 안내를 이용하세요.")]


def find_emergency_rooms(x):
    docs = er_retriever.invoke(x["symptom"])
    hits = [d for d in docs if d.metadata["sido"] in sido_candidates(x["sido"])]
    if not hits:
        hits = docs
    return hits[:3] or [Document(page_content="응급실 정보를 찾지 못했습니다. 즉시 119에 연락하세요.")]


facility_branch = RunnableBranch(
    (lambda x: x["triage"].severity == "emergency", RunnableLambda(find_emergency_rooms)),
    (lambda x: x["triage"].severity == "hospital", RunnableLambda(find_hospitals)),
    RunnableLambda(find_clinics),
)

# --- 3단계: 출력 조립 ---


def format_output(x):
    t = x["triage"]
    lines = [
        "[판단 결과]",
        f"- 추천 진료과: {t.department}",
        f"- 심각도: {SEVERITY_LABEL.get(t.severity, t.severity)} ({t.severity})",
        f"- 이유: {t.reason}",
        f"- 주의: {t.caution}",
        "",
        "[주변 의료기관]",
    ]
    for i, d in enumerate(x["facilities"], 1):
        lines.append(f"{i}. {d.page_content}")
    if t.severity == "emergency":
        lines.append("\n※ 상태가 급격히 나빠지면 119에 즉시 연락하세요.")
    return "\n".join(lines)


core_chain = (
    RunnableLambda(normalize_input)
    | RunnablePassthrough.assign(triage=triage_chain)
    | RunnablePassthrough.assign(facilities=facility_branch)
)

full_chain = core_chain | RunnableLambda(format_output)


# --- API 응답 변환 ---


def _haversine_km(lat1, lng1, lat2, lng2) -> float:
    R = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp, dl = math.radians(lat2 - lat1), math.radians(lng2 - lng1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


def doc_to_facility(d: Document, user_pos=None) -> dict:
    m = d.metadata
    distance = None
    if user_pos and m.get("lat") is not None:
        distance = round(_haversine_km(user_pos[0], user_pos[1], m["lat"], m["lng"]), 1)
    return {
        "name": m.get("name"),
        "type": m.get("type"),
        "kind": "emergency" if m.get("is_24h") else "hospital",
        "sido": m.get("sido"),
        "sigungu": m.get("sigungu"),
        "address": m.get("address"),
        "phone": m.get("phone"),
        "departments": m.get("departments"),
        "is_24h": m.get("is_24h"),
        "lat": m.get("lat"),
        "lng": m.get("lng"),
        "distance_km": distance,
        "message": None if m.get("name") else d.page_content,
    }


def nearby_facilities(lat: float, lng: float, radius_km: float = 30.0, limit: int = 10) -> list[dict]:
    """현재 위치 기준 반경 내 의료기관을 거리순으로 반환 (지도 초기 표시용)."""
    rows = []
    for m in ALL_FACILITIES:
        d = _haversine_km(lat, lng, m["lat"], m["lng"])
        if d <= radius_km:
            rows.append({**m, "distance_km": round(d, 1), "message": None})
    return sorted(rows, key=lambda f: f["distance_km"])[:limit]


def run_triage(symptom: str, sido: str, sigungu: str = "", lat=None, lng=None) -> dict:
    result = core_chain.invoke({"symptom": symptom, "sido": sido, "sigungu": sigungu})
    t = result["triage"]
    user_pos = (lat, lng) if lat is not None and lng is not None else None
    facilities = [doc_to_facility(d, user_pos) for d in result["facilities"]]
    return {
        "triage": {**t.model_dump(), "severity_label": SEVERITY_LABEL.get(t.severity, t.severity)},
        "facilities": facilities,
        "resolved_region": {"sido": result["sido"], "sigungu": result["sigungu"]},
        "notice": next((f["message"] for f in facilities if f["message"]), None),
    }
