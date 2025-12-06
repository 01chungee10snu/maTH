/* =========================================================================
   규칙찾기 문제 템플릿 - Pattern Problems
   문항 구성 원리 적용:
   1. 다양한 패턴 유형 (수, 도형, 색깔)
   2. 명확한 발문 ("다음에 올 것은?", "규칙은?")
   3. 매력적 오답 (인접값, 패턴 오해)
   4. 시각적 이모지로 패턴 표현
   ========================================================================= */

const PATTERN_TEMPLATES = {
    // 수 패턴 (1~2학년)
    numberPatterns: [
        {
            type: 'increasing',
            template: (start, step, seq) => ({
                question: `🔢 규칙을 찾아보세요!\n${seq.slice(0, -1).join(', ')}, ?\n?에 알맞은 수는 무엇일까요?`,
                explanation: `${step}씩 커지는 규칙이에요! ${seq[seq.length - 2]} + ${step} = ${seq[seq.length - 1]}`,
                answer: seq[seq.length - 1]
            })
        },
        {
            type: 'decreasing',
            template: (start, step, seq) => ({
                question: `🔢 규칙을 찾아보세요!\n${seq.slice(0, -1).join(', ')}, ?\n?에 알맞은 수는 무엇일까요?`,
                explanation: `${step}씩 작아지는 규칙이에요! ${seq[seq.length - 2]} - ${step} = ${seq[seq.length - 1]}`,
                answer: seq[seq.length - 1]
            })
        }
    ],

    // 도형 패턴 (1~2학년)
    shapePatterns: [
        {
            context: '도형 나열',
            template: (shapes, answer) => ({
                question: `🔷 규칙을 찾아보세요!\n${shapes.join(' ')}\n다음에 올 도형은 무엇일까요?`,
                explanation: `도형이 순서대로 반복되는 규칙이에요!`,
                answer: answer
            })
        }
    ],

    // 반복 패턴 (1학년)
    repeatingPatterns: [
        {
            context: '색깔 패턴',
            template: (colors, answer, sequence) => ({
                question: `🎨 색깔 규칙을 찾아보세요!\n${sequence}\n다음에 올 색깔은 무엇일까요?`,
                explanation: `${colors.join(', ')}이(가) 반복되는 규칙이에요!`,
                answer: answer
            })
        }
    ],

    // 복합 패턴 (2~3학년)
    complexPatterns: [
        {
            context: '두 수의 합',
            template: (pairs, answer) => ({
                question: `🧩 규칙을 찾아보세요!\n${pairs.map(p => `(${p[0]}, ${p[1]})`).join(' → ')} → (?, ?)\n?에 알맞은 수의 합은 무엇일까요?`,
                explanation: `각 쌍에서 규칙을 찾으면 됩니다!`,
                answer: answer
            })
        }
    ]
};

// 규칙찾기 문제 생성 함수
function generatePatternProblem(difficulty) {
    const { getRandomCharacter, createProblemResult, shuffleArray } = window.ProblemBase;

    const name1 = getRandomCharacter();
    let question, answer, explanation;
    const wrongs = new Set();

    // 난이도에 따른 유형 선택
    const type = Math.floor(Math.random() * 4);

    if (type === 0) {
        // 등차수열 (증가)
        const start = Math.floor(Math.random() * 10) + 1;
        const step = Math.floor(Math.random() * 5) + 2;
        const seq = [];
        for (let i = 0; i < 5; i++) {
            seq.push(start + i * step);
        }

        const template = PATTERN_TEMPLATES.numberPatterns[0];
        const result = template.template(start, step, seq);

        question = result.question;
        answer = result.answer;
        explanation = result.explanation;

        wrongs.add(seq[seq.length - 1] + step);
        wrongs.add(seq[seq.length - 1] - step);
        wrongs.add(seq[seq.length - 1] + 1);

    } else if (type === 1) {
        // 등차수열 (감소)
        const start = Math.floor(Math.random() * 20) + 30;
        const step = Math.floor(Math.random() * 5) + 2;
        const seq = [];
        for (let i = 0; i < 5; i++) {
            seq.push(start - i * step);
        }

        const template = PATTERN_TEMPLATES.numberPatterns[1];
        const result = template.template(start, step, seq);

        question = result.question;
        answer = result.answer;
        explanation = result.explanation;

        wrongs.add(seq[seq.length - 1] + step);
        wrongs.add(seq[seq.length - 1] - step);
        wrongs.add(seq[seq.length - 1] + 1);

    } else if (type === 2) {
        // 도형 반복 패턴
        const shapeGroups = [
            { shapes: ['⭐', '💎', '⭐', '💎', '⭐', '💎'], answer: '⭐', wrong: ['💎', '🔷', '🔶'] },
            { shapes: ['🔴', '🔵', '🟡', '🔴', '🔵', '🟡'], answer: '🔴', wrong: ['🔵', '🟡', '🟢'] },
            { shapes: ['🌸', '🌺', '🌸', '🌺', '🌸', '🌺'], answer: '🌸', wrong: ['🌺', '🌻', '🌷'] },
            { shapes: ['🔺', '🔻', '🔺', '🔻', '🔺', '🔻'], answer: '🔺', wrong: ['🔻', '⬛', '⬜'] },
            { shapes: ['♠️', '♥️', '♠️', '♥️', '♠️', '♥️'], answer: '♠️', wrong: ['♥️', '♦️', '♣️'] }
        ];

        const group = shapeGroups[Math.floor(Math.random() * shapeGroups.length)];
        question = `🔷 규칙을 찾아보세요!\n${group.shapes.join(' ')}\n다음에 올 것은 무엇일까요?`;
        answer = group.answer;
        explanation = `2개씩 반복되는 규칙이에요! 다음은 ${group.answer}입니다.`;

        group.wrong.forEach(w => wrongs.add(w));

    } else {
        // 색깔 반복 패턴
        const colorGroups = [
            { colors: ['빨강', '파랑', '빨강', '파랑', '빨강'], answer: '파랑', sequence: '🔴 🔵 🔴 🔵 🔴 ?', wrong: ['빨강', '노랑', '초록'] },
            { colors: ['노랑', '초록', '노랑', '초록', '노랑'], answer: '초록', sequence: '🟡 🟢 🟡 🟢 🟡 ?', wrong: ['노랑', '빨강', '파랑'] },
            { colors: ['빨강', '노랑', '파랑', '빨강', '노랑'], answer: '파랑', sequence: '🔴 🟡 🔵 🔴 🟡 ?', wrong: ['빨강', '노랑', '초록'] }
        ];

        const group = colorGroups[Math.floor(Math.random() * colorGroups.length)];
        question = `🎨 색깔 규칙을 찾아보세요!\n${group.sequence}\n다음에 올 색깔은 무엇일까요?`;
        answer = group.answer;
        explanation = `색깔이 순서대로 반복되는 규칙이에요! 다음은 ${group.answer}입니다.`;

        group.wrong.forEach(w => wrongs.add(w));
    }

    const wrongsArray = Array.from(wrongs).filter(w => String(w) !== String(answer)).slice(0, 3);

    return createProblemResult(question, answer, explanation, wrongsArray, 'pattern', difficulty);
}

// 전역으로 내보내기
window.PatternProblems = {
    TEMPLATES: PATTERN_TEMPLATES,
    generate: generatePatternProblem
};
