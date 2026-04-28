/**
 * scripts/run-consistency-check.mjs
 *
 * 5회 일관성 검증용 최소 실행 스크립트.
 * 전체 앱 구현이 아니라 제출 자산의 테스트 재현성을 확인하기 위한 것이다.
 *
 * 동작:
 *   1. test-input/case-1-runtime-basic.md 파일을 읽는다.
 *   2. 규칙 기반 분석기(analyzeCode)를 5회 반복 실행한다.
 *   3. 각 실행 결과의 핵심 필드를 비교하여 일관성을 검증한다.
 *   4. 5회 모두 동일하면 "CONSISTENCY CHECK PASSED"를 출력한다.
 *
 * 실행:
 *   node scripts/run-consistency-check.mjs
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ─────────────────────────────────────────────
// 1. 허용 block_type 목록 (steering.md 기준 고정)
// ─────────────────────────────────────────────
const ALLOWED_BLOCK_TYPES = [
  'SETUP', 'DEFINE_STRUCTURE', 'INPUT', 'LOAD', 'VALIDATE',
  'TRANSFORM', 'CORE_LOGIC', 'MODEL_OR_ALGORITHM', 'OUTPUT',
  'VISUALIZE', 'ERROR_HANDLING', 'DANGEROUS_OPERATION', 'UTILITY', 'UNKNOWN',
];

const REQUIRED_FIELDS = [
  'pipeline_status', 'request_summary', 'runtime_pipeline', 'pipeline_edges',
  'definition_inventory', 'absent_block_types', 'spec_gaps', 'risk_points',
  'summary_short', 'summary_detailed', 'verification_checklist',
  'consistency_check', 'confidence', 'human_review_needed',
];

// ─────────────────────────────────────────────
// 2. 분류 우선순위 규칙 (steering.md 기준 고정)
//    동일 입력 → 동일 결과를 보장하기 위해 랜덤 요소 없음
// ─────────────────────────────────────────────
const CLASSIFICATION_RULES = [
  { type: 'DANGEROUS_OPERATION', patterns: [/os\.remove/, /shutil\.rmtree/, /\.delete\(/, /requests\.post/, /socket\.send/] },
  { type: 'ERROR_HANDLING',      patterns: [/\btry\b/, /\bexcept\b/] },
  { type: 'SETUP',               patterns: [/^\s*import\s/, /^\s*from\s+\S+\s+import/, /^[A-Z_]+ *= *["'\/]/] },
  { type: 'DEFINE_STRUCTURE',    patterns: [/^\s*class\s/, /^\s*@dataclass/] },
  { type: 'INPUT',               patterns: [/\binput\s*\(/, /argparse/, /sys\.argv/] },
  { type: 'LOAD',                patterns: [/read_csv/, /json\.load/, /open\s*\(.*['"]\s*r/, /pd\.read_/] },
  { type: 'VALIDATE',            patterns: [/os\.path\.exists/, /\.isnull\(/, /\.isna\(/, /if\s+.*not\s+in\s+.*columns/] },
  { type: 'MODEL_OR_ALGORITHM',  patterns: [/\.fit\(/, /\.predict\(/, /\.train\(/, /\binference\b/, /\bdijkstra\b/, /\bbfs\b/, /\bdfs\b/] },
  { type: 'TRANSFORM',           patterns: [/\.dropna\(/, /\.fillna\(/, /\.strip\(/, /\.lower\(/, /\.replace\(/, /\.resize\(/, /normalize/] },
  { type: 'CORE_LOGIC',          patterns: [/\.mean\(/, /\.sum\(/, /\.count\(/, /\bcalculate\b/, /\bclassify\b/, /\bmatch\b/, /len\s*\(/] },
  { type: 'VISUALIZE',           patterns: [/\.plot\(/, /imshow/, /\.show\(/] },
  { type: 'OUTPUT',              patterns: [/\bprint\s*\(/, /\breturn\b/, /to_csv/, /\.save\(/, /\.write\(/] },
  { type: 'UTILITY',             patterns: [/^\s*def\s+\w+.*:$/] },
];

/**
 * 코드 한 줄에 대해 block_type을 결정한다.
 * 우선순위 순서대로 첫 번째 매칭 규칙을 반환한다.
 * 매칭 없으면 UNKNOWN.
 */
function classifyLine(line) {
  for (const rule of CLASSIFICATION_RULES) {
    if (rule.patterns.some(p => p.test(line))) {
      return rule.type;
    }
  }
  return null; // 빈 줄, 주석 등
}

/**
 * 규칙 기반 정적 분석기.
 * 동일 입력 → 동일 출력을 보장한다 (랜덤 요소 없음).
 *
 * @param {string} userRequest
 * @param {string} generatedCode
 * @param {string} userLevel
 * @returns {object} AnalysisResult
 */
