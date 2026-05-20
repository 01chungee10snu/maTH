const fs = require('fs');
const path = require('path');

const outPath = path.resolve(__dirname, '..', 'data', 'elementary_word_problem_seed_bank.json');

const names = ['태희', '민지', '하준', '서아', '지우', '도윤', '수빈', '연우', '지민', '유나'];
const objects = ['스티커', '구슬', '색종이', '연필', '딱지', '쿠키', '사탕', '공책', '책', '카드'];
const containers = ['상자', '바구니', '봉지', '접시', '컵', '통', '주머니', '서랍', '상자', '가방'];
const colors = ['빨간', '파란', '노란', '초록', '보라', '하얀', '검은', '분홍', '주황', '남색'];

const LEVEL_LABELS = {
  1: '기초 인식',
  2: '기초 적용',
  3: '표준 개념',
  4: '표준 적용',
  5: '관계 해석',
  6: '복합 적용',
  7: '심화 구조화',
  8: '전이 적용',
  9: '고난도 복합',
  10: '도전 추론',
  11: '상위 전이',
  12: '확장 사고'
};

const DOMAIN_BY_TOPIC = {
  '네 자리 이하의 수': '수와 연산',
  '두 자리 수 범위의 덧셈과 뺄셈': '수와 연산',
  '곱셈의 의미': '수와 연산',
  '길이, 시각, 시간': '도형과 측정',
  '표와 그래프': '자료와 가능성',
  '자연수의 곱셈과 나눗셈': '수와 연산',
  '분수와 소수의 이해': '수와 연산',
  '들이와 무게': '도형과 측정',
  '시간과 길이': '도형과 측정',
  '막대그래프': '자료와 가능성',
  '꺾은선그래프': '자료와 가능성',
  '규칙 찾기와 표현': '변화와 관계',
  '자연수의 혼합 계산': '수와 연산',
  '약수와 배수': '수와 연산',
  '분수의 덧셈과 뺄셈': '수와 연산',
  '분수의 곱셈과 나눗셈': '수와 연산',
  '소수의 곱셈과 나눗셈': '수와 연산',
  '비와 비율': '변화와 관계',
  '비례식과 비례배분': '변화와 관계',
  '평균': '자료와 가능성',
  '그림그래프': '자료와 가능성',
  '띠그래프와 원그래프': '자료와 가능성',
  '가능성': '자료와 가능성',
  '원의 넓이': '도형과 측정',
  '직육면체의 부피와 겉넓이': '도형과 측정'
};

function n(i, offset = 0) {
  return i + offset;
}

function pick(list, i) {
  return list[i % list.length];
}

function gcd(a, b) {
  while (b) [a, b] = [b, a % b];
  return Math.abs(a);
}

function lcm(a, b) {
  return (a * b) / gcd(a, b);
}

function simplify(num, den) {
  const g = gcd(num, den);
  return [num / g, den / g];
}

function fractionText(num, den) {
  const [a, b] = simplify(num, den);
  return b === 1 ? String(a) : `${a}/${b}`;
}

function level(difficulty) {
  return LEVEL_LABELS[difficulty];
}

function makeItem(gradeBand, topic, family, variant, difficulty, skillTags, problem, answer, solution) {
  return {
    id: `EWP_${gradeBand.replace(/_/g, '')}_${family}_${String(variant).padStart(3, '0')}`,
    grade_band: gradeBand,
    curriculum_domain: DOMAIN_BY_TOPIC[topic] || '수와 연산',
    topic,
    type_family: family,
    type: `${family}_V${variant}`,
    skill_tags: skillTags,
    difficulty,
    level_label: level(difficulty),
    problem,
    answer,
    solution
  };
}

