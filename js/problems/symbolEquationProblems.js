/* =========================================================================
   미지수 추론 문제 - Symbol Equation Problems
   □(네모), ○(동그라미), △(세모) 세 미지수를 순차적으로 추론하는 문제
   
   문항 구성 원리:
   1. 3개의 방정식으로 3개의 미지수를 순차적으로 해결
   2. 첫 번째 식에서 하나의 미지수 확정 가능
   3. 두 번째 식에서 두 번째 미지수 확정 가능
   4. 세 번째 식에서 세 번째 미지수 확정 가능
   5. 난이도별 숫자 범위: 쉬움(1~9), 어려움(10~99)
   ========================================================================= */

const SYMBOL_EQUATION_TEMPLATES = {
    // 미지수 기호 정의
    SYMBOLS: {
        square: { emoji: '□', name: '네모' },
        circle: { emoji: '○', name: '동그라미' },
        triangle: { emoji: '△', name: '세모' }
    },

    // 패턴 유형들
    patterns: {
        // 패턴 A: 같은 미지수 덧셈으로 시작 (가장 쉬움)
        // □ + □ = N1  → □ 확정
        // □ + ○ = N2  → ○ 확정
        // ○ + △ = N3  → △ 확정 (또는 ○ - △ = N3)
        patternA: {
            name: '기본 순차형',
            difficulty: 'easy',
            generate: (maxNum, useSubtraction = false) => {
                // 한 자리수: 1~9, 두 자리수: 10~99
                const square = Math.floor(Math.random() * maxNum) + 1;
                const circle = Math.floor(Math.random() * maxNum) + 1;
                const triangle = Math.floor(Math.random() * maxNum) + 1;

                const eq1_result = square + square;
                const eq2_result = square + circle;

                let eq3_op, eq3_result;
                if (useSubtraction && circle > triangle) {
                    eq3_op = '-';
                    eq3_result = circle - triangle;
                } else {
                    eq3_op = '+';
                    eq3_result = circle + triangle;
                }

                return {
                    equations: [
                        { left: '□ + □', result: eq1_result, explanation: `□ + □ = ${eq1_result}이므로, □ = ${eq1_result} ÷ 2 = ${square}` },
                        { left: '□ + ○', result: eq2_result, explanation: `${square} + ○ = ${eq2_result}이므로, ○ = ${eq2_result} - ${square} = ${circle}` },
                        {
                            left: `○ ${eq3_op} △`, result: eq3_result, explanation: eq3_op === '+'
                                ? `${circle} + △ = ${eq3_result}이므로, △ = ${eq3_result} - ${circle} = ${triangle}`
                                : `${circle} - △ = ${eq3_result}이므로, △ = ${circle} - ${eq3_result} = ${triangle}`
                        }
                    ],
                    answers: { square, circle, triangle },
                    fullExplanation: `① □ + □ = ${eq1_result} → □ = ${square}\n② ${square} + ○ = ${eq2_result} → ○ = ${circle}\n③ ${circle} ${eq3_op} △ = ${eq3_result} → △ = ${triangle}`
                };
            }
        },

        // 패턴 B: 뺄셈을 활용한 추론 (중간)
        // □ + ○ = N1
        // ○ + ○ = N2  → ○ 먼저 확정
        // □ - △ = N3  → △ 확정
        patternB: {
            name: '역순 추론형',
            difficulty: 'medium',
            generate: (maxNum, useSubtraction = true) => {
                const circle = Math.floor(Math.random() * Math.floor(maxNum / 2)) + 1; // 더 작은 수로
                const square = Math.floor(Math.random() * maxNum) + circle + 1; // square > circle
                const triangle = Math.floor(Math.random() * (square - 1)) + 1; // triangle < square

                const eq1_result = square + circle;
                const eq2_result = circle + circle;
                const eq3_result = square - triangle;

                return {
                    equations: [
                        { left: '□ + ○', result: eq1_result, explanation: `나중에 □와 ○를 알면 확인할 수 있어요.` },
                        { left: '○ + ○', result: eq2_result, explanation: `○ + ○ = ${eq2_result}이므로, ○ = ${eq2_result} ÷ 2 = ${circle}` },
                        { left: '□ - △', result: eq3_result, explanation: `□ - △ = ${eq3_result}이고, □ = ${square}이므로, △ = ${square} - ${eq3_result} = ${triangle}` }
                    ],
                    answers: { square, circle, triangle },
                    fullExplanation: `② ○ + ○ = ${eq2_result} → ○ = ${circle} (먼저 풀어요!)\n① □ + ${circle} = ${eq1_result} → □ = ${square}\n③ ${square} - △ = ${eq3_result} → △ = ${triangle}`,
                    solveOrder: [2, 1, 3] // 풀이 순서
                };
            }
        },

        // 패턴 C: 세 변수 연결형 (어려움)
        // □ + ○ = N1
        // ○ + △ = N2
        // △ + △ = N3  → △ 먼저 확정 → 역순으로 풀이
        patternC: {
            name: '역추론형',
            difficulty: 'hard',
            generate: (maxNum, useSubtraction = false) => {
                const triangle = Math.floor(Math.random() * Math.floor(maxNum / 2)) + 1;
                const circle = Math.floor(Math.random() * maxNum) + 1;
                const square = Math.floor(Math.random() * maxNum) + 1;

                const eq1_result = square + circle;
                const eq2_result = circle + triangle;
                const eq3_result = triangle + triangle;

                return {
                    equations: [
                        { left: '□ + ○', result: eq1_result, explanation: `나중에 ○를 알면 □을 구할 수 있어요.` },
                        { left: '○ + △', result: eq2_result, explanation: `△를 알면 ○ = ${eq2_result} - ${triangle} = ${circle}` },
                        { left: '△ + △', result: eq3_result, explanation: `△ + △ = ${eq3_result}이므로, △ = ${eq3_result} ÷ 2 = ${triangle}` }
                    ],
                    answers: { square, circle, triangle },
                    fullExplanation: `③ △ + △ = ${eq3_result} → △ = ${triangle} (먼저 풀어요!)\n② ○ + ${triangle} = ${eq2_result} → ○ = ${circle}\n① □ + ${circle} = ${eq1_result} → □ = ${square}`,
                    solveOrder: [3, 2, 1]
                };
            }
        }
    }
};

