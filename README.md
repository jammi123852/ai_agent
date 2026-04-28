# AI 생성 코드 기능 블록 그래프 시각화 하네스 에이전트

---

## 1. 어떤 병목을 다루는가

**병목 Task:**
AI가 생성한 Python 코드 파일 1개를 사람이 이해하고 검증할 수 있도록, 실행 역할별 기능 블록 그래프로 변환한다.

**빈도:**
AI 코딩 도구로 Python 코드를 생성할 때마다 발생한다.
개인 기준으로 주 3~5회 이상 발생 가능하며, 100~300줄 코드 1개를 이해하고 검증하는 데 약 10~30분이 소요된다.

**왜 병목인가:**
AI가 코드는 빠르게 만들어주지만, 사용자는 그 코드가 어떤 순서로 실행되는지, 어떤 기능끼리 연결되는지, 사용자 요구사항과 실제 코드가 일치하는지 직접 확인해야 한다.
함수별/클래스별 설명만으로는 실제 실행 흐름을 파악하기 어렵고, 파일 삭제·덮어쓰기·외부 전송 같은 위험 동작을 놓치면 디버깅 시간이나 데이터 손실이 발생할 수 있다.
따라서 텍스트 설명보다 기능 블록 그래프 형태의 인수인계 구조가 필요하다.

---

## 2. 왜 AI Agent로 만들었는가

**룰베이스/매크로/기존 도구로 안 되는 이유:**
단순 정규식이나 매크로는 함수명, import, 특정 키워드는 찾을 수 있지만, 코드 조각이 실제로 어떤 실행 역할을 하는지 안정적으로 판단하기 어렵다.
하나의 함수 안에 여러 기능이 들어가거나, 여러 함수가 하나의 기능을 수행하거나, 클래스 안에 load/clean/save 같은 역할이 섞여 있을 수 있다.
따라서 단순 함수 목록이 아니라 실행 역할 기준으로 기능 블록을 구성해야 한다.

**AI 판단이 필요한 지점:**

1. 사용자 원래 요청에서 goal, must_have, must_not_have를 추출하는 부분
2. 코드의 실제 동작과 사용자 요청이 일치하는지 비교하는 부분
3. 특정 코드 조각이 LOAD, TRANSFORM, CORE_LOGIC, OUTPUT 등 어떤 실행 역할인지 판단하는 부분
4. 요청에 없는 위험 동작이 포함되었는지 해석하는 부분
5. 사용자의 코딩 지식 수준에 따라 쉬운 설명, 일반 설명, 기술 설명을 다르게 생성하는 부분

**재현성 제약:**
block_type 분류와 그래프 구조 생성은 고정 규칙 기반 하네스로 제한한다.
AI Agent는 의미 비교, 위험 해석, 설명 생성을 담당하며, 그래프 구조 자체를 결정하지 않는다.

---

## 3. Agent 구조

**입력 → 처리 → 출력 다이어그램:**

```
user_request + generated_code + user_level
    ↓
Request Parser → Code Observer → Block Classifier → Graph Builder → Spec Gap / Risk Detector
    ↓
기능 블록 그래프 + 블록 상세 패널 + 요약본 + 위험 지점 + 검증 체크리스트
```

**하위 Agent 구조:**

| Agent | 역할 |
|---|---|
| **Request Parser Agent** | `user_request`에서 `goal`, `must_have`, `must_not_have` 추출 |
| **Code Observer Agent** | `generated_code`에서 실제 관찰 가능한 실행 동작 추출 |
| **Block Classifier Agent** | 고정 `block_type` 목록과 우선순위에 따라 실행 역할 분류 |
| **Graph Builder Agent** | `runtime_pipeline`과 `pipeline_edges`를 생성하여 기능 블록 그래프 구성 |
| **Detail Panel Agent** | 블록 클릭 시 관련 함수, 클래스, 코드 근거, 입력, 출력, 설명 제공 |
| **Spec Gap & Risk Agent** | 사용자 요청과 코드 동작 차이, 위험 동작 탐지 |
| **Consistency Checker Agent** | `block_id`, `block_type`, edge, schema, 5회 일관성 검사 |