const families = [
  {
    gradeBand: 'G1_G2',
    topic: '두 자리 수 범위의 덧셈과 뺄셈',
    family: 'ADD_JOIN_RESULT_UNKNOWN',
    difficulty: 1,
    skillTags: ['ADDITION', 'CHANGE_RELATION'],
    build(i) {
      const a = 7 + n(i);
      const b = 4 + (i % 6);
      const obj = pick(objects, i);
      return [
        `${pick(names, i)}가 ${obj} ${a}개를 가지고 있었어요. 친구가 ${b}개를 더 주었어요. ${obj}는 모두 몇 개가 되었을까요?`,
        `${a + b}개`,
        `${a}개에 ${b}개를 더하므로 ${a}+${b}=${a + b}입니다.`
      ];
    }
  },
  {
    gradeBand: 'G1_G2',
    topic: '두 자리 수 범위의 덧셈과 뺄셈',
    family: 'ADD_JOIN_CHANGE_UNKNOWN',
    difficulty: 2,
    skillTags: ['ADDITION', 'UNKNOWN_CHANGE'],
    build(i) {
      const start = 8 + i;
      const change = 5 + (i % 5);
      const total = start + change;
      const obj = pick(objects, i + 2);
      return [
        `${pick(names, i)}가 ${obj} ${start}개를 가지고 있었는데 더 받았더니 ${total}개가 되었어요. 더 받은 ${obj}는 몇 개일까요?`,
        `${change}개`,
        `${start}개에서 ${total}개가 되었으므로 늘어난 수는 ${total}-${start}=${change}입니다.`
      ];
    }
  },
  {
    gradeBand: 'G1_G2',
    topic: '두 자리 수 범위의 덧셈과 뺄셈',
    family: 'SUB_TAKE_RESULT_UNKNOWN',
    difficulty: 1,
    skillTags: ['SUBTRACTION', 'CHANGE_RELATION'],
    build(i) {
      const start = 18 + i;
      const take = 5 + (i % 8);
      const obj = pick(objects, i + 4);
      return [
        `${pick(containers, i)}에 ${obj}가 ${start}개 있었어요. 그중 ${take}개를 꺼냈어요. 남은 ${obj}는 몇 개일까요?`,
        `${start - take}개`,
        `${start}개에서 ${take}개를 빼므로 ${start}-${take}=${start - take}입니다.`
      ];
    }
  },
  {
    gradeBand: 'G1_G2',
    topic: '두 자리 수 범위의 덧셈과 뺄셈',
    family: 'SUB_TAKE_START_UNKNOWN',
    difficulty: 3,
    skillTags: ['SUBTRACTION', 'UNKNOWN_START'],
    build(i) {
      const left = 9 + i;
      const take = 4 + (i % 6);
      const start = left + take;
      const obj = pick(objects, i + 6);
      return [
        `${obj}를 ${take}개 나누어 주었더니 ${left}개가 남았어요. 처음에는 ${obj}가 몇 개 있었을까요?`,
        `${start}개`,
        `처음 수는 남은 ${left}개와 나누어 준 ${take}개를 합한 ${start}개입니다.`
      ];
    }
  },
  {
    gradeBand: 'G1_G2',
    topic: '두 자리 수 범위의 덧셈과 뺄셈',
    family: 'COMPARE_DIFFERENCE',
    difficulty: 2,
    skillTags: ['SUBTRACTION', 'COMPARE'],
    build(i) {
      const large = 17 + i;
      const diff = 4 + (i % 7);
      const small = large - diff;
      const obj = pick(objects, i + 1);
      return [
        `${pick(names, i)}는 ${obj} ${large}개, ${pick(names, i + 1)}는 ${obj} ${small}개를 가지고 있어요. 더 많은 사람은 몇 개 더 많이 가지고 있을까요?`,
        `${diff}개`,
        `두 수의 차이는 ${large}-${small}=${diff}입니다.`
      ];
    }
  },
  {
    gradeBand: 'G1_G2',
    topic: '두 자리 수 범위의 덧셈과 뺄셈',
    family: 'PART_PART_WHOLE_TOTAL',
    difficulty: 1,
    skillTags: ['ADDITION', 'PART_WHOLE'],
    build(i) {
      const a = 5 + (i % 8);
      const b = 6 + (i % 7);
      const obj = pick(objects, i + 3);
      return [
        `${pick(colors, i)} ${obj}가 ${a}개, ${pick(colors, i + 1)} ${obj}가 ${b}개 있어요. ${obj}는 모두 몇 개일까요?`,
        `${a + b}개`,
        `두 부분을 합치므로 ${a}+${b}=${a + b}입니다.`
      ];
    }
  },
  {
    gradeBand: 'G1_G2',
    topic: '네 자리 이하의 수',
    family: 'PLACE_VALUE_DIGIT',
    difficulty: 2,
    skillTags: ['PLACE_VALUE', 'NUMBER_SENSE'],
    build(i) {
      const num = 200 + i * 73;
      const text = String(num);
      const digit = text[text.length - 2];
      return [
        `도서관 책 번호 ${num}에서 십의 자리 숫자는 무엇일까요?`,
        digit,
        `${num}에서 오른쪽에서 두 번째 자리가 십의 자리이므로 답은 ${digit}입니다.`
      ];
    }
  },
  {
    gradeBand: 'G1_G2',
    topic: '곱셈의 의미',
    family: 'MUL_EQUAL_GROUPS_PRODUCT',
    difficulty: 2,
    skillTags: ['MULTIPLICATION_MEANING', 'EQUAL_GROUPS'],
    build(i) {
      const groups = 3 + (i % 5);
      const size = 2 + (i % 6);
      const obj = pick(objects, i + 5);
      return [
        `${pick(containers, i)} ${groups}개에 ${obj}가 ${size}개씩 들어 있어요. ${obj}는 모두 몇 개일까요?`,
        `${groups * size}개`,
        `${size}개씩 ${groups}묶음이므로 ${size}x${groups}=${groups * size}입니다.`
      ];
    }
  },
  {
    gradeBand: 'G1_G2',
    topic: '곱셈의 의미',
    family: 'MUL_ARRAY_PRODUCT',
    difficulty: 3,
    skillTags: ['MULTIPLICATION_MEANING', 'ARRAY'],
    build(i) {
      const rows = 2 + (i % 4);
      const cols = 4 + (i % 5);
      return [
        `화분이 한 줄에 ${cols}개씩 ${rows}줄 놓여 있어요. 화분은 모두 몇 개일까요?`,
        `${rows * cols}개`,
        `${cols}개씩 ${rows}줄이므로 ${cols}x${rows}=${rows * cols}입니다.`
      ];
    }
  },
  {
    gradeBand: 'G1_G2',
    topic: '길이, 시각, 시간',
    family: 'MEAS_LENGTH_COMPARE',
    difficulty: 2,
    skillTags: ['MEASUREMENT', 'COMPARE'],
    build(i) {
      const a = 15 + i * 2;
      const b = a - (3 + (i % 8));
      return [
        `${pick(colors, i)} 리본은 ${a}cm, ${pick(colors, i + 1)} 리본은 ${b}cm예요. 더 긴 리본은 몇 cm 더 길까요?`,
        `${a - b}cm`,
        `길이의 차이는 ${a}-${b}=${a - b}cm입니다.`
      ];
    }
  },
  {
    gradeBand: 'G1_G2',
    topic: '길이, 시각, 시간',
    family: 'TIME_ELAPSED_HOURS',
    difficulty: 2,
    skillTags: ['TIME', 'CHANGE_RELATION'],
    build(i) {
      const start = 1 + (i % 9);
      const elapsed = 1 + (i % 4);
      const end = ((start + elapsed - 1) % 12) + 1;
      return [
        `${pick(names, i)}가 ${start}시에 놀이터에 가서 ${end}시에 돌아왔어요. 놀이터에 있었던 시간은 몇 시간일까요?`,
        `${elapsed}시간`,
        `${start}시에서 ${end}시까지는 ${elapsed}시간입니다.`
      ];
    }
  },
  {
    gradeBand: 'G1_G2',
    topic: '표와 그래프',
    family: 'DATA_TABLE_TOTAL',
    difficulty: 2,
    skillTags: ['DATA_READING', 'ADDITION'],
    build(i) {
      const a = 3 + (i % 6);
      const b = 4 + (i % 7);
      const c = 2 + (i % 5);
      return [
        `월요일에는 책을 ${a}권, 화요일에는 ${b}권, 수요일에는 ${c}권 읽었어요. 세 날 동안 읽은 책은 모두 몇 권일까요?`,
        `${a + b + c}권`,
        `${a}+${b}+${c}=${a + b + c}입니다.`
      ];
    }
  },
  {
    gradeBand: 'G1_G2',
    topic: '표와 그래프',
    family: 'DATA_TABLE_COMPARE',
    difficulty: 3,
    skillTags: ['DATA_READING', 'COMPARE'],
    build(i) {
      const a = 8 + i;
      const b = 5 + (i % 5);
      return [
        `좋아하는 과일 조사에서 사과는 ${a}명, 바나나는 ${b}명이 골랐어요. 사과를 고른 학생은 바나나보다 몇 명 많을까요?`,
        `${a - b}명`,
        `${a}-${b}=${a - b}명입니다.`
      ];
    }
  },
  {
    gradeBand: 'G3_G4',
    topic: '자연수의 곱셈과 나눗셈',
    family: 'DIV_EQUAL_SHARING',
    difficulty: 3,
    skillTags: ['EQUAL_SHARING', 'DIVISION'],
    build(i) {
      const people = 3 + (i % 7);
      const each = 4 + (i % 8);
      const total = people * each;
      const obj = pick(objects, i);
      return [
        `${obj} ${total}개를 ${people}명에게 똑같이 나누어 주려고 해요. 한 명은 몇 개씩 받을까요?`,
        `${each}개`,
        `${total}개를 ${people}명에게 나누므로 ${total}÷${people}=${each}입니다.`
      ];
    }
  },
  {
    gradeBand: 'G3_G4',
    topic: '자연수의 곱셈과 나눗셈',
    family: 'DIV_GROUP_COUNT',
    difficulty: 3,
    skillTags: ['QUOTATIVE_DIVISION', 'GROUP_COUNT'],
    build(i) {
      const size = 3 + (i % 7);
      const groups = 5 + (i % 8);
      const total = size * groups;
      const obj = pick(objects, i + 1);
      return [
        `${obj} ${total}개를 한 ${pick(containers, i)}에 ${size}개씩 담으려고 해요. 모두 몇 ${pick(containers, i)}가 필요할까요?`,
        `${groups}개`,
        `${total}개를 ${size}개씩 묶으므로 ${total}÷${size}=${groups}입니다.`
      ];
    }
  },
  {
    gradeBand: 'G3_G4',
    topic: '자연수의 곱셈과 나눗셈',
    family: 'DIV_UNKNOWN_FACTOR',
    difficulty: 4,
    skillTags: ['DIVISION', 'UNKNOWN_FACTOR'],
    build(i) {
      const row = 4 + (i % 6);
      const rows = 5 + (i % 7);
      const total = row * rows;
      return [
        `한 줄에 의자를 ${row}개씩 놓았더니 모두 ${total}개가 되었어요. 의자는 몇 줄로 놓았을까요?`,
        `${rows}줄`,
        `${total}개를 ${row}개씩 나누면 ${total}÷${row}=${rows}입니다.`
      ];
    }
  },
  {
    gradeBand: 'G3_G4',
    topic: '자연수의 곱셈과 나눗셈',
    family: 'DIV_REMAINDER_INTERPRET',
    difficulty: 5,
    skillTags: ['DIVISION', 'REMAINDER_INTERPRETATION'],
    build(i) {
      const size = 4 + (i % 5);
      const groups = 5 + (i % 7);
      const rem = 1 + (i % (size - 1));
      const total = size * groups + rem;
      return [
        `학생 ${total}명이 한 모둠에 ${size}명씩 앉으려고 해요. ${size}명씩 꽉 찬 모둠은 몇 모둠이고 남는 학생은 몇 명일까요?`,
        `${groups}모둠, ${rem}명`,
        `${total}÷${size}=${groups} 나머지 ${rem}입니다.`
      ];
    }
  },
  {
    gradeBand: 'G3_G4',
    topic: '자연수의 곱셈과 나눗셈',
    family: 'UNIT_PRICE_FIND',
    difficulty: 4,
    skillTags: ['UNIT_COMPARE', 'DIVISION'],
    build(i) {
      const count = 3 + (i % 7);
      const unit = 500 + 100 * i;
      const total = count * unit;
      return [
        `공책 ${count}권의 값이 ${total}원이에요. 공책 1권의 값은 얼마일까요?`,
        `${unit}원`,
        `${total}원을 ${count}권으로 나누면 ${unit}원입니다.`
      ];
    }
  },
  {
    gradeBand: 'G3_G4',
    topic: '자연수의 곱셈과 나눗셈',
    family: 'INVERSE_CONTAINER_SIZE',
    difficulty: 5,
    skillTags: ['INVERSE_RELATION', 'UNIT_COMPARE'],
    build(i) {
      const small = 8 + i;
      const big = 4 + Math.floor(i / 2);
      return [
        `같은 물통을 작은 컵으로는 ${small}컵, 큰 컵으로는 ${big}컵 부어야 채울 수 있어요. 어느 컵이 더 클까요?`,
        `큰 컵`,
        `같은 양을 더 적은 횟수로 채우는 컵이 한 번에 더 많이 담으므로 큰 컵입니다.`
      ];
    }
  },
  {
    gradeBand: 'G3_G4',
    topic: '분수와 소수의 이해',
    family: 'FRAC_PART_OF_WHOLE',
    difficulty: 3,
    skillTags: ['FRACTION_RELATION', 'PART_WHOLE'],
    build(i) {
      const den = 4 + (i % 8);
      const num = 1 + (i % (den - 1));
      return [
        `피자 한 판을 똑같이 ${den}조각으로 나누었어요. 그중 ${num}조각을 먹었다면 먹은 양은 한 판의 얼마일까요?`,
        `${num}/${den}`,
        `전체 ${den}조각 중 ${num}조각이므로 ${num}/${den}입니다.`
      ];
    }
  },
  {
    gradeBand: 'G3_G4',
    topic: '분수와 소수의 이해',
    family: 'FRAC_COMPARE_SAME_NUMERATOR',
    difficulty: 4,
    skillTags: ['FRACTION_RELATION', 'COMPARE'],
    build(i) {
      const a = 3 + (i % 4);
      const b = a + 2 + (i % 3);
      return [
        `같은 크기의 케이크에서 ${pick(names, i)}는 1/${a}, ${pick(names, i + 1)}는 1/${b}을 먹었어요. 누가 더 많이 먹었을까요?`,
        `${pick(names, i)}`,
        `분자가 같을 때 분모가 작을수록 크므로 1/${a}이 1/${b}보다 큽니다.`
      ];
    }
  },
  {
    gradeBand: 'G3_G4',
    topic: '분수와 소수의 이해',
    family: 'FRAC_EQUIVALENCE',
    difficulty: 5,
    skillTags: ['FRACTION_RELATION', 'EQUIVALENCE'],
    build(i) {
      const den = 2 + (i % 5);
      const k = 2 + (i % 4);
      return [
        `같은 크기의 초콜릿에서 한 조각은 1/${den}, 다른 조각은 ${k}/${den * k}이라고 표시했어요. 두 양은 같을까요?`,
        `같다`,
        `${k}/${den * k}은 약분하면 1/${den}이므로 같습니다.`
      ];
    }
  },
  {
    gradeBand: 'G3_G4',
    topic: '분수와 소수의 이해',
    family: 'DECIMAL_COMPARE',
    difficulty: 4,
    skillTags: ['DECIMAL', 'COMPARE'],
    build(i) {
      const a = (12 + i) / 10;
      const b = (16 + i) / 10;
      return [
        `리본 A는 ${a.toFixed(1)}m, 리본 B는 ${b.toFixed(1)}m예요. 더 긴 리본은 어느 것일까요?`,
        `리본 B`,
        `${b.toFixed(1)}은 ${a.toFixed(1)}보다 크므로 리본 B가 더 깁니다.`
      ];
    }
  },
  {
    gradeBand: 'G3_G4',
    topic: '들이와 무게',
    family: 'CAPACITY_CONVERSION_COMPARE',
    difficulty: 4,
    skillTags: ['MEASUREMENT', 'UNIT_CONVERSION'],
    build(i) {
      const ml = 650 + i * 30;
      return [
        `물병 A에는 ${ml}mL, 물병 B에는 1L가 들어 있어요. 어느 물병에 물이 더 많이 들어 있을까요?`,
        ml > 1000 ? '물병 A' : '물병 B',
        `1L는 1000mL이므로 ${ml}mL와 1000mL를 비교합니다.`
      ];
    }
  },
  {
    gradeBand: 'G3_G4',
    topic: '들이와 무게',
    family: 'WEIGHT_DIFFERENCE',
    difficulty: 4,
    skillTags: ['MEASUREMENT', 'SUBTRACTION'],
    build(i) {
      const a = 2800 + i * 120;
      const b = a - (300 + i * 20);
      return [
        `수박은 ${Math.floor(a / 1000)}kg ${a % 1000}g, 멜론은 ${Math.floor(b / 1000)}kg ${b % 1000}g이에요. 수박은 멜론보다 몇 g 더 무거울까요?`,
        `${a - b}g`,
        `${a}g과 ${b}g의 차이는 ${a - b}g입니다.`
      ];
    }
  },
  {
    gradeBand: 'G3_G4',
    topic: '시간과 길이',
    family: 'TIME_ELAPSED_MINUTES',
    difficulty: 5,
    skillTags: ['TIME', 'CHANGE_RELATION'],
    build(i) {
      const startHour = 2 + (i % 4);
      const startMin = 10 + (i % 5) * 5;
      const elapsed = 25 + i * 3;
      const totalMin = startHour * 60 + startMin + elapsed;
      const endHour = Math.floor(totalMin / 60);
      const endMin = totalMin % 60;
      return [
        `${pick(names, i)}가 ${startHour}시 ${startMin}분에 운동을 시작해서 ${endHour}시 ${endMin}분에 끝냈어요. 운동한 시간은 몇 분일까요?`,
        `${elapsed}분`,
        `시작 시각에서 끝 시각까지의 차이는 ${elapsed}분입니다.`
      ];
    }
  },
  {
    gradeBand: 'G3_G4',
    topic: '막대그래프',
    family: 'DATA_BAR_COMPARE',
    difficulty: 4,
    skillTags: ['DATA_READING', 'COMPARE'],
    build(i) {
      const a = 12 + i;
      const b = 18 + i;
      const c = 15 + (i % 4);
      return [
        `병뚜껑을 월요일 ${a}개, 화요일 ${b}개, 수요일 ${c}개 모았어요. 가장 많이 모은 날과 가장 적게 모은 날의 차이는 몇 개일까요?`,
        `${Math.max(a, b, c) - Math.min(a, b, c)}개`,
        `가장 큰 수와 가장 작은 수의 차이를 구합니다.`
      ];
    }
  },
  {
    gradeBand: 'G3_G4',
    topic: '규칙 찾기와 표현',
    family: 'PATTERN_GROWING_ADD',
    difficulty: 5,
    skillTags: ['PATTERN', 'CHANGE_RELATION'],
    build(i) {
      const start = 2 + (i % 5);
      const add = 3 + (i % 4);
      const term = 6 + (i % 4);
      const value = start + add * (term - 1);
      return [
        `첫째 줄에는 별 ${start}개가 있고, 줄이 하나 늘 때마다 ${add}개씩 늘어나요. ${term}째 줄에는 별이 몇 개 있을까요?`,
        `${value}개`,
        `${start}+${add}x${term - 1}=${value}입니다.`
      ];
    }
  },
  {
    gradeBand: 'G5_G6',
    topic: '자연수의 혼합 계산',
    family: 'MIXED_OPS_TWO_STEP',
    difficulty: 6,
    skillTags: ['MIXED_OPERATIONS', 'STRUCTURE'],
    build(i) {
      const unit = 900 + i * 100;
      const count = 3 + (i % 5);
      const extra = 500 + i * 100;
      const total = unit * count + extra;
      return [
        `공책 ${count}권을 한 권에 ${unit}원씩 사고, ${extra}원짜리 지우개도 샀어요. 모두 얼마를 내야 할까요?`,
        `${total}원`,
        `공책값은 ${unit}x${count}=${unit * count}원이고 지우개값을 더하면 ${total}원입니다.`
      ];
    }
  },
  {
    gradeBand: 'G5_G6',
    topic: '약수와 배수',
    family: 'LCM_SCHEDULE',
    difficulty: 6,
    skillTags: ['MULTIPLE', 'LCM_CONTEXT'],
    build(i) {
      const a = 4 + (i % 6);
      const b = 6 + (i % 5);
      const ans = lcm(a, b);
      return [
        `빨간 불은 ${a}분마다, 파란 불은 ${b}분마다 켜져요. 두 불이 지금 함께 켜졌다면 다시 함께 켜지는 가장 빠른 때는 몇 분 뒤일까요?`,
        `${ans}분 뒤`,
        `${a}와 ${b}의 최소공배수는 ${ans}입니다.`
      ];
    }
  },
  {
    gradeBand: 'G5_G6',
    topic: '약수와 배수',
    family: 'GCF_GROUPING',
    difficulty: 6,
    skillTags: ['FACTOR', 'GCF_CONTEXT'],
    build(i) {
      const a = 24 + i * 3;
      const b = 36 + i * 3;
      const ans = gcd(a, b);
      return [
        `${pick(objects, i)} ${a}개와 ${pick(objects, i + 1)} ${b}개를 남김없이 똑같이 나누어 담으려고 해요. 만들 수 있는 봉지 수가 가장 많을 때 몇 봉지를 만들 수 있을까요?`,
        `${ans}봉지`,
        `${a}와 ${b}의 최대공약수는 ${ans}입니다.`
      ];
    }
  },
  {
    gradeBand: 'G5_G6',
    topic: '분수의 덧셈과 뺄셈',
    family: 'FRAC_ADD_UNLIKE_DENOM',
    difficulty: 6,
    skillTags: ['FRACTION_ADDITION', 'COMMON_DENOMINATOR'],
    build(i) {
      const a = 1;
      const b = 2 + (i % 4);
      const c = 1;
      const d = b + 1;
      const num = a * d + c * b;
      const den = b * d;
      return [
        `주스 한 병의 ${a}/${b}를 오전에 마시고 ${c}/${d}를 오후에 마셨어요. 마신 주스는 한 병의 얼마일까요?`,
        fractionText(num, den),
        `통분하여 ${a}/${b}+${c}/${d}=${fractionText(num, den)}입니다.`
      ];
    }
  },
  {
    gradeBand: 'G5_G6',
    topic: '분수의 덧셈과 뺄셈',
    family: 'FRAC_SUB_UNLIKE_DENOM',
    difficulty: 7,
    skillTags: ['FRACTION_SUBTRACTION', 'COMMON_DENOMINATOR'],
    build(i) {
      const den = 6 + (i % 5);
      const num = den - 1;
      const subDen = 2;
      const totalNum = num * subDen - den;
      const totalDen = den * subDen;
      return [
        `끈 ${num}/${den}m 중에서 1/${subDen}m를 사용했어요. 남은 끈은 몇 m일까요?`,
        `${fractionText(totalNum, totalDen)}m`,
        `${num}/${den}-1/${subDen}=${fractionText(totalNum, totalDen)}입니다.`
      ];
    }
  },
  {
    gradeBand: 'G5_G6',
    topic: '분수의 곱셈과 나눗셈',
    family: 'FRAC_OF_QUANTITY',
    difficulty: 7,
    skillTags: ['FRACTION_MULTIPLICATION', 'PART_OF_QUANTITY'],
    build(i) {
      const den = 5 + (i % 4);
      const unit = 4 + (i % 5);
      const num = 2 + (i % Math.max(2, den - 2));
      const total = den * unit;
      return [
        `색종이 ${total}장의 ${num}/${den}를 사용했어요. 사용한 색종이는 몇 장일까요?`,
        `${unit * num}장`,
        `${total}장의 1/${den}은 ${unit}장이고 ${num}/${den}는 ${unit * num}장입니다.`
      ];
    }
  },
  {
    gradeBand: 'G5_G6',
    topic: '분수의 곱셈과 나눗셈',
    family: 'FRAC_DIV_PARTITIVE',
    difficulty: 8,
    skillTags: ['FRACTION_DIVISION', 'EQUAL_SHARING'],
    build(i) {
      const den = 4 + (i % 5);
      const people = 2 + (i % 4);
      const num = people;
      return [
        `물 ${num}/${den}L를 컵 ${people}개에 똑같이 나누어 담으려고 해요. 한 컵에는 몇 L씩 담을 수 있을까요?`,
        `1/${den}L`,
        `${num}/${den}L를 ${people}등분하면 1/${den}L입니다.`
      ];
    }
  },
  {
    gradeBand: 'G5_G6',
    topic: '분수의 곱셈과 나눗셈',
    family: 'FRAC_DIV_MEASUREMENT',
    difficulty: 9,
    skillTags: ['FRACTION_DIVISION', 'QUOTATIVE_DIVISION'],
    build(i) {
      const whole = 2 + (i % 4);
      const den = 3 + (i % 5);
      const pieces = whole * den;
      return [
        `리본 ${whole}m를 한 조각에 1/${den}m씩 자르려고 해요. 모두 몇 조각을 만들 수 있을까요?`,
        `${pieces}조각`,
        `${whole} 안에 1/${den}이 ${pieces}번 들어갑니다.`
      ];
    }
  },
  {
    gradeBand: 'G5_G6',
    topic: '소수의 곱셈과 나눗셈',
    family: 'DECIMAL_MULT_CONTEXT',
    difficulty: 6,
    skillTags: ['DECIMAL_MULTIPLICATION', 'MEASUREMENT'],
    build(i) {
      const amount = 1.2 + i / 10;
      const count = 3 + (i % 5);
      const total = amount * count;
      return [
        `한 병에 물이 ${amount.toFixed(1)}L 들어 있어요. 같은 병 ${count}개에는 물이 모두 몇 L 들어 있을까요?`,
        `${Number(total.toFixed(1))}L`,
        `${amount.toFixed(1)}x${count}=${Number(total.toFixed(1))}입니다.`
      ];
    }
  },
  {
    gradeBand: 'G5_G6',
    topic: '소수의 곱셈과 나눗셈',
    family: 'DECIMAL_DIV_UNIT_AMOUNT',
    difficulty: 7,
    skillTags: ['DECIMAL_DIVISION', 'UNIT_AMOUNT'],
    build(i) {
      const each = 1.2 + i / 10;
      const people = 3 + (i % 5);
      const total = each * people;
      return [
        `리본 ${Number(total.toFixed(1))}m를 ${people}명이 똑같이 나누어 가지려고 해요. 한 명은 몇 m씩 가질까요?`,
        `${each.toFixed(1)}m`,
        `${Number(total.toFixed(1))}÷${people}=${each.toFixed(1)}입니다.`
      ];
    }
  },
  {
    gradeBand: 'G5_G6',
    topic: '비와 비율',
    family: 'RATIO_PART_UNKNOWN',
    difficulty: 8,
    skillTags: ['RATIO', 'UNKNOWN_VALUE'],
    build(i) {
      const a = 2 + (i % 5);
      const b = a + 3;
      const scale = 2 + (i % 5);
      return [
        `연필과 지우개의 수의 비가 ${a}:${b}예요. 연필이 ${a * scale}자루라면 지우개는 몇 개일까요?`,
        `${b * scale}개`,
        `비의 한 부분은 ${scale}이므로 지우개는 ${b}x${scale}=${b * scale}개입니다.`
      ];
    }
  },
  {
    gradeBand: 'G5_G6',
    topic: '비와 비율',
    family: 'UNIT_RATE_PRICE',
    difficulty: 7,
    skillTags: ['RATIO', 'UNIT_RATE'],
    build(i) {
      const count = 3 + (i % 7);
      const unit = 800 + i * 100;
      const total = count * unit;
      return [
        `공책 ${count}권의 값이 ${total}원이에요. 공책 1권의 값은 얼마일까요?`,
        `${unit}원`,
        `${total}÷${count}=${unit}입니다.`
      ];
    }
  },
  {
    gradeBand: 'G5_G6',
    topic: '비와 비율',
    family: 'PERCENT_OF_QUANTITY',
    difficulty: 8,
    skillTags: ['PERCENT', 'PART_WHOLE'],
    build(i) {
      const total = 40 + i * 10;
      const percent = [10, 20, 25, 40, 50][i % 5];
      const ans = total * percent / 100;
      return [
        `학급 ${total}명 중 ${percent}%가 독서를 좋아한다고 답했어요. 독서를 좋아하는 학생은 몇 명일까요?`,
        `${ans}명`,
        `${total}명의 ${percent}%는 ${ans}명입니다.`
      ];
    }
  },
  {
    gradeBand: 'G5_G6',
    topic: '비례식과 비례배분',
    family: 'PROPORTION_PRICE',
    difficulty: 8,
    skillTags: ['PROPORTION', 'MULTIPLICATIVE_COMPARE'],
    build(i) {
      const baseCount = 3 + (i % 5);
      const unit = 700 + i * 100;
      const target = baseCount + 4 + (i % 5);
      return [
        `복숭아 ${baseCount}개의 값이 ${baseCount * unit}원이에요. 같은 가격이라면 복숭아 ${target}개의 값은 얼마일까요?`,
        `${target * unit}원`,
        `1개 값은 ${unit}원이고 ${target}개는 ${target * unit}원입니다.`
      ];
    }
  },
  {
    gradeBand: 'G5_G6',
    topic: '비례식과 비례배분',
    family: 'PROPORTIONAL_ALLOCATION',
    difficulty: 9,
    skillTags: ['PROPORTION', 'PART_WHOLE'],
    build(i) {
      const a = 2 + (i % 4);
      const b = a + 2;
      const unit = 3000 + i * 500;
      const total = (a + b) * unit;
      return [
        `상금 ${total}원을 ${pick(names, i)}와 ${pick(names, i + 1)}가 ${a}:${b}의 비로 나누려고 해요. 두 번째 사람은 얼마를 받을까요?`,
        `${b * unit}원`,
        `전체 비는 ${a + b}이고 한 부분은 ${unit}원입니다. 두 번째 사람은 ${b * unit}원입니다.`
      ];
    }
  },
  {
    gradeBand: 'G5_G6',
    topic: '평균',
    family: 'AVERAGE_FIND',
    difficulty: 6,
    skillTags: ['AVERAGE', 'DATA_REASONING'],
    build(i) {
      const a = 40 + i;
      const b = 50 + i;
      const c = 60 + i;
      const avg = (a + b + c) / 3;
      return [
        `${pick(names, i)}가 3일 동안 줄넘기를 ${a}번, ${b}번, ${c}번 했어요. 하루 평균 몇 번 했을까요?`,
        `${avg}번`,
        `${a}+${b}+${c}=${a + b + c}이고 ${a + b + c}÷3=${avg}입니다.`
      ];
    }
  },
  {
    gradeBand: 'G5_G6',
    topic: '평균',
    family: 'AVERAGE_UNKNOWN_SCORE',
    difficulty: 9,
    skillTags: ['AVERAGE', 'UNKNOWN_VALUE'],
    build(i) {
      const target = 80 + (i % 8);
      const a = target - 4;
      const b = target + 2;
      const c = target - 1;
      const needed = target * 4 - a - b - c;
      return [
        `네 번의 퀴즈 평균을 ${target}점으로 만들고 싶어요. 앞의 세 번 점수가 ${a}점, ${b}점, ${c}점이라면 네 번째는 몇 점을 받아야 할까요?`,
        `${needed}점`,
        `네 번의 총점은 ${target}x4=${target * 4}점이고 앞 세 번의 합을 빼면 ${needed}점입니다.`
      ];
    }
  },
  {
    gradeBand: 'G5_G6',
    topic: '직육면체의 부피와 겉넓이',
    family: 'VOLUME_RECT_PRISM',
    difficulty: 7,
    skillTags: ['VOLUME', 'MULTIPLICATION'],
    build(i) {
      const a = 4 + (i % 6);
      const b = 3 + (i % 5);
      const h = 5 + (i % 4);
      return [
        `가로 ${a}cm, 세로 ${b}cm, 높이 ${h}cm인 직육면체 상자의 부피는 몇 세제곱cm일까요?`,
        `${a * b * h}세제곱cm`,
        `직육면체의 부피는 ${a}x${b}x${h}=${a * b * h}입니다.`
      ];
    }
  },
  {
    gradeBand: 'G5_G6',
    topic: '직육면체의 부피와 겉넓이',
    family: 'VOLUME_UNKNOWN_HEIGHT',
    difficulty: 10,
    skillTags: ['VOLUME', 'UNKNOWN_VALUE'],
    build(i) {
      const a = 5 + (i % 5);
      const b = 4 + (i % 4);
      const h = 3 + (i % 6);
      const volume = a * b * h;
      return [
        `가로 ${a}cm, 세로 ${b}cm인 직육면체의 부피가 ${volume}세제곱cm예요. 높이는 몇 cm일까요?`,
        `${h}cm`,
        `밑면의 넓이는 ${a}x${b}=${a * b}이고 ${volume}÷${a * b}=${h}입니다.`
      ];
    }
  },
  {
    gradeBand: 'G5_G6',
    topic: '띠그래프와 원그래프',
    family: 'PERCENT_GRAPH_COUNT',
    difficulty: 8,
    skillTags: ['PERCENT', 'DATA_REASONING'],
    build(i) {
      const total = 40 + i * 5;
      const percent = [20, 25, 30, 40, 50][i % 5];
      const ans = total * percent / 100;
      return [
        `설문에 참여한 ${total}명 중 ${percent}%가 축구를 좋아한다고 답했어요. 축구를 좋아한다고 답한 사람은 몇 명일까요?`,
        `${ans}명`,
        `${total}명의 ${percent}%는 ${ans}명입니다.`
      ];
    }
  },
  {
    gradeBand: 'G5_G6',
    topic: '비와 비율',
    family: 'TRANSFER_RATE_DISTANCE',
    difficulty: 10,
    skillTags: ['PROPORTION', 'TRANSFER', 'UNIT_RATE'],
    build(i) {
      const minutes = 6 + i;
      const km = 3 + (i % 5);
      const target = minutes * 2;
      return [
        `자전거가 ${minutes}분 동안 ${km}km를 갔어요. 같은 빠르기로 ${target}분 동안 가면 몇 km를 갈 수 있을까요?`,
        `${km * 2}km`,
        `시간이 2배가 되면 거리도 2배가 되므로 ${km * 2}km입니다.`
      ];
    }
  },
  {
    gradeBand: 'G5_G6',
    topic: '비례식과 비례배분',
    family: 'MAP_SCALE_DISTANCE',
    difficulty: 10,
    skillTags: ['PROPORTION', 'SCALE_FACTOR', 'MEASUREMENT'],
    build(i) {
      const scale = 2 + (i % 6);
      const cm = 3 + i / 2;
      const ans = scale * cm;
      return [
        `지도에서 1cm가 실제 거리 ${scale}km를 나타내요. 지도에서 두 장소 사이가 ${cm}cm라면 실제 거리는 몇 km일까요?`,
        `${Number(ans.toFixed(1))}km`,
        `1cm가 ${scale}km이므로 ${cm}cm는 ${Number(ans.toFixed(1))}km입니다.`
      ];
    }
  },
  {
    gradeBand: 'G5_G6',
    topic: '그림그래프',
    family: 'PICTOGRAPH_SCALE',
    difficulty: 6,
    skillTags: ['DATA_READING', 'SCALE_FACTOR'],
    build(i) {
      const scale = 3 + (i % 6);
      const symbols = 5 + (i % 7);
      return [
        `그림그래프에서 별 1개는 학생 ${scale}명을 나타내요. 어느 반에 별이 ${symbols}개 그려져 있다면 그 반 학생은 몇 명일까요?`,
        `${scale * symbols}명`,
        `별 1개가 ${scale}명이므로 ${symbols}개는 ${scale * symbols}명입니다.`
      ];
    }
  },
  {
    gradeBand: 'G5_G6',
    topic: '가능성',
    family: 'PROBABILITY_COMPARE',
    difficulty: 6,
    skillTags: ['PROBABILITY', 'COMPARE'],
    build(i) {
      const red = 3 + (i % 5);
      const blue = red + 2 + (i % 4);
      return [
        `상자에 빨간 공 ${red}개, 파란 공 ${blue}개가 들어 있어요. 눈을 감고 공 1개를 꺼낼 때 어느 색 공이 나올 가능성이 더 클까요?`,
        `파란 공`,
        `파란 공이 ${blue}개로 빨간 공 ${red}개보다 많으므로 가능성이 더 큽니다.`
      ];
    }
  },
  {
    gradeBand: 'G5_G6',
    topic: '비와 비율',
    family: 'MULTI_STAGE_RATE_TRANSFER',
    difficulty: 11,
    skillTags: ['PROPORTION', 'TRANSFER', 'MULTI_STEP_RELATION'],
    build(i) {
      const baseMinutes = 8 + (i % 6);
      const basePages = 12 + i;
      const targetMinutes = baseMinutes + 12;
      const rate = basePages / baseMinutes;
      const ans = rate * targetMinutes;
      const clean = Number(ans.toFixed(1));
      return [
        `${pick(names, i)}는 ${baseMinutes}분 동안 책을 ${basePages}쪽 읽었어요. 같은 빠르기로 ${targetMinutes}분 동안 읽으면 몇 쪽을 읽을 수 있을까요?`,
        `${clean}쪽`,
        `1분에 ${Number(rate.toFixed(2))}쪽씩 읽는 셈이므로 ${targetMinutes}분에는 약 ${clean}쪽입니다.`
      ];
    }
  },
  {
    gradeBand: 'G5_G6',
    topic: '분수의 곱셈과 나눗셈',
    family: 'FRACTION_RATIO_COMPOSITE',
    difficulty: 11,
    skillTags: ['FRACTION_DIVISION', 'RATIO', 'COMPOSITE_RELATION'],
    build(i) {
      const den = 4 + (i % 5);
      const bottle = 2 + (i % 4);
      const totalNum = bottle * den;
      return [
        `물 ${bottle}L를 한 컵에 1/${den}L씩 담고, 담은 컵의 절반을 친구들에게 나누어 주었어요. 친구들에게 준 컵은 몇 컵일까요?`,
        `${totalNum / 2}컵`,
        `${bottle}L에는 1/${den}L가 ${totalNum}컵 들어가고, 그 절반은 ${totalNum / 2}컵입니다.`
      ];
    }
  },
  {
    gradeBand: 'G5_G6',
    topic: '평균',
    family: 'AVERAGE_AND_PERCENT_COMPOSITE',
    difficulty: 12,
    skillTags: ['AVERAGE', 'PERCENT', 'COMPOSITE_RELATION'],
    build(i) {
      const avg = 70 + (i % 10);
      const count = 4;
      const bonus = 10 + (i % 5) * 5;
      const total = avg * count;
      const increased = total + total * bonus / 100;
      return [
        `네 번의 연습 점수 평균이 ${avg}점이었어요. 다음 달에는 전체 연습 점수 합계를 ${bonus}% 높이는 것이 목표예요. 목표 총점은 몇 점일까요?`,
        `${increased}점`,
        `현재 총점은 ${avg}x${count}=${total}점이고, ${bonus}%만큼 높이면 ${increased}점입니다.`
      ];
    }
  },
  {
    gradeBand: 'G5_G6',
    topic: '직육면체의 부피와 겉넓이',
    family: 'VOLUME_SCALE_TRANSFER',
    difficulty: 12,
    skillTags: ['VOLUME', 'SCALE_FACTOR', 'TRANSFER'],
    build(i) {
      const a = 3 + (i % 4);
      const b = 4 + (i % 4);
      const h = 5 + (i % 4);
      const scale = 2;
      const original = a * b * h;
      const scaled = original * scale * scale * scale;
      return [
        `가로 ${a}cm, 세로 ${b}cm, 높이 ${h}cm인 직육면체가 있어요. 가로, 세로, 높이를 모두 ${scale}배로 만들면 새 직육면체의 부피는 몇 세제곱cm일까요?`,
        `${scaled}세제곱cm`,
        `처음 부피는 ${original}세제곱cm이고 세 길이를 모두 2배로 하면 부피는 8배가 되어 ${scaled}세제곱cm입니다.`
      ];
    }
  }
];

function generate() {
  const items = [];
  const variantsPerFamily = 20;

  for (const family of families) {
    for (let i = 0; i < variantsPerFamily; i += 1) {
      const [problem, answer, solution] = family.build(i);
      items.push(makeItem(
        family.gradeBand,
        family.topic,
        family.family,
        i + 1,
        family.difficulty,
        family.skillTags,
        problem,
        answer,
        solution
      ));
    }
  }

  return {
    metadata: {
      created_at: '2026-05-20',
      scope: 'elementary_school_only',
      language: 'ko',
      source_policy: 'External sources were used only to verify curriculum scope and problem-type coverage. All problem texts are newly written original seed items generated from deterministic templates.',
      item_count: items.length,
      family_count: families.length,
      difficulty_scale: '1-12',
      schema_version: 2
    },
    items
  };
}

const bank = generate();
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, `${JSON.stringify(bank, null, 2)}\n`, 'utf8');
console.log(`Wrote ${bank.items.length} elementary word problem seed items to ${outPath}`);
