# Requirements Document: Python Code Visualizer

## 1. Introduction

Python Code Visualizer는 AI가 생성한 Python 코드 파일 1개를 기능 블록 그래프 형태로 시각화하는 React + TypeScript 웹 애플리케이션이다.

핵심 목적은 AI가 생성한 코드를 사람이 더 쉽게 이해하고 검증할 수 있도록 돕는 것이다. 코드를 실행하거나 수정하지 않고, 정적 분석(규칙 기반 파서 + 휴리스틱)만으로 코드의 실행 흐름을 파악하여 시각적 파이프라인으로 표현한다.

---

## 2. Problem / Bottleneck

| 문제 | 설명 |
|------|------|
| AI 생성 코드의 불투명성 | AI가 생성한 코드는 길고 복잡하여 사람이 전체 흐름을 파악하기 어렵다 |
| 검증 부담 | 코드 인수인계 시 수신자가 코드 전체를 처음부터 읽어야 한다 |
| 위험 동작 식별 어려움 | 파일 삭제, 외부 전송 등 위험 동작이 코드 중간에 숨어 있을 수 있다 |
| 수준별 이해 격차 | 초급자와 고급자가 같은 코드를 다른 수준으로 이해해야 한다 |

---

## 3. Scope

### 포함 범위 (In Scope)

- Python 코드 1개 파일의 정적 분석 및 시각화
- 규칙 기반 파서와 휴리스틱을 이용한 브라우저 내 분석 (외부 API 호출 없음)
- 기능 블록 그래프 UI (노드 + 엣지)
- 블록 클릭 시 상세 패널 표시
- 위험도 표시 및 human review 필요 여부 판단
- 사용자 수준(beginner / intermediate / advanced)별 설명 제공
- 향후 AI API 연결을 위한 분석 로직 분리 구조

### 제외 범위 (Out of Scope)

- 코드 자동 수정
- 코드 실행 또는 동적 분석
- 복수 파일 분석
- Python 이외 언어 지원
- 백엔드 서버 또는 외부 API 연동 (MVP 단계)

---

## 4. User Inputs

| 입력 필드 | 타입 | 필수 여부 | 설명 |
|-----------|------|-----------|------|
| `user_request` | string | 필수 | 사용자가 AI에게 원래 요청했던 내용 |
| `generated_code` | string | 필수 | AI가 생성한 Python 코드 전문 |
| `user_level` | enum | 필수 | `beginner` / `intermediate` / `advanced` 중 하나 |

### 입력 제약

- `generated_code`는 비어 있을 수 없다.
- `user_level`은 세 가지 값 중 정확히 하나여야 한다.
- `user_request`는 비어 있을 수 없다.

---

## 5. Functional Requirements

### Requirement 1: 입력 수집

**User Story:** 사용자로서, 분석할 코드와 맥락 정보를 입력하고 싶다. 그래야 시스템이 올바른 분석을 수행할 수 있다.

#### Acceptance Criteria

1. THE Visualizer SHALL `user_request`, `generated_code`, `user_level` 세 가지 입력 필드를 제공해야 한다.
2. WHEN `generated_code`가 비어 있는 상태에서 분석이 요청되면, THE Visualizer SHALL 오류 메시지를 표시하고 분석을 시작하지 않아야 한다.
3. WHEN `user_level`이 `beginner`, `intermediate`, `advanced` 이외의 값이면, THE Visualizer SHALL 해당 입력을 거부해야 한다.
4. THE Visualizer SHALL 입력 제출 전에 세 필드 모두 채워졌는지 검증해야 한다.

---

### Requirement 2: 코드 분석 및 파이프라인 생성

**User Story:** 사용자로서, 입력한 Python 코드가 자동으로 분석되어 실행 흐름 파이프라인으로 변환되기를 원한다.

#### Acceptance Criteria

1. WHEN 유효한 입력이 제출되면, THE Analyzer SHALL `generated_code`를 정적으로 분석하여 `runtime_pipeline`을 생성해야 한다.
2. THE Analyzer SHALL 코드에서 실제로 관찰되는 실행 동작만 블록으로 분류해야 한다. 코드에 없는 기능을 블록으로 만들어서는 안 된다.
3. THE Analyzer SHALL 함수 정의만 있고 호출부가 없는 함수는 `runtime_pipeline`에 포함하지 않고 `definition_inventory`에 기록해야 한다.
4. THE Analyzer SHALL 위험 동작(파일 삭제, 덮어쓰기, 외부 전송, 개인정보 처리)을 `DANGEROUS_OPERATION` 블록으로 독립 분리해야 한다.
5. THE Analyzer SHALL 외부 API를 호출하지 않고 브라우저 내에서만 분석을 수행해야 한다.
6. THE Analyzer SHALL 동일한 입력에 대해 항상 동일한 분석 결과를 반환해야 한다 (결정론적 동작).

