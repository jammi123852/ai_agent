# Case 1: Runtime Basic — CSV 로드 후 평균 계산 출력

## user_request

CSV 파일을 읽어서 age 컬럼의 평균값을 계산하고 출력하는 Python 코드를 만들어줘.

## user_level

beginner

## generated_code

```python
import pandas as pd

FILE_PATH = "data/users.csv"

df = pd.read_csv(FILE_PATH)

avg_age = df["age"].mean()

print(f"Average age: {avg_age}")
```

---

## expected_analysis

| 항목 | 예상 값 |
|---|---|
| `pipeline_status` | `runtime_detected` |
| `block_type` sequence | `SETUP` → `LOAD` → `CORE_LOGIC` → `OUTPUT` |
| block count | 4 |
| edge count | 3 |
| high risk count | 0 |
| `human_review_needed` | `false` |

## expected_blocks

| block_id | block_type | 근거 코드 |
|---|---|---|
| B01 | `SETUP` | `import pandas as pd`, `FILE_PATH = "data/users.csv"` |
| B02 | `LOAD` | `df = pd.read_csv(FILE_PATH)` |
| B03 | `CORE_LOGIC` | `avg_age = df["age"].mean()` |
| B04 | `OUTPUT` | `print(f"Average age: {avg_age}")` |

## expected_edges

| from | to | reason |
|---|---|---|
| B01 | B02 | 환경 설정 후 데이터 로드 |
| B02 | B03 | 데이터 로드 후 연산 수행 |
| B03 | B04 | 연산 결과 출력 |

## notes

- 함수 정의 없음 → `definition_inventory`는 빈 배열
- 위험 동작 없음 → `risk_points`는 빈 배열
- `spec_gaps` 없음 → 빈 배열
