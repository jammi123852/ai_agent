# Case 3: Class Methods — 클래스 메서드 실행 역할 분류

## user_request

CSV 파일을 읽고, 결측값을 제거하고, 결과를 새 CSV로 저장하는 Python 코드를 만들어줘.
DataProcessor 클래스로 구성해줘.

## user_level

advanced

## generated_code

```python
import pandas as pd

class DataProcessor:
    def __init__(self, input_path, output_path):
        self.input_path = input_path
        self.output_path = output_path
        self.df = None

    def load(self):
        self.df = pd.read_csv(self.input_path)

    def clean(self):
        self.df = self.df.dropna()
        self.df = self.df[self.df["age"] > 0]

    def save(self):
        self.df.to_csv(self.output_path, index=False)

processor = DataProcessor("data/input.csv", "data/output.csv")
processor.load()
processor.clean()
processor.save()
```

---

## expected_analysis

| 항목 | 예상 값 |
|---|---|
| `pipeline_status` | `runtime_detected` |
| `block_type` sequence | `SETUP` → `DEFINE_STRUCTURE` → `LOAD` → `TRANSFORM` → `OUTPUT` |
| block count | 5 |
| edge count | 4 |
| high risk count | 0 |
| `human_review_needed` | `false` |

## expected_blocks

| block_id | block_type | 근거 코드 | 분류 근거 |
|---|---|---|---|
| B01 | `SETUP` | `import pandas as pd` | import 문 |
| B02 | `DEFINE_STRUCTURE` | `class DataProcessor:` | 클래스 정의 |
| B03 | `LOAD` | `processor.load()` → `pd.read_csv(...)` | 파일 로드 호출 |
| B04 | `TRANSFORM` | `processor.clean()` → `dropna()`, 필터링 | 데이터 변환 호출 |
| B05 | `OUTPUT` | `processor.save()` → `to_csv(...)` | 파일 저장 호출 |

## notes

- 블록은 클래스 단위가 아니라 실행 역할 단위로 분류한다.
- `DataProcessor.__init__`, `load`, `clean`, `save` 메서드는 `related_functions`에 기록한다.
- `DataProcessor` 클래스는 `related_classes`에 기록한다.
- 메서드 정의 자체는 `DEFINE_STRUCTURE`에 포함되며, 실제 호출(`processor.load()` 등)이 각 역할 블록의 근거가 된다.
- `to_csv(...)`는 파일 저장이므로 `OUTPUT`이며, 덮어쓰기 가능성을 `risk_points`에 `medium` risk로 기록한다.
