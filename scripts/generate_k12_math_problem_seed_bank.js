const fs = require('fs');
const path = require('path');

const outPath = path.resolve(__dirname, '..', 'data', 'k12_math_problem_seed_bank.json');

const LEVEL_LABELS = {
  1: '한 자리 수 기초',
  2: '두 자리 수 기초',
  3: '곱셈과 나눗셈 기초',
  4: '초등 수 구조',
  5: '분수와 소수 기초',
  6: '측정과 자료 기초',
  7: '비율과 평균',
  8: '초등 복합 문장제',
  9: '정수와 유리수',
  10: '약수와 배수 구조',
  11: '일차방정식',
  12: '좌표와 비례',
  13: '일차함수',
  14: '연립방정식과 부등식',
  15: '중학 기하 추론',
  16: '중학 확률과 통계',
  17: '제곱근과 이차식',
  18: '이차함수',
  19: '공통수학1 대수',
  20: '방정식과 행렬',
  21: '집합과 함수',
  22: '해석기하와 조합',
  23: '지수와 로그',
  24: '삼각함수',
  25: '수열과 극한',
  26: '미분 기초',
  27: '미분과 적분 활용',
  28: '확률분포와 추정',
  29: '수능형 통합 추론',
  30: '수능 최상위 변별'
};

const PROBLEM_FRAMES = [
  problem => problem,
  problem => `먼저 구할 값을 확인하세요. ${problem}`,
  problem => `식을 세우기 전에 조건을 한 번 정리하세요. ${problem}`,
  problem => `답의 단위를 끝에서 다시 확인하며 풀어보세요. ${problem}`,
  problem => `계산 순서를 말로 떠올린 뒤 풀어보세요. ${problem}`,
  problem => `가장 먼저 사용할 조건을 고르고 풀어보세요. ${problem}`,
  problem => `중간 계산을 하나씩 확인하며 풀어보세요. ${problem}`,
  problem => `문제에서 주어진 수와 구할 수를 구분하세요. ${problem}`,
  problem => `풀이가 한 단계인지 두 단계인지 생각하며 풀어보세요. ${problem}`,
  problem => `예상되는 답의 크기를 먼저 생각해 보세요. ${problem}`,
  problem => `같은 의미의 식으로 바꾼 뒤 계산해 보세요. ${problem}`,
  problem => `조건을 빠뜨리지 않도록 밑줄 친다고 생각하세요. ${problem}`,
  problem => `가장 간단한 식부터 적는다고 생각하세요. ${problem}`,
  problem => `계산 후 원래 질문에 맞게 답하세요. ${problem}`,
  problem => `틀리기 쉬운 조건을 먼저 찾아보세요. ${problem}`,
  problem => `머릿속 표나 수직선을 떠올리며 풀어보세요. ${problem}`,
  problem => `관계가 변하지 않는 양을 찾아보세요. ${problem}`,
  problem => `전체와 부분 중 무엇을 묻는지 확인하세요. ${problem}`,
  problem => `숫자만 보지 말고 문장 조건을 함께 읽으세요. ${problem}`,
  problem => `계산 결과가 문제 상황에 맞는지 점검하세요. ${problem}`,
  problem => `첫 번째 조건과 마지막 질문을 연결해 보세요. ${problem}`,
  problem => `필요 없는 정보가 있는지 확인하며 풀어보세요. ${problem}`,
  problem => `같은 유형을 다른 말로 바꾼 문제라고 생각해 보세요. ${problem}`,
  problem => `식의 왼쪽과 오른쪽 의미를 비교하세요. ${problem}`,
  problem => `그래프나 표를 그린다고 생각하며 풀어보세요. ${problem}`,
  problem => `공식보다 조건의 뜻을 먼저 확인하세요. ${problem}`,
  problem => `답을 고르기 전에 반례가 없는지 생각하세요. ${problem}`,
  problem => `한 번에 풀리지 않으면 중간값을 먼저 구하세요. ${problem}`,
  problem => `계산 방향이 맞는지 마지막에 다시 보세요. ${problem}`,
  problem => `주어진 식을 더 단순한 관계로 바꾸어 보세요. ${problem}`,
  problem => `비교 기준이 무엇인지 먼저 정하세요. ${problem}`,
  problem => `문제 속 변화량을 기준으로 생각해 보세요. ${problem}`,
  problem => `구한 값이 정수인지 분수인지 예상해 보세요. ${problem}`,
  problem => `조건을 그림으로 옮긴다고 생각하며 풀어보세요. ${problem}`,
  problem => `풀이가 끝나면 답이 질문 형식과 맞는지 보세요. ${problem}`,
  problem => `가장 실수하기 쉬운 연산을 조심하며 풀어보세요. ${problem}`
];