---

### Requirement 3: 출력 데이터 구조 생성

**User Story:** 사용자로서, 분석 결과가 정해진 구조로 생성되기를 원한다. 그래야 UI가 일관되게 표시할 수 있다.

#### Acceptance Criteria

1. THE Analyzer SHALL 다음 필드를 모두 포함하는 출력 객체를 생성해야 한다:
   - `pipeline_status`
   - `request_summary`
   - `runtime_pipeline`
   - `pipeline_edges`
   - `definition_inventory`
   - `absent_block_types`
   - `spec_gaps`
   - `risk_points`
   - `summary_short`
   - `summary_detailed`
   - `verification_checklist`
   - `consistency_check`
   - `confidence`
   - `human_review_needed`
2. `pipeline_status`는 `runtime_detected`, `definition_only`, `partial`, `unknown` 중 하나여야 한다.
3. `human_review_needed`는 boolean 타입이어야 한다.
4. `confidence`는 0 이상 1 이하의 숫자여야 한다.

---

## 6. Block Classification Requirements

### Requirement 4: 블록 타입 제한

**User Story:** 사용자로서, 블록이 정해진 타입 목록 안에서만 분류되기를 원한다. 그래야 일관된 시각화가 가능하다.

#### Acceptance Criteria

1. THE Analyzer SHALL 각 블록의 `block_type`을 다음 허용 목록 중 하나로만 지정해야 한다:
   `SETUP`, `DEFINE_STRUCTURE`, `INPUT`, `LOAD`, `VALIDATE`, `TRANSFORM`, `CORE_LOGIC`, `MODEL_OR_ALGORITHM`, `OUTPUT`, `VISUALIZE`, `ERROR_HANDLING`, `DANGEROUS_OPERATION`, `UTILITY`, `UNKNOWN`
2. THE Analyzer SHALL 허용 목록에 없는 새로운 `block_type`을 생성해서는 안 된다.
3. THE Analyzer SHALL 전처리와 후처리를 모두 `TRANSFORM` 타입으로 분류해야 한다.
4. THE Analyzer SHALL 코드에 나타나지 않은 블록 타입을 `absent_block_types` 필드에 기록해야 한다.

---

### Requirement 5: 블록 ID 규칙

**User Story:** 사용자로서, 각 블록이 고유하고 순서가 있는 ID를 가지기를 원한다. 그래야 블록을 명확히 참조할 수 있다.

#### Acceptance Criteria

1. THE Analyzer SHALL 각 블록에 `B01`부터 시작하는 순차적 ID를 부여해야 한다.
2. THE Analyzer SHALL 블록 ID가 `B` + 2자리 숫자 형식(`B01`, `B02`, ..., `B99`)을 따르도록 해야 한다.
3. THE Analyzer SHALL 동일한 분석 결과 내에서 블록 ID가 중복되지 않도록 해야 한다.
4. THE Analyzer SHALL `runtime_pipeline` 내 블록 순서와 블록 ID 순서가 일치해야 한다.

---

### Requirement 6: 블록 분류 원칙

**User Story:** 사용자로서, 블록이 함수/클래스 단위가 아닌 실행 역할 단위로 분류되기를 원한다. 그래야 코드의 실제 동작 흐름을 파악할 수 있다.

#### Acceptance Criteria

1. THE Analyzer SHALL 블록을 함수별 또는 클래스별로 나누지 않고, 코드 실행 시 맡는 역할별로 분류해야 한다.
2. THE Analyzer SHALL 관련 함수를 각 블록의 `related_functions` 필드에 기록해야 한다.
3. THE Analyzer SHALL 관련 클래스를 각 블록의 `related_classes` 필드에 기록해야 한다.
4. THE Analyzer SHALL 호출되지 않은 함수와 클래스를 `definition_inventory`에 기록해야 한다.
5. THE Analyzer SHALL `DANGEROUS_OPERATION` 블록을 다른 블록과 독립적으로 분리해야 한다. 위험 동작을 다른 블록 타입과 혼합해서는 안 된다.

---

## 7. Graph Visualization Requirements

### Requirement 7: 그래프 레이아웃

**User Story:** 사용자로서, 분석 결과가 n8n과 같은 노드-엣지 그래프 형태로 표시되기를 원한다. 텍스트 목록이 아닌 시각적 파이프라인으로 흐름을 파악하고 싶다.

