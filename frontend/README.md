# 지역 병원 길잡이 Frontend

Vite + React + TypeScript로 구현한 지역 병원 길잡이 확장 프론트입니다. 주 사용자를 어르신과 보호자로 가정하여 모바일 우선 화면, 큰 글씨, 고정 지도, 드래그 가능한 하단 패널, React Joyride 도움말을 적용했습니다.

> 과제 제출 README에는 배포 주소와 실제 화면 스크린샷을 함께 정리했습니다. 이 프론트엔드는 노트북 기반 LangChain 과제를 웹 서비스로 확장한 구현입니다.

## 실행

```bash
npm install
npm run dev
```

기본 개발 주소는 `http://localhost:5173`입니다.

FastAPI 서버는 상위 폴더에서 다음과 같이 실행합니다.

```bash
uvicorn backend.main:app --reload
```

## 환경변수

`.env.example`을 참고해 `frontend/.env`를 만듭니다.

```bash
VITE_KAKAO_JS_KEY=카카오_지도_JavaScript_키
# VITE_API_BASE_URL=
```

`VITE_API_BASE_URL`을 비우면 Vite dev proxy가 `/api` 요청을 `localhost:8000`으로 전달합니다.

공공데이터포털 인증키와 LLM 키는 프론트에 두지 않습니다. 상위 폴더의 backend 또는 노트북 실행 환경에서만 관리합니다.

## 주요 화면

| 경로      | 역할                                        |
| --------- | ------------------------------------------- |
| `/`       | 서비스 시작 화면, 사용 방법 보기            |
| `/triage` | 지도, 주변 병원, 증상 입력, 결과 확인       |
| `*`       | 404 페이지, 처음 화면 또는 진료 안내로 이동 |

라우터는 `src/router/index.tsx`에서 `createBrowserRouter`로 분리했습니다. 진입점 `src/main.tsx`는 `RouterProvider`만 조립합니다.

## 주요 기능

- 현재 위치 기반 주변 병원 조회
- 카카오 지도 마커 표시와 병원 카드 선택 시 지도 포커스 이동
- 증상 입력 후 FastAPI `/api/triage` 호출
- 병원/증상/결과 탭 기반 하단 패널
- 하단 패널 손잡이 드래그, 탭, 키보드 화살표 조절
- React Joyride 자동 도움말과 헤더 도움말 버튼
- 모바일 폭 중심 레이아웃과 404 페이지

## 데이터 안내

- 병원명, 주소, 전화번호는 backend가 공공 API 또는 fallback CSV에서 가져온 값을 사용합니다.
- 기관별 진료과가 명확하지 않으면 `진료과 확인 필요`로 표시될 수 있습니다.
- 응급 상황에서는 앱 화면보다 119 연락과 실제 의료기관 확인이 우선입니다.

## 검증 명령

```bash
npm run format:check
npm run lint
npm run typecheck
npm run build
```

문서나 UI를 수정한 뒤에는 위 명령을 다시 실행해 최종 상태를 확인합니다.