**사용 도구:**
- Kiro Spec Mode
- React + TypeScript 설계
- 브라우저 내부 규칙 기반 분석기
- 외부 AI API는 MVP에서 사용하지 않음
- 향후 확장으로 AI API를 설명 생성, 요구사항 비교, 위험 해석에 연결 가능

**허용 block_type 목록 (14종 고정):**

| block_type | 실행 역할 |
|---|---|
| `SETUP` | 환경 설정, 라이브러리 임포트, 초기화 |
| `DEFINE_STRUCTURE` | 데이터 구조, 클래스, 스키마 정의 |
| `INPUT` | 사용자 입력 수집, CLI 인자, stdin |
| `LOAD` | 파일, DB, 외부 소스에서 데이터 로드 |
| `VALIDATE` | 입력값 또는 데이터 유효성 검사 |
| `TRANSFORM` | 전처리, 후처리, 데이터 변환 |
| `CORE_LOGIC` | 핵심 비즈니스 로직, 주요 연산 |
| `MODEL_OR_ALGORITHM` | ML 모델, 알고리즘, 수치 계산 |
| `OUTPUT` | 결과 출력, 파일 저장, 반환값 |
| `VISUALIZE` | 차트, 그래프, 시각화 렌더링 |
| `ERROR_HANDLING` | 예외 처리, 오류 복구 |
| `DANGEROUS_OPERATION` | 파일 삭제, 외부 전송, 개인정보 처리 등 위험 동작 |
| `UTILITY` | 헬퍼 함수, 공통 유틸리티 |
| `UNKNOWN` | 분류 불가 또는 판단 불확실 |

**분류 우선순위:**

```
1. DANGEROUS_OPERATION
2. ERROR_HANDLING
3. SETUP
4. DEFINE_STRUCTURE
5. INPUT
6. LOAD
7. VALIDATE
8. MODEL_OR_ALGORITHM
9. TRANSFORM
10. CORE_LOGIC
11. VISUALIZE
12. OUTPUT
13. UTILITY
14. UNKNOWN
```

**핵심 제약:**
- 원본 코드는 수정하지 않는다.
- 원본 코드는 실행하지 않는다.
- 블록은 함수별/클래스별이 아니라 실행 역할별로 나눈다.
- 허용 `block_type` 목록 외 새 타입을 만들지 않는다.
- 코드에 실제로 관찰된 동작만 블록으로 만든다.
- 함수 정의만 있고 호출부가 없으면 `runtime_pipeline`에 넣지 않고 `definition_inventory`에 기록한다.
- `DANGEROUS_OPERATION`은 독립 블록으로 분리한다.
- `high` risk가 1개 이상 있으면 `human_review_needed=true`로 설정한다.
- 동일 입력 5회 실행 시 `pipeline_status`, `block_type` sequence, block count, edge count가 동일해야 한다.

---

## 4. 실행 방법

현재 단계는 설계 자산 제출용이다. 실제 앱 실행 대신 Kiro 기반 설계 자산을 확인하는 방식으로 검토한다.

```bash
# 프로젝트 폴더 이동
cd ai_agent

# 설계 자산 확인
ls .kiro/specs/python-code-visualizer/
# requirements.md  design.md  tasks.md  .config.kiro

# 전역 규칙 확인
ls .kiro/steering/
# python-code-visualizer.md

# 테스트 입력 확인
ls test-input/
# case-1-runtime-basic.md
# case-2-definition-only.md
# case-3-class-methods.md
# case-4-request-code-mismatch.md
# case-5-dangerous-operation.md
```

---

## 5. 테스트 입력 케이스

| 케이스 | 파일 | 예상 pipeline_status | 핵심 검증 항목 |
|---|---|---|---|
| Case 1 | `case-1-runtime-basic.md` | `runtime_detected` | 최소 4개 블록, 정상 흐름 |
| Case 2 | `case-2-definition-only.md` | `definition_only` | `runtime_pipeline=[]`, 모든 함수가 `definition_inventory`에 기록 |
| Case 3 | `case-3-class-methods.md` | `runtime_detected` | 호출된 메서드만 `runtime_pipeline`에 포함 |
| Case 4 | `case-4-request-code-mismatch.md` | `runtime_detected` | `spec_gaps`에 불일치 항목 기록 |
| Case 5 | `case-5-dangerous-operation.md` | `runtime_detected` | `DANGEROUS_OPERATION` 블록 생성, `human_review_needed=true` |

