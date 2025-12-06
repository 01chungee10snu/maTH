/* =========================================================================
   덧셈 문제 템플릿 - Addition Problems
   문항 구성 원리 적용:
   1. 구체적 상황 제시 (사탕, 풍선, 동물 등 친숙한 소재)
   2. 명확한 발문 ("모두 몇 개일까요?")
   3. 매력적 오답 (±1, ±5, 연산 혼동)
   4. 시각적 이모지로 흥미 유발
   ========================================================================= */

const ADDITION_TEMPLATES = {
    // 기본 합 구하기 (1~2학년)
    basic: [
        {
            context: '사탕 모으기',
            template: (a, b, name1, name2) => ({
                question: `🍬 ${name1}이(가) 사탕 ${a}개를 가지고 있었어요. ${name2}이(가) ${b}개를 더 주었다면, 사탕은 모두 몇 개일까요?`,
                explanation: `${name1}의 사탕 ${a}개에 ${name2}이(가) 준 ${b}개를 더하면 ${a} + ${b} = ${a + b}개입니다.`
            })
        },
        {
            context: '버스 탑승',
            template: (a, b, name1) => ({
                question: `🚌 버스에 ${a}명이 타고 있었어요. 다음 정류장에서 ${b}명이 더 탔다면, 버스에는 모두 몇 명이 있을까요?`,
                explanation: `처음 ${a}명에 새로 탄 ${b}명을 더하면 ${a} + ${b} = ${a + b}명입니다.`
            })
        },
        {
            context: '독서',
            template: (a, b, name1) => ({
                question: `📖 ${name1}(이)가 동화책을 아침에 ${a}쪽, 저녁에 ${b}쪽 읽었어요. 오늘 모두 몇 쪽을 읽었을까요?`,
                explanation: `아침에 읽은 ${a}쪽과 저녁에 읽은 ${b}쪽을 더하면 ${a} + ${b} = ${a + b}쪽입니다.`
            })
        },
        {
            context: '학생 수',
            template: (a, b) => ({
                question: `👧👦 운동장에 남학생 ${a}명과 여학생 ${b}명이 있어요. 학생은 모두 몇 명일까요?`,
                explanation: `남학생 ${a}명과 여학생 ${b}명을 더하면 ${a} + ${b} = ${a + b}명입니다.`
            })
        },
        {
            context: '스티커',
            template: (a, b, name1) => ({
                question: `⭐ ${name1}이(가) 스티커 ${a}장을 모았어요. 퀴즈를 맞혀서 ${b}장을 더 받았다면, 스티커는 모두 몇 장일까요?`,
                explanation: `원래 ${a}장에 받은 ${b}장을 더하면 ${a} + ${b} = ${a + b}장입니다.`
            })
        },
        {
            context: '풍선',
            template: (a, b) => ({
                question: `🎈 빨간 풍선 ${a}개와 파란 풍선 ${b}개가 있어요. 풍선은 모두 몇 개일까요?`,
                explanation: `빨간 풍선 ${a}개와 파란 풍선 ${b}개를 더하면 ${a} + ${b} = ${a + b}개입니다.`
            })
        },
        {
            context: '과일',
            template: (a, b) => ({
                question: `🍎 과일 바구니에 사과 ${a}개가 있었어요. 엄마가 ${b}개를 더 넣었다면, 사과는 모두 몇 개일까요?`,
                explanation: `원래 ${a}개에 추가된 ${b}개를 더하면 ${a} + ${b} = ${a + b}개입니다.`
            })
        },
        {
            context: '꽃',
            template: (a, b) => ({
                question: `🌸 정원에 꽃이 ${a}송이 피었어요. 오늘 ${b}송이가 더 피었다면, 꽃은 모두 몇 송이일까요?`,
                explanation: `처음 ${a}송이에 새로 핀 ${b}송이를 더하면 ${a} + ${b} = ${a + b}송이입니다.`
            })
        },
        {
            context: '나비',
            template: (a, b) => ({
                question: `🦋 나비 ${a}마리가 날아왔어요. 잠시 후 ${b}마리가 더 왔다면, 나비는 모두 몇 마리일까요?`,
                explanation: `처음 ${a}마리에 ${b}마리를 더하면 ${a} + ${b} = ${a + b}마리입니다.`
            })
        },
        {
            context: '블록',
            template: (a, b, name1) => ({
                question: `🏠 ${name1}이(가) 블록으로 집을 만들고 있어요. 빨간 블록 ${a}개와 파란 블록 ${b}개를 사용했다면, 블록은 모두 몇 개일까요?`,
                explanation: `빨간 블록 ${a}개와 파란 블록 ${b}개를 더하면 ${a} + ${b} = ${a + b}개입니다.`
            })
        },
        {
            context: '물고기',
            template: (a, b) => ({
                question: `🐟 수족관에 물고기가 ${a}마리 있었어요. ${b}마리를 더 넣었다면, 물고기는 모두 몇 마리일까요?`,
                explanation: `원래 ${a}마리에 ${b}마리를 더하면 ${a} + ${b} = ${a + b}마리입니다.`
            })
        },
        {
            context: '연필',
            template: (a, b) => ({
                question: `✏️ 연필통에 연필이 ${a}자루 있었어요. 새 연필 ${b}자루를 더 넣었다면, 연필은 모두 몇 자루일까요?`,
                explanation: `원래 ${a}자루에 ${b}자루를 더하면 ${a} + ${b} = ${a + b}자루입니다.`
            })
        }
    ],

    // 세 수의 덧셈 (2~3학년)
    threeNumbers: [
        {
            context: '구슬 모으기',
            template: (a, b, c, name1) => ({
                question: `🔵🔴🟡 ${name1}이(가) 파란 구슬 ${a}개, 빨간 구슬 ${b}개, 노란 구슬 ${c}개를 가지고 있어요. 구슬은 모두 몇 개일까요?`,
                explanation: `${a} + ${b} + ${c} = ${a + b + c}개입니다.`,
                answer: a + b + c
            })
        },
        {
            context: '간식 먹기',
            template: (a, b, c, name1) => ({
                question: `🍪 ${name1}이(가) 아침에 과자 ${a}개, 점심에 ${b}개, 저녁에 ${c}개를 먹었어요. 하루 동안 과자를 모두 몇 개 먹었을까요?`,
                explanation: `${a} + ${b} + ${c} = ${a + b + c}개입니다.`,
                answer: a + b + c
            })
        }
    ],

    // 받아올림 있는 덧셈 (2학년)
    withCarry: [
        {
            context: '저금통',
            template: (a, b, name1) => ({
                question: `🪙 ${name1}의 저금통에 동전이 ${a}개 있었어요. 오늘 ${b}개를 더 넣었다면, 동전은 모두 몇 개일까요?`,
                explanation: `${a} + ${b} = ${a + b}개입니다. (받아올림이 있어요!)`
            })
        },
        {
            context: '계단 오르기',
            template: (a, b, name1) => ({
                question: `🪜 ${name1}이(가) 계단을 ${a}칸 올라갔어요. ${b}칸을 더 올라가면, 모두 몇 칸을 올라간 걸까요?`,
                explanation: `${a} + ${b} = ${a + b}칸입니다.`
            })
        }
    ]
};

