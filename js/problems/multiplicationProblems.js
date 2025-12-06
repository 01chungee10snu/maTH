/* =========================================================================
   곱셈 문제 템플릿 - Multiplication Problems
   문항 구성 원리 적용:
   1. 묶음의 개념을 강조하는 상황 제시 ("~씩 ~개")
   2. 명확한 발문 ("모두 몇 개일까요?")
   3. 매력적 오답 (덧셈 혼동, 구구단 인접 오류)
   4. 시각적 이모지로 묶음 표현
   ========================================================================= */

const MULTIPLICATION_TEMPLATES = {
    // 기본 곱셈 (2~3학년)
    basic: [
        {
            context: '사탕 봉지',
            template: (a, b, name1) => ({
                question: `🍬 한 봉지에 사탕이 ${a}개씩 들어 있어요. ${b}봉지에는 사탕이 모두 몇 개 있을까요?`,
                explanation: `한 봉지에 ${a}개씩 ${b}봉지이므로 ${a} × ${b} = ${a * b}개입니다.`
            })
        },
        {
            context: '스티커 모으기',
            template: (a, b, name1) => ({
                question: `⭐ ${name1}이(가) 하루에 스티커를 ${a}장씩 모아요. ${b}일 동안 모으면 스티커는 모두 몇 장일까요?`,
                explanation: `하루에 ${a}장씩 ${b}일이므로 ${a} × ${b} = ${a * b}장입니다.`
            })
        },
        {
            context: '귤 상자',
            template: (a, b) => ({
                question: `🍊 한 상자에 귤이 ${a}개씩 들어 있어요. ${b}상자에는 귤이 모두 몇 개 있을까요?`,
                explanation: `한 상자에 ${a}개씩 ${b}상자이므로 ${a} × ${b} = ${a * b}개입니다.`
            })
        },
        {
            context: '버스 정원',
            template: (a, b) => ({
                question: `🚌 버스 한 대에 ${a}명씩 탈 수 있어요. 버스 ${b}대에는 모두 몇 명이 탈 수 있을까요?`,
                explanation: `한 대에 ${a}명씩 ${b}대이므로 ${a} × ${b} = ${a * b}명입니다.`
            })
        },
        {
            context: '연필 묶음',
            template: (a, b) => ({
                question: `✏️ 연필 한 묶음에 ${a}자루씩 있어요. ${b}묶음에는 연필이 모두 몇 자루 있을까요?`,
                explanation: `한 묶음에 ${a}자루씩 ${b}묶음이므로 ${a} × ${b} = ${a * b}자루입니다.`
            })
        },
        {
            context: '초콜릿 나누기',
            template: (a, b, name1) => ({
                question: `🍫 ${name1}이(가) 친구 ${b}명에게 초콜릿을 ${a}개씩 나눠주려고 해요. 초콜릿은 모두 몇 개 필요할까요?`,
                explanation: `친구 한 명에게 ${a}개씩 ${b}명이므로 ${a} × ${b} = ${a * b}개입니다.`
            })
        },
        {
            context: '의자 배열',
            template: (a, b) => ({
                question: `🪑 한 줄에 의자가 ${a}개씩 놓여 있어요. ${b}줄에는 의자가 모두 몇 개 있을까요?`,
                explanation: `한 줄에 ${a}개씩 ${b}줄이므로 ${a} × ${b} = ${a * b}개입니다.`
            })
        },
        {
            context: '꽃밭',
            template: (a, b) => ({
                question: `🌸 꽃밭에 꽃이 한 줄에 ${a}송이씩 심어져 있어요. ${b}줄이면 꽃은 모두 몇 송이일까요?`,
                explanation: `한 줄에 ${a}송이씩 ${b}줄이므로 ${a} × ${b} = ${a * b}송이입니다.`
            })
        },
        {
            context: '선물 상자',
            template: (a, b) => ({
                question: `🎁 선물 상자 하나에 사탕이 ${a}개씩 들어있어요. 상자 ${b}개에는 사탕이 모두 몇 개일까요?`,
                explanation: `한 상자에 ${a}개씩 ${b}상자이므로 ${a} × ${b} = ${a * b}개입니다.`
            })
        },
        {
            context: '수족관',
            template: (a, b) => ({
                question: `🐟 수족관 한 칸에 물고기가 ${a}마리씩 있어요. ${b}칸에는 물고기가 모두 몇 마리일까요?`,
                explanation: `한 칸에 ${a}마리씩 ${b}칸이므로 ${a} × ${b} = ${a * b}마리입니다.`
            })
        },
        {
            context: '책장',
            template: (a, b) => ({
                question: `📚 책장 한 칸에 책이 ${a}권씩 꽂혀 있어요. ${b}칸에는 책이 모두 몇 권일까요?`,
                explanation: `한 칸에 ${a}권씩 ${b}칸이므로 ${a} × ${b} = ${a * b}권입니다.`
            })
        },
        {
            context: '컵케이크',
            template: (a, b) => ({
                question: `🧁 접시 하나에 컵케이크가 ${a}개씩 있어요. ${b}접시에는 컵케이크가 모두 몇 개일까요?`,
                explanation: `한 접시에 ${a}개씩 ${b}접시이므로 ${a} × ${b} = ${a * b}개입니다.`
            })
        }
    ],

    // 배열 곱셈 (시각화)
    array: [
        {
            context: '도장 배열',
            template: (a, b) => ({
                question: `🔴 도장이 가로로 ${a}개, 세로로 ${b}줄 찍혀 있어요. 도장은 모두 몇 개일까요?`,
                explanation: `${a} × ${b} = ${a * b}개입니다. (배열로 곱셈하기!)`,
                visual: true
            })
        }
    ]
};

// 곱셈 문제 생성 함수
function generateMultiplicationProblem(difficulty) {
    const { getRandomCharacter, createProblemResult } = window.ProblemBase;

    const dan = Math.max(2, Math.min(9, difficulty));
    const a = dan;
    const b = Math.floor(Math.random() * 9) + 1;
    const answer = a * b;

    const name1 = getRandomCharacter();

    // 템플릿 선택
    const templates = MULTIPLICATION_TEMPLATES.basic;
    const template = templates[Math.floor(Math.random() * templates.length)];
    const result = template.template(a, b, name1);

    // 매력적 오답 생성 (구구단 오류 반영)
    const wrongs = new Set();
    wrongs.add(a * (b + 1));     // 다음 단 혼동
    wrongs.add(a * (b - 1));     // 이전 단 혼동
    wrongs.add(a + b);           // 덧셈과 혼동
    wrongs.add((a + 1) * b);     // 인접 단 오류
    wrongs.add((a - 1) * b);     // 인접 단 오류

    const wrongsArray = Array.from(wrongs).filter(w => w !== answer && w > 0).slice(0, 3);

    return createProblemResult(result.question, answer, result.explanation, wrongsArray, 'multiplication', difficulty);
}

// 전역으로 내보내기
window.MultiplicationProblems = {
    TEMPLATES: MULTIPLICATION_TEMPLATES,
    generate: generateMultiplicationProblem
};