/**
 * 미지수 추론 문제 생성 함수
 * @param {number} difficulty - 난이도 (1~100 범위, 1~20은 한 자리, 21~100은 두 자리)
 * @returns {Object} 문제 객체 (특수 형식: 3개 입력 필요)
 */
function generateSymbolEquationProblem(difficulty) {
    const { getRandomCharacter } = window.ProblemBase || { getRandomCharacter: () => '하츄핑' };

    const name1 = getRandomCharacter();
    const symbols = SYMBOL_EQUATION_TEMPLATES.SYMBOLS;

    // 난이도에 따른 숫자 범위 결정
    let maxNum, patternType, useSubtraction;

    if (difficulty <= 20) {
        // 쉬움: 한 자리 숫자 (1~9)
        maxNum = 9;
        patternType = 'patternA';
        useSubtraction = false;
    } else if (difficulty <= 50) {
        // 중간-쉬움: 한 자리 숫자 + 뺄셈
        maxNum = 9;
        patternType = Math.random() < 0.5 ? 'patternA' : 'patternB';
        useSubtraction = true;
    } else if (difficulty <= 75) {
        // 중간-어려움: 두 자리 숫자, 쉬운 패턴
        maxNum = Math.min(20 + Math.floor((difficulty - 50) * 0.8), 50);
        patternType = Math.random() < 0.6 ? 'patternB' : 'patternC';
        useSubtraction = true;
    } else {
        // 어려움: 두 자리 숫자, 어려운 패턴
        maxNum = Math.min(30 + Math.floor((difficulty - 75) * 1.5), 99);
        patternType = Math.random() < 0.3 ? 'patternB' : 'patternC';
        useSubtraction = true;
    }

    // 패턴에 따른 문제 생성
    const pattern = SYMBOL_EQUATION_TEMPLATES.patterns[patternType];
    const generated = pattern.generate(maxNum, useSubtraction);

    // 문제 텍스트 구성
    const equationText = generated.equations.map((eq, idx) =>
        `(${idx + 1}) ${eq.left} = ${eq.result}`
    ).join('\n');

    const question = `🧩 ${name1}이(가) 미지수 탐정이 되었어요!\n다음 식을 보고 ${symbols.square.emoji}, ${symbols.circle.emoji}, ${symbols.triangle.emoji}에 알맞은 수를 각각 구하세요.\n\n${equationText}`;

    // 정답과 오답 생성
    const { square, circle, triangle } = generated.answers;

    // 각 미지수별 오답 생성
    const generateWrongsForValue = (correctValue, otherValues) => {
        const wrongs = new Set();
        wrongs.add(correctValue + 1);
        wrongs.add(correctValue - 1 > 0 ? correctValue - 1 : correctValue + 2);
        wrongs.add(correctValue * 2);
        otherValues.forEach(v => wrongs.add(v));

        return Array.from(wrongs)
            .filter(w => w !== correctValue && w > 0)
            .slice(0, 3);
    };

    const squareWrongs = generateWrongsForValue(square, [circle, triangle]);
    const circleWrongs = generateWrongsForValue(circle, [square, triangle]);
    const triangleWrongs = generateWrongsForValue(triangle, [square, circle]);

    // 문제 객체 반환 (특수 형식)
    return {
        type: 'symbolEquation',
        question: question,
        equations: generated.equations,

        // 세 개의 정답
        answers: {
            square: {
                symbol: symbols.square.emoji,
                name: symbols.square.name,
                value: square,
                options: shuffleArray([square, ...squareWrongs.slice(0, 3)].map(String))
            },
            circle: {
                symbol: symbols.circle.emoji,
                name: symbols.circle.name,
                value: circle,
                options: shuffleArray([circle, ...circleWrongs.slice(0, 3)].map(String))
            },
            triangle: {
                symbol: symbols.triangle.emoji,
                name: symbols.triangle.name,
                value: triangle,
                options: shuffleArray([triangle, ...triangleWrongs.slice(0, 3)].map(String))
            }
        },

        // 전체 정답 문자열 (단일 선택용 폴백)
        answer: `□=${square}, ○=${circle}, △=${triangle}`,

        // 해설
        explanation: generated.fullExplanation,

        // 풀이 순서 (선택적)
        solveOrder: generated.solveOrder || [1, 2, 3],

        // 패턴 정보
        patternType: patternType,
        patternName: pattern.name,

        // 문제 고유 키
        problemKey: `symbolEquation-${difficulty}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
    };
}

/**
 * 배열 섞기 유틸리티 (ProblemBase가 없을 경우 대비)
 */
function shuffleArray(array) {
    if (window.ProblemBase && window.ProblemBase.shuffleArray) {
        return window.ProblemBase.shuffleArray(array);
    }
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

/**
 * 미지수 문제 정답 검증 함수
 * @param {Object} problem - 문제 객체
 * @param {Object} userAnswers - 사용자 답안 { square: number, circle: number, triangle: number }
 * @returns {Object} 검증 결과
 */
function validateSymbolEquationAnswer(problem, userAnswers) {
    const correct = problem.answers;

    const results = {
        square: {
            correct: parseInt(userAnswers.square) === correct.square.value,
            userAnswer: userAnswers.square,
            correctAnswer: correct.square.value
        },
        circle: {
            correct: parseInt(userAnswers.circle) === correct.circle.value,
            userAnswer: userAnswers.circle,
            correctAnswer: correct.circle.value
        },
        triangle: {
            correct: parseInt(userAnswers.triangle) === correct.triangle.value,
            userAnswer: userAnswers.triangle,
            correctAnswer: correct.triangle.value
        }
    };

    results.allCorrect = results.square.correct && results.circle.correct && results.triangle.correct;
    results.correctCount = [results.square.correct, results.circle.correct, results.triangle.correct].filter(Boolean).length;

    return results;
}

// 전역으로 내보내기
window.SymbolEquationProblems = {
    TEMPLATES: SYMBOL_EQUATION_TEMPLATES,
    generate: generateSymbolEquationProblem,
    validate: validateSymbolEquationAnswer
};

console.log('미지수 추론 문제 모듈(symbolEquationProblems.js)이 로드되었습니다.');
