/* =========================================================================
   창의/영재교육 문제 템플릿 - Creative/Gifted Problems
   문항 구성 원리 적용:
   1. 복면산, 논리추론, 공간지각 등 다양한 사고력 문제
   2. 명확한 발문 (무엇을 구해야 하는지 명시)
   3. 매력적 오답 (논리적으로 그럴듯한 오답)
   4. 시각적 이모지로 문제 상황 표현
   5. 단계별 난이도 설계
   ========================================================================= */

const CREATIVE_TEMPLATES = {
    // ===== 복면산 (Cryptarithm) =====
    cryptarithm: {
        simple: [
            {
                template: (val, sym, name1) => ({
                    question: `🧩 ${name1}이(가) 비밀 암호를 풀고 있어요!\n${sym.emoji} + ${sym.emoji} = ${val * 2}일 때, ${sym.emoji}(${sym.name})은 얼마일까요?`,
                    explanation: `${sym.emoji} + ${sym.emoji} = ${val * 2}이므로, ${sym.emoji} = ${val * 2}÷2 = ${val}`,
                    answer: val,
                    generateWrongs: (val) => [val + 1, val - 1 > 0 ? val - 1 : val + 2, val * 2]
                })
            }
        ],
        medium: [
            {
                template: (a, b, sym1, sym2, name1) => ({
                    question: `🧩 ${name1}이(가) 암호를 풀어요!\n${sym1.emoji} + ${sym2.emoji} = ${a + b}, ${sym1.emoji} - ${sym2.emoji} = ${a - b}\n${sym1.emoji}(${sym1.name})은 얼마일까요?`,
                    explanation: `두 식을 더하면 2×${sym1.emoji} = ${2 * a}, ${sym1.emoji} = ${a}`,
                    answer: a,
                    generateWrongs: (a, b) => [b, a + b, a + 1]
                })
            }
        ]
    },

    // ===== 나이 문제 =====
    age: {
        simple: [
            {
                template: (ageB, diffAge, name1, name2) => ({
                    question: `🎂 ${name1}은(는) ${name2}보다 ${diffAge}살 많아요.\n${name2}이(가) ${ageB}살이면, ${name1}은 몇 살?`,
                    explanation: `${ageB} + ${diffAge} = ${ageB + diffAge}살`,
                    answer: `${ageB + diffAge}살`,
                    wrongs: [`${ageB}살`, `${ageB - diffAge > 0 ? ageB - diffAge : ageB + diffAge + 1}살`, `${ageB + diffAge + 1}살`]
                })
            }
        ],
        medium: [
            {
                template: (ageNow, years, name1) => ({
                    question: `🎂 ${name1}은(는) 지금 ${ageNow}살이에요.\n${years}년 후에는 몇 살이 될까요?`,
                    explanation: `${ageNow} + ${years} = ${ageNow + years}살`,
                    answer: `${ageNow + years}살`,
                    wrongs: [`${ageNow}살`, `${ageNow - years > 0 ? ageNow - years : ageNow + years + 1}살`, `${ageNow + years + 1}살`]
                })
            }
        ]
    },

    // ===== 순서 문제 =====
    order: {
        simple: [
            {
                template: (name1, name2, name3) => ({
                    question: `🏃 달리기 시합에서 ${name1}이 1등, ${name3}이 3등이에요.\n${name2}은 ${name1}보다 늦고 ${name3}보다 빨랐어요. ${name2}은 몇 등?`,
                    explanation: `1등과 3등 사이이므로 ${name2}은 2등!`,
                    answer: '2등',
                    wrongs: ['1등', '3등', '4등']
                })
            }
        ],
        medium: [
            {
                template: (name1, name2, name3) => ({
                    question: `📏 ${name1}, ${name2}, ${name3}이 키 순서대로 줄을 섰어요.\n${name1}이 가장 크고, ${name3}이 가장 작아요. ${name2}은 앞에서 몇 번째?`,
                    explanation: `가장 큰 사람이 맨 앞이면, ${name2}은 가운데인 2번째!`,
                    answer: '2번째',
                    wrongs: ['1번째', '3번째', '4번째']
                })
            }
        ],
        hard: [
            {
                template: (n, fromFront, fromBack, name1) => ({
                    question: `👧👦 ${name1}은 줄의 앞에서 ${fromFront}번째, 뒤에서 ${fromBack}번째예요.\n줄에 선 사람은 모두 몇 명일까요?`,
                    explanation: `앞에서 ${fromFront}번째 + 뒤에서 ${fromBack}번째 - 1 = ${n}명`,
                    answer: `${n}명`,
                    wrongs: [`${n + 1}명`, `${n - 1}명`, `${fromFront + fromBack}명`]
                })
            }
        ]
    },

    // ===== 수 피라미드 =====
    pyramid: {
        simple: [
            {
                template: (a, b, c) => ({
                    question: `🔺 수 피라미드예요! 위 칸은 아래 두 수의 합이에요.\n    [?]\n  [${a + b}] [${b + c}]\n[${a}] [${b}] [${c}]\n맨 위 ?는 얼마?`,
                    explanation: `(${a}+${b}) + (${b}+${c}) = ${a + 2 * b + c}`,
                    answer: a + 2 * b + c,
                    generateWrongs: (a, b, c) => [a + b + c, a + b + c + 1, 2 * (a + b + c)]
                })
            }
        ]
    },

    // ===== 규칙 찾기 =====
    pattern: {
        simple: [
            {
                template: (start, step) => ({
                    question: `🔢 규칙을 찾아보세요!\n${start}, ${start + step}, ${start + 2 * step}, ?\n?에 알맞은 수는?`,
                    explanation: `${step}씩 커지는 규칙! ${start + 2 * step} + ${step} = ${start + 3 * step}`,
                    answer: start + 3 * step,
                    generateWrongs: (start, step) => [start + 2 * step, start + 4 * step, start + 3 * step + 1]
                })
            }
        ]
    },

    // ===== 쌓기나무 =====
    blocks: {
        counting: [
            {
                desc: '1층에 4개, 2층에 1개',
                total: 5,
                template: (name1) => ({
                    question: `🧱 ${name1}이(가) 블록을 쌓았어요!\n1층에 4개, 2층에 1개로 쌓았어요. 블록은 모두 몇 개일까요?`,
                    explanation: `1층 4개 + 2층 1개 = 5개입니다!`,
                    answer: '5개',
                    wrongs: ['4개', '6개', '7개']
                })
            },
            {
                desc: '1층에 3개, 2층에 2개',
                total: 5,
                template: (name1) => ({
                    question: `🧱 ${name1}이(가) 블록을 쌓았어요!\n1층에 3개, 2층에 2개로 쌓았어요. 블록은 모두 몇 개일까요?`,
                    explanation: `1층 3개 + 2층 2개 = 5개입니다!`,
                    answer: '5개',
                    wrongs: ['4개', '6개', '3개']
                })
            },
            {
                desc: '1층에 6개, 2층에 2개',
                total: 8,
                template: (name1) => ({
                    question: `🧱 ${name1}이(가) 블록을 쌓았어요!\n1층에 6개, 2층에 2개로 쌓았어요. 블록은 모두 몇 개일까요?`,
                    explanation: `1층 6개 + 2층 2개 = 8개입니다!`,
                    answer: '8개',
                    wrongs: ['7개', '9개', '6개']
                })
            }
        ]
    },

    // ===== 수 분해 =====
    decompose: [
        {
            template: (target, part1, part2, name1, name2) => ({
                question: `🎯 ${name1}이(가) 사탕 ${target}개를 두 봉지에 나눠 담았어요.\n한 봉지에 ${part1}개를 담았다면, 다른 봉지에는 몇 개?`,
                explanation: `${target} - ${part1} = ${part2}개`,
                answer: `${part2}개`,
                wrongs: [`${part2 + 1}개`, `${part2 - 1 > 0 ? part2 - 1 : part2 + 2}개`, `${target}개`]
            })
        },
        {
            template: (target, part1, part2, name1, name2) => ({
                question: `🎁 선물 ${target}개를 ${name1}과 ${name2}이(가) 나눠 가져요.\n${name1}이 ${part1}개 가지면, ${name2}은 몇 개?`,
                explanation: `${target} - ${part1} = ${part2}개`,
                answer: `${part2}개`,
                wrongs: [`${part2 + 1}개`, `${part2 - 1 > 0 ? part2 - 1 : part2 + 2}개`, `${target}개`]
            })
        }
    ],

    // ===== 거꾸로 생각하기 =====
    reverse: [
        {
            template: (original, change, name1) => ({
                question: `🔙 ${name1}이(가) 생각한 수에 ${change}을 더했더니 ${original + change}이 되었어요.\n처음 생각한 수는 얼마일까요?`,
                explanation: `${original + change} - ${change} = ${original}`,
                answer: original,
                generateWrongs: (original, change) => [original + 1, original - 1 > 0 ? original - 1 : original + 2, original + change]
            })
        },
        {
            template: (original, change, name1) => ({
                question: `🔙 어떤 수에서 ${change}을 빼면 ${original - change > 0 ? original - change : 1}이 돼요.\n어떤 수는 얼마일까요?`,
                explanation: `${original - change > 0 ? original - change : 1} + ${change} = ${original - change > 0 ? original : change + 1}`,
                answer: original - change > 0 ? original : change + 1,
                generateWrongs: (original, change) => [original + 1, original - 1 > 0 ? original - 1 : original + 2, original - change > 0 ? original - change : 1]
            })
        }
    ],

    // ===== 저울 균형 =====
    balance: [
        {
            template: (unit, count, total) => ({
                question: `⚖️ 저울이 균형을 이루고 있어요!\n한쪽에 ${total}g 추가 있고, 다른 쪽에 ${count}개의 같은 추가 있어요.\n추 하나는 몇 g일까요?`,
                explanation: `${total} ÷ ${count} = ${unit}g`,
                answer: `${unit}g`,
                wrongs: [`${unit + 1}g`, `${unit - 1 > 0 ? unit - 1 : unit + 2}g`, `${total}g`]
            })
        }
    ],

    // ===== 비교 논리 =====
    comparison: [
        {
            template: (name1, name2, name3) => ({
                question: `🏃 ${name1}이 ${name2}보다 빨라요.\n${name2}가 ${name3}보다 빨라요.\n가장 빠른 사람은 누구일까요?`,
                explanation: `${name1} > ${name2} > ${name3}이므로 ${name1}이 가장 빨라요!`,
                answer: name1,
                wrongs: [name2, name3, '두 사람이 같음']
            })
        },
        {
            template: (name1, name2, name3) => ({
                question: `📏 ${name1}이 ${name2}보다 키가 커요.\n${name3}이 ${name1}보다 키가 커요.\n가장 키가 큰 사람은?`,
                explanation: `${name3} > ${name1} > ${name2}이므로 ${name3}이 가장 커요!`,
                answer: name3,
                wrongs: [name1, name2, '두 사람이 같음']
            })
        }
    ],

    // ===== 숨은 수 찾기 =====
    hiddenNumber: [
        {
            template: (a, b) => ({
                question: `🔍 ? + ${b} = ${a + b}일 때, ?는 얼마일까요?`,
                explanation: `${a + b} - ${b} = ${a}`,
                answer: a,
                generateWrongs: (a, b) => [a + 1, a - 1 > 0 ? a - 1 : a + 2, a + b]
            })
        },
        {
            template: (a, b) => ({
                question: `🔍 ${a} + ? = ${a + b}일 때, ?는 얼마일까요?`,
                explanation: `${a + b} - ${a} = ${b}`,
                answer: b,
                generateWrongs: (a, b) => [b + 1, b - 1 > 0 ? b - 1 : b + 2, a + b]
            })
        }
    ],

    // ===== 간단한 수열 =====
    sequence: [
        { seq: [1, 2, 3, 4, '?'], answer: 5, rule: '1씩 커지는' },
        { seq: [2, 4, 6, 8, '?'], answer: 10, rule: '2씩 커지는' },
        { seq: [5, 10, 15, 20, '?'], answer: 25, rule: '5씩 커지는' },
        { seq: [10, 9, 8, 7, '?'], answer: 6, rule: '1씩 작아지는' },
        { seq: [1, 3, 5, 7, '?'], answer: 9, rule: '2씩 커지는 홀수' },
        { seq: [2, 4, 6, 8, '?'], answer: 10, rule: '2씩 커지는 짝수' }
    ]
};