// 덧셈 문제 생성 함수
function generateAdditionProblem(difficulty) {
    const { getRandomCharacter, getTwoCharacters, generateDistractors, createProblemResult } = window.ProblemBase;

    const max = difficulty * 10;
    const a = Math.floor(Math.random() * max) + 1;
    const b = Math.floor(Math.random() * max) + 1;
    const answer = a + b;

    const [name1, name2] = getTwoCharacters();

    // 템플릿 선택
    let templates;
    if (difficulty <= 3) {
        templates = ADDITION_TEMPLATES.basic;
    } else if (difficulty <= 6 && Math.random() < 0.3) {
        templates = ADDITION_TEMPLATES.withCarry;
    } else {
        templates = ADDITION_TEMPLATES.basic;
    }

    const template = templates[Math.floor(Math.random() * templates.length)];
    const result = template.template(a, b, name1, name2);

    // 매력적 오답 생성 (흔한 실수 반영)
    const wrongs = new Set();
    wrongs.add(answer + 1);     // +1 오류
    wrongs.add(answer - 1);     // -1 오류
    wrongs.add(Math.abs(a - b)); // 뺄셈과 혼동
    if (answer > 10) wrongs.add(answer + 10); // 자릿수 오류

    const wrongsArray = Array.from(wrongs).filter(w => w !== answer && w > 0).slice(0, 3);
    while (wrongsArray.length < 3) {
        const wrong = answer + Math.floor(Math.random() * 10) - 5;
        if (wrong > 0 && wrong !== answer && !wrongsArray.includes(wrong)) {
            wrongsArray.push(wrong);
        }
    }

    return createProblemResult(result.question, answer, result.explanation, wrongsArray, 'addition', difficulty);
}

// 전역으로 내보내기
window.AdditionProblems = {
    TEMPLATES: ADDITION_TEMPLATES,
    generate: generateAdditionProblem
};
