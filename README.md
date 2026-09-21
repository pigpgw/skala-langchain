# 지역 응급·병원 길잡이

> 광주 3반 G079 박건우  
> SKALA `08 생성형 AI 서비스 개발의 이해/활용(LangChain)` 종합실습과제  
> 과제명: 기획 의도가 있는 나만의 AI 도우미

## 1. 제출 파일

| 파일 | 설명 |
|---|---|
| `광주_3반_박건우_지역병원길잡이.ipynb` | 설명과 실행 결과가 저장된 제출 노트북 |
| `광주_3반_박건우_지역병원길잡이_발표.pptx` | 5분 발표용 슬라이드 |
| `data/hospitals.csv` | 일반 의료기관 샘플 데이터 |
| `data/emergency_rooms.csv` | 응급의료기관 샘플 데이터 |
| `requirements.txt` | 노트북 재실행용 Python 패키지 |
| `설계문서.md` | 발표와 Q&A 대비용 설계 근거 |

## 2. 서비스 한 문장 정의

의료 인프라가 부족한 지역에 사는 사람이 증상을 말하면, 동네 의원으로 충분한지, 병원급 진료나 응급실 방문이 필요한지 판단하고, 실제 갈 수 있는 주변 의료기관까지 안내하는 AI 도우미입니다.

## 3. 핵심 채점 기준 대응

| 핵심 항목 | 배점 | 노트북 대응 |
|---|---:|---|
| 주제 선정 | 20점 | 지역 의료 접근성 문제와 왜 LLM이 필요한지 설명 |
| 문제 해결 범위 | 20점 | 입력 → 컨텍스트 구성 → 체인 실행 → 후처리 → 출력 흐름을 셀 출력으로 추적 |
| LangChain 컴포넌트 활용 | 50점 | Prompt, LCEL Chain, PydanticOutputParser, RunnableBranch, Document, FAISS Retriever, RunnableWithMessageHistory 사용 이유 설명 |

Gradio UI는 발표 시연 보조용이며, 핵심 평가는 노트북의 주제 설명, 체인 실행 흐름, LangChain 컴포넌트 선택 근거를 중심으로 구성했습니다.

## 4. 실행 방법

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
```

API 응답이 지연되거나 키가 없는 환경에서도 발표할 수 있도록 노트북 셀 출력은 저장해 두었습니다.

## 5. 발표 흐름

1. 문제 정의와 Why LLM
2. 모델에 실제로 들어가는 컨텍스트 확인
3. `PydanticOutputParser`로 구조화된 triage 결과 확인
4. `RunnableBranch`로 clinic/hospital/emergency 분기
5. 증상 3개 비교 실행
6. 한계와 개선 방향 정리