function frameProblem(problem, index) {
  return PROBLEM_FRAMES[index % PROBLEM_FRAMES.length](problem);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function round(value, digits = 3) {
  const factor = 10 ** digits;
  return Math.round(Number(value || 0) * factor) / factor;
}

function irtB(level) {
  return round(-3 + ((level - 1) / 29) * 6, 2);
}

function choose(list, index) {
  return list[index % list.length];
}

function makeItem(level, index, blueprint, built) {
  const id = `K12_L${String(level).padStart(2, '0')}_${blueprint.family}_${String(index + 1).padStart(3, '0')}`;
  const skillTags = Array.from(new Set([...(blueprint.skillTags || []), ...(built.skillTags || [])]));
  const prerequisiteTags = Array.from(new Set([...(blueprint.prerequisites || []), ...(built.prerequisites || [])]));
  const structure = blueprint.structure || blueprint.family;
  const template = `${structure}:${built.template || blueprint.template || 'core'}`;
  return {
    id,
    school_band: blueprint.schoolBand,
    grade_band: blueprint.gradeBand,
    course: blueprint.course,
    curriculum_domain: blueprint.domain,
    topic: blueprint.topic,
    type_family: blueprint.family,
    type: `${blueprint.family}_V${index + 1}`,
    difficulty: level,
    level_label: LEVEL_LABELS[level],
    irt_b: irtB(level),
    skill_tags: skillTags,
    prerequisite_tags: prerequisiteTags,
    reasoning_tags: Array.from(new Set(blueprint.reasoningTags || [])),
    reasoning_depth: blueprint.reasoningDepth,
    requires_multi_step_reasoning: blueprint.reasoningDepth >= 2,
    representation_hint: blueprint.representationHint,
    structure_signature: structure,
    template_signature: template,
    problem: frameProblem(built.problem, index),
    answer: String(built.answer),
    solution: built.solution
  };
}

function buildAdditionSingleDigit(i) {
  const a = 1 + (i % 8);
  const b = 1 + ((i * 2 + 3) % (9 - a));
  const answer = a + b;
  return {
    template: 'single-digit-add',
    skillTags: ['ADD_SINGLE_DIGIT', 'ADDITION'],
    problem: `${a}+${b}는 얼마인가요?`,
    answer,
    solution: `${a}+${b}=${answer}입니다. 정답은 ${answer}입니다.`
  };
}

function buildSubtractionSingleDigit(i) {
  const b = 1 + (i % 5);
  const answer = 1 + ((i * 3) % 4);
  const a = b + answer;
  return {
    template: 'single-digit-sub',
    skillTags: ['SUB_SINGLE_DIGIT', 'SUBTRACTION'],
    problem: `${a}-${b}는 얼마인가요?`,
    answer,
    solution: `${a}-${b}=${answer}입니다. 정답은 ${answer}입니다.`
  };
}

function buildTwoDigitAddSub(i) {
  const a = 12 + i;
  const b = 5 + (i % 9);
  const isAdd = i % 2 === 0;
  const answer = isAdd ? a + b : a - b;
  return {
    template: isAdd ? 'two-digit-add' : 'two-digit-sub',
    skillTags: [isAdd ? 'TWO_DIGIT_ADDITION' : 'TWO_DIGIT_SUBTRACTION', isAdd ? 'ADDITION' : 'SUBTRACTION'],
    problem: `${a}${isAdd ? '+' : '-'}${b}는 얼마인가요?`,
    answer,
    solution: `${a}${isAdd ? '+' : '-'}${b}=${answer}입니다. 정답은 ${answer}입니다.`
  };
}

function buildMultiplicationDivision(i) {
  const a = 2 + (i % 8);
  const b = 2 + ((i * 2) % 7);
  const isMul = i % 2 === 0;
  const answer = isMul ? a * b : a;
  return {
    template: isMul ? 'basic-mul' : 'basic-div',
    skillTags: [isMul ? 'MULTIPLICATION_FACT' : 'DIVISION_FACT', isMul ? 'MULTIPLICATION' : 'DIVISION'],
    problem: isMul ? `${a}×${b}는 얼마인가요?` : `${a * b}÷${b}는 얼마인가요?`,
    answer,
    solution: isMul ? `${a}×${b}=${answer}입니다. 정답은 ${answer}입니다.` : `${a * b}÷${b}=${answer}입니다. 정답은 ${answer}입니다.`
  };
}

function buildPlaceValue(i) {
  const hundreds = 2 + (i % 7);
  const tens = 1 + ((i * 3) % 8);
  const ones = 1 + ((i * 5) % 8);
  const answer = hundreds * 100 + tens * 10 + ones;
  return {
    template: 'place-value',
    skillTags: ['PLACE_VALUE', 'NUMBER_SENSE'],
    problem: `백의 자리 숫자가 ${hundreds}, 십의 자리 숫자가 ${tens}, 일의 자리 숫자가 ${ones}인 수는 얼마인가요?`,
    answer,
    solution: `${hundreds}00+${tens}0+${ones}=${answer}입니다. 정답은 ${answer}입니다.`
  };
}

function buildFractionDecimal(i) {
  const den = choose([2, 4, 5, 10], i);
  const num = 1 + (i % (den - 1));
  const total = den * (2 + (i % 5));
  const answer = (total / den) * num;
  return {
    template: 'fraction-of-quantity',
    skillTags: ['FRACTION_RELATION', 'PART_WHOLE'],
    problem: `${total}개의 ${num}/${den}은 몇 개인가요?`,
    answer: `${answer}개`,
    solution: `${total}÷${den}×${num}=${answer}이므로 정답은 ${answer}개입니다.`
  };
}

function buildMeasurementData(i) {
  const values = [12 + i, 15 + (i % 6), 18 + ((i * 2) % 7)];
  const answer = Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
  return {
    template: 'mean-of-three',
    skillTags: ['AVERAGE', 'DATA_REASONING'],
    problem: `세 기록이 ${values[0]}분, ${values[1]}분, ${values[2]}분입니다. 평균은 몇 분인가요?`,
    answer: `${answer}분`,
    solution: `(${values.join('+')})÷3=${answer}이므로 정답은 ${answer}분입니다.`
  };
}

function buildRatioAverage(i) {
  const unit = 3 + (i % 5);
  const count = 4 + (i % 4);
  const answer = unit * count;
  return {
    template: 'unit-rate-transfer',
    skillTags: ['UNIT_RATE', 'PROPORTION'],
    problem: `공책 1권의 값이 ${unit * 100}원입니다. 같은 공책 ${count}권의 값은 얼마인가요?`,
    answer: `${answer * 100}원`,
    solution: `${unit * 100}×${count}=${answer * 100}이므로 정답은 ${answer * 100}원입니다.`
  };
}

function buildElementaryComposite(i) {
  const base = 18 + i;
  const add = 5 + (i % 6);
  const subtract = 3 + (i % 4);
  const answer = base + add - subtract;
  return {
    template: 'two-step-change',
    skillTags: ['COMPOSITE_RELATION', 'ADDITION', 'SUBTRACTION'],
    problem: `태희가 스티커 ${base}개를 가지고 있었어요. ${add}개를 더 받고 ${subtract}개를 친구에게 주었습니다. 남은 스티커는 몇 개인가요?`,
    answer: `${answer}개`,
    solution: `${base}+${add}-${subtract}=${answer}이므로 정답은 ${answer}개입니다.`
  };
}

function buildIntegerRational(i) {
  const a = 3 + (i % 8);
  const b = 2 + ((i * 2) % 7);
  const answer = a - b;
  return {
    template: 'integer-operation',
    skillTags: ['INTEGER_OPERATION', 'RATIONAL_NUMBER'],
    problem: `수직선에서 ${a}만큼 오른쪽으로 간 뒤 ${b}만큼 왼쪽으로 갔습니다. 처음 위치가 0이면 도착한 위치는 어디인가요?`,
    answer,
    solution: `${a}-${b}=${answer}이므로 정답은 ${answer}입니다.`
  };
}

function buildGcfLcm(i) {
  const a = 12 + (i % 6) * 2;
  const b = 18 + (i % 5) * 3;
  const gcd = greatestCommonDivisor(a, b);
  return {
    template: 'gcf',
    skillTags: ['GCF', 'FACTOR_MULTIPLE'],
    problem: `${a}와 ${b}의 최대공약수는 얼마인가요?`,
    answer: gcd,
    solution: `${a}와 ${b}의 공약수 중 가장 큰 수는 ${gcd}입니다. 정답은 ${gcd}입니다.`
  };
}

function greatestCommonDivisor(a, b) {
  while (b) [a, b] = [b, a % b];
  return Math.abs(a);
}

function buildLinearEquation(i) {
  const x = 2 + (i % 8);
  const a = 2 + (i % 5);
  const b = 3 + (i % 7);
  const c = a * x + b;
  return {
    template: 'linear-equation',
    skillTags: ['LINEAR_EQUATION', 'UNKNOWN_VALUE'],
    problem: `${a}x+${b}=${c}일 때 x의 값은 얼마인가요?`,
    answer: `x=${x}`,
    solution: `${a}x=${c - b}이므로 x=${x}입니다. 정답은 x=${x}입니다.`
  };
}

function buildCoordinateProportion(i) {
  const x = 2 + (i % 6);
  const k = 2 + (i % 5);
  const answer = k * x;
  return {
    template: 'proportional-graph',
    skillTags: ['PROPORTIONAL_GRAPH', 'FUNCTION'],
    problem: `y=${k}x의 그래프 위에서 x=${x}일 때 y의 값은 얼마인가요?`,
    answer,
    solution: `y=${k}×${x}=${answer}이므로 정답은 ${answer}입니다.`
  };
}

function buildLinearFunction(i) {
  const m = 2 + (i % 5);
  const b = 1 + (i % 7);
  const x = 2 + (i % 6);
  const answer = m * x + b;
  return {
    template: 'linear-function-value',
    skillTags: ['LINEAR_FUNCTION', 'FUNCTION_VALUE'],
    problem: `일차함수 y=${m}x+${b}에서 x=${x}일 때 y의 값은 얼마인가요?`,
    answer,
    solution: `y=${m}×${x}+${b}=${answer}이므로 정답은 ${answer}입니다.`
  };
}

function buildSystemOrInequality(i) {
  const x = 1 + (i % 5);
  const y = 2 + (i % 4);
  const sum = x + y;
  const diff = x - y;
  return {
    template: 'linear-system',
    skillTags: ['SYSTEM_OF_EQUATIONS', 'LINEAR_EQUATION'],
    problem: `x+y=${sum}, x-y=${diff}일 때 x의 값은 얼마인가요?`,
    answer: `x=${x}`,
    solution: `두 식을 더하면 2x=${sum + diff}이므로 x=${x}입니다. 정답은 x=${x}입니다.`
  };
}

function buildMiddleGeometry(i) {
  const a = 3 + (i % 8);
  const b = 4 + ((i * 3 + Math.floor(i / 8)) % 9);
  const c2 = a * a + b * b;
  return {
    template: 'pythagorean-square',
    skillTags: ['PYTHAGOREAN', 'GEOMETRY_REASONING'],
    problem: `직각삼각형의 두 직각변 길이가 ${a}cm, ${b}cm입니다. 빗변의 길이의 제곱은 얼마인가요?`,
    answer: `${c2}`,
    solution: `${a}^2+${b}^2=${c2}이므로 정답은 ${c2}입니다.`
  };
}

function buildMiddleProbability(i) {
  const red = 2 + (i % 5);
  const blue = 3 + (i % 4);
  const total = red + blue;
  return {
    template: 'simple-probability-percent',
    skillTags: ['PROBABILITY', 'DATA_REASONING'],
    problem: `빨간 공 ${red}개와 파란 공 ${blue}개가 있습니다. 공 1개를 뽑을 때 빨간 공일 확률을 ${total}분의 몇으로 나타내면 얼마인가요?`,
    answer: `${red}/${total}`,
    solution: `전체는 ${total}개이고 빨간 공은 ${red}개이므로 정답은 ${red}/${total}입니다.`
  };
}

function buildQuadraticBasics(i) {
  const r = 2 + (i % 6);
  const s = 3 + (i % 5);
  const sum = r + s;
  const product = r * s;
  return {
    template: 'quadratic-root-sum',
    skillTags: ['QUADRATIC_EQUATION', 'FACTORING'],
    problem: `이차방정식 x^2-${sum}x+${product}=0의 두 근 중 작은 근은 얼마인가요?`,
    answer: Math.min(r, s),
    solution: `(x-${r})(x-${s})=0이므로 두 근은 ${r}, ${s}입니다. 정답은 ${Math.min(r, s)}입니다.`
  };
}

function buildQuadraticFunction(i) {
  const a = 1 + (i % 3);
  const h = 1 + (i % 5);
  const k = 2 + (i % 7);
  return {
    template: 'quadratic-vertex',
    skillTags: ['QUADRATIC_FUNCTION', 'FUNCTION_GRAPH'],
    problem: `이차함수 y=${a}(x-${h})^2+${k}의 꼭짓점의 y좌표는 얼마인가요?`,
    answer: k,
    solution: `y=${a}(x-${h})^2+${k}의 꼭짓점은 (${h}, ${k})이므로 정답은 ${k}입니다.`
  };
}

function buildCommonMathAlgebra(i) {
  const divisor = 2 + (i % 5);
  const remainder = 1 + (i % 7);
  return {
    template: 'remainder-theorem',
    skillTags: ['REMAINDER_THEOREM', 'POLYNOMIAL'],
    problem: `다항식 P(x)를 x-${divisor}로 나누었을 때의 나머지가 ${remainder}입니다. P(${divisor})의 값은 얼마인가요?`,
    answer: remainder,
    solution: `나머지정리에 의해 P(${divisor})=${remainder}입니다. 정답은 ${remainder}입니다.`
  };
}

function buildMatrixEquation(i) {
  const a = 1 + (i % 4);
  const b = 2 + (i % 5);
  const answer = a + b;
  return {
    template: 'matrix-entry-sum',
    skillTags: ['MATRIX_OPERATION', 'ALGEBRAIC_STRUCTURE'],
    problem: `행렬 A의 첫째 행이 [${a}, ${b}]입니다. 첫째 행의 두 성분의 합은 얼마인가요?`,
    answer,
    solution: `${a}+${b}=${answer}이므로 정답은 ${answer}입니다.`
  };
}

function buildSetFunction(i) {
  const a = 2 + (i % 6);
  const b = 3 + (i % 5);
  const answer = a + b - 1;
  return {
    template: 'set-union-size',
    skillTags: ['SET_OPERATION', 'FUNCTION'],
    problem: `집합 A의 원소가 ${a}개, 집합 B의 원소가 ${b}개이고 공통 원소가 1개입니다. A∪B의 원소는 몇 개인가요?`,
    answer,
    solution: `${a}+${b}-1=${answer}이므로 정답은 ${answer}입니다.`
  };
}

function buildAnalyticCombinatorics(i) {
  const n = 5 + (i % 8);
  const r = 2 + (Math.floor(i / 8) % 3);
  const answer = combination(n, r);
  return {
    template: 'combination-basic',
    skillTags: ['COMBINATION', 'COUNTING'],
    problem: `서로 다른 ${n}명 중 ${r}명을 뽑는 방법의 수는 얼마인가요?`,
    answer,
    solution: `${n}C${r}=${answer}이므로 정답은 ${answer}입니다.`
  };
}

function combination(n, r) {
  let top = 1;
  let bottom = 1;
  for (let offset = 0; offset < r; offset += 1) {
    top *= n - offset;
    bottom *= offset + 1;
  }
  return top / bottom;
}

function buildLogExponential(i) {
  const base = 2 + (i % 3);
  const exponent = 2 + (i % 4);
  const value = base ** exponent;
  return {
    template: 'log-definition',
    skillTags: ['LOGARITHM', 'EXPONENTIAL'],
    problem: `${base}^${exponent}=${value}일 때 log_${base} ${value}의 값은 얼마인가요?`,
    answer: exponent,
    solution: `log_${base} ${value}=${exponent}이므로 정답은 ${exponent}입니다.`
  };
}

function buildTrigonometry(i) {
  const table = {
    sin: {
      30: '1/2',
      45: 'sqrt(2)/2',
      60: 'sqrt(3)/2'
    },
    cos: {
      30: 'sqrt(3)/2',
      45: 'sqrt(2)/2',
      60: '1/2'
    },
    tan: {
      30: 'sqrt(3)/3',
      45: '1',
      60: 'sqrt(3)'
    }
  };
  const functions = ['sin', 'cos', 'tan'];
  const angles = [30, 45, 60];
  const fn = choose(functions, i);
  const angle = choose(angles, Math.floor(i / functions.length));
  const value = table[fn][angle];
  return {
    template: 'special-angle-sine',
    skillTags: ['TRIGONOMETRIC_FUNCTION', 'SPECIAL_ANGLE'],
    problem: `${fn} ${angle}°의 값은 얼마인가요?`,
    answer: value,
    solution: `특수각의 삼각비에 의해 ${fn} ${angle}°=${value}입니다. 정답은 ${value}입니다.`
  };
}

function buildSequenceLimit(i) {
  const a = 2 + (i % 5);
  const d = 1 + (i % 4);
  const n = 5 + (i % 6);
  const answer = a + (n - 1) * d;
  return {
    template: 'arithmetic-sequence',
    skillTags: ['SEQUENCE', 'ALGEBRAIC_PATTERN'],
    problem: `첫째항이 ${a}, 공차가 ${d}인 등차수열의 제${n}항은 얼마인가요?`,
    answer,
    solution: `${a}+(${n}-1)×${d}=${answer}이므로 정답은 ${answer}입니다.`
  };
}

function buildDerivativeBasic(i) {
  const a = 2 + (i % 5);
  const x = 1 + (i % 4);
  const answer = 2 * a * x;
  return {
    template: 'derivative-value',
    skillTags: ['DERIVATIVE', 'FUNCTION_RATE'],
    problem: `f(x)=${a}x^2일 때 f'(${x})의 값은 얼마인가요?`,
    answer,
    solution: `f'(x)=${2 * a}x이고 f'(${x})=${answer}입니다. 정답은 ${answer}입니다.`
  };
}

function buildCalculusApplication(i) {
  const a = 1 + (i % 4);
  const b = 2 + (i % 6);
  const answer = a + b;
  return {
    template: 'integral-linear',
    skillTags: ['INTEGRAL', 'ACCUMULATION'],
    problem: `0부터 1까지 (${2 * a}x+${b})를 적분한 값은 얼마인가요?`,
    answer,
    solution: `[${a}x^2+${b}x]_0^1=${a}+${b}=${answer}입니다. 정답은 ${answer}입니다.`
  };
}

function buildProbabilityDistribution(i) {
  const p = choose([0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5], i);
  const n = 6 + ((i * 5 + Math.floor(i / 9)) % 10);
  const answer = round(n * p, 2);
  return {
    template: 'binomial-expectation',
    skillTags: ['PROBABILITY_DISTRIBUTION', 'EXPECTED_VALUE'],
    problem: `확률변수 X가 B(${n}, ${p})를 따를 때 E(X)의 값은 얼마인가요?`,
    answer,
    solution: `이항분포의 평균은 np=${n}×${p}=${answer}입니다. 정답은 ${answer}입니다.`
  };
}

function buildCsatIntegrated(i) {
  const a = 1 + (i % 4);
  const r = 1 + ((i * 2 + Math.floor(i / 4)) % 7);
  const answer = 2 * a * r ** 3;
  return {
    template: 'calculus-modeling-critical-point',
    skillTags: ['CSAT_INTEGRATED', 'DERIVATIVE', 'COMPOSITE_REASONING'],
    problem: `함수 f(x)=${a}x^3-3×${a}kx^2+cx가 x=${r}에서 극값을 갖고 c=6×${a}k×${r}-3×${a}×${r}^2입니다. f(${2 * r})의 값은 얼마인가요?`,
    answer,
    solution: `f'(${r})=0 조건과 c=6×${a}k×${r}-3×${a}×${r}^2을 이용하면 f(${2 * r})=2×${a}×${r}^3=${answer}입니다. 정답은 ${answer}입니다.`
  };
}

function buildCsatTopTier(i) {
  const a = 1 + (i % 5);
  const r = 2 + ((i * 3 + Math.floor(i / 5)) % 7);
  const answer = 2 * a * r ** 3;
  return {
    template: 'csat-top-derivative-parameter',
    skillTags: ['CSAT_TOP_TIER', 'DERIVATIVE', 'PARAMETER_REASONING', 'COMPOSITE_REASONING'],
    prerequisites: ['QUADRATIC_FUNCTION', 'DERIVATIVE', 'FUNCTION_GRAPH'],
    problem: `실수 k와 c에 대하여 f(x)=${a}x^3-3×${a}kx^2+cx라 하자. f(x)가 x=${r}에서 극값을 갖고 c=6×${a}k×${r}-3×${a}×${r}^2일 때, f(${2 * r})의 값은 얼마인가요? 조건을 먼저 식으로 바꾸어 k가 사라지는 구조를 확인하세요.`,
    answer,
    solution: `f'(x)=3×${a}x^2-6×${a}kx+c이고 f'(${r})=0입니다. c=6×${a}k×${r}-3×${a}×${r}^2이므로 f(${2 * r})=2×${a}×${r}^3=${answer}입니다. 정답은 ${answer}입니다.`
  };
}

const BLUEPRINTS = [
  { level: 1, schoolBand: 'elementary', gradeBand: 'G1_G2', course: '초등 기초 연산', domain: '수와 연산', topic: '한 자리 수 덧셈과 뺄셈', family: 'ADD_SINGLE_DIGIT', structure: 'ADD_SINGLE_DIGIT', skillTags: ['NUMBER_SENSE'], prerequisites: [], reasoningTags: ['DIRECT_REASONING'], reasoningDepth: 1, representationHint: 'unit_blocks', build: buildAdditionSingleDigit },
  { level: 1, schoolBand: 'elementary', gradeBand: 'G1_G2', course: '초등 기초 연산', domain: '수와 연산', topic: '한 자리 수 덧셈과 뺄셈', family: 'SUB_SINGLE_DIGIT', structure: 'SUB_SINGLE_DIGIT', skillTags: ['NUMBER_SENSE'], prerequisites: ['ADD_SINGLE_DIGIT'], reasoningTags: ['DIRECT_REASONING'], reasoningDepth: 1, representationHint: 'unit_blocks', build: buildSubtractionSingleDigit },
  { level: 2, schoolBand: 'elementary', gradeBand: 'G1_G2', course: '초등 기초 연산', domain: '수와 연산', topic: '두 자리 수 덧셈과 뺄셈', family: 'TWO_DIGIT_ADD_SUB', structure: 'TWO_DIGIT_ADD_SUB', skillTags: ['NUMBER_SENSE'], prerequisites: ['ADD_SINGLE_DIGIT', 'SUB_SINGLE_DIGIT'], reasoningTags: ['DIRECT_REASONING'], reasoningDepth: 1, representationHint: 'unit_blocks', build: buildTwoDigitAddSub },
  { level: 3, schoolBand: 'elementary', gradeBand: 'G1_G2', course: '초등 수와 연산', domain: '수와 연산', topic: '곱셈과 나눗셈 기초', family: 'MUL_DIV_FACT', structure: 'MUL_DIV_FACT', skillTags: ['NUMBER_SENSE'], prerequisites: ['TWO_DIGIT_ADD_SUB'], reasoningTags: ['DIRECT_REASONING'], reasoningDepth: 1, representationHint: 'unit_blocks', build: buildMultiplicationDivision },
  { level: 4, schoolBand: 'elementary', gradeBand: 'G3_G4', course: '초등 수와 연산', domain: '수와 연산', topic: '자릿값과 수 구조', family: 'PLACE_VALUE_STRUCTURE', structure: 'PLACE_VALUE_STRUCTURE', skillTags: ['STRUCTURE'], prerequisites: ['TWO_DIGIT_ADD_SUB'], reasoningTags: ['STRUCTURE_REASONING'], reasoningDepth: 2, representationHint: 'table', build: buildPlaceValue },
  { level: 5, schoolBand: 'elementary', gradeBand: 'G3_G4', course: '초등 수와 연산', domain: '수와 연산', topic: '분수와 소수의 이해', family: 'FRACTION_OF_QUANTITY', structure: 'FRACTION_OF_QUANTITY', skillTags: ['FRACTION_RELATION'], prerequisites: ['MUL_DIV_FACT'], reasoningTags: ['PART_WHOLE'], reasoningDepth: 2, representationHint: 'bar_model', build: buildFractionDecimal },
  { level: 6, schoolBand: 'elementary', gradeBand: 'G3_G4', course: '초등 관계 문장제', domain: '자료와 가능성', topic: '측정과 자료 해석', family: 'MEAN_OF_THREE', structure: 'MEAN_OF_THREE', skillTags: ['MEASUREMENT'], prerequisites: ['TWO_DIGIT_ADD_SUB'], reasoningTags: ['DATA_REASONING'], reasoningDepth: 2, representationHint: 'table', build: buildMeasurementData },
  { level: 7, schoolBand: 'elementary', gradeBand: 'G5_G6', course: '초등 관계 문장제', domain: '변화와 관계', topic: '비와 비율', family: 'UNIT_RATE_TRANSFER', structure: 'UNIT_RATE_TRANSFER', skillTags: ['PROPORTION'], prerequisites: ['FRACTION_RELATION'], reasoningTags: ['TRANSFER'], reasoningDepth: 3, representationHint: 'table', build: buildRatioAverage },
  { level: 8, schoolBand: 'elementary', gradeBand: 'G5_G6', course: '초등 관계 문장제', domain: '변화와 관계', topic: '복합 문장제', family: 'ELEMENTARY_TWO_STEP_CHANGE', structure: 'ELEMENTARY_TWO_STEP_CHANGE', skillTags: ['COMPOSITE_RELATION'], prerequisites: ['ADDITION', 'SUBTRACTION'], reasoningTags: ['MULTI_STEP_RELATION'], reasoningDepth: 3, representationHint: 'bar_model', build: buildElementaryComposite },
  { level: 9, schoolBand: 'middle_school', gradeBand: 'M1', course: '중학 수와 식', domain: '수와 연산', topic: '정수와 유리수', family: 'INTEGER_OPERATION', structure: 'INTEGER_OPERATION', skillTags: ['RATIONAL_NUMBER'], prerequisites: ['NUMBER_SENSE'], reasoningTags: ['SIGNED_NUMBER_REASONING'], reasoningDepth: 2, representationHint: 'number_line', build: buildIntegerRational },
  { level: 10, schoolBand: 'middle_school', gradeBand: 'M1', course: '중학 수와 식', domain: '수와 연산', topic: '소인수분해와 최대공약수', family: 'GCF_REASONING', structure: 'GCF_REASONING', skillTags: ['FACTOR_MULTIPLE'], prerequisites: ['MUL_DIV_FACT'], reasoningTags: ['STRUCTURE_REASONING'], reasoningDepth: 2, representationHint: 'table', build: buildGcfLcm },
  { level: 11, schoolBand: 'middle_school', gradeBand: 'M1', course: '중학 수와 식', domain: '변화와 관계', topic: '일차방정식', family: 'LINEAR_EQUATION_SOLVE', structure: 'LINEAR_EQUATION_SOLVE', skillTags: ['UNKNOWN_VALUE'], prerequisites: ['INTEGER_OPERATION'], reasoningTags: ['EQUATION_REASONING'], reasoningDepth: 2, representationHint: 'equation', build: buildLinearEquation },
  { level: 12, schoolBand: 'middle_school', gradeBand: 'M1', course: '중학 함수', domain: '변화와 관계', topic: '좌표와 정비례', family: 'PROPORTIONAL_GRAPH', structure: 'PROPORTIONAL_GRAPH', skillTags: ['FUNCTION'], prerequisites: ['PROPORTION'], reasoningTags: ['FUNCTION_REASONING'], reasoningDepth: 2, representationHint: 'graph', build: buildCoordinateProportion },
  { level: 13, schoolBand: 'middle_school', gradeBand: 'M2', course: '중학 함수', domain: '변화와 관계', topic: '일차함수', family: 'LINEAR_FUNCTION_VALUE', structure: 'LINEAR_FUNCTION_VALUE', skillTags: ['FUNCTION'], prerequisites: ['LINEAR_EQUATION'], reasoningTags: ['FUNCTION_REASONING'], reasoningDepth: 2, representationHint: 'graph', build: buildLinearFunction },
  { level: 14, schoolBand: 'middle_school', gradeBand: 'M2', course: '중학 수와 식', domain: '변화와 관계', topic: '연립방정식과 부등식', family: 'LINEAR_SYSTEM', structure: 'LINEAR_SYSTEM', skillTags: ['UNKNOWN_VALUE'], prerequisites: ['LINEAR_EQUATION'], reasoningTags: ['EQUATION_REASONING'], reasoningDepth: 3, representationHint: 'equation', build: buildSystemOrInequality },
  { level: 15, schoolBand: 'middle_school', gradeBand: 'M2_M3', course: '중학 기하', domain: '도형과 측정', topic: '피타고라스 정리와 닮음', family: 'PYTHAGOREAN_SQUARE', structure: 'PYTHAGOREAN_SQUARE', skillTags: ['GEOMETRY_REASONING'], prerequisites: ['SQUARE_NUMBER'], reasoningTags: ['GEOMETRY_REASONING'], reasoningDepth: 3, representationHint: 'diagram', build: buildMiddleGeometry },
  { level: 16, schoolBand: 'middle_school', gradeBand: 'M2_M3', course: '중학 확률과 통계', domain: '자료와 가능성', topic: '확률과 통계', family: 'SIMPLE_PROBABILITY', structure: 'SIMPLE_PROBABILITY', skillTags: ['PROBABILITY'], prerequisites: ['FRACTION_RELATION'], reasoningTags: ['DATA_REASONING'], reasoningDepth: 3, representationHint: 'table', build: buildMiddleProbability },
  { level: 17, schoolBand: 'middle_school', gradeBand: 'M3', course: '중학 수와 식', domain: '변화와 관계', topic: '제곱근과 이차식', family: 'QUADRATIC_ROOTS', structure: 'QUADRATIC_ROOTS', skillTags: ['FACTORING'], prerequisites: ['LINEAR_EQUATION'], reasoningTags: ['ALGEBRAIC_REASONING'], reasoningDepth: 3, representationHint: 'equation', build: buildQuadraticBasics },
  { level: 18, schoolBand: 'middle_school', gradeBand: 'M3', course: '중학 함수', domain: '변화와 관계', topic: '이차함수', family: 'QUADRATIC_VERTEX', structure: 'QUADRATIC_VERTEX', skillTags: ['QUADRATIC_FUNCTION'], prerequisites: ['LINEAR_FUNCTION'], reasoningTags: ['FUNCTION_REASONING'], reasoningDepth: 3, representationHint: 'graph', build: buildQuadraticFunction },
  { level: 19, schoolBand: 'high_school', gradeBand: 'H1', course: '공통수학1', domain: '변화와 관계', topic: '다항식과 나머지정리', family: 'REMAINDER_THEOREM', structure: 'REMAINDER_THEOREM', skillTags: ['POLYNOMIAL'], prerequisites: ['FACTORING'], reasoningTags: ['ALGEBRAIC_REASONING'], reasoningDepth: 3, representationHint: 'equation', build: buildCommonMathAlgebra },
  { level: 20, schoolBand: 'high_school', gradeBand: 'H1', course: '공통수학1', domain: '변화와 관계', topic: '행렬과 방정식', family: 'MATRIX_ENTRY_SUM', structure: 'MATRIX_ENTRY_SUM', skillTags: ['MATRIX_OPERATION'], prerequisites: ['LINEAR_SYSTEM'], reasoningTags: ['STRUCTURE_REASONING'], reasoningDepth: 3, representationHint: 'table', build: buildMatrixEquation },
  { level: 21, schoolBand: 'high_school', gradeBand: 'H1', course: '공통수학2', domain: '변화와 관계', topic: '집합과 함수', family: 'SET_UNION_SIZE', structure: 'SET_UNION_SIZE', skillTags: ['SET_OPERATION', 'FUNCTION'], prerequisites: ['FUNCTION'], reasoningTags: ['STRUCTURE_REASONING'], reasoningDepth: 3, representationHint: 'table', build: buildSetFunction },
  { level: 22, schoolBand: 'high_school', gradeBand: 'H1', course: '공통수학2', domain: '자료와 가능성', topic: '해석기하와 순열조합', family: 'COMBINATION_BASIC', structure: 'COMBINATION_BASIC', skillTags: ['COMBINATION'], prerequisites: ['COUNTING'], reasoningTags: ['COUNTING_REASONING'], reasoningDepth: 3, representationHint: 'tree', build: buildAnalyticCombinatorics },
  { level: 23, schoolBand: 'high_school', gradeBand: 'H2', course: '대수', domain: '변화와 관계', topic: '지수와 로그', family: 'LOG_DEFINITION', structure: 'LOG_DEFINITION', skillTags: ['LOGARITHM'], prerequisites: ['EXPONENT'], reasoningTags: ['FUNCTION_REASONING'], reasoningDepth: 3, representationHint: 'equation', build: buildLogExponential },
  { level: 24, schoolBand: 'high_school', gradeBand: 'H2', course: '대수', domain: '변화와 관계', topic: '삼각함수', family: 'SPECIAL_ANGLE_SINE', structure: 'SPECIAL_ANGLE_SINE', skillTags: ['TRIGONOMETRIC_FUNCTION'], prerequisites: ['GEOMETRY_REASONING'], reasoningTags: ['FUNCTION_REASONING'], reasoningDepth: 3, representationHint: 'unit_circle', build: buildTrigonometry },
  { level: 25, schoolBand: 'high_school', gradeBand: 'H2', course: '미적분I', domain: '해석(미적분)', topic: '수열과 극한', family: 'ARITHMETIC_SEQUENCE', structure: 'ARITHMETIC_SEQUENCE', skillTags: ['SEQUENCE'], prerequisites: ['FUNCTION'], reasoningTags: ['PATTERN_REASONING'], reasoningDepth: 3, representationHint: 'table', build: buildSequenceLimit },
  { level: 26, schoolBand: 'high_school', gradeBand: 'H2', course: '미적분I', domain: '해석(미적분)', topic: '미분계수와 도함수', family: 'DERIVATIVE_VALUE', structure: 'DERIVATIVE_VALUE', skillTags: ['DERIVATIVE'], prerequisites: ['QUADRATIC_FUNCTION'], reasoningTags: ['RATE_REASONING'], reasoningDepth: 4, representationHint: 'graph', build: buildDerivativeBasic },
  { level: 27, schoolBand: 'high_school', gradeBand: 'H2', course: '미적분I', domain: '해석(미적분)', topic: '정적분과 활용', family: 'INTEGRAL_LINEAR', structure: 'INTEGRAL_LINEAR', skillTags: ['INTEGRAL'], prerequisites: ['DERIVATIVE'], reasoningTags: ['ACCUMULATION_REASONING'], reasoningDepth: 4, representationHint: 'area_model', build: buildCalculusApplication },
  { level: 28, schoolBand: 'high_school', gradeBand: 'H2', course: '확률과 통계', domain: '자료와 가능성', topic: '확률분포와 통계적 추정', family: 'BINOMIAL_EXPECTATION', structure: 'BINOMIAL_EXPECTATION', skillTags: ['EXPECTED_VALUE'], prerequisites: ['PROBABILITY'], reasoningTags: ['DATA_REASONING'], reasoningDepth: 4, representationHint: 'table', build: buildProbabilityDistribution },
  { level: 29, schoolBand: 'csat', gradeBand: 'CSAT', course: '수능형 통합', domain: '해석(미적분)', topic: '수능형 통합 추론', family: 'CSAT_INTEGRATED_MODELING', structure: 'CSAT_INTEGRATED_MODELING', skillTags: ['CSAT_INTEGRATED'], prerequisites: ['DERIVATIVE', 'FUNCTION_GRAPH'], reasoningTags: ['COMPOSITE_REASONING'], reasoningDepth: 4, representationHint: 'equation', build: buildCsatIntegrated },
  { level: 30, schoolBand: 'csat', gradeBand: 'CSAT', course: '수능형 통합', domain: '해석(미적분)', topic: '수능 최상위 변별', family: 'CSAT_TOP_TIER_DERIVATIVE_PARAMETER', structure: 'CSAT_TOP_TIER_DERIVATIVE_PARAMETER', skillTags: ['CSAT_TOP_TIER'], prerequisites: ['DERIVATIVE', 'FUNCTION_GRAPH'], reasoningTags: ['COMPOSITE_REASONING', 'PARAMETER_REASONING'], reasoningDepth: 4, representationHint: 'equation', build: buildCsatTopTier }
];

function generate() {
  const items = [];
  const variantsPerLevel = 36;
  for (let level = 1; level <= 30; level += 1) {
    const blueprints = BLUEPRINTS.filter(blueprint => blueprint.level === level);
    for (let index = 0; index < variantsPerLevel; index += 1) {
      const blueprint = blueprints[index % blueprints.length];
      const built = blueprint.build(index);
      items.push(makeItem(level, index, blueprint, built));
    }
  }

  return {
    metadata: {
      created_at: '2026-05-21',
      scope: 'k12_to_csat_math',
      language: 'ko',
      source_policy: 'Coverage follows the 2022 revised Korean math curriculum structure and CSAT public exam frame. Problem texts are original deterministic seed items.',
      item_count: items.length,
      difficulty_scale: '1-30',
      schema_version: 1,
      level_count: 30,
      easiest_anchor: 'single-digit addition and subtraction',
      hardest_anchor: 'CSAT-style integrated top-tier mathematics',
      irt_b_range: [-3, 3]
    },
    items
  };
}

const bank = generate();
fs.writeFileSync(outPath, `${JSON.stringify(bank, null, 2)}\n`, 'utf8');
console.log(`Wrote ${bank.items.length} K-12 math problem seed items to ${outPath}`);
