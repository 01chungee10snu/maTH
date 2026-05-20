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

운영 초기는 `b`를 수동으로 넣고, 응답 로그가 충분히 쌓이면 정답률과 힌트 사용량을 기준으로 재보정한다. 초기 seed 은행은 최소 50문항을 유지하고, 핵심 skill은 각각 최소 3문항 이상을 둔다. 새 단원을 추가할 때는 먼저 10문항 단위로 seed를 넣고, 실사용 로그가 쌓이면 난이도 `b`를 재추정한다.

## 초등 과정 통합 방식

관계형 문장제는 별도 `관계수학 코치` 모드로 운영하지 않는다. 초등학교 과정 중 관계 사고가 중요한 단원에서만 내부 풀이 레이어로 작동한다.

초기 적용 단원은 다음으로 제한한다.

- 자연수의 곱셈과 나눗셈
- 분수와 소수의 이해
- 분수의 덧셈과 뺄셈
- 분수의 곱셈과 나눗셈
- 길이, 시각, 시간
- 들이와 무게
- 시간과 길이
- 약수와 배수
- 규칙과 대응
- 비와 비율
- 비례식과 비례배분
- 평균 및 그래프 해석 단원

화면에서는 별도 Add-on처럼 보이지 않게 해당 단원 문제로 제시하고, 내부적으로만 기준량, 방향, 표상, 연산, 설명 단계를 기록한다.

## Supabase 저장 대상

- `math_items`: 운영 문제 은행
- `learning_attempts`: 개별 풀이 로그
- `learner_skill_states`: 학습자별 theta 및 skill mastery

아동 데이터는 보호자 동의와 삭제 정책이 확정되기 전까지 local-first로 유지한다.

## 로컬 우선 풀이 로그 큐

앱은 IRT 업데이트가 일어날 때마다 `taehee-irt-attempt-log` localStorage 큐에 풀이 기록을 남긴다. 이 기록은 Supabase `learning_attempts`에 그대로 매핑될 수 있도록 다음 필드를 포함한다.

| 필드 | 의미 |
| --- | --- |
| `local_id` | 기기 내 임시 로그 ID |
| `learner_id` | 로그인 전 기본값 `local-child` |
| `item_id` | `REL_MATH_###` 문제 ID |
| `topic` | IRT 주제, 초기값 `relationship_math` |
| `skill_tags` | 문항이 훈련하는 관계 추론 skill |
| `selected_answer` | 아이가 고른 답 |
| `correct` | 최종 정답 여부 |
| `hint_level` | 정답 확인 전 사용한 힌트 단계 |
| `step_success_rate` | 기준량, 방향, 시각화 등 사고 단계 성공률 |
| `response_score` | 힌트와 사고 단계를 반영한 IRT 응답 점수 |
| `theta_before`, `theta_after` | 풀이 전후 학습자 능력 추정치 |
| `standard_error_after` | 업데이트 후 추정 오차 |
| `error_type` | 오답일 때 추정한 오개념 코드 |
| `sync_status` | `pending` 또는 `synced` |

Supabase 동기화는 익명 쓰기 정책을 열지 않는다. 운영 적용 시에는 보호자 동의, 사용자 인증, RLS 정책, 삭제 요청 처리 방식을 먼저 확정한 뒤 `pending` 로그만 서버에 업로드하고 성공한 항목을 `synced`로 표시한다.

클라이언트 동기화 함수는 `IrtSync.syncPendingAttempts()`로 분리한다. 이 함수는 Supabase 인증 사용자가 확인되지 않으면 `auth_required`를 반환하고 업로드하지 않는다. 로그인과 보호자 동의 UI가 붙기 전까지는 자동 호출하지 않으며, 관리자가 검증한 시점에만 명시적으로 호출한다.
