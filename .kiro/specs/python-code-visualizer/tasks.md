# Tasks: Python Code Visualizer

## Phase 1. Project Structure

- [ ] 1.1 현재 React + TypeScript 프로젝트 구조 확인
  - `package.json`, `tsconfig.json`, `vite.config.ts` 파일이 존재하는지 확인한다.
  - `src/` 폴더 아래 기존 파일 목록을 파악한다.
  - 완료 기준: 프로젝트 루트에서 `npm run build`가 오류 없이 통과한다.

- [ ] 1.2 `src/types.ts` 파일 생성
  - Phase 2에서 정의할 모든 타입을 이 파일에 집중 관리한다.
  - 완료 기준: `src/types.ts` 파일이 존재하고 TypeScript 컴파일 오류가 없다.

- [ ] 1.3 `src/analyzer/` 폴더 생성
  - 분석 모듈 파일들을 이 폴더에 배치한다.
  - `src/analyzer/index.ts` 진입점 파일을 생성한다.
  - 완료 기준: `src/analyzer/index.ts`가 존재하고 빈 export 구조를 가진다.

- [ ] 1.4 `src/components/` 폴더 생성
  - UI 컴포넌트 파일들을 이 폴더에 배치한다.
  - 완료 기준: `src/components/` 폴더가 존재한다.

---

## Phase 2. Data Types

- [ ] 2.1 `BlockType` enum 작성
  - `src/types.ts`에 다음 14종만 포함한다:
    `SETUP`, `DEFINE_STRUCTURE`, `INPUT`, `LOAD`, `VALIDATE`, `TRANSFORM`,
    `CORE_LOGIC`, `MODEL_OR_ALGORITHM`, `OUTPUT`, `VISUALIZE`,
    `ERROR_HANDLING`, `DANGEROUS_OPERATION`, `UTILITY`, `UNKNOWN`
  - 완료 기준: 허용 목록 외 값이 없고, TypeScript enum으로 선언되어 있다.

- [ ] 2.2 `PipelineStatus` enum 작성
  - `src/types.ts`에 다음 4종만 포함한다:
    `runtime_detected`, `definition_only`, `partial`, `unknown`
  - 완료 기준: 4종 외 값이 없고, TypeScript enum으로 선언되어 있다.

- [ ] 2.3 `BlockNode` 타입 작성
  - `src/types.ts`에 다음 필드를 포함한다:
    - `block_id: string` — `B01` 형식
    - `block_type: BlockType`
    - `block_name: string`
    - `role: string`
    - `input: string[]`
    - `output: string[]`
    - `related_functions: string[]`
    - `related_classes: string[]`
    - `code_evidence: string`
    - `risk_level: 'low' | 'medium' | 'high'`
    - `explanation: Record<'beginner' | 'intermediate' | 'advanced', string>`
  - 완료 기준: 모든 필드가 선언되어 있고 TypeScript 컴파일 오류가 없다.

- [ ] 2.4 `PipelineEdge` 타입 작성
  - `src/types.ts`에 다음 필드를 포함한다:
    - `from: string` — 존재하는 `block_id` 참조
    - `to: string` — 존재하는 `block_id` 참조
    - `reason: string`
  - 완료 기준: 모든 필드가 선언되어 있고 TypeScript 컴파일 오류가 없다.

- [ ] 2.5 `AnalysisResult` 타입 작성
  - `src/types.ts`에 다음 14개 필드를 모두 포함한다:
    - `pipeline_status: PipelineStatus`
    - `request_summary: string`
    - `runtime_pipeline: BlockNode[]`
    - `pipeline_edges: PipelineEdge[]`
    - `definition_inventory: DefinitionItem[]`
    - `absent_block_types: BlockType[]`
    - `spec_gaps: SpecGap[]`
    - `risk_points: RiskPoint[]`
    - `summary_short: string`
    - `summary_detailed: string`
    - `verification_checklist: CheckItem[]`
    - `consistency_check: ConsistencyCheck`
    - `confidence: number` — 0.0 ~ 1.0
    - `human_review_needed: boolean`
  - 보조 타입 `DefinitionItem`, `SpecGap`, `RiskPoint`, `CheckItem`, `ConsistencyCheck`도 함께 정의한다.
  - 완료 기준: 14개 필드가 모두 존재하고 TypeScript 컴파일 오류가 없다.

---

## Phase 3. Input UI

- [ ] 3.1 `user_request` 입력창 구현
  - `src/components/InputPanel.tsx`를 생성한다.
  - `<textarea>` 또는 `<input>` 으로 구현하며 placeholder를 포함한다.
  - 완료 기준: 입력값이 상태로 관리되고 빈 값 제출 시 오류 메시지가 표시된다.

