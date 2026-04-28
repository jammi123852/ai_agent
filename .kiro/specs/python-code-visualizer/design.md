# Design Document: Python Code Visualizer

## 1. Architecture Overview

This project is a React + TypeScript single-page web application that visualizes an AI-generated Python code file as a functional block graph.

The application does not execute or modify the original code. Its purpose is to help a human understand and verify AI-generated code by converting observed code behavior into a reproducible graph pipeline.

The MVP uses a browser-side rule-based analyzer. The analyzer is separated from the UI so that an AI API can be added later for explanation generation, requirement comparison, and risk interpretation.

## 2. InputPanel Design

The InputPanel collects three user inputs.

- user_request: the original prompt or request given to an AI coding tool
- generated_code: the generated Python code
- user_level: beginner, intermediate, or advanced

The analyze button sends these inputs to the analyzer core and receives an AnalysisResult object.

## 3. Analyzer Core Design

The analyzer core is split into small modules.

- requestParser: extracts goal, must_have, and must_not_have from user_request
- codeObserver: observes code lines and extracts visible operations
- operationUnitExtractor: groups raw code lines into operation units
- blockClassifier: assigns an allowed block_type to each operation unit
- blockMerger: merges consecutive blocks of the same type when allowed
- pipelineBuilder: creates runtime_pipeline and pipeline_edges
- definitionInventoryBuilder: separates uncalled functions and classes
- specGapDetector: compares user_request with observed code behavior
- riskDetector: detects dangerous or risky operations
- consistencyChecker: validates schema, block IDs, edges, and enum values

The classification logic is deterministic first. AI reasoning may be added later only as a helper, not as the primary block classifier.

## 4. Data Model

### BlockType

Allowed block_type values are:

- SETUP
- DEFINE_STRUCTURE
- INPUT
- LOAD
- VALIDATE
- TRANSFORM
- CORE_LOGIC
- MODEL_OR_ALGORITHM
- OUTPUT
- VISUALIZE
- ERROR_HANDLING
- DANGEROUS_OPERATION
- UTILITY
- UNKNOWN

### PipelineStatus

Allowed pipeline_status values are:

- runtime_detected
- definition_only
- partial
- unknown

### BlockNode

Each runtime block contains:

- block_id
- block_type
- block_name
- role
- input
- output
- related_functions
- related_classes
- code_evidence
- risk_level
- explanation

### PipelineEdge

Each edge contains:

- from
- to
- reason

### AnalysisResult

The final output contains:

- pipeline_status
- request_summary
- runtime_pipeline
- pipeline_edges
- definition_inventory
- absent_block_types
- spec_gaps
- risk_points
- summary_short
- summary_detailed
- verification_checklist
- consistency_check
- confidence
- human_review_needed

## 5. Block Classification Rules

Blocks are not divided by function name or class name. Blocks are divided by runtime role.

The classifier must only use the allowed block_type list. It must not create new block types.

Classification priority:

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

Classification examples:

- import statements, path strings, constants: SETUP
- class or dataclass definitions: DEFINE_STRUCTURE
- input() or argparse: INPUT
- read_csv, json.load, open(..., "r"): LOAD
- os.path.exists or column existence checks: VALIDATE
- dropna, fillna, resize, normalize, strip, lower, replace: TRANSFORM
- fit, predict, train, inference, bfs, dfs, dijkstra: MODEL_OR_ALGORITHM
- mean, sum, count, calculate, classify, match: CORE_LOGIC
- print, return, to_csv, save, write: OUTPUT
- plot, imshow, show: VISUALIZE
- try, except: ERROR_HANDLING
- os.remove, shutil.rmtree, delete, requests.post: DANGEROUS_OPERATION
- unclear behavior: UNKNOWN

## 6. Runtime Pipeline and Definition Inventory

The runtime_pipeline contains only observed runtime behavior.

Function or class definitions that are not called must not be inserted into runtime_pipeline. They must be recorded in definition_inventory.

If the code only contains definitions and no detected call or top-level runtime behavior, pipeline_status must be definition_only and runtime_pipeline must be an empty array.

If the code is incomplete or appears truncated, pipeline_status must be partial.

## 7. Graph Visualization Design

GraphView renders runtime_pipeline as connected visual nodes.

Requirements:

- Each BlockNode is displayed as a card-like node.
- Nodes flow from left to right by default.
- pipeline_edges are displayed as arrows or connector lines.
- block_type values are visually distinguished by color.
- high risk nodes are highlighted with a red tone.
- The selected node is visually emphasized.
- Clicking a node updates the DetailPanel.

The graph is a visualization of code structure, not a graph editor.

## 8. Detail Panel Design

When a user clicks a graph node, the DetailPanel displays:

- block_id
- block_type
- block_name
- role
- input
- output
- related_functions
- related_classes
- code_evidence
- risk_level
- explanation based on user_level
- related spec_gaps
- related risk_points

Explanation rules:

- beginner: use simple role-based explanations
- intermediate: explain function and variable flow
- advanced: explain structural role, risk, and design implications

## 9. Summary Panel Design

The SummaryPanel displays:

- summary_short
- summary_detailed
- pipeline_status
- confidence
- human_review_needed
- spec_gaps
- risk_points
- verification_checklist

If human_review_needed is true, a warning banner must be shown.

If no spec_gaps are detected, display a message that no requirement mismatch was observed.

If no risk_points are detected, display a message that no risky operation was observed.

## 10. Spec Gap and Risk Detection

spec_gaps describe differences between user_request and generated_code.

Allowed gap_type values:

- missing_requirement
- extra_behavior
- mismatch
- unclear

risk_points describe code behavior that may require human review.

Risk rules:

- os.remove, shutil.rmtree, delete, external transfer, and personal data transfer are high risk.
- File save operations are OUTPUT, but overwrite possibility should be recorded as a risk point.
- If at least one high risk exists, human_review_needed must be true.
- If confidence is lower than 0.7, human_review_needed must be true.

## 11. Failure Handling

The application must handle these cases:

- Empty generated_code: show an error and do not analyze.
- Definition-only code: set pipeline_status to definition_only and runtime_pipeline to an empty array.
- Truncated code: set pipeline_status to partial.
- Unknown behavior: classify as UNKNOWN and add an uncertain point if needed.
- Invalid edge reference: mark consistency_check.edge_ids_valid as false.
- High risk operation: set human_review_needed to true.

## 12. Reproducibility Strategy

The system must produce stable output for repeated runs of the same input.

Reproducibility rules:

- block_id values are assigned sequentially as B01, B02, B03.
- block_type must be selected only from the allowed enum list.
- The classifier must use the fixed priority order.
- Consecutive identical block_type values may be merged.
- DANGEROUS_OPERATION must never be merged with other blocks.
- pipeline_edges.from and pipeline_edges.to must reference existing block IDs.
- For runtime_detected status with N > 1 runtime blocks, there must be at least N - 1 edges.

The 5-run consistency test compares:

- pipeline_status
- block_type sequence
- block count
- edge count
- high risk count
- schema validity

## 13. Future AI API Extension

The MVP does not call an external AI API.

Future AI API usage may be added for:

- user-level explanation generation
- richer summary generation
- natural language spec gap interpretation
- risk explanation

However, AI API output must not directly determine block_type or block_id. The deterministic rule-based harness remains the source of truth for graph structure.
