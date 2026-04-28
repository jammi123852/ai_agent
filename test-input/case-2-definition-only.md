# Case 2: Definition Only — 함수 정의만 있고 호출부 없음

## user_request

데이터를 정제하는 clean_data 함수를 Python으로 만들어줘.

## user_level

intermediate

## generated_code

```python
import pandas as pd

def clean_data(df):
    df = df.dropna()
    df = df[df["age"] > 0]
    df["name"] = df["name"].str.strip().str.lower()
    return df
```

---

## expected_analysis

| 항목 | 예상 값 |
|---|---|
| `pipeline_status` | `definition_only` |
| `runtime_pipeline` 길이 | 0 |
| `runtime_pipeline` | `[]` |
| block count | 0 |
| edge count | 0 |
| `human_review_needed` | `false` |

## expected_definition_inventory

| 이름 | 종류 | 이유 |
|---|---|---|
| `clean_data` | function | 정의되었지만 호출부 없음 |

## notes

- `import pandas as pd`는 최상위 실행문이지만, 호출부가 없는 정의 전용 코드이므로 `pipeline_status=definition_only`로 설정한다.
- `clean_data` 함수 내부의 `dropna`, `strip`, `lower` 등은 호출되지 않으므로 `runtime_pipeline`에 포함하지 않는다.
- `definition_inventory`에 `clean_data`가 기록되어야 한다.
- `spec_gaps`: user_request는 함수 생성을 요청했으므로 불일치 없음 → 빈 배열
