/* =========================================================================
   나눗셈 문제 템플릿 - Division Problems
   문항 구성 원리 적용:
   1. 등분제(똑같이 나누기)와 포함제(묶어서 세기) 상황 구분
   2. 명확한 발문 ("각각 몇 개씩?", "몇 묶음?")
   3. 매력적 오답 (곱셈과 혼동, 나머지 포함 오류)
   4. 시각적 이모지로 나눔 표현
   ========================================================================= */

const DIVISION_TEMPLATES = {
    // 등분제 - 똑같이 나누기 (2~3학년)
    equalSharing: [
        {
            context: '사탕 나누기',
            template: (total, divisor, quotient, name1) => ({
                question: `🍬 ${name1}이(가) 사탕 ${total}개를 친구 ${divisor}명에게 똑같이 나눠주려고 해요. 한 명에게 몇 개씩 줄 수 있을까요?`,
                explanation: `${total} ÷ ${divisor} = ${quotient}개씩 나눠줄 수 있어요.`
            })
        },
        {
            context: '과일 나누기',
            template: (total, divisor, quotient, name1) => ({
                question: `🍎 사과 ${total}개를 ${divisor}개의 바구니에 똑같이 나누어 담으려고 해요. 한 바구니에 몇 개씩 담을 수 있을까요?`,
                explanation: `${total} ÷ ${divisor} = ${quotient}개씩 담을 수 있어요.`
            })
        },
        {
            context: '과자 나누기',
            template: (total, divisor, quotient, name1) => ({
                question: `🍪 과자 ${total}개를 ${divisor}명이 똑같이 나눠 먹으려고 해요. 한 사람이 몇 개씩 먹을 수 있을까요?`,
                explanation: `${total} ÷ ${divisor} = ${quotient}개씩 먹을 수 있어요.`
            })
        },
        {
            context: '구슬 나누기',
            template: (total, divisor, quotient, name1, name2) => ({
                question: `🔵 구슬 ${total}개를 ${name1}과 ${name2}가 똑같이 나눠 가지려고 해요. 한 명이 가질 수 있는 구슬은 몇 개일까요?`,
                explanation: `${total} ÷ 2 = ${quotient}개씩 가질 수 있어요.`
            })
        },
        {
            context: '색연필 나누기',
            template: (total, divisor, quotient) => ({
                question: `🖍️ 색연필 ${total}자루를 ${divisor}명에게 똑같이 나눠주려고 해요. 한 명에게 몇 자루씩 줄 수 있을까요?`,
                explanation: `${total} ÷ ${divisor} = ${quotient}자루씩 줄 수 있어요.`
            })
        },
        {
            context: '연필 나누기',
            template: (total, divisor, quotient) => ({
                question: `✏️ 연필 ${total}자루를 ${divisor}개의 연필통에 똑같이 나눠 담으려고 해요. 한 통에 몇 자루씩 담을 수 있을까요?`,
                explanation: `${total} ÷ ${divisor} = ${quotient}자루씩 담을 수 있어요.`
            })
        }
    ],

    // 포함제 - 묶어서 세기 (2~3학년)
    quotitive: [
        {
            context: '묶음 만들기',
            template: (total, groupSize, groups, name1) => ({
                question: `🍬 ${name1}이(가) 사탕 ${total}개를 ${groupSize}개씩 봉지에 담으려고 해요. 봉지는 몇 개가 필요할까요?`,
                explanation: `${total} ÷ ${groupSize} = ${groups}봉지가 필요해요.`
            })
        },
        {
            context: '팀 나누기',
            template: (total, groupSize, groups) => ({
                question: `👦👧 학생 ${total}명을 ${groupSize}명씩 한 팀으로 나누려고 해요. 팀은 모두 몇 개가 될까요?`,
                explanation: `${total} ÷ ${groupSize} = ${groups}팀이 돼요.`
            })
        },
        {
            context: '줄 세우기',
            template: (total, groupSize, groups) => ({
                question: `🧍 사람 ${total}명이 ${groupSize}명씩 한 줄로 서려고 해요. 줄은 몇 줄이 될까요?`,
                explanation: `${total} ÷ ${groupSize} = ${groups}줄이 돼요.`
            })
        },
        {
            context: '상자 담기',
            template: (total, groupSize, groups) => ({
                question: `📦 책 ${total}권을 ${groupSize}권씩 상자에 담으려고 해요. 상자는 몇 개가 필요할까요?`,
                explanation: `${total} ÷ ${groupSize} = ${groups}상자가 필요해요.`
            })
        }
    ],

    // 나머지 있는 나눗셈 (3학년)
    withRemainder: [
        {
            context: '사탕 남기',
            template: (total, divisor, quotient, remainder, name1) => ({
                question: `🍬 ${name1}이(가) 사탕 ${total}개를 ${divisor}명에게 똑같이 나눠주려고 해요. 한 명에게 몇 개씩 주고, 몇 개가 남을까요?`,
                explanation: `${total} ÷ ${divisor} = ${quotient} ... ${remainder}이므로, ${quotient}개씩 주고 ${remainder}개가 남아요.`,
                hasRemainder: true
            })
        }
    ]
};

// 나눗셈 문제 생성 함수
function generateDivisionProblem(difficulty) {
    const { getRandomCharacter, getTwoCharacters, createProblemResult, shuffleArray } = window.ProblemBase;

    const dan = Math.max(2, Math.min(9, difficulty));
    const divisor = dan;
    const quotient = Math.floor(Math.random() * 9) + 1;
    const total = divisor * quotient;

    const [name1, name2] = getTwoCharacters();

    // 문제 유형 선택
    const isQuotitive = Math.random() < 0.3;
    let templates;
    if (isQuotitive) {
        templates = DIVISION_TEMPLATES.quotitive;
    } else {
        templates = DIVISION_TEMPLATES.equalSharing;
    }

    const template = templates[Math.floor(Math.random() * templates.length)];
    let result;
    if (isQuotitive) {
        result = template.template(total, divisor, quotient, name1);
    } else {
        result = template.template(total, divisor, quotient, name1, name2);
    }

    // 매력적 오답 생성 (나눗셈 오류 반영)
    const wrongs = new Set();
    wrongs.add(quotient + 1);        // +1 오류
    wrongs.add(quotient - 1 > 0 ? quotient - 1 : quotient + 2); // -1 오류
    wrongs.add(divisor);             // 나누는 수와 혼동
    wrongs.add(total);               // 원래 수 혼동
    wrongs.add(total - divisor);     // 뺄셈 혼동
    wrongs.add(quotient + divisor);  // 연산 혼동

    const wrongsArray = Array.from(wrongs).filter(w => w !== quotient && w > 0).slice(0, 3);

    return createProblemResult(result.question, quotient, result.explanation, wrongsArray, 'division', difficulty);
}

// 전역으로 내보내기
window.DivisionProblems = {
    TEMPLATES: DIVISION_TEMPLATES,
    generate: generateDivisionProblem
};
