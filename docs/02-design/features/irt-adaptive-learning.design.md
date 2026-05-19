# IRT 기반 적응형 학습 설계

## 목적

정답률만으로 난이도를 올리고 내리는 방식에서 벗어나, 문항 난이도와 학습자 현재 상태를 함께 추정해 다음 문제를 제시한다. 초기 운영 모델은 Rasch/1PL IRT이며, 문제 수와 응답 로그가 충분히 쌓이기 전까지는 수동 난이도 태깅을 기준으로 한다.

## MVP 모델

- `theta`: 학습자 능력 추정치, 기본값 0, 범위 -3~3
- `b`: 문항 난이도, 수동 태깅, 범위 -3~3
- `P(correct) = 1 / (1 + exp(-(theta - b)))`
- 다음 문항은 현재 `theta`와 가까운 `b`를 우선한다.
- 최근 출제 문항은 재출제 penalty를 둔다.
- 반복 약점 skill은 보강 우선순위를 조금 올린다.

## 힌트와 사고 단계 반영

정답 여부를 0/1로만 보지 않는다.

| 풀이 결과 | IRT 반영 |
| --- | --- |
| 무지원 정답 | 1.00 |
| 낮은 힌트 정답 | 0.84~0.92 |
| 높은 힌트 정답 | 0.45~0.60 |
| 오답이지만 일부 사고 단계 성공 | 0.00~0.35 |
| 완전 오답 | 0.00 |

관계수학 코치에서는 `base`, `direction`, `visualization`, `operation`, `explanation` 단계 성공률을 `stepSuccessRate`로 넣는다.

## 문제 확장 규칙

새 문제를 추가할 때 최소 필드는 다음과 같다.

```json
{
  "problem_id": "REL_MATH_006",
  "grade_band": "G1_G2",
  "level": 5,
  "skill_tags": ["UNIT_COMPARE", "DIRECTION_CONFUSION"],
  "irt": { "model": "rasch", "b": 0.2 },
  "problem_types": ["UNIT_COMPARE"],
  "question": "...",
  "base_unit": "...",
  "entities": [],
  "question_type": "LARGEST",
  "operation": "관계 비교",
  "answer": "...",
  "explanation": "..."
}
```

운영 초기는 `b`를 수동으로 넣고, 응답 로그가 충분히 쌓이면 정답률과 힌트 사용량을 기준으로 재보정한다.

## Supabase 저장 대상

- `math_items`: 운영 문제 은행
- `learning_attempts`: 개별 풀이 로그
- `learner_skill_states`: 학습자별 theta 및 skill mastery

아동 데이터는 보호자 동의와 삭제 정책이 확정되기 전까지 local-first로 유지한다.
