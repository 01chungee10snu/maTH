# 관계수학 코치 Add-on 설계

## 핵심 정의

관계수학 코치는 아이가 문장제 문제를 읽고, 기준량·관계 방향·수량 관계를 스스로 구조화하도록 돕는 사고 훈련 Add-on이다. 목표는 정답 제공이 아니라 다음 절차의 반복 훈련이다.

```text
문장 -> 관계 파악 -> 표상 생성 -> 연산 선택 -> 설명 -> 전이
```

## MVP 범위

| 우선순위 | 기능 | 구현 방향 |
| --- | --- | --- |
| P0 | 문제 수동 태깅 | `relationshipCoachProblems.js`의 문제 은행에 기준량, 방향, 문제 유형, 오개념 코드 포함 |
| P0 | 기준량 찾기 | 코치 1단계에서 기준 대상을 선택 |
| P0 | 관계 방향 표시 | 코치 2단계에서 방향 해석 문장을 선택 |
| P0 | 빈 시각화 틀 제공 | 기준량 1 기준의 표/바 모델을 앱이 그리되, 아이가 해석 선택을 먼저 수행 |
| P0 | 힌트 사다리 | 힌트 버튼을 누른 횟수를 `hintLevel`로 기록 |
| P0 | 오개념 로그 | 기준량, 방향, 연산, 설명 오류를 로컬 로그에 저장 |
| P1 | 설명 완성 | 최종 단계에서 이유 설명 문장 선택 |
| P1 | 부모 리포트 | 로컬 로그 요약 API를 먼저 제공하고 화면화는 후속 |

## 문제 유형 분류

| 코드 | 의미 |
| --- | --- |
| `DIRECT_COMPARE` | 직접 비교 |
| `EQUAL_SHARING` | 등분 나눗셈 |
| `QUOTATIVE_DIVISION` | 포함 나눗셈 |
| `UNIT_COMPARE` | 단위량 비교 |
| `MULTIPLICATIVE_COMPARE` | 배수 비교 |
| `FRACTION_RELATION` | 분수 관계 |
| `INVERSE_RELATION` | 역관계 |
| `PROPORTION` | 비율·비례 |
| `RANKING` | 순위 판단 |
| `COMPOSITE_RELATION` | 복합 문장제 |

## 오개념 코드

| 코드 | 의미 |
| --- | --- |
| `NUMBER_SIZE_BIAS` | 숫자가 크면 대상도 크다고 판단 |
| `DIRECTION_CONFUSION` | A가 B를 채우는지, B가 A를 채우는지 혼동 |
| `BASE_UNIT_CONFUSION` | 기준량을 찾지 못함 |
| `FRACTION_SIZE_CONFUSION` | 분수 크기 혼동 |
| `OPERATION_SELECTION_ERROR` | 연산 선택 오류 |
| `RANKING_MISREAD` | 가장 큰 것과 두 번째 큰 것 등 질문 조건 오해 |
| `EXPLANATION_GAP` | 답은 맞았지만 이유 설명이 부족 |
| `TRANSFER_FAILURE` | 소재가 바뀌면 같은 원리 적용 실패 |

## UX 흐름

```text
문제 제시
-> 기준량 찾기
-> 관계 방향 해석
-> 표/바 모델로 관계 확인
-> 필요한 연산 또는 사고 선택
-> 설명 문장 선택
-> 최종 답 선택
-> 오개념 및 힌트 단계 기록
```

초기 MVP는 모든 문장제를 자동 분석하지 않는다. 검수된 관계형 문장제 문제 은행을 사용하고, 문제 객체에 태깅된 메타데이터를 기반으로 코치 단계를 구성한다.

## 데이터 구조

```json
{
  "problem_id": "REL_MATH_001",
  "grade_band": "G1_G2",
  "problem_types": ["UNIT_COMPARE", "INVERSE_RELATION", "RANKING"],
  "base_unit": "빨간 그릇",
  "entities": [
    { "id": "A", "label": "그릇 ㉮", "relation_direction": "A_to_base", "count": 5, "relative_value": 0.2 }
  ],
  "question_type": "SECOND_LARGEST",
  "operation": "관계 비교",
  "answer": "그릇 ㉰"
}
```

풀이 로그는 브라우저 로컬 저장소 `taehee-relation-coach-log`에 저장한다.

```json
{
  "problem_id": "REL_MATH_001",
  "problem_types": ["UNIT_COMPARE", "INVERSE_RELATION", "RANKING"],
  "base_unit_correct": true,
  "direction_mapping_correct": false,
  "visualization_used": true,
  "hint_level": 4,
  "answer_correct": false,
  "error_type": "DIRECTION_CONFUSION",
  "explanation_success": false,
  "time_spent_seconds": 132
}
```

## 성공 지표

정답률만 보지 않는다. 가장 중요한 지표는 무지원 또는 낮은 힌트 단계에서 관계를 정확히 구조화한 비율이다.

| 지표 | 의미 |
| --- | --- |
| 기준량 찾기 정확도 | 기준 대상을 파악하는 능력 |
| 방향 표시 정확도 | 관계 방향 이해 |
| 평균 힌트 단계 | 적은 도움으로 풀 수 있는지 |
| 설명 성공률 | 답의 이유를 말할 수 있는지 |
| 오개념 반복률 | 같은 오류가 줄어드는지 |
| 전이 문제 성공률 | 소재 변화에도 적용 가능한지 |

## 리스크와 대응

| 리스크 | 대응 |
| --- | --- |
| 시각화 의존 | 완성 시각화를 바로 보여주지 않고 기준·방향 선택 후 표상 확인 |
| 정답 앱으로 변질 | 최종 답 선택 전 사고 단계 진행 |
| AI 오분류 | 초기 MVP는 수동 태깅 문제만 사용 |
| 부모 과잉해석 | 리포트 문구는 진단이 아니라 학습 과정 기록으로 표현 |
| 개인정보 이슈 | 로컬 저장, 최소 수집, 추후 보호자 동의와 삭제 기능 추가 |
