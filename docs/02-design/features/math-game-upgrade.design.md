# Design: Math Game Upgrade

> **Summary**: 이미지 폴백 시스템 구축 및 수학 문제 생성 엔진의 5대 영역 확장 설계
>
> **Author**: Gemini CLI
> **Created**: 2026-02-03
> **Status**: Draft
> **Related Plan**: [math-game-upgrade.plan.md](../../01-plan/features/math-game-upgrade.plan.md)

---

## 1. Architecture & Data Flow

### 1.1. Image Loading System (Fix)
- **Problem**: 일부 티니핑 이미지 경로가 `images/characters/`와 `images/tinipings/` 사이에 혼재되어 있거나, 파일명 불일치로 로딩 실패 발생.
- **Solution**: 
  - `ImageManager` (가칭) 유틸리티 도입 혹은 `js/data.js`의 `loadTinipingImages` 로직 강화.
  - **Fallback Chain**: `로컬 파일(캐릭터 폴더)` -> `로컬 파일(티니핑 폴더)` -> `Base64 데이터 (JSON)` -> `Placeholder (기본 이미지)`.
  - HTML Canvas `drawImage` 호출 전 `img.complete` 및 `naturalWidth` 체크 로직 추가.

### 1.2. Math Problem Engine (Expansion)
- **Structure**: `js/problems/` 디렉토리 내 도메인별 모듈 구조 유지 및 확장.
- **Data Flow**:
  1. `game.js` (Quiz State) -> `ProblemLoader.generateProblem(topic, difficulty)` 호출.
  2. `ProblemLoader`가 해당 `topic` 모듈 (`addition`, `geometry` 등)에 할당.
  3. 각 모듈은 `ProblemBase`를 상속받아 문제 객체 생성.
  4. 생성된 문제 객체는 `question`, `options`, `answer`, `explanation`, `type` 필드를 포함.

---

## 2. Data Model

### 2.1. Problem Object Interface
```typescript
interface MathProblem {
  id: string;
  topic: string;        // '수와 연산', '도형', '측정' 등
  subTopic: string;     // '각도', '시계보기' 등
  difficulty: number;   // 1 ~ 5
  type: 'multiple' | 'blank' | 'short'; // 문제 유형
  question: string;     // 문제 텍스트 (이모지 포함 가능)
  options?: string[];   // 객관식 보기
  answer: string | number;
  explanation: string;  // 정답 해설 (피드백용)
  hint: string;         // 힌트 텍스트
  visualData?: any;     // 도형 그리기 데이터 등 (선택사항)
}
```

---

## 3. Implementation Guide

### 3.1. 이미지 시스템 개선
- `js/data.js`의 캐릭터 데이터 객체에 `fallbackImage` 속성 추가.
- `game.js`의 이미지 렌더링 함수에서 `onerror` 핸들러를 통해 `images/characters/하츄핑.png`와 같은 기본 이미지로 대체하는 로직 구현.

### 3.2. 수학 문제 영역 확장 (New Modules)
- **`geometryProblems.js`**: 삼각형, 사각형의 성질 및 각도 계산 로직 구현.
- **`measurementProblems.js`**: `Date` 객체 및 랜덤 시간 생성을 이용한 시계 보기 문제, 단위 변환(cm <-> m) 문제 구현.
- **`patternProblems.js`**: 배열의 규칙(등차, 등비, 반복)을 감지하고 빈칸을 맞추는 로직 구현.

### 3.3. UI 고도화 (Quiz UI)
- `game.js`의 `drawQuiz()` 함수 내에서 `problem.type`에 따른 분기 처리:
  - `multiple`: 기존 4개 버튼 UI.
  - `blank`: 입력창(또는 숫자 패드) UI 렌더링.
- 힌트 버튼 추가 및 클릭 시 `problem.hint`를 캔버스 상단에 팝업 형태로 표시.

---

## 4. Test Plan
- **Unit Test**: 각 문제 생성 모듈이 유효한 정답과 매력적인 오답을 생성하는지 확인.
- **Visual Test**: 모든 학년(1~6)의 맵에서 퀴즈 진입 시 이미지가 깨지지 않는지 확인.
- **Integration Test**: 퀴즈 정답 시 티니핑 '캐치' 애니메이션 및 컬렉션 저장 정상 작동 여부 확인.

---

## 5. Security & Performance
- **Performance**: 문제 생성 알고리즘을 최적화하여 루프 발생 방지 (특히 무작위 숫자 생성 시 조건부 루프 주의).
- **Security**: Supabase에 정답 결과를 저장할 때 클라이언트 사이드 변조 방지를 위한 최소한의 검증 로직 고려.