#### Acceptance Criteria

1. THE Graph SHALL `runtime_pipeline`의 각 블록을 하나의 노드로 표시해야 한다.
2. THE Graph SHALL `pipeline_edges`에 정의된 연결 관계에 따라 노드 사이에 방향성 있는 연결선(엣지)을 표시해야 한다.
3. THE Graph SHALL 노드와 엣지를 텍스트 목록이 아닌 2D 캔버스 또는 SVG 기반 그래프로 렌더링해야 한다.
4. THE Graph SHALL 실행 흐름의 방향(위→아래 또는 왼쪽→오른쪽)이 시각적으로 명확해야 한다.

---

### Requirement 8: 노드 표시

**User Story:** 사용자로서, 각 노드에서 블록의 핵심 정보를 한눈에 파악하고 싶다.

#### Acceptance Criteria

1. THE Graph SHALL 각 노드에 `block_id`, `block_type`, `label`을 표시해야 한다.
2. THE Graph SHALL `risk_level`이 `high`인 블록의 노드를 다른 노드와 시각적으로 구별되게 표시해야 한다 (예: 빨간색 테두리, 경고 아이콘).
3. THE Graph SHALL `DANGEROUS_OPERATION` 타입의 노드를 다른 타입과 시각적으로 구별되게 표시해야 한다.
4. THE Graph SHALL 각 `block_type`에 대해 일관된 색상 또는 아이콘을 사용해야 한다.

---

### Requirement 9: 그래프 인터랙션

**User Story:** 사용자로서, 그래프를 탐색하고 원하는 블록을 클릭하여 상세 정보를 볼 수 있기를 원한다.

#### Acceptance Criteria

1. WHEN 사용자가 노드를 클릭하면, THE Graph SHALL 해당 블록의 상세 정보를 오른쪽 패널에 표시해야 한다.
2. THE Graph SHALL 그래프 영역에서 드래그를 통한 패닝(panning)을 지원해야 한다.
3. THE Graph SHALL 마우스 휠 또는 핀치 제스처를 통한 줌인/줌아웃을 지원해야 한다.
4. WHEN 노드에 마우스를 올리면, THE Graph SHALL 해당 노드를 시각적으로 강조(highlight)해야 한다.

---

## 8. Detail Panel Requirements

### Requirement 10: 블록 상세 패널

**User Story:** 사용자로서, 블록을 클릭했을 때 해당 블록의 역할, 입출력, 코드, 위험도 등 상세 정보를 오른쪽 패널에서 확인하고 싶다.

#### Acceptance Criteria

1. THE DetailPanel SHALL 선택된 블록의 다음 정보를 표시해야 한다:
   - 역할 설명 (`role`)
   - 입력값 (`inputs`)
   - 출력값 (`outputs`)
   - 관련 함수 (`related_functions`)
   - 관련 클래스 (`related_classes`)
   - 핵심 코드 조각 (`code_snippet`)
   - 위험도 (`risk_level`)
   - 사용자 수준별 설명
2. THE DetailPanel SHALL `user_level`에 따라 적합한 수준의 설명을 표시해야 한다:
   - `beginner`: 비전문가도 이해할 수 있는 쉬운 설명
   - `intermediate`: 기본 프로그래밍 지식을 가진 사용자를 위한 설명
   - `advanced`: 기술적 세부 사항을 포함한 전문가 수준 설명
3. THE DetailPanel SHALL `risk_level`이 `high`인 블록에 대해 경고 메시지를 표시해야 한다.
4. WHEN 선택된 블록이 없으면, THE DetailPanel SHALL 안내 메시지를 표시해야 한다.
5. THE DetailPanel SHALL `code_snippet`을 구문 강조(syntax highlighting)와 함께 표시해야 한다.

---

## 9. Summary and Checklist Requirements

### Requirement 11: 요약 및 검증 체크리스트

**User Story:** 사용자로서, 분석 결과의 전체 요약과 검증 체크리스트를 확인하고 싶다. 그래야 코드 인수인계 시 빠르게 검토할 수 있다.

#### Acceptance Criteria

1. THE Visualizer SHALL `summary_short`를 그래프 상단 또는 별도 영역에 표시해야 한다.
2. THE Visualizer SHALL `verification_checklist`의 각 항목을 체크 가능한 목록으로 표시해야 한다.
3. THE Visualizer SHALL `consistency_check` 결과를 표시해야 한다.
4. THE Visualizer SHALL `confidence` 값을 시각적 지표(예: 퍼센트, 게이지)로 표시해야 한다.
5. WHEN `human_review_needed`가 `true`이면, THE Visualizer SHALL 눈에 띄는 경고 배너를 표시해야 한다.

