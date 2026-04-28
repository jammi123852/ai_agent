---
inclusion: fileMatch
fileMatchPattern: "src/**"
---

# Python Code Visualizer — 전역 규칙 (Steering)

## Core Principle

이 앱은 AI 생성 코드를 수정하거나 실행하는 도구가 아니다.
AI 생성 코드에서 실제로 관찰되는 실행 역할만 고정된 block_type으로 분류하고, 이를 기능 블록 그래프로 보여주는 코드 인수인계 하네스이다.

---

## Global Rules

1. 원본 코드는 수정하지 않는다.
2. 원본 코드는 실행하지 않는다.
3. 블록은 함수별 또는 클래스별로 나누지 않는다.
4. 블록은 코드 실행 시 맡는 역할별로 나눈다.
5. 코드에 실제로 관찰된 동작만 블록으로 만든다.
6. 코드에 없는 기능은 억지로 생성하지 않는다.
7. 없는 기능은 `absent_block_types`에 기록한다.
8. 함수와 클래스는 블록 분류 기준이 아니라 `related_functions`, `related_classes`, `definition_inventory`에 기록한다.
9. 함수 정의만 있고 호출부가 없으면 `runtime_pipeline`에 넣지 않는다.
10. 호출되지 않은 함수와 클래스는 `definition_inventory`에 기록한다.
11. 하나의 함수 안에 여러 실행 역할이 있으면 역할별로 나눈다.
12. 여러 함수가 하나의 실행 역할을 구성하면 하나의 블록으로 묶는다.
13. `DANGEROUS_OPERATION`은 다른 블록과 합치지 않는다.
14. 판단이 불확실하면 `UNKNOWN` 또는 `uncertain_points`에 기록한다.
15. `pipeline_status`는 `runtime_detected`, `definition_only`, `partial`, `unknown` 중 하나만 사용한다.
16. `block_type`은 허용 목록 외에는 만들지 않는다.
17. `high` risk가 하나 이상 있으면 `human_review_needed=true`로 설정한다.
18. `confidence < 0.7`이면 `human_review_needed=true`로 설정한다.
19. 동일 입력을 여러 번 분석해도 `block_type` 순서, `block_id` 개수, edge 개수가 최대한 동일해야 한다.

---

## Allowed block_type

아래 14종 외에는 어떤 block_type도 생성하지 않는다.

| block_type | 설명 |
|---|---|
| `SETUP` | 환경 설정, 라이브러리 임포트, 초기화 |
| `DEFINE_STRUCTURE` | 데이터 구조, 클래스, 스키마 정의 |
| `INPUT` | 사용자 입력 수집, CLI 인자, stdin |
| `LOAD` | 파일, DB, 외부 소스에서 데이터 로드 |
| `VALIDATE` | 입력값 또는 데이터 유효성 검사 |
| `TRANSFORM` | 전처리, 후처리, 데이터 변환 (전처리/후처리 구분 없이 통합) |
| `CORE_LOGIC` | 핵심 비즈니스 로직, 주요 연산 |
| `MODEL_OR_ALGORITHM` | ML 모델, 알고리즘, 수치 계산 |
| `OUTPUT` | 결과 출력, 파일 저장, 반환값 |
| `VISUALIZE` | 차트, 그래프, 시각화 렌더링 |
| `ERROR_HANDLING` | 예외 처리, 오류 복구 |
| `DANGEROUS_OPERATION` | 파일 삭제, 외부 전송, 개인정보 처리 등 위험 동작 |
| `UTILITY` | 헬퍼 함수, 공통 유틸리티 |
| `UNKNOWN` | 분류 불가 또는 판단 불확실 |

---

## Classification Priority

동일한 코드 조각이 여러 block_type에 해당할 경우 아래 우선순위를 따른다.

| 우선순위 | block_type |
|---|---|
| 1 | `DANGEROUS_OPERATION` |
| 2 | `ERROR_HANDLING` |
| 3 | `SETUP` |
| 4 | `DEFINE_STRUCTURE` |
| 5 | `INPUT` |
| 6 | `LOAD` |
| 7 | `VALIDATE` |
| 8 | `MODEL_OR_ALGORITHM` |
| 9 | `TRANSFORM` |
| 10 | `CORE_LOGIC` |
| 11 | `VISUALIZE` |
| 12 | `OUTPUT` |
| 13 | `UTILITY` |
| 14 | `UNKNOWN` |

---

## Risk Rules

| 동작 | 분류 | risk_level |
|---|---|---|
| `os.remove`, `shutil.rmtree`, 파일/폴더 삭제 | `DANGEROUS_OPERATION` | `high` |
| `requests.post`, `socket.send`, 외부 데이터 전송 | `DANGEROUS_OPERATION` | `high` |
| 이메일, 전화번호, 주민번호 등 개인정보 처리 | `DANGEROUS_OPERATION` | `high` |
| 파일 저장 (`open(..., 'w')`) | `OUTPUT` | `medium` (덮어쓰기 가능성 있으면 `risk_points`에 기록) |

- `risk_level`이 `high`인 블록이 1개 이상 존재하면 `human_review_needed=true`로 설정한다.
- `confidence < 0.7`이면 `human_review_needed=true`로 설정한다.
- 각 위험 지점은 `risk_points` 필드에 위험 유형, 관련 코드 위치, 설명을 포함하여 기록한다.

---

## Output Stability Rules

- `block_id`는 `B01`, `B02`, `B03` 형식으로 순차 부여한다.
- `runtime_pipeline`의 순서는 실제 실행 순서를 우선한다.
- 실행 순서를 판단할 수 없으면 코드 등장 순서를 따른다.
- 연속된 동일 `block_type`은 하나로 병합할 수 있다.
- `DANGEROUS_OPERATION`은 병합하지 않는다.
- `pipeline_edges`의 `from`/`to`는 반드시 존재하는 `block_id`를 참조해야 한다.
- 동일 입력 5회 실행 시 `pipeline_status`, `block_type` sequence, block count, edge count가 동일해야 한다.

---

## Output Data Structure

분석 결과 객체는 아래 14개 필드를 모두 포함해야 한다.

| 필드 | 타입 | 설명 |
|---|---|---|
| `pipeline_status` | enum | `runtime_detected` \| `definition_only` \| `partial` \| `unknown` |
| `request_summary` | string | user_request 요약 |
| `runtime_pipeline` | Block[] | 실행 역할 블록 목록 (순서 있음) |
| `pipeline_edges` | Edge[] | 블록 간 연결 관계 |
| `definition_inventory` | Item[] | 정의만 있고 호출되지 않은 함수/클래스 |
| `absent_block_types` | string[] | 허용 목록 중 코드에 나타나지 않은 block_type |
| `spec_gaps` | Gap[] | user_request와 generated_code 간 불일치 항목 |
| `risk_points` | RiskPoint[] | 위험 지점 목록 (유형, 위치, 설명 포함) |
| `summary_short` | string | 한 문장 요약 |
| `summary_detailed` | string | 상세 요약 |
| `verification_checklist` | CheckItem[] | 검증 체크리스트 항목 |
| `consistency_check` | object | user_request와 코드 일치도 평가 |
| `confidence` | number | 분석 신뢰도 (0.0 ~ 1.0) |
| `human_review_needed` | boolean | 사람 검토 필요 여부 |

---

## Writing Style

- 보고서형 문체로 작성한다.
- 모호한 표현을 피한다.
- 구현자가 바로 기준으로 사용할 수 있게 명확한 규칙 중심으로 작성한다.
