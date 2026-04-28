# Case 4: Request-Code Mismatch — 요청과 코드 불일치

## user_request

CSV 파일을 읽어서 age 컬럼의 평균값을 계산하고 출력하는 Python 코드를 만들어줘.

## user_level

intermediate

## generated_code

```python
import pandas as pd

FILE_PATH = "data/scores.csv"

df = pd.read_csv(FILE_PATH)

avg_score = df["score"].mean()

print(f"Average score: {avg_score}")
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
| `human_review_needed` | `true` |

## expected_spec_gaps

| gap_type | 설명 |
|---|---|
| `mismatch` | user_request는 `age` 컬럼 평균을 요청했지만, 코드는 `score` 컬럼 평균을 계산한다. |
| `mismatch` | user_request는 `users.csv` 또는 age 관련 파일을 암시하지만, 코드는 `scores.csv`를 사용한다. |

## notes

- `spec_gaps`에 `mismatch` 항목이 1개 이상 기록되어야 한다.
- `consistency_check`에 낮은 일치도가 기록되어야 한다.
- `human_review_needed=true`로 설정되어야 한다 (spec_gaps mismatch 존재).
- 코드 자체의 실행 흐름은 정상이므로 `pipeline_status=runtime_detected`이다.
- `risk_points`는 빈 배열 (위험 동작 없음).