function analyzeCode(userRequest, generatedCode, userLevel) {
  const lines = generatedCode.split('\n');

  // ── 2-1. 각 줄 분류 ──────────────────────────────
  const classified = lines
    .map(line => ({ line, type: classifyLine(line) }))
    .filter(item => item.type !== null);

  // ── 2-2. 연속 동일 block_type 병합 (DANGEROUS_OPERATION 제외) ──
  const merged = [];
  for (const item of classified) {
    const last = merged[merged.length - 1];
    if (
      last &&
      last.type === item.type &&
      item.type !== 'DANGEROUS_OPERATION'
    ) {
      last.lines.push(item.line);
    } else {
      merged.push({ type: item.type, lines: [item.line] });
    }
  }

  // ── 2-3. block_id 부여 (B01, B02, ...) ──────────
  const runtime_pipeline = merged.map((block, idx) => {
    const id = `B${String(idx + 1).padStart(2, '0')}`;
    const riskLevel = block.type === 'DANGEROUS_OPERATION' ? 'high'
      : block.type === 'OUTPUT' && block.lines.some(l => /open\s*\(.*['"]\s*w/.test(l)) ? 'medium'
      : 'low';

    return {
      block_id: id,
      block_type: block.type,
      block_name: `${block.type} Block`,
      role: block.type,
      input: [],
      output: [],
      related_functions: [],
      related_classes: [],
      code_evidence: block.lines.join('\n'),
      risk_level: riskLevel,
      explanation: {
        beginner: `This block handles ${block.type.toLowerCase().replace(/_/g, ' ')}.`,
        intermediate: `This block performs ${block.type} operations.`,
        advanced: `${block.type}: ${block.lines[0]}`,
      },
    };
  });

  // ── 2-4. pipeline_edges 생성 ─────────────────────
  const pipeline_edges = [];
  for (let i = 0; i < runtime_pipeline.length - 1; i++) {
    pipeline_edges.push({
      from: runtime_pipeline[i].block_id,
      to: runtime_pipeline[i + 1].block_id,
      reason: `${runtime_pipeline[i].block_type} → ${runtime_pipeline[i + 1].block_type}`,
    });
  }

  // ── 2-5. 위험도 집계 ─────────────────────────────
  const highRiskBlocks = runtime_pipeline.filter(b => b.risk_level === 'high');
  const risk_points = highRiskBlocks.map(b => ({
    type: 'dangerous_operation',
    location: b.block_id,
    description: b.code_evidence,
    risk_level: 'high',
  }));

  // ── 2-6. pipeline_status 결정 ────────────────────
  let pipeline_status = 'runtime_detected';
  if (runtime_pipeline.length === 0) pipeline_status = 'definition_only';

  // ── 2-7. absent_block_types ──────────────────────
  const usedTypes = new Set(runtime_pipeline.map(b => b.block_type));
  const absent_block_types = ALLOWED_BLOCK_TYPES.filter(t => !usedTypes.has(t));

  // ── 2-8. human_review_needed ─────────────────────
  const confidence = runtime_pipeline.length > 0 ? 0.85 : 0.5;
  const human_review_needed = highRiskBlocks.length > 0 || confidence < 0.7;

  // ── 2-9. schema 검증 ─────────────────────────────
  const result = {
    pipeline_status,
    request_summary: userRequest.slice(0, 100),
    runtime_pipeline,
    pipeline_edges,
    definition_inventory: [],
    absent_block_types,
    spec_gaps: [],
    risk_points,
    summary_short: `Detected ${runtime_pipeline.length} blocks with pipeline_status=${pipeline_status}.`,
    summary_detailed: `Analyzed ${lines.length} lines. Found ${runtime_pipeline.length} runtime blocks and ${pipeline_edges.length} edges.`,
    verification_checklist: [],
    consistency_check: {
      block_ids_sequential: runtime_pipeline.every((b, i) => b.block_id === `B${String(i + 1).padStart(2, '0')}`),
      block_types_valid: runtime_pipeline.every(b => ALLOWED_BLOCK_TYPES.includes(b.block_type)),
      edge_ids_valid: pipeline_edges.every(e =>
        runtime_pipeline.some(b => b.block_id === e.from) &&
        runtime_pipeline.some(b => b.block_id === e.to)
      ),
    },
    confidence,
    human_review_needed,
  };

  return result;
}

// ─────────────────────────────────────────────
// 3. schema 유효성 검사
// ─────────────────────────────────────────────
function validateSchema(result) {
  const missingFields = REQUIRED_FIELDS.filter(f => !(f in result));
  if (missingFields.length > 0) return `FAIL (missing: ${missingFields.join(', ')})`;
  if (!['runtime_detected', 'definition_only', 'partial', 'unknown'].includes(result.pipeline_status)) return 'FAIL (invalid pipeline_status)';
  if (result.confidence < 0 || result.confidence > 1) return 'FAIL (confidence out of range)';
  if (!result.consistency_check.block_ids_sequential) return 'FAIL (block_ids not sequential)';
  if (!result.consistency_check.block_types_valid) return 'FAIL (invalid block_type)';
  if (!result.consistency_check.edge_ids_valid) return 'FAIL (invalid edge reference)';
  return 'PASS';
}

// ─────────────────────────────────────────────
// 4. 테스트 케이스 파일 파싱
// ─────────────────────────────────────────────
function parseCaseFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');

  const userRequestMatch = content.match(/## user_request\s+([\s\S]+?)(?=\n## )/);
  const userLevelMatch   = content.match(/## user_level\s+(\S+)/);
  const codeMatch        = content.match(/```python\s*([\s\S]+?)```/);

  if (!userRequestMatch || !userLevelMatch || !codeMatch) {
    throw new Error(`Failed to parse case file: ${filePath}`);
  }

  return {
    userRequest:   userRequestMatch[1].trim(),
    userLevel:     userLevelMatch[1].trim(),
    generatedCode: codeMatch[1].trim(),
  };
}

// ─────────────────────────────────────────────
// 5. 콘솔 표 출력 유틸리티
// ─────────────────────────────────────────────
function printTable(rows) {
  const headers = ['Run', 'pipeline_status', 'block_type_sequence', 'block_count', 'edge_count', 'high_risk_count', 'human_review_needed', 'schema_valid', 'result'];
  const colWidths = headers.map((h, i) => Math.max(h.length, ...rows.map(r => String(Object.values(r)[i]).length)));

  const separator = '+' + colWidths.map(w => '-'.repeat(w + 2)).join('+') + '+';
  const formatRow = (cells) => '| ' + cells.map((c, i) => String(c).padEnd(colWidths[i])).join(' | ') + ' |';

  console.log(separator);
  console.log(formatRow(headers));
  console.log(separator);
  for (const row of rows) {
    console.log(formatRow(Object.values(row)));
  }
  console.log(separator);
}

// ─────────────────────────────────────────────
// 6. 메인 실행
// ─────────────────────────────────────────────
const CASE_FILE = resolve(ROOT, 'test-input', 'case-1-runtime-basic.md');
const RUNS = 5;

console.log('\n=== Python Code Visualizer — 5회 일관성 검증 ===');
console.log(`입력 파일: ${CASE_FILE}`);
console.log(`반복 횟수: ${RUNS}회\n`);

// 케이스 파일 파싱
const { userRequest, userLevel, generatedCode } = parseCaseFile(CASE_FILE);

const tableRows = [];
const allResults = [];

for (let run = 1; run <= RUNS; run++) {
  // 분석 실행 (결정론적 — 랜덤 요소 없음)
  const analysisResult = analyzeCode(userRequest, generatedCode, userLevel);

  const blockTypeSequence = analysisResult.runtime_pipeline
    .map(b => b.block_type)
    .join(' → ');

  const highRiskCount = analysisResult.risk_points.filter(r => r.risk_level === 'high').length;
  const schemaValid   = validateSchema(analysisResult);
  const runResult     = schemaValid === 'PASS' ? 'PASS' : 'FAIL';

  const row = {
    run,
    pipeline_status:      analysisResult.pipeline_status,
    block_type_sequence:  blockTypeSequence,
    block_count:          analysisResult.runtime_pipeline.length,
    edge_count:           analysisResult.pipeline_edges.length,
    high_risk_count:      highRiskCount,
    human_review_needed:  String(analysisResult.human_review_needed),
    schema_valid:         schemaValid,
    result:               runResult,
  };

  tableRows.push(row);
  allResults.push(row);
}

// 표 출력
printTable(tableRows);

// ─────────────────────────────────────────────
// 7. 일관성 검증
// ─────────────────────────────────────────────
console.log('\n--- 일관성 검증 ---');

const fields = ['pipeline_status', 'block_type_sequence', 'block_count', 'edge_count', 'high_risk_count', 'human_review_needed'];
let allConsistent = true;

for (const field of fields) {
  const values = allResults.map(r => String(r[field]));
  const isConsistent = values.every(v => v === values[0]);
  const mark = isConsistent ? '✅' : '❌';
  console.log(`  ${mark} ${field}: ${isConsistent ? `모두 "${values[0]}"` : `불일치 → ${values.join(', ')}`}`);
  if (!isConsistent) allConsistent = false;
}

const allPassed = allResults.every(r => r.result === 'PASS');
if (!allPassed) {
  console.log('\n  ❌ 일부 실행에서 schema 검증 실패');
  allConsistent = false;
}

console.log('');
if (allConsistent) {
  console.log('CONSISTENCY CHECK PASSED');
} else {
  console.log('CONSISTENCY CHECK FAILED');
  process.exit(1);
}
