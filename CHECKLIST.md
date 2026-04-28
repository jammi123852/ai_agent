# CHECKLIST — Python Code Visualizer 검증 기준

이 체크리스트는 requirements.md의 Acceptance Criteria(AC-01~AC-15)를 자동 판정 가능한 형태로 정리한 것이다.
각 항목은 분석 결과(`AnalysisResult`) 객체를 기준으로 판정한다.

---

## 1. Required Fields

분석 결과 객체에 다음 필드가 모두 존재해야 한다.

| # | 검증 항목 | 판정 기준 | 결과 |
|---|---|---|---|
| RF-01 | `pipeline_status` 필드가 존재한다 | `result.pipeline_status !== undefined` | |
| RF-02 | `request_summary` 필드가 존재한다 | `result.request_summary !== undefined` | |
| RF-03 | `runtime_pipeline` 필드가 존재한다 | `Array.isArray(result.runtime_pipeline)` | |
| RF-04 | `pipeline_edges` 필드가 존재한다 | `Array.isArray(result.pipeline_edges)` | |
| RF-05 | `definition_inventory` 필드가 존재한다 | `Array.isArray(result.definition_inventory)` | |
| RF-06 | `absent_block_types` 필드가 존재한다 | `Array.isArray(result.absent_block_types)` | |
| RF-07 | `spec_gaps` 필드가 존재한다 | `Array.isArray(result.spec_gaps)` | |
| RF-08 | `risk_points` 필드가 존재한다 | `Array.isArray(result.risk_points)` | |
| RF-09 | `summary_short` 필드가 존재한다 | `typeof result.summary_short === 'string'` | |
| RF-10 | `summary_detailed` 필드가 존재한다 | `typeof result.summary_detailed === 'string'` | |
| RF-11 | `verification_checklist` 필드가 존재한다 | `Array.isArray(result.verification_checklist)` | |
| RF-12 | `consistency_check` 필드가 존재한다 | `result.consistency_check !== undefined` | |
| RF-13 | `confidence` 필드가 존재한다 | `typeof result.confidence === 'number'` | |
| RF-14 | `human_review_needed` 필드가 존재한다 | `typeof result.human_review_needed === 'boolean'` | |

---

## 2. Enum Rules

열거형 값이 허용 목록 내에 있어야 한다.

| # | 검증 항목 | 판정 기준 | 결과 |
|---|---|---|---|
| EN-01 | `pipeline_status`는 허용 값 중 하나이다 | `['runtime_detected','definition_only','partial','unknown'].includes(result.pipeline_status)` | |
| EN-02 | 모든 블록의 `block_type`은 허용 목록 중 하나이다 | `runtime_pipeline`의 모든 블록이 14종 허용 목록 내 값을 가진다 | |
| EN-03 | 허용 목록 외 `block_type`이 존재하지 않는다 | 허용 목록: `SETUP`, `DEFINE_STRUCTURE`, `INPUT`, `LOAD`, `VALIDATE`, `TRANSFORM`, `CORE_LOGIC`, `MODEL_OR_ALGORITHM`, `OUTPUT`, `VISUALIZE`, `ERROR_HANDLING`, `DANGEROUS_OPERATION`, `UTILITY`, `UNKNOWN` | |
| EN-04 | `confidence`는 0 이상 1 이하이다 | `result.confidence >= 0 && result.confidence <= 1` | |
| EN-05 | 각 블록의 `risk_level`은 `low`, `medium`, `high` 중 하나이다 | `['low','medium','high'].includes(block.risk_level)` | |

---

## 3. Graph Rules

그래프 구조의 일관성을 검증한다.

| # | 검증 항목 | 판정 기준 | 결과 |
|---|---|---|---|
| GR-01 | `block_id`는 `B01`부터 순서대로 증가한다 | 첫 번째 블록 `block_id === 'B01'`, 이후 `B02`, `B03` 순서 | |
| GR-02 | `block_id`가 동일 결과 내에서 중복되지 않는다 | `new Set(ids).size === ids.length` | |
| GR-03 | `pipeline_edges`의 `from`이 존재하는 `block_id`를 참조한다 | 모든 edge의 `from`이 `runtime_pipeline`의 `block_id` 목록에 존재 | |
| GR-04 | `pipeline_edges`의 `to`가 존재하는 `block_id`를 참조한다 | 모든 edge의 `to`가 `runtime_pipeline`의 `block_id` 목록에 존재 | |
| GR-05 | `runtime_pipeline` 블록 수가 N이면 edge 수는 최소 N-1이다 | `pipeline_edges.length >= runtime_pipeline.length - 1` (N > 1인 경우) | |
| GR-06 | `absent_block_types`에 실제로 나타난 `block_type`이 포함되지 않는다 | `absent_block_types`와 `runtime_pipeline`의 `block_type` 집합이 교집합 없음 | |

---

## 4. Definition Rules

함수/클래스 정의 처리 규칙을 검증한다.

| # | 검증 항목 | 판정 기준 | 결과 |
|---|---|---|---|
| DF-01 | 함수 정의만 있고 호출부가 없으면 `pipeline_status=definition_only`이다 | Case 2 입력 기준: `result.pipeline_status === 'definition_only'` | |
| DF-02 | `definition_only`이면 `runtime_pipeline` 길이는 0이다 | `result.pipeline_status === 'definition_only'` → `result.runtime_pipeline.length === 0` | |
| DF-03 | 호출되지 않은 함수가 `runtime_pipeline`에 포함되지 않는다 | Case 2의 `clean_data`가 `runtime_pipeline`에 없어야 함 | |
| DF-04 | 호출되지 않은 함수가 `definition_inventory`에 기록된다 | Case 2의 `clean_data`가 `definition_inventory`에 존재해야 함 | |