---

## 10. Risk and Spec Gap Requirements

### Requirement 12: 위험도 분류

**User Story:** 사용자로서, 코드 내 위험 동작이 명확히 식별되고 강조 표시되기를 원한다.

#### Acceptance Criteria

1. THE Analyzer SHALL 다음 동작을 `high` 위험도로 분류해야 한다:
   - 파일 삭제 (예: `os.remove`, `shutil.rmtree`)
   - 파일 덮어쓰기 (예: `open(..., 'w')` 후 기존 파일 경로 사용)
   - 외부 데이터 전송 (예: `requests.post`, `socket.send`)
   - 개인정보 처리 (예: 이메일, 전화번호, 주민번호 패턴 처리)
2. WHEN `risk_level`이 `high`인 블록이 1개 이상 존재하면, THE Analyzer SHALL `human_review_needed`를 `true`로 설정해야 한다.
3. THE Analyzer SHALL 각 위험 지점을 `risk_points` 필드에 기록해야 한다. 각 항목은 위험 유형, 관련 코드 위치, 설명을 포함해야 한다.
4. THE Analyzer SHALL `DANGEROUS_OPERATION` 블록을 `runtime_pipeline` 내 독립 블록으로 분리해야 한다.

---

### Requirement 13: Spec Gap 탐지

**User Story:** 사용자로서, 원래 요청(`user_request`)과 생성된 코드 사이의 불일치를 파악하고 싶다.

#### Acceptance Criteria

1. THE Analyzer SHALL `user_request`와 `generated_code`를 비교하여 누락되거나 불일치하는 항목을 `spec_gaps` 필드에 기록해야 한다.
2. THE Visualizer SHALL `spec_gaps`가 존재하면 해당 내용을 사용자에게 표시해야 한다.
3. THE Analyzer SHALL `spec_gaps`가 없을 경우 빈 배열(`[]`)을 반환해야 한다.

---

## 11. Reproducibility Requirements

### Requirement 14: 결정론적 분석

**User Story:** 사용자로서, 동일한 입력을 여러 번 분석해도 항상 같은 결과가 나오기를 원한다. 그래야 결과를 신뢰하고 공유할 수 있다.

#### Acceptance Criteria

1. THE Analyzer SHALL 동일한 `(user_request, generated_code, user_level)` 입력에 대해 항상 동일한 `runtime_pipeline`의 `block_type` 시퀀스를 반환해야 한다.
2. THE Analyzer SHALL 동일한 입력을 5회 연속 실행했을 때 `block_type` 시퀀스가 모두 동일해야 한다.
3. THE Analyzer SHALL 분석 결과에 랜덤 요소나 타임스탬프 기반 변동을 포함해서는 안 된다.
4. THE Analyzer SHALL 외부 상태(네트워크, 파일 시스템)에 의존하지 않고 입력만으로 결과를 결정해야 한다.

---

## 12. Acceptance Criteria (통합 검증 기준)

아래 기준은 자동 검증 가능한 형태로 작성되었다.

| # | 검증 항목 | 기대 결과 |
|---|-----------|-----------|
| AC-01 | `block_type`이 허용 목록 외 값을 가지는 블록이 존재하는가 | 존재하면 안 됨 |
| AC-02 | `block_id`가 `B01`부터 순서대로 증가하는가 | `B01`, `B02`, ... 순서여야 함 |
| AC-03 | `pipeline_status`가 허용 값 중 하나인가 | `runtime_detected`, `definition_only`, `partial`, `unknown` 중 하나 |
| AC-04 | `DANGEROUS_OPERATION` 블록이 독립 블록으로 존재하는가 | 다른 블록 타입과 혼합되지 않아야 함 |
| AC-05 | `high` risk 블록이 1개 이상일 때 `human_review_needed`가 `true`인가 | `true`여야 함 |
| AC-06 | 동일 입력 5회 실행 시 `block_type` 시퀀스가 동일한가 | 5회 모두 동일해야 함 |
| AC-07 | 출력 객체에 필수 13개 필드가 모두 존재하는가 | 누락 필드 없어야 함 |
| AC-08 | `confidence`가 0 이상 1 이하인가 | `0 <= confidence <= 1` |
| AC-09 | 호출되지 않은 함수가 `runtime_pipeline`에 포함되는가 | 포함되면 안 됨 |
| AC-10 | `user_level`이 `beginner`일 때 상세 패널 설명이 쉬운 언어로 표시되는가 | 전문 용어 최소화 |
| AC-11 | `generated_code`가 빈 문자열일 때 분석이 시작되는가 | 시작되면 안 됨 |
| AC-12 | `block_id`가 동일 결과 내에서 중복되는가 | 중복되면 안 됨 |
| AC-13 | `absent_block_types`에 코드에 실제로 나타난 블록 타입이 포함되는가 | 포함되면 안 됨 |
| AC-14 | `DANGEROUS_OPERATION` 노드가 그래프에서 시각적으로 구별되는가 | 구별되어야 함 |
| AC-15 | `human_review_needed`가 `true`일 때 경고 배너가 표시되는가 | 표시되어야 함 |