// 창의 문제 생성 함수
function generateCreativeProblem(difficulty) {
    const { getRandomCharacter, getTwoCharacters, getThreeCharacters, getRandomSymbol, createProblemResult, shuffleArray } = window.ProblemBase;

    const [name1, name2, name3] = getThreeCharacters();
    const sym = getRandomSymbol();
    const sym1 = { emoji: '⭐', name: '별' };
    const sym2 = { emoji: '💎', name: '보석' };

    let question, answer, explanation;
    let wrongs = [];

    // 난이도별 문제 유형 선택
    let problemTypes = [];
    if (difficulty <= 5) {
        problemTypes = [
            'cryptarithm_simple', 'age_simple', 'order_simple', 'pyramid_simple', 'pattern_simple',
            'blocks_counting', 'number_decompose', 'reverse_think', 'balance_scale',
            'hidden_number', 'compare_logic', 'simple_sequence'
        ];
    } else if (difficulty <= 10) {
        problemTypes = [
            'cryptarithm_medium', 'age_medium', 'order_medium', 'pyramid_simple',
            'blocks_counting', 'reverse_think', 'hidden_number'
        ];
    } else {
        problemTypes = ['cryptarithm_medium', 'order_hard', 'compare_logic'];
    }

    const problemType = problemTypes[Math.floor(Math.random() * problemTypes.length)];

    switch (problemType) {
        case 'cryptarithm_simple': {
            const val = Math.floor(Math.random() * 8) + 1;
            const template = CREATIVE_TEMPLATES.cryptarithm.simple[0];
            const result = template.template(val, sym, name1);
            question = result.question;
            answer = result.answer;
            explanation = result.explanation;
            wrongs = result.generateWrongs(val);
            break;
        }

        case 'cryptarithm_medium': {
            const a = Math.floor(Math.random() * 5) + 2;
            const b = Math.floor(Math.random() * 5) + 2;
            const template = CREATIVE_TEMPLATES.cryptarithm.medium[0];
            const result = template.template(a, b, sym1, sym2, name1);
            question = result.question;
            answer = result.answer;
            explanation = result.explanation;
            wrongs = result.generateWrongs(a, b);
            break;
        }

        case 'age_simple': {
            const ageB = Math.floor(Math.random() * 4) + 6;
            const diffAge = Math.floor(Math.random() * 3) + 1;
            const template = CREATIVE_TEMPLATES.age.simple[0];
            const result = template.template(ageB, diffAge, name1, name2);
            question = result.question;
            answer = result.answer;
            explanation = result.explanation;
            wrongs = result.wrongs;
            break;
        }

        case 'age_medium': {
            const ageNow = Math.floor(Math.random() * 5) + 7;
            const years = Math.floor(Math.random() * 3) + 2;
            const template = CREATIVE_TEMPLATES.age.medium[0];
            const result = template.template(ageNow, years, name1);
            question = result.question;
            answer = result.answer;
            explanation = result.explanation;
            wrongs = result.wrongs;
            break;
        }

        case 'order_simple': {
            const template = CREATIVE_TEMPLATES.order.simple[0];
            const result = template.template(name1, name2, name3);
            question = result.question;
            answer = result.answer;
            explanation = result.explanation;
            wrongs = result.wrongs;
            break;
        }

        case 'order_medium': {
            const template = CREATIVE_TEMPLATES.order.medium[0];
            const result = template.template(name1, name2, name3);
            question = result.question;
            answer = result.answer;
            explanation = result.explanation;
            wrongs = result.wrongs;
            break;
        }

        case 'order_hard': {
            const n = Math.floor(Math.random() * 3) + 5;
            const fromFront = Math.floor(Math.random() * 3) + 2;
            const fromBack = n - fromFront + 1;
            const template = CREATIVE_TEMPLATES.order.hard[0];
            const result = template.template(n, fromFront, fromBack, name1);
            question = result.question;
            answer = result.answer;
            explanation = result.explanation;
            wrongs = result.wrongs;
            break;
        }

        case 'pyramid_simple': {
            const a = Math.floor(Math.random() * 5) + 1;
            const b = Math.floor(Math.random() * 5) + 1;
            const c = Math.floor(Math.random() * 5) + 1;
            const template = CREATIVE_TEMPLATES.pyramid.simple[0];
            const result = template.template(a, b, c);
            question = result.question;
            answer = result.answer;
            explanation = result.explanation;
            wrongs = result.generateWrongs(a, b, c);
            break;
        }

        case 'pattern_simple': {
            const start = Math.floor(Math.random() * 5) + 1;
            const step = Math.floor(Math.random() * 3) + 2;
            const template = CREATIVE_TEMPLATES.pattern.simple[0];
            const result = template.template(start, step);
            question = result.question;
            answer = result.answer;
            explanation = result.explanation;
            wrongs = result.generateWrongs(start, step);
            break;
        }

        case 'blocks_counting': {
            const blocks = CREATIVE_TEMPLATES.blocks.counting;
            const block = blocks[Math.floor(Math.random() * blocks.length)];
            const result = block.template(name1);
            question = result.question;
            answer = result.answer;
            explanation = result.explanation;
            wrongs = result.wrongs;
            break;
        }

        case 'number_decompose': {
            const target = Math.floor(Math.random() * 8) + 5;
            const part1 = Math.floor(Math.random() * (target - 2)) + 1;
            const part2 = target - part1;
            const templates = CREATIVE_TEMPLATES.decompose;
            const template = templates[Math.floor(Math.random() * templates.length)];
            const result = template.template(target, part1, part2, name1, name2);
            question = result.question;
            answer = result.answer;
            explanation = result.explanation;
            wrongs = result.wrongs;
            break;
        }

        case 'reverse_think': {
            const original = Math.floor(Math.random() * 10) + 3;
            const change = Math.floor(Math.random() * 5) + 1;
            const templates = CREATIVE_TEMPLATES.reverse;
            const template = templates[0];
            const result = template.template(original, change, name1);
            question = result.question;
            answer = result.answer;
            explanation = result.explanation;
            wrongs = result.generateWrongs(original, change);
            break;
        }

        case 'balance_scale': {
            const unit = Math.floor(Math.random() * 3) + 2;
            const count = Math.floor(Math.random() * 3) + 2;
            const total = unit * count;
            const template = CREATIVE_TEMPLATES.balance[0];
            const result = template.template(unit, count, total);
            question = result.question;
            answer = result.answer;
            explanation = result.explanation;
            wrongs = result.wrongs;
            break;
        }

        case 'hidden_number': {
            const a = Math.floor(Math.random() * 8) + 2;
            const b = Math.floor(Math.random() * 8) + 2;
            const templates = CREATIVE_TEMPLATES.hiddenNumber;
            const template = templates[Math.floor(Math.random() * templates.length)];
            const result = template.template(a, b);
            question = result.question;
            answer = result.answer;
            explanation = result.explanation;
            wrongs = result.generateWrongs(a, b);
            break;
        }

        case 'compare_logic': {
            const templates = CREATIVE_TEMPLATES.comparison;
            const template = templates[Math.floor(Math.random() * templates.length)];
            const result = template.template(name1, name2, name3);
            question = result.question;
            answer = result.answer;
            explanation = result.explanation;
            wrongs = result.wrongs;
            break;
        }

        case 'simple_sequence': {
            const patterns = CREATIVE_TEMPLATES.sequence;
            const p = patterns[Math.floor(Math.random() * patterns.length)];
            question = `🔢 ${name1}이(가) 규칙을 찾고 있어요!\n${p.seq.join(', ')}\n?에 알맞은 수는?`;
            answer = p.answer;
            explanation = `${p.rule} 규칙이에요. ?는 ${p.answer}!`;
            wrongs = [p.answer + 1, p.answer - 1 > 0 ? p.answer - 1 : p.answer + 2, p.answer + 2];
            break;
        }

        default: {
            const val = Math.floor(Math.random() * 8) + 2;
            question = `🧩 ${name1}이(가) 생각한 수에 2를 곱하면 ${val * 2}이 돼요.\n생각한 수는 무엇일까요?`;
            answer = val;
            explanation = `${val * 2} ÷ 2 = ${val}`;
            wrongs = [val + 1, val - 1 > 0 ? val - 1 : val + 2, val * 2];
        }
    }

    const wrongsFiltered = wrongs.filter(w => String(w) !== String(answer)).slice(0, 3);

    return createProblemResult(question, answer, explanation, wrongsFiltered, 'creative', difficulty);
}

// 전역으로 내보내기
window.CreativeProblems = {
    TEMPLATES: CREATIVE_TEMPLATES,
    generate: generateCreativeProblem
};
