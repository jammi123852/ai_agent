# Steering Rules: Python Code Visualizer

## 1. Core Principle

This project is not a code execution tool and not a code modification tool.

The goal is to help a human understand and verify AI-generated Python code by converting observed runtime behavior into a reproducible functional block graph.

The system must prioritize reproducibility, explicit rules, and human review over free-form interpretation.

## 2. Global Rules

1. The original code must not be modified.
2. The original code must not be executed.
3. Blocks must not be divided by function name.
4. Blocks must not be divided by class name.
5. Blocks must be divided by runtime role.
6. Only behavior actually observed in the code may become a runtime block.
7. Missing behavior must not be invented.
8. Missing block types may be recorded in `absent_block_types`.
9. Function and class names are evidence only. They may appear in `related_functions`, `related_classes`, and `definition_inventory`.
10. Function definitions without calls must not be inserted into `runtime_pipeline`.
11. Uncalled functions and classes must be recorded in `definition_inventory`.
12. If one function contains multiple runtime roles, it must be split by role.
13. If multiple functions perform one runtime role, they may be grouped into one block.
14. `DANGEROUS_OPERATION` must always be an independent block.
15. Unclear behavior must be classified as `UNKNOWN`.
16. `pipeline_status` must be one of `runtime_detected`, `definition_only`, `partial`, or `unknown`.
17. If at least one high risk item exists, `human_review_needed` must be `true`.
18. If `confidence < 0.7`, `human_review_needed` must be `true`.

## 3. Allowed block_type Values

The analyzer may only use the following block types.

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

No new block type may be created.

## 4. Classification Priority

If one code operation can match multiple block types, the following priority must be used.

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

## 5. Risk Rules

The following operations are high risk.

- `os.remove`
- `shutil.rmtree`
- file or folder deletion
- external data transfer
- personal data transfer
- destructive operations not requested by the user

File save operations are classified as `OUTPUT`, but overwrite possibility must be recorded in `risk_points`.

If a high risk operation exists, `human_review_needed` must be `true`.

## 6. Reproducibility Rules

The same input must produce the same structural output.

The consistency target is based on these fields.

- `pipeline_status`
- `block_type` sequence
- block count
- edge count
- high risk count

`block_id` must be assigned sequentially as `B01`, `B02`, `B03`.

`pipeline_edges.from` and `pipeline_edges.to` must reference existing `block_id` values.

For `pipeline_status=runtime_detected` and runtime block count `N > 1`, the graph should contain at least `N-1` edges.

## 7. Human Review Rules

Human review is required when one or more of the following conditions is true.

- high risk operation exists
- requirement mismatch exists
- generated code contains only definitions and no runtime call
- confidence is lower than 0.7
- code is partial or unclear
- a dangerous operation was not explicitly requested by the user
