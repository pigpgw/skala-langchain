# 지역 응급·병원 길잡이

> 광주 3반 G079 박건우  
> SKALA `08 생성형 AI 서비스 개발의 이해/활용(LangChain)` 종합실습과제  
> 과제명: 기획 의도가 있는 나만의 AI 도우미

## 1. 제출 파일

| 파일 | 설명 |
|---|---|
| `광주_3반_박건우_지역병원길잡이.ipynb` | 설명과 실행 결과가 저장된 제출 노트북 |
| `광주_3반_박건우_지역병원길잡이_발표.pptx` | 5분 발표용 슬라이드 |
| `backend/` | FastAPI 기반 triage API와 병원 검색 로직 |
| `frontend/` | React/Vite 기반 지도·증상 안내 웹 화면 |
| `data/hospitals.csv` | 공공 API 실패 시 사용하는 fallback 일반 의료기관 데이터 |
| `data/emergency_rooms.csv` | 공공 API 실패 시 사용하는 fallback 응급의료기관 데이터 |
| `requirements.txt` | 노트북 재실행용 Python 패키지 |
| `render.yaml`, `Dockerfile` | Render 배포 설정 |
| `docs/screenshots/` | 배포 화면 확인용 스크린샷 |
| `설계문서.md` | 발표와 Q&A 대비용 설계 근거 |

## 2. 배포 주소

- 웹 서비스: https://skala-langchain.onrender.com/triage
- 상태 확인 API: https://skala-langchain.onrender.com/api/health
- GitHub 저장소: https://github.com/pigpgw/skala-langchain

Render Free 플랜을 사용하므로 일정 시간 접속이 없으면 첫 접속 때 cold start로 로딩이 지연될 수 있습니다.

## 3. 화면 스크린샷

### 첫 진입 도움말

![첫 진입 도움말](docs/screenshots/01-joyride-map.png)

### 지도와 내 위치 기반 병원 화면

![지도와 내 위치 기반 병원 화면](docs/screenshots/02-nearby-map.png)

### AI 증상 안내 입력

![AI 증상 안내 입력](docs/screenshots/03-ai-triage-form.png)

### AI 안내 결과와 추천 병원

![AI 안내 결과와 추천 병원](docs/screenshots/04-ai-result.png)

## 4. 서비스 한 문장 정의

의료 인프라가 부족한 지역에 사는 사람이 증상을 말하면, 동네 의원으로 충분한지, 병원급 진료나 응급실 방문이 필요한지 판단하고, 실제 갈 수 있는 주변 의료기관까지 안내하는 AI 도우미입니다.

## 5. 구현 요약

| 항목 | 내용 |
|---|---|
| 문제 정의 | 지역 의료 접근성 문제와 왜 LLM이 필요한지 설명 |
| 실행 흐름 | 입력 → 공공 API/fallback 데이터 조회 → 프롬프트 구성 → 체인 실행 → 후처리 → 출력 흐름을 셀 출력으로 확인 |
| LangChain 구성 | Prompt, LCEL Chain, PydanticOutputParser, RunnableBranch, Document, FAISS Retriever, RunnableWithMessageHistory 사용 |
| 웹 확장 | React 화면, Kakao 지도, 현재 위치 기반 주변 병원 표시, FastAPI 연동, Render 배포 |

Gradio UI는 발표 시연 보조용이며, 노트북에서는 서비스 기획 의도, 체인 실행 흐름, LangChain 컴포넌트 선택 근거를 함께 설명했습니다.

웹 화면은 사용자가 지도만 보고 가까운 병원을 찾는 흐름과, 증상이 애매할 때 AI 안내를 받는 흐름을 함께 제공합니다.

## 6. 병원 데이터 처리 방식

노트북은 `.env`에 `DATA_GO_KR_SERVICE_KEY`가 있으면 공공데이터포털 API를 먼저 호출합니다.

