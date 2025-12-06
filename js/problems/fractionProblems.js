/* =========================================================================
   분수 문제 템플릿 - Fraction Problems
   문항 구성 원리 적용:
   1. 분수의 개념 이해 (전체와 부분)
   2. 명확한 발문 ("얼마를 먹었을까요?", "몇 분의 몇?")
   3. 매력적 오답 (분자/분모 혼동, 크기 비교 오류)
   4. 시각적 이모지로 분수 상황 표현
   ========================================================================= */

const FRACTION_TEMPLATES = {
    // 분수 읽기 (3~4학년)
    reading: [
        {
            template: (numer, denom, name1) => ({
                question: `🍕 ${name1}이(가) 피자를 ${denom}조각으로 똑같이 나눴어요.\n그 중 ${numer}조각을 먹었다면, 얼마를 먹은 걸까요?`,
                explanation: `전체 ${denom}조각 중 ${numer}조각이므로 ${numer}/${denom}입니다!`,
                answer: `${numer}/${denom}`,
                wrongs: [`${denom}/${numer}`, `${numer}/${denom + 1}`, `${numer + 1}/${denom}`]
            })
        },
        {
            template: (numer, denom, name1) => ({
                question: `🍰 ${name1}이(가) 케이크를 ${denom}조각으로 나눴어요.\n${numer}조각을 가져갔다면, 몇 분의 몇을 가져간 걸까요?`,
                explanation: `전체 ${denom}조각 중 ${numer}조각이므로 ${numer}/${denom}입니다!`,
                answer: `${numer}/${denom}`,
                wrongs: [`${denom}/${numer}`, `${numer}/${denom + 1}`, `1/${denom}`]
            })
        }
    ],

    // 분수 크기 비교 (3~4학년)
    comparison: [
        {
            template: (frac1, frac2, bigger, name1, name2) => ({
                question: `🍕 ${name1}은 피자의 ${frac1}을, ${name2}은 ${frac2}을 먹었어요.\n누가 더 많이 먹었을까요?`,
                explanation: `분모가 같으면 분자가 클수록 더 큽니다! ${bigger}이 더 커요.`,
                answer: `${frac1}이 더 큰 경우` ? name1 : name2,
                wrongs: ['같다', '모름']
            })
        }
    ],

    // 단위분수 (3학년)
    unitFraction: [
        {
            template: (denom, name1) => ({
                question: `🎂 ${name1}이(가) 케이크를 ${denom}명과 똑같이 나눠 먹으려고 해요.\n한 사람이 먹는 양은 전체의 얼마일까요?`,
                explanation: `${denom}명이 똑같이 나누면 한 사람은 1/${denom}을 먹어요!`,
                answer: `1/${denom}`,
                wrongs: [`${denom}/1`, `1/${denom + 1}`, `1/${denom - 1 > 0 ? denom - 1 : denom + 2}`]
            })
        }
    ],

    // 분수만큼 찾기 (3~4학년)
    finding: [
        {
            template: (total, numer, denom, result, name1) => ({
                question: `🍬 ${name1}이(가) 사탕 ${total}개를 가지고 있어요.\n이 중 ${numer}/${denom}은 몇 개일까요?`,
                explanation: `${total}개의 ${numer}/${denom}은 ${total} × ${numer}/${denom} = ${result}개입니다!`,
                answer: `${result}개`,
                wrongs: [`${result + 1}개`, `${result - 1 > 0 ? result - 1 : result + 2}개`, `${total}개`]
            })
        }
    ]
};

// 분수 문제 생성 함수
function generateFractionProblem(difficulty) {
    const { getRandomCharacter, getTwoCharacters, createProblemResult, shuffleArray } = window.ProblemBase;

    const [name1, name2] = getTwoCharacters();
    const type = Math.floor(Math.random() * 3);
    let result;

    if (type === 0) {
        // 분수 읽기
        const denom = Math.floor(Math.random() * 6) + 2; // 2~7
        const numer = Math.floor(Math.random() * (denom - 1)) + 1; // 1 ~ denom-1

        const template = FRACTION_TEMPLATES.reading[Math.floor(Math.random() * FRACTION_TEMPLATES.reading.length)];
        result = template.template(numer, denom, name1);

    } else if (type === 1) {
        // 단위분수
        const denom = Math.floor(Math.random() * 6) + 2; // 2~7

        const template = FRACTION_TEMPLATES.unitFraction[0];
        result = template.template(denom, name1);

    } else {
        // 분수만큼 찾기
        const denom = [2, 3, 4, 5][Math.floor(Math.random() * 4)];
        const numer = 1;
        const multiplier = Math.floor(Math.random() * 4) + 2;
        const total = denom * multiplier;
        const resultVal = numer * multiplier;

        const template = FRACTION_TEMPLATES.finding[0];
        result = template.template(total, numer, denom, resultVal, name1);
    }

    return createProblemResult(result.question, result.answer, result.explanation, result.wrongs, 'fraction', difficulty);
}

// 전역으로 내보내기
window.FractionProblems = {
    TEMPLATES: FRACTION_TEMPLATES,
    generate: generateFractionProblem
};