---

## 13. Failure Cases

아래는 시스템이 올바르게 처리해야 하는 실패 시나리오다.

### FC-01: 빈 코드 입력
- **상황**: `generated_code`가 빈 문자열 또는 공백만 포함
- **기대 동작**: 분석을 시작하지 않고 "코드를 입력해 주세요" 오류 메시지 표시

### FC-02: Python이 아닌 코드 입력
- **상황**: JavaScript, Java 등 Python이 아닌 코드가 입력됨
- **기대 동작**: `pipeline_status`를 `unknown`으로 설정하고, `spec_gaps`에 언어 불일치 기록

### FC-03: 함수 정의만 있고 호출부 없는 코드
- **상황**: 모든 함수가 정의되어 있지만 어디서도 호출되지 않음
- **기대 동작**: `pipeline_status`를 `definition_only`로 설정, `runtime_pipeline`은 비어 있음, 모든 함수는 `definition_inventory`에 기록

### FC-04: 위험 동작이 포함된 코드
- **상황**: `os.remove()` 또는 `requests.post()` 등 위험 동작 포함
- **기대 동작**: `DANGEROUS_OPERATION` 블록 생성, `risk_level`을 `high`로 설정, `human_review_needed`를 `true`로 설정

### FC-05: 매우 짧은 코드 (1~3줄)
- **상황**: `print("Hello")` 같은 단순 코드
- **기대 동작**: 분석 가능한 블록만 생성, 없는 기능을 억지로 블록으로 만들지 않음

### FC-06: 매우 긴 코드 (1000줄 이상)
- **상황**: 대용량 Python 파일 입력
- **기대 동작**: 분석이 완료되어야 하며, UI가 응답 불능 상태가 되어서는 안 됨. 처리 중 로딩 인디케이터 표시

### FC-07: `user_request`와 코드가 완전히 불일치
- **상황**: "이미지 분류기를 만들어줘"라고 요청했지만 코드는 CSV 파싱 코드
- **기대 동작**: `spec_gaps`에 불일치 항목 기록, `consistency_check`에 낮은 일치도 표시

### FC-08: 잘못된 `user_level` 값
- **상황**: `user_level`에 `expert` 또는 `pro` 같은 허용되지 않은 값 입력
- **기대 동작**: 입력 검증 실패 메시지 표시, 분석 시작 안 함

---

## Glossary

| 용어 | 정의 |
|------|------|
| **Visualizer** | 본 시스템 전체를 지칭하는 이름 |
| **Analyzer** | 코드를 정적 분석하여 파이프라인 데이터를 생성하는 분석 모듈 |
| **Graph** | 노드와 엣지로 구성된 시각적 파이프라인 UI 컴포넌트 |
| **DetailPanel** | 선택된 블록의 상세 정보를 표시하는 오른쪽 패널 컴포넌트 |
| **runtime_pipeline** | 코드 실행 시 실제로 동작하는 블록들의 순서 있는 목록 |
| **pipeline_edges** | 블록 간 실행 흐름 연결 관계 목록 |
| **definition_inventory** | 정의되었지만 호출되지 않은 함수/클래스 목록 |
| **block_type** | 블록의 역할 분류 (허용 목록 14종) |
| **block_id** | 블록의 고유 식별자 (`B01` 형식) |
| **risk_level** | 블록의 위험도 (`low`, `medium`, `high`) |
| **human_review_needed** | 사람의 검토가 필요한지 여부 (boolean) |
| **spec_gaps** | `user_request`와 `generated_code` 사이의 불일치 항목 |
| **absent_block_types** | 허용 목록 중 현재 코드에 나타나지 않은 블록 타입 목록 |
| **confidence** | 분석 결과의 신뢰도 (0.0 ~ 1.0) |
| **user_level** | 사용자의 기술 수준 (`beginner`, `intermediate`, `advanced`) |