- [ ] 3.2 `generated_code` 입력창 구현
  - 여러 줄 입력이 가능한 `<textarea>`로 구현한다.
  - 완료 기준: 입력값이 상태로 관리되고 빈 값 제출 시 오류 메시지가 표시된다.

- [ ] 3.3 `user_level` 선택 구현
  - `<select>` 또는 라디오 버튼으로 `beginner`, `intermediate`, `advanced` 세 가지 옵션을 제공한다.
  - 기본값은 `beginner`로 설정한다.
  - 완료 기준: 세 가지 값 중 하나만 선택 가능하고 선택값이 상태로 관리된다.

- [ ] 3.4 `analyze` 버튼 구현
  - 버튼 클릭 시 세 필드 모두 채워졌는지 검증한다.
  - 검증 실패 시 오류 메시지를 표시하고 분석을 시작하지 않는다.
  - 검증 통과 시 Analyzer Core를 호출하고 로딩 상태를 표시한다.
  - 완료 기준: 빈 필드가 있을 때 분석이 시작되지 않고, 모든 필드가 채워졌을 때 분석이 시작된다.

---

## Phase 4. Analyzer Core

- [ ] 4.1 `requestParser` 구현
  - 파일: `src/analyzer/requestParser.ts`
  - `user_request` 문자열에서 `goal`, `must_have`, `must_not_have` 키워드를 추출한다.
  - 완료 기준: 입력 문자열에서 핵심 키워드 목록을 반환하고 동일 입력에 동일 결과를 반환한다.

- [ ] 4.2 `codeObserver` 구현
  - 파일: `src/analyzer/codeObserver.ts`
  - 코드를 줄 단위로 읽어 각 줄의 패턴(import, def, class, call, assignment 등)을 식별한다.
  - 완료 기준: 각 줄에 대해 패턴 태그가 부여된 배열을 반환한다.

- [ ] 4.3 `operationUnitExtractor` 구현
  - 파일: `src/analyzer/operationUnitExtractor.ts`
  - `codeObserver` 결과를 받아 연속된 관련 줄들을 하나의 operation unit으로 묶는다.
  - 함수 정의(`def`)와 클래스 정의(`class`)는 별도 definition unit으로 분리한다.
  - 완료 기준: operation unit 목록과 definition unit 목록이 분리되어 반환된다.

- [ ] 4.4 `blockClassifier` 구현
  - 파일: `src/analyzer/blockClassifier.ts`
  - 각 operation unit에 대해 steering.md의 분류 우선순위에 따라 `block_type`을 결정한다.
  - 분류 규칙:
    - `import`, 경로 문자열, 상수 → `SETUP`
    - `class`, `dataclass` 정의 → `DEFINE_STRUCTURE`
    - `input()`, `argparse` → `INPUT`
    - `read_csv`, `json.load`, `open(..., "r")` → `LOAD`
    - `os.path.exists`, 컬럼/값 존재 확인 → `VALIDATE`
    - `dropna`, `fillna`, `resize`, `normalize`, `strip`, `lower`, `replace` → `TRANSFORM`
    - `fit`, `predict`, `train`, `inference`, `bfs`, `dfs`, `dijkstra` → `MODEL_OR_ALGORITHM`
    - `mean`, `sum`, `count`, `calculate`, `classify`, `match` → `CORE_LOGIC`
    - `print`, `return`, `to_csv`, `save`, `write` → `OUTPUT`
    - `plot`, `imshow`, `show` → `VISUALIZE`
    - `try`, `except` → `ERROR_HANDLING`
    - `os.remove`, `shutil.rmtree`, `delete`, `requests.post` → `DANGEROUS_OPERATION`
    - 판단 불가 → `UNKNOWN`
  - 완료 기준: 허용 목록 외 `block_type`이 반환되지 않고, 동일 입력에 동일 결과를 반환한다.

- [ ] 4.5 `blockMerger` 구현
  - 파일: `src/analyzer/blockMerger.ts`
  - 연속된 동일 `block_type` 블록을 하나로 병합한다.
  - `DANGEROUS_OPERATION`은 병합하지 않는다.
  - 완료 기준: 연속된 동일 타입이 하나로 줄어들고, `DANGEROUS_OPERATION`은 독립 블록으로 유지된다.