- 일반 병원/의원: 건강보험심사평가원 병원정보서비스
- 응급의료기관: 중앙응급의료센터 응급의료기관 정보 조회 서비스
- API 키, 네트워크, 호출량 문제로 실패하면 `data/*.csv`를 fallback으로 사용

따라서 이 서비스는 병원명을 LLM이 만들어내지 않고, 공공 API 또는 fallback CSV에서 조회한 기관명·주소·전화번호를 그대로 출력합니다. 다만 API 조회 범위와 파라미터에 따라 주변 모든 병원이 한 번에 포함된다고 보장할 수는 없으므로, 실제 서비스에서는 사용자 좌표 기반 반경 검색, 페이지네이션, 지역 코드 확장 수집, 지도 API 거리 정렬이 추가로 필요합니다.

병원 기본정보 API에서 기관별 진료과가 충분히 제공되지 않는 경우에는 병원명에 포함된 과목명을 보조로 추론하고, 그래도 확인되지 않으면 `진료과 확인 필요`로 표시합니다. 이 경우 방문 전 전화 확인 안내를 함께 출력합니다.

최종 점검 기준으로 공공 API 경로는 정상 동작했습니다. 로컬 `.env`에 인증키가 있을 때 일반 의료기관 126개, 응급의료기관 7개를 가져와 감기, 흉통, 허리 통증, 진단 요구 입력 시나리오를 확인했습니다.

## 7. 실행 방법

### 노트북 실행

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
jupyter notebook 광주_3반_박건우_지역병원길잡이.ipynb
```

`.env` 또는 실행 환경에 다음 중 하나를 설정합니다.

```bash
OPENAI_API_KEY=...
# 또는
GOOGLE_API_KEY=...

# 공공데이터포털 병원/응급의료기관 조회
DATA_GO_KR_SERVICE_KEY=...
```

API 응답이 지연되거나 키가 없는 환경에서도 발표할 수 있도록 노트북 셀 출력은 저장해 두었습니다.

### 웹 서비스 로컬 실행

백엔드:

```bash
uvicorn backend.main:app --reload
```

프론트엔드:

```bash
cd frontend
npm install
npm run dev
```

기본 개발 주소는 `http://localhost:5173`입니다.

## 8. 검증 결과

| 항목 | 확인 내용 |
|---|---|
| 배포 상태 | `https://skala-langchain.onrender.com/api/health` 응답 `{"status":"ok"}` 확인 |
| 배포 화면 | `https://skala-langchain.onrender.com/triage`에서 지도, 현재 위치 버튼, AI 증상 안내, 결과 화면 확인 |
| 노트북 | 코드 셀 14개, 실행 오류 출력 없음, 빈 코드 셀 없음, API 키 노출 없음 |
| 프론트엔드 | `npm run typecheck`, `npm run build` 통과 |
| 스크린샷 | `docs/screenshots/`에 배포 화면 4장 저장 |

## 9. 발표 흐름

1. 문제 정의와 Why LLM
2. 모델에 실제로 들어가는 컨텍스트 확인
3. `PydanticOutputParser`로 구조화된 triage 결과 확인
4. `RunnableBranch`로 clinic/hospital/emergency 분기
5. 증상 3개 비교 실행
6. 한계와 개선 방향 정리

## 10. 최종 제출 안내

제출 시에는 이 README를 기준으로 다음 내용을 함께 확인할 수 있습니다.

- 노트북 실행 결과: `광주_3반_박건우_지역병원길잡이.ipynb`
- 발표 자료: `광주_3반_박건우_지역병원길잡이_발표.pptx`
- 배포 웹 서비스: https://skala-langchain.onrender.com/triage
- 화면 증거: `docs/screenshots/`
- 소스 코드: `backend/`, `frontend/`

`.env`, `.venv`, `node_modules`, 빌드 캐시, 개인 API 키는 제출 대상에서 제외합니다.