---

## 5. Risk Rules

위험 동작 탐지 및 처리 규칙을 검증한다.

| # | 검증 항목 | 판정 기준 | 결과 |
|---|---|---|---|
| RK-01 | `os.remove`가 있으면 `DANGEROUS_OPERATION` 블록이 존재한다 | Case 5 기준: `runtime_pipeline`에 `block_type === 'DANGEROUS_OPERATION'`인 블록 존재 | |
| RK-02 | `DANGEROUS_OPERATION` 블록의 `risk_level`은 `high`이다 | `block.block_type === 'DANGEROUS_OPERATION'` → `block.risk_level === 'high'` | |
| RK-03 | `DANGEROUS_OPERATION` 블록은 독립 블록이다 | `DANGEROUS_OPERATION` 블록이 다른 `block_type`과 병합되지 않음 | |
| RK-04 | `high` risk가 1개 이상이면 `human_review_needed=true`이다 | `risk_points.some(r => r.risk_level === 'high')` → `result.human_review_needed === true` | |
| RK-05 | `confidence < 0.7`이면 `human_review_needed=true`이다 | `result.confidence < 0.7` → `result.human_review_needed === true` | |
| RK-06 | 각 `risk_points` 항목에 위험 유형, 코드 위치, 설명이 포함된다 | `risk_point.type`, `risk_point.location`, `risk_point.description`이 모두 존재 | |

---

## 6. Spec Gap Rules

요청-코드 불일치 탐지 규칙을 검증한다.

| # | 검증 항목 | 판정 기준 | 결과 |
|---|---|---|---|
| SG-01 | 불일치가 없으면 `spec_gaps`는 빈 배열이다 | Case 1 기준: `result.spec_gaps.length === 0` | |
| SG-02 | 불일치가 있으면 `spec_gaps`에 항목이 기록된다 | Case 4 기준: `result.spec_gaps.length > 0` | |
| SG-03 | `spec_gaps`의 `gap_type`은 허용 값 중 하나이다 | `['missing_requirement','extra_behavior','mismatch','unclear'].includes(gap.gap_type)` | |
| SG-04 | 요청에 없는 위험 동작이 있으면 `spec_gaps`에 `extra_behavior`가 기록된다 | Case 5 기준: `spec_gaps`에 `gap_type === 'extra_behavior'` 항목 존재 | |

---

## 7. Reproducibility Rules

동일 입력 5회 실행 시 결과 일관성을 검증한다.

| # | 검증 항목 | 판정 기준 | 결과 |
|---|---|---|---|
| RP-01 | 동일 입력 5회 실행 시 `pipeline_status`가 동일하다 | 5회 결과의 `pipeline_status`가 모두 동일한 값 | |
| RP-02 | 동일 입력 5회 실행 시 `block_type` sequence가 동일하다 | 5회 결과의 `block_type` 순서 배열이 모두 동일 | |
| RP-03 | 동일 입력 5회 실행 시 block count가 동일하다 | 5회 결과의 `runtime_pipeline.length`가 모두 동일 | |
| RP-04 | 동일 입력 5회 실행 시 edge count가 동일하다 | 5회 결과의 `pipeline_edges.length`가 모두 동일 | |
| RP-05 | 분석 결과에 랜덤 요소가 없다 | 분석 함수가 `Math.random()`, `Date.now()` 등 비결정적 요소를 사용하지 않음 | |
| RP-06 | 분석 결과가 외부 상태에 의존하지 않는다 | 분석 함수가 네트워크 요청, 파일 시스템 접근 없이 입력만으로 결과를 결정 | |

---

## 통합 판정 기준 (AC-01 ~ AC-15)

requirements.md의 Acceptance Criteria와 대응 관계:

| AC | 검증 항목 | 대응 체크리스트 항목 |
|---|---|---|
| AC-01 | `block_type`이 허용 목록 외 값을 가지는 블록이 존재하지 않는다 | EN-02, EN-03 |
| AC-02 | `block_id`가 `B01`부터 순서대로 증가한다 | GR-01 |
| AC-03 | `pipeline_status`가 허용 값 중 하나이다 | EN-01 |
| AC-04 | `DANGEROUS_OPERATION` 블록이 독립 블록으로 존재한다 | RK-03 |
| AC-05 | `high` risk 블록이 1개 이상일 때 `human_review_needed=true`이다 | RK-04 |
| AC-06 | 동일 입력 5회 실행 시 `block_type` 시퀀스가 동일하다 | RP-02 |
| AC-07 | 출력 객체에 필수 14개 필드가 모두 존재한다 | RF-01 ~ RF-14 |
| AC-08 | `confidence`가 0 이상 1 이하이다 | EN-04 |
| AC-09 | 호출되지 않은 함수가 `runtime_pipeline`에 포함되지 않는다 | DF-03 |
| AC-10 | `user_level`에 따라 적합한 수준의 설명이 표시된다 | (UI 수동 검증) |
| AC-11 | `generated_code`가 빈 문자열일 때 분석이 시작되지 않는다 | (UI 수동 검증) |
| AC-12 | `block_id`가 동일 결과 내에서 중복되지 않는다 | GR-02 |
| AC-13 | `absent_block_types`에 실제로 나타난 `block_type`이 포함되지 않는다 | GR-06 |
| AC-14 | `DANGEROUS_OPERATION` 노드가 그래프에서 시각적으로 구별된다 | (UI 수동 검증) |
| AC-15 | `human_review_needed=true`일 때 경고 배너가 표시된다 | (UI 수동 검증) |
