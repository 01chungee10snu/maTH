/* =========================================================================
   길이 문제 템플릿 - Length Problems
   문항 구성 원리 적용:
   1. cm, mm, m 단위의 길이 측정과 비교
   2. 명확한 발문 ("길이는 몇 cm?", "더 긴 것은?")
   3. 매력적 오답 (단위 혼동, 비교 오류)
   4. 시각적 이모지로 측정 상황 표현
   ========================================================================= */

const LENGTH_TEMPLATES = {
    // 길이 비교 (1~2학년)
    comparison: [
        {
            template: (a, b, longer, shorter, name1, name2) => ({
                question: `📏 ${name1}의 연필은 ${a}cm, ${name2}의 연필은 ${b}cm예요.\n더 긴 연필은 몇 cm일까요?`,
                explanation: `${a}cm와 ${b}cm를 비교하면 ${longer}cm가 더 깁니다!`,
                answer: `${longer}cm`,
                wrongs: [`${shorter}cm`, `${a + b}cm`, `${Math.abs(a - b)}cm`]
            })
        },
        {
            template: (a, b, longer, shorter, name1, name2) => ({
                question: `📐 ${name1}의 리본은 ${a}cm, ${name2}의 리본은 ${b}cm예요.\n더 짧은 리본은 몇 cm일까요?`,
                explanation: `${a}cm와 ${b}cm를 비교하면 ${shorter}cm가 더 짧습니다!`,
                answer: `${shorter}cm`,
                wrongs: [`${longer}cm`, `${a + b}cm`, `${Math.abs(a - b)}cm`]
            })
        }
    ],

    // 길이 합 (2~3학년)
    addition: [
        {
            template: (a, b, total, name1) => ({
                question: `📏 ${name1}이(가) ${a}cm 막대와 ${b}cm 막대를 이었어요.\n이은 막대의 전체 길이는 몇 cm일까요?`,
                explanation: `${a}cm + ${b}cm = ${total}cm입니다!`,
                answer: `${total}cm`,
                wrongs: [`${total - 1}cm`, `${total + 1}cm`, `${Math.abs(a - b)}cm`]
            })
        }
    ],

    // 길이 차이 (2~3학년)
    difference: [
        {
            template: (a, b, diff, name1, name2) => ({
                question: `📏 ${name1}의 줄자는 ${a}cm, ${name2}의 줄자는 ${b}cm예요.\n두 줄자의 길이 차이는 몇 cm일까요?`,
                explanation: `${a}cm - ${b}cm = ${diff}cm입니다!`,
                answer: `${diff}cm`,
                wrongs: [`${diff + 1}cm`, `${diff - 1 > 0 ? diff - 1 : diff + 2}cm`, `${a + b}cm`]
            })
        }
    ],

    // 단위 변환 (2~3학년)
    conversion: [
        {
            template: (cm, mm) => ({
                question: `📐 1cm = 10mm예요.\n${cm}cm는 몇 mm일까요?`,
                explanation: `${cm}cm × 10 = ${mm}mm입니다!`,
                answer: `${mm}mm`,
                wrongs: [`${cm}mm`, `${mm + 10}mm`, `${mm - 10 > 0 ? mm - 10 : mm + 5}mm`]
            })
        }
    ]
};

// 길이 문제 생성 함수
function generateLengthProblem(difficulty) {
    const { getRandomCharacter, getTwoCharacters, createProblemResult, shuffleArray } = window.ProblemBase;

    const [name1, name2] = getTwoCharacters();
    const type = Math.floor(Math.random() * 4);
    let result;

    if (type === 0) {
        // 길이 비교
        const a = Math.floor(Math.random() * 20) + 5;
        let b;
        do {
            b = Math.floor(Math.random() * 20) + 5;
        } while (a === b);
        const longer = Math.max(a, b);
        const shorter = Math.min(a, b);

        const template = LENGTH_TEMPLATES.comparison[Math.floor(Math.random() * LENGTH_TEMPLATES.comparison.length)];
        result = template.template(a, b, longer, shorter, name1, name2);

    } else if (type === 1) {
        // 길이 합
        const a = Math.floor(Math.random() * 15) + 3;
        const b = Math.floor(Math.random() * 15) + 3;
        const total = a + b;

        const template = LENGTH_TEMPLATES.addition[0];
        result = template.template(a, b, total, name1);

    } else if (type === 2) {
        // 길이 차이
        let a = Math.floor(Math.random() * 20) + 10;
        let b = Math.floor(Math.random() * 10) + 3;
        if (a < b) [a, b] = [b, a];
        const diff = a - b;

        const template = LENGTH_TEMPLATES.difference[0];
        result = template.template(a, b, diff, name1, name2);

    } else {
        // 단위 변환
        const cm = Math.floor(Math.random() * 10) + 1;
        const mm = cm * 10;

        const template = LENGTH_TEMPLATES.conversion[0];
        result = template.template(cm, mm);
    }

    return createProblemResult(result.question, result.answer, result.explanation, result.wrongs, 'length', difficulty);
}

// 전역으로 내보내기
window.LengthProblems = {
    TEMPLATES: LENGTH_TEMPLATES,
    generate: generateLengthProblem
};