- [ ] 4.6 `pipelineBuilder` 구현
  - 파일: `src/analyzer/pipelineBuilder.ts`
  - 병합된 블록 목록에 `B01`, `B02`, ... 형식으로 `block_id`를 순차 부여한다.
  - 인접 블록 사이에 `pipeline_edges`를 생성한다.
  - `pipeline_edges`의 `from`/`to`는 반드시 존재하는 `block_id`를 참조해야 한다.
  - 완료 기준: `block_id`가 `B01`부터 순서대로 증가하고, 모든 edge가 유효한 `block_id`를 참조한다.

- [ ] 4.7 `definitionInventoryBuilder` 구현
  - 파일: `src/analyzer/definitionInventoryBuilder.ts`
  - 정의만 있고 호출부가 없는 함수와 클래스를 `definition_inventory`에 기록한다.
  - 호출 여부는 코드 내 함수명 등장 여부로 판단한다.
  - 완료 기준: 호출되지 않은 함수/클래스가 `definition_inventory`에 기록되고, `runtime_pipeline`에는 포함되지 않는다.

- [ ] 4.8 `specGapDetector` 구현
  - 파일: `src/analyzer/specGapDetector.ts`
  - `requestParser` 결과와 `runtime_pipeline`의 `block_type` 목록을 비교한다.
  - 요청에 있지만 코드에 없는 기능, 코드에 있지만 요청에 없는 기능을 `spec_gaps`에 기록한다.
  - `gap_type`은 `missing_requirement`, `extra_behavior`, `mismatch`, `unclear` 중 하나를 사용한다.
  - 완료 기준: 불일치 항목이 `spec_gaps`에 기록되고, 불일치가 없으면 빈 배열을 반환한다.

- [ ] 4.9 `riskDetector` 구현
  - 파일: `src/analyzer/riskDetector.ts`
  - 다음 패턴을 `high` risk로 탐지한다:
    - `os.remove`, `shutil.rmtree`, 파일/폴더 삭제
    - `requests.post`, `socket.send`, 외부 데이터 전송
    - 이메일, 전화번호, 주민번호 패턴 처리
  - 파일 저장(`open(..., 'w')`)은 `medium` risk로 기록하고 `risk_points`에 덮어쓰기 가능성을 명시한다.
  - `high` risk가 1개 이상이면 `human_review_needed=true`로 설정한다.
  - `confidence < 0.7`이면 `human_review_needed=true`로 설정한다.
  - 완료 기준: `high` risk 블록이 존재할 때 `human_review_needed`가 `true`이고, `risk_points`에 위험 유형·위치·설명이 기록된다.

- [ ] 4.10 `consistencyChecker` 구현
  - 파일: `src/analyzer/consistencyChecker.ts`
  - 다음 항목을 검증한다:
    - `block_type`이 허용 목록 내 값인지
    - `block_id`가 `B01`부터 순서대로 증가하는지
    - `pipeline_status`가 허용 값 중 하나인지
    - `pipeline_edges`의 `from`/`to`가 존재하는 `block_id`를 참조하는지
    - `confidence`가 0 이상 1 이하인지
  - 검증 결과를 `consistency_check` 객체에 기록한다.
  - 완료 기준: 각 검증 항목의 통과/실패 여부가 `consistency_check`에 기록된다.

---

## Phase 5. Graph UI

- [ ] 5.1 `BlockNodeCard` 컴포넌트 구현
  - 파일: `src/components/BlockNodeCard.tsx`
  - `block_id`, `block_type`, `block_name`을 카드 형태로 표시한다.
  - `risk_level`이 `high`이면 빨간색 계열 테두리와 경고 아이콘을 표시한다.
  - 선택된 노드는 강조 테두리 또는 그림자로 구별한다.
  - 완료 기준: 각 `block_type`에 일관된 색상이 적용되고, `high` risk 노드가 시각적으로 구별된다.

- [ ] 5.2 `GraphView` 컴포넌트 구현
  - 파일: `src/components/GraphView.tsx`
  - `runtime_pipeline`의 각 블록을 `BlockNodeCard`로 렌더링한다.
  - 노드는 왼쪽에서 오른쪽으로 흐르는 레이아웃을 기본으로 한다.
  - SVG 또는 절대 위치 기반으로 노드 위치를 계산한다.
  - 완료 기준: `runtime_pipeline`의 모든 블록이 노드로 표시되고, 텍스트 목록이 아닌 2D 그래프로 렌더링된다.

- [ ] 5.3 노드 연결선 구현
  - `pipeline_edges`를 SVG `<line>` 또는 `<path>`로 렌더링한다.
  - 연결선에 방향을 나타내는 화살표를 표시한다.
  - 완료 기준: 모든 edge가 연결선으로 표시되고, 방향이 시각적으로 명확하다.