---

## 6. 5회 실행 일관성 테스트 계획

동일 입력(`case-1-runtime-basic`)을 5회 연속 분석했을 때 아래 항목이 모두 동일해야 한다.

| Run | Input Case | pipeline_status | block_type sequence | block count | edge count | high risk count | human_review_needed | schema valid | result |
|---|---|---|---|---:|---:|---:|---|---|---|
| 1 | case-1-runtime-basic | runtime_detected | SETUP → LOAD → CORE_LOGIC → OUTPUT | 4 | 3 | 0 | false | PASS | PASS |
| 2 | case-1-runtime-basic | runtime_detected | SETUP → LOAD → CORE_LOGIC → OUTPUT | 4 | 3 | 0 | false | PASS | PASS |
| 3 | case-1-runtime-basic | runtime_detected | SETUP → LOAD → CORE_LOGIC → OUTPUT | 4 | 3 | 0 | false | PASS | PASS |
| 4 | case-1-runtime-basic | runtime_detected | SETUP → LOAD → CORE_LOGIC → OUTPUT | 4 | 3 | 0 | false | PASS | PASS |
| 5 | case-1-runtime-basic | runtime_detected | SETUP → LOAD → CORE_LOGIC → OUTPUT | 4 | 3 | 0 | false | PASS | PASS |

동일 입력 5회 실행에서 `pipeline_status`, `block_type` sequence, block count, edge count, high risk count가 유지되는 것을 핵심 일관성 기준으로 정의하였다. 이를 위해 `steering.md`에서 허용 `block_type`, 분류 우선순위, `block_id` 부여 규칙, edge 생성 규칙을 고정하였다.

**판정 기준:**
- 5회 모두 동일: 재현성 통과 ✅
- 1회라도 다름: 재현성 실패 ❌ → 분류 로직에 랜덤 요소 또는 외부 상태 의존성이 있는지 점검

---

## 7. 설계 자산 목록

| 파일 | 설명 |
|---|---|
| `.kiro/specs/python-code-visualizer/requirements.md` | 기능 요구사항, Acceptance Criteria(AC-01~AC-15), Failure Cases(FC-01~FC-08) |
| `.kiro/specs/python-code-visualizer/design.md` | 아키텍처, 데이터 모델, 분류 규칙, 컴포넌트 설계 |
| `.kiro/specs/python-code-visualizer/tasks.md` | Phase 1~10, 43개 구현 태스크, 완료 기준 포함 |
| `.kiro/steering/python-code-visualizer.md` | 전역 규칙, 허용 block_type, 분류 우선순위, 위험 규칙 |

---

## 8. 출력 데이터 구조 요약

분석 결과(`AnalysisResult`)는 다음 14개 필드를 포함한다.

| 필드 | 타입 | 설명 |
|---|---|---|
| `pipeline_status` | enum | `runtime_detected` \| `definition_only` \| `partial` \| `unknown` |
| `request_summary` | string | `user_request` 요약 |
| `runtime_pipeline` | `BlockNode[]` | 실행 역할 블록 목록 (순서 있음) |
| `pipeline_edges` | `PipelineEdge[]` | 블록 간 연결 관계 |
| `definition_inventory` | `DefinitionItem[]` | 정의만 있고 호출되지 않은 함수/클래스 |
| `absent_block_types` | `BlockType[]` | 허용 목록 중 코드에 나타나지 않은 타입 |
| `spec_gaps` | `SpecGap[]` | `user_request`와 코드 간 불일치 항목 |
| `risk_points` | `RiskPoint[]` | 위험 지점 목록 (유형, 위치, 설명) |
| `summary_short` | string | 한 문장 요약 |
| `summary_detailed` | string | 상세 요약 |
| `verification_checklist` | `CheckItem[]` | 검증 체크리스트 항목 |
| `consistency_check` | object | 스키마·ID·edge 유효성 검사 결과 |
| `confidence` | number | 분석 신뢰도 (0.0 ~ 1.0) |
| `human_review_needed` | boolean | 사람 검토 필요 여부 |
