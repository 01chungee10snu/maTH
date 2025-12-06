/* =========================================================================
   뺄셈 문제 템플릿 - Subtraction Problems
   문항 구성 원리 적용:
   1. 구체적 상황 제시 (남은 것, 차이 구하기 등)
   2. 명확한 발문 ("남은 것은 몇 개일까요?", "차이는 얼마일까요?")
   3. 매력적 오답 (덧셈 혼동, 큰 수에서 작은 수 빼기 오류)
   4. 시각적 이모지로 흥미 유발
   ========================================================================= */

const SUBTRACTION_TEMPLATES = {
    // 남은 것 구하기 (1~2학년)
    remaining: [
        {
            context: '사탕 나눠주기',
            template: (a, b, name1) => ({
                question: `🍬 ${name1}이(가) 사탕 ${a}개를 가지고 있었어요. 친구에게 ${b}개를 주었다면, 남은 사탕은 몇 개일까요?`,
                explanation: `원래 ${a}개에서 준 ${b}개를 빼면 ${a} - ${b} = ${a - b}개가 남습니다.`
            })
        },
        {
            context: '버스 하차',
            template: (a, b) => ({
                question: `🚌 버스에 ${a}명이 타고 있었어요. 정류장에서 ${b}명이 내렸다면, 남은 사람은 몇 명일까요?`,
                explanation: `처음 ${a}명에서 내린 ${b}명을 빼면 ${a} - ${b} = ${a - b}명입니다.`
            })
        },
        {
            context: '연필 사용',
            template: (a, b) => ({
                question: `✏️ 책상 위에 연필이 ${a}자루 있었어요. 동생이 ${b}자루를 가져갔다면, 남은 연필은 몇 자루일까요?`,
                explanation: `원래 ${a}자루에서 가져간 ${b}자루를 빼면 ${a} - ${b} = ${a - b}자루입니다.`
            })
        },
        {
            context: '과자 먹기',
            template: (a, b) => ({
                question: `🍪 과자가 ${a}개 있었는데 ${b}개를 먹었어요. 남은 과자는 몇 개일까요?`,
                explanation: `원래 ${a}개에서 먹은 ${b}개를 빼면 ${a} - ${b} = ${a - b}개입니다.`
            })
        },
        {
            context: '스티커 선물',
            template: (a, b, name1) => ({
                question: `⭐ ${name1}이(가) 스티커 ${a}장을 가지고 있었어요. 친구에게 ${b}장을 선물했다면, 남은 스티커는 몇 장일까요?`,
                explanation: `원래 ${a}장에서 선물한 ${b}장을 빼면 ${a} - ${b} = ${a - b}장입니다.`
            })
        },
        {
            context: '풍선 터짐',
            template: (a, b) => ({
                question: `🎈 풍선이 ${a}개 있었는데 ${b}개가 터졌어요. 남은 풍선은 몇 개일까요?`,
                explanation: `원래 ${a}개에서 터진 ${b}개를 빼면 ${a} - ${b} = ${a - b}개입니다.`
            })
        },
        {
            context: '책 읽기',
            template: (a, b, name1) => ({
                question: `📖 ${name1}(이)가 동화책 ${a}쪽을 읽으려고 해요. 이미 ${b}쪽을 읽었다면, 남은 쪽수는?`,
                explanation: `전체 ${a}쪽에서 읽은 ${b}쪽을 빼면 ${a} - ${b} = ${a - b}쪽 남았습니다.`
            })
        },
        {
            context: '사과 먹기',
            template: (a, b) => ({
                question: `🍎 바구니에 사과가 ${a}개 있었어요. ${b}개를 먹었다면, 남은 사과는 몇 개일까요?`,
                explanation: `원래 ${a}개에서 먹은 ${b}개를 빼면 ${a} - ${b} = ${a - b}개입니다.`
            })
        },
        {
            context: '꽃 시들기',
            template: (a, b) => ({
                question: `🌸 정원에 꽃이 ${a}송이 있었어요. ${b}송이가 시들었다면, 남은 꽃은 몇 송이일까요?`,
                explanation: `원래 ${a}송이에서 시든 ${b}송이를 빼면 ${a} - ${b} = ${a - b}송이입니다.`
            })
        },
        {
            context: '물고기 옮기기',
            template: (a, b) => ({
                question: `🐟 수족관에 물고기가 ${a}마리 있었어요. ${b}마리를 다른 곳으로 옮겼다면, 남은 물고기는 몇 마리일까요?`,
                explanation: `원래 ${a}마리에서 옮긴 ${b}마리를 빼면 ${a} - ${b} = ${a - b}마리입니다.`
            })
        },
        {
            context: '초콜릿 나누기',
            template: (a, b) => ({
                question: `🎁 선물 상자에 초콜릿이 ${a}개 있었어요. ${b}개를 나눠줬다면, 남은 초콜릿은 몇 개일까요?`,
                explanation: `원래 ${a}개에서 나눠준 ${b}개를 빼면 ${a} - ${b} = ${a - b}개입니다.`
            })
        },
        {
            context: '블록 떨어짐',
            template: (a, b, name1) => ({
                question: `🏠 ${name1}이(가) 블록 ${a}개로 탑을 쌓았어요. ${b}개가 떨어졌다면, 남은 블록은 몇 개일까요?`,
                explanation: `원래 ${a}개에서 떨어진 ${b}개를 빼면 ${a} - ${b} = ${a - b}개입니다.`
            })
        }
    ],

    // 차이 구하기 (2~3학년)
    difference: [
        {
            context: '키 비교',
            template: (a, b, name1, name2) => ({
                question: `📏 ${name1}의 키는 ${a}cm이고, ${name2}의 키는 ${b}cm예요. 두 사람의 키 차이는 몇 cm일까요?`,
                explanation: `${a} - ${b} = ${a - b}cm입니다.`,
                answer: a - b
            })
        },
        {
            context: '나이 차이',
            template: (a, b, name1, name2) => ({
                question: `🎂 ${name1}은(는) ${a}살이고, ${name2}은(는) ${b}살이에요. 두 사람의 나이 차이는 몇 살일까요?`,
                explanation: `${a} - ${b} = ${a - b}살입니다.`,
                answer: a - b
            })
        }
    ],

    // 비교 뺄셈 (더 많이/적게)
    comparison: [
        {
            context: '사탕 비교',
            template: (a, b, name1, name2) => ({
                question: `🍬 ${name1}은(는) 사탕 ${a}개, ${name2}은(는) ${b}개를 가지고 있어요. ${name1}이(가) 몇 개 더 많을까요?`,
                explanation: `${a} - ${b} = ${a - b}개 더 많습니다.`,
                answer: a - b
            })
        }
    ]
};