- [ ] 5.4 `block_type`별 색상 적용
  - 14종 `block_type` 각각에 고유한 배경색 또는 테두리 색상을 지정한다.
  - 색상 맵을 상수 파일(`src/constants/blockTypeColors.ts`)로 분리한다.
  - 완료 기준: 동일 `block_type`은 항상 동일한 색상으로 표시된다.

- [ ] 5.5 `high` risk 강조 적용
  - `risk_level === 'high'`인 노드에 빨간색 계열 배경 또는 테두리를 적용한다.
  - `DANGEROUS_OPERATION` 타입 노드에 경고 아이콘(⚠️ 또는 SVG)을 표시한다.
  - 완료 기준: `high` risk 노드가 다른 노드와 시각적으로 명확히 구별된다.

- [ ] 5.6 노드 클릭 이벤트 구현
  - 노드 클릭 시 해당 `BlockNode`를 선택 상태로 설정한다.
  - 선택된 노드 정보를 `DetailPanel`에 전달한다.
  - 노드에 마우스를 올리면 강조 효과를 적용한다.
  - 완료 기준: 노드 클릭 시 `DetailPanel`이 해당 블록 정보로 업데이트된다.

---

## Phase 6. Detail Panel

- [ ] 6.1 `DetailPanel` 컴포넌트 구현
  - 파일: `src/components/DetailPanel.tsx`
  - 선택된 블록이 없을 때 안내 메시지를 표시한다.
  - 완료 기준: 컴포넌트가 렌더링되고 선택 전 상태에서 안내 메시지가 표시된다.

- [ ] 6.2 선택된 블록 정보 표시
  - 다음 필드를 표시한다:
    - `block_id`, `block_type`, `block_name`
    - `role`
    - `input`, `output`
    - `related_functions`, `related_classes`
    - `code_evidence` (구문 강조 포함)
    - `risk_level`
  - `code_evidence`는 `<pre>` 또는 코드 블록 스타일로 표시한다.
  - 완료 기준: 노드 클릭 시 위 모든 필드가 패널에 표시된다.

- [ ] 6.3 사용자 수준별 설명 표시
  - `user_level`에 따라 `explanation` 객체에서 해당 수준의 설명을 선택하여 표시한다:
    - `beginner`: 비전문가도 이해할 수 있는 쉬운 설명
    - `intermediate`: 함수와 변수 흐름 중심 설명
    - `advanced`: 구조적 역할, 위험도, 설계 함의 포함 설명
  - 완료 기준: `user_level` 변경 시 설명 텍스트가 즉시 업데이트된다.

- [ ] 6.4 관련 `spec_gaps`와 `risk_points` 표시
  - 선택된 블록과 관련된 `spec_gaps` 항목을 패널 하단에 표시한다.
  - 선택된 블록과 관련된 `risk_points` 항목을 패널 하단에 표시한다.
  - `risk_level === 'high'`이면 경고 메시지를 표시한다.
  - 완료 기준: 관련 spec_gaps와 risk_points가 패널에 표시되고, high risk 경고가 표시된다.

---

## Phase 7. Summary Panel

- [ ] 7.1 `SummaryPanel` 컴포넌트 구현
  - 파일: `src/components/SummaryPanel.tsx`
  - 완료 기준: 컴포넌트가 렌더링되고 `AnalysisResult`를 props로 받는다.

- [ ] 7.2 `summary_short` 및 `summary_detailed` 표시
  - `summary_short`를 패널 상단에 굵은 텍스트로 표시한다.
  - `summary_detailed`를 접을 수 있는 섹션(accordion 또는 toggle)으로 표시한다.
  - 완료 기준: 두 요약 텍스트가 표시되고 `summary_detailed`는 토글 가능하다.

- [ ] 7.3 `verification_checklist` 표시
  - 각 항목을 체크박스 형식으로 표시한다.
  - 완료 기준: 모든 체크리스트 항목이 체크박스 목록으로 표시된다.

- [ ] 7.4 `human_review_needed` 표시
  - `human_review_needed === true`이면 눈에 띄는 경고 배너를 패널 상단에 표시한다.
  - `confidence` 값을 퍼센트 또는 게이지 형태로 표시한다.
  - `pipeline_status`를 레이블로 표시한다.
  - 완료 기준: `human_review_needed=true`일 때 경고 배너가 표시되고, `confidence`가 시각적 지표로 표시된다.

---

## Phase 8. Test Inputs

