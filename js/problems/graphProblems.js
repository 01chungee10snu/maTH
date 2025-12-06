/* =========================================================================
   자료 해석 문제 템플릿 - Graph/Data Problems
   문항 구성 원리 적용:
   1. 그래프, 표 해석 상황 제시
   2. 명확한 발문 ("가장 많은 것은?", "몇 개 차이?")
   3. 매력적 오답 (두 번째로 많은 것, 합계 혼동)
   4. 시각적 이모지로 데이터 표현
   ========================================================================= */

const GRAPH_TEMPLATES = {
    // 막대그래프 해석 (2~3학년)
    barGraph: [
        {
            context: '좋아하는 과일',
            template: (items, counts, maxItem, maxCount, name1) => ({
                question: `📊 ${name1}의 반 친구들이 좋아하는 과일을 조사했어요.\n${items.map((item, i) => `${item}: ${counts[i]}명`).join(', ')}\n가장 많은 친구들이 좋아하는 과일은 무엇일까요?`,
                explanation: `수를 비교하면 ${maxItem}이(가) ${maxCount}명으로 가장 많습니다.`,
                answer: maxItem
            })
        },
        {
            context: '좋아하는 동물',
            template: (items, counts, maxItem, maxCount, name1) => ({
                question: `📊 ${name1}의 반 친구들이 좋아하는 동물을 조사했어요.\n${items.map((item, i) => `${item}: ${counts[i]}명`).join(', ')}\n가장 많은 친구들이 좋아하는 동물은 무엇일까요?`,
                explanation: `수를 비교하면 ${maxItem}이(가) ${maxCount}명으로 가장 많습니다.`,
                answer: maxItem
            })
        },
        {
            context: '좋아하는 색깔',
            template: (items, counts, maxItem, maxCount, name1) => ({
                question: `📊 ${name1}의 반 친구들이 좋아하는 색깔을 조사했어요.\n${items.map((item, i) => `${item}: ${counts[i]}명`).join(', ')}\n가장 많은 친구들이 좋아하는 색깔은 무엇일까요?`,
                explanation: `수를 비교하면 ${maxItem}이(가) ${maxCount}명으로 가장 많습니다.`,
                answer: maxItem
            })
        }
    ],

    // 분류하기 (1~2학년)
    classification: [
        {
            context: '모양 분류',
            template: (counts, name1) => ({
                question: `🔷 ${name1}이(가) 도형을 분류했어요.\n세모: ${counts[0]}개, 네모: ${counts[1]}개, 동그라미: ${counts[2]}개\n가장 적은 도형은 무엇일까요?`,
                explanation: `수를 비교하면 가장 적은 것을 찾을 수 있어요.`,
                answer: ['세모', '네모', '동그라미'][counts.indexOf(Math.min(...counts))]
            })
        }
    ],

    // 표 해석 (2~3학년)
    tableReading: [
        {
            context: '간식 조사',
            template: (items, counts, targetItem, targetCount) => ({
                question: `📋 친구들이 좋아하는 간식을 조사했어요.\n${items.map((item, i) => `${item}: ${counts[i]}명`).join(', ')}\n${targetItem}을(를) 좋아하는 친구는 몇 명일까요?`,
                explanation: `표를 보면 ${targetItem}을(를) 좋아하는 친구는 ${targetCount}명입니다.`,
                answer: targetCount
            })
        }
    ]
};

// 자료 해석 문제 생성 함수
function generateGraphProblem(difficulty) {
    const { getRandomCharacter, createProblemResult, shuffleArray } = window.ProblemBase;

    const name1 = getRandomCharacter();

    // 주제별 아이템 설정
    const topics = [
        { items: ['🍎사과', '🍊귤', '🍌바나나', '🍇포도'], type: '과일' },
        { items: ['🐶강아지', '🐱고양이', '🐰토끼', '🐹햄스터'], type: '동물' },
        { items: ['🔴빨강', '🔵파랑', '🟡노랑', '🟢초록'], type: '색깔' },
        { items: ['⚽축구', '🏀농구', '⚾야구', '🏐배구'], type: '운동' }
    ];

    const topic = topics[Math.floor(Math.random() * topics.length)];
    const items = topic.items;

    // 중복 없는 카운트 생성 (버그 수정)
    let counts;
    let attempts = 0;
    do {
        counts = items.map(() => Math.floor(Math.random() * 8) + 2);
        attempts++;
    } while (attempts < 10 && (
        counts.filter(c => c === Math.max(...counts)).length > 1 ||
        counts.filter(c => c === Math.min(...counts)).length > 1
    ));

    // 10번 시도 후에도 중복이면 강제로 수정
    const maxVal = Math.max(...counts);
    const minVal = Math.min(...counts);
    const maxIndices = counts.map((c, i) => c === maxVal ? i : -1).filter(i => i !== -1);
    const minIndices = counts.map((c, i) => c === minVal ? i : -1).filter(i => i !== -1);

    if (maxIndices.length > 1) {
        for (let i = 1; i < maxIndices.length; i++) {
            counts[maxIndices[i]] = maxVal - 1 - i;
            if (counts[maxIndices[i]] < 1) counts[maxIndices[i]] = 1;
        }
    }

    if (minIndices.length > 1) {
        for (let i = 1; i < minIndices.length; i++) {
            counts[minIndices[i]] = minVal + 1 + i;
        }
    }

    const maxIdx = counts.indexOf(Math.max(...counts));
    const maxItem = items[maxIdx];
    const maxCount = counts[maxIdx];

    // 템플릿 선택
    const template = GRAPH_TEMPLATES.barGraph[Math.floor(Math.random() * GRAPH_TEMPLATES.barGraph.length)];
    const result = template.template(items, counts, maxItem, maxCount, name1);

    // 오답 생성 (다른 항목들)
    const wrongs = items.filter(item => item !== maxItem).slice(0, 3);

    return createProblemResult(result.question, result.answer, result.explanation, wrongs, 'graph', difficulty);
}

// 전역으로 내보내기
window.GraphProblems = {
    TEMPLATES: GRAPH_TEMPLATES,
    generate: generateGraphProblem
};