// 뺄셈 문제 생성 함수
function generateSubtractionProblem(difficulty) {
    const { getRandomCharacter, getTwoCharacters, createProblemResult } = window.ProblemBase;

    const max = difficulty * 10;
    let a = Math.floor(Math.random() * max) + 1;
    let b = Math.floor(Math.random() * max) + 1;
    if (a < b) [a, b] = [b, a]; // 항상 a >= b

    const answer = a - b;
    const name1 = getRandomCharacter();

    // 템플릿 선택
    let templates;
    if (difficulty <= 3) {
        templates = SUBTRACTION_TEMPLATES.remaining;
    } else if (Math.random() < 0.3) {
        templates = SUBTRACTION_TEMPLATES.difference;
    } else {
        templates = SUBTRACTION_TEMPLATES.remaining;
    }

    const template = templates[Math.floor(Math.random() * templates.length)];
    const result = template.template(a, b, name1);

    // 매력적 오답 생성 (흔한 실수 반영)
    const wrongs = new Set();
    wrongs.add(answer + 1);          // +1 오류
    wrongs.add(answer - 1 > 0 ? answer - 1 : answer + 2); // -1 오류
    wrongs.add(a + b);               // 덧셈과 혼동
    wrongs.add(a);                   // 원래 수 혼동
    wrongs.add(b);                   // 빼는 수 혼동

    const wrongsArray = Array.from(wrongs).filter(w => w !== answer && w >= 0).slice(0, 3);

    return createProblemResult(result.question, answer, result.explanation, wrongsArray, 'subtraction', difficulty);
}

// 전역으로 내보내기
window.SubtractionProblems = {
    TEMPLATES: SUBTRACTION_TEMPLATES,
    generate: generateSubtractionProblem
};