- [ ] 8.1 `test-input/case-1-runtime-basic.md` 작성
  - 내용: import, 데이터 로드, 변환, 출력이 포함된 기본 Python 코드
  - 예상 결과: `pipeline_status=runtime_detected`, 최소 4개 블록
  - 완료 기준: 파일이 존재하고 user_request, generated_code, user_level, expected_blocks가 명시되어 있다.

- [ ] 8.2 `test-input/case-2-definition-only.md` 작성
  - 내용: 함수 정의만 있고 호출부가 없는 Python 코드
  - 예상 결과: `pipeline_status=definition_only`, `runtime_pipeline=[]`
  - 완료 기준: 파일이 존재하고 예상 결과가 명시되어 있다.

- [ ] 8.3 `test-input/case-3-class-methods.md` 작성
  - 내용: 클래스와 메서드가 정의되고 일부만 호출되는 Python 코드
  - 예상 결과: 호출된 메서드만 `runtime_pipeline`에 포함, 미호출 메서드는 `definition_inventory`에 기록
  - 완료 기준: 파일이 존재하고 예상 결과가 명시되어 있다.

- [ ] 8.4 `test-input/case-4-request-code-mismatch.md` 작성
  - 내용: user_request와 generated_code가 불일치하는 케이스
  - 예상 결과: `spec_gaps`에 불일치 항목 기록, `consistency_check`에 낮은 일치도
  - 완료 기준: 파일이 존재하고 예상 결과가 명시되어 있다.

- [ ] 8.5 `test-input/case-5-dangerous-operation.md` 작성
  - 내용: `os.remove()` 또는 `requests.post()` 등 위험 동작이 포함된 Python 코드
  - 예상 결과: `DANGEROUS_OPERATION` 블록 생성, `human_review_needed=true`
  - 완료 기준: 파일이 존재하고 예상 결과가 명시되어 있다.

---

## Phase 9. Reproducibility Test

- [ ] 9.1 동일 입력 5회 실행 기준 정의
  - `test-input/` 케이스 중 하나를 선택하여 5회 연속 분석을 수행한다.
  - 완료 기준: 5회 실행 결과를 기록할 수 있는 비교 표 형식이 정의되어 있다.

- [ ] 9.2 `pipeline_status` 비교
  - 5회 실행 결과의 `pipeline_status`가 모두 동일한지 확인한다.
  - 완료 기준: 5회 모두 동일한 `pipeline_status` 값이 반환된다.

- [ ] 9.3 `block_type` sequence 비교
  - 5회 실행 결과의 `block_type` 순서가 모두 동일한지 확인한다.
  - 완료 기준: 5회 모두 동일한 `block_type` 시퀀스가 반환된다.

- [ ] 9.4 block count 비교
  - 5회 실행 결과의 `runtime_pipeline` 블록 수가 모두 동일한지 확인한다.
  - 완료 기준: 5회 모두 동일한 블록 수가 반환된다.

- [ ] 9.5 edge count 비교
  - 5회 실행 결과의 `pipeline_edges` 수가 모두 동일한지 확인한다.
  - 완료 기준: 5회 모두 동일한 edge 수가 반환된다.

---

## Phase 10. Submission Documents

- [ ] 10.1 `README.md` 작성
  - 앱의 목적, 실행 방법(`npm install`, `npm run dev`), 입력 방법을 설명한다.
  - 허용 `block_type` 목록과 분류 우선순위를 포함한다.
  - 완료 기준: `README.md`가 존재하고 앱 목적, 실행 방법, 입력 방법이 명시되어 있다.

- [ ] 10.2 `CHECKLIST.md` 작성
  - requirements.md의 Acceptance Criteria(AC-01 ~ AC-15)를 체크리스트 형식으로 옮긴다.
  - 각 항목에 통과/실패 여부를 기록할 수 있는 칸을 포함한다.
  - 완료 기준: AC-01 ~ AC-15가 모두 포함되고 각 항목에 결과 기록 칸이 있다.

- [ ] 10.3 5회 일관성 테스트 결과 표 작성
  - `CHECKLIST.md` 또는 별도 파일에 다음 형식의 표를 포함한다:

    | 실행 | pipeline_status | block_type sequence | block count | edge count |
    |------|----------------|---------------------|-------------|------------|
    | 1회  |                |                     |             |            |
    | 2회  |                |                     |             |            |
    | 3회  |                |                     |             |            |
    | 4회  |                |                     |             |            |
    | 5회  |                |                     |             |            |

  - 완료 기준: 표가 존재하고 5회 실행 결과가 모두 기록되어 있다.
