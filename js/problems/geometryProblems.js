/* =========================================================================
   도형 문제 템플릿 - Geometry Problems
   문항 구성 원리 적용:
   1. 도형의 특성, 이름, 변/꼭짓점 수 등 다양한 개념
   2. 명확한 발문 ("이 도형의 이름은?", "변은 몇 개?")
   3. 매력적 오답 (유사 도형, 인접 도형)
   4. 시각적 이모지로 도형 표현
   ========================================================================= */

const GEOMETRY_TEMPLATES = {
    // 도형 이름 맞히기 (1~2학년)
    shapeNames: [
        {
            context: '세모',
            template: (name1) => ({
                question: `🔺 ${name1}이(가) 도형을 보고 있어요.\n세 개의 변과 세 개의 꼭짓점이 있는 도형의 이름은 무엇일까요?`,
                explanation: `변이 3개, 꼭짓점이 3개인 도형은 삼각형이에요!`,
                answer: '삼각형',
                wrongs: ['사각형', '오각형', '원']
            })
        },
        {
            context: '네모',
            template: (name1) => ({
                question: `⬜ ${name1}이(가) 도형을 보고 있어요.\n네 개의 변과 네 개의 꼭짓점이 있는 도형의 이름은 무엇일까요?`,
                explanation: `변이 4개, 꼭짓점이 4개인 도형은 사각형이에요!`,
                answer: '사각형',
                wrongs: ['삼각형', '오각형', '육각형']
            })
        },
        {
            context: '동그라미',
            template: (name1) => ({
                question: `⭕ ${name1}이(가) 도형을 보고 있어요.\n변과 꼭짓점이 없고 둥근 도형의 이름은 무엇일까요?`,
                explanation: `변과 꼭짓점이 없는 둥근 도형은 원이에요!`,
                answer: '원',
                wrongs: ['삼각형', '사각형', '타원']
            })
        }
    ],

    // 변과 꼭짓점 세기 (1~2학년)
    sidesAndVertices: [
        {
            context: '삼각형',
            template: (name1) => ({
                question: `🔺 삼각형의 변은 모두 몇 개일까요?`,
                explanation: `삼각형은 '삼' = 3, 변이 3개입니다!`,
                answer: '3개',
                wrongs: ['2개', '4개', '5개']
            })
        },
        {
            context: '사각형',
            template: (name1) => ({
                question: `⬜ 사각형의 꼭짓점은 모두 몇 개일까요?`,
                explanation: `사각형은 '사' = 4, 꼭짓점이 4개입니다!`,
                answer: '4개',
                wrongs: ['3개', '5개', '6개']
            })
        },
        {
            context: '오각형',
            template: (name1) => ({
                question: `⬠ 오각형의 변은 모두 몇 개일까요?`,
                explanation: `오각형은 '오' = 5, 변이 5개입니다!`,
                answer: '5개',
                wrongs: ['4개', '6개', '3개']
            })
        },
        {
            context: '육각형',
            template: (name1) => ({
                question: `⬡ 육각형의 꼭짓점은 모두 몇 개일까요?`,
                explanation: `육각형은 '육' = 6, 꼭짓점이 6개입니다!`,
                answer: '6개',
                wrongs: ['5개', '7개', '4개']
            })
        }
    ],

    // 도형 분류 (1~2학년)
    shapeClassification: [
        {
            context: '곧은 선',
            template: (name1) => ({
                question: `📐 ${name1}이(가) 도형을 분류하고 있어요.\n삼각형과 사각형의 공통점은 무엇일까요?`,
                explanation: `삼각형과 사각형은 모두 곧은 선(직선)으로 이루어진 도형이에요!`,
                answer: '곧은 선으로 이루어짐',
                wrongs: ['둥근 선으로 이루어짐', '변이 같은 수', '크기가 같음']
            })
        }
    ],

    // 도형 합치기/나누기 (2~3학년)
    shapeCombination: [
        {
            context: '삼각형 합치기',
            template: (name1) => ({
                question: `🔺🔺 ${name1}이(가) 같은 삼각형 2개를 붙였어요.\n어떤 도형이 될 수 있을까요?`,
                explanation: `삼각형 2개를 붙이면 사각형이 될 수 있어요!`,
                answer: '사각형',
                wrongs: ['삼각형', '원', '오각형']
            })
        },
        {
            context: '사각형 나누기',
            template: (name1) => ({
                question: `⬜ ${name1}이(가) 사각형을 대각선으로 나눴어요.\n몇 개의 삼각형이 될까요?`,
                explanation: `사각형을 대각선으로 나누면 삼각형 2개가 돼요!`,
                answer: '2개',
                wrongs: ['1개', '3개', '4개']
            })
        }
    ],

    // 입체도형 (2~3학년)
    solidShapes: [
        {
            context: '상자 모양',
            template: (name1) => ({
                question: `📦 ${name1}이(가) 상자를 보고 있어요.\n상자 모양(직육면체)의 면은 모두 몇 개일까요?`,
                explanation: `직육면체는 면이 6개입니다. (위, 아래, 앞, 뒤, 왼쪽, 오른쪽)`,
                answer: '6개',
                wrongs: ['4개', '5개', '8개']
            })
        },
        {
            context: '공 모양',
            template: (name1) => ({
                question: `⚽ ${name1}이(가) 공을 보고 있어요.\n공 모양(구)의 특징은 무엇일까요?`,
                explanation: `구는 어느 방향에서 봐도 둥글고, 어디로든 굴러가요!`,
                answer: '어느 방향으로든 굴러간다',
                wrongs: ['한 방향으로만 굴러간다', '굴러가지 않는다', '모서리가 있다']
            })
        },
        {
            context: '원기둥',
            template: (name1) => ({
                question: `🥫 ${name1}이(가) 음료수 캔을 보고 있어요.\n이 모양(원기둥)은 어느 방향으로 굴러갈까요?`,
                explanation: `원기둥은 옆으로는 굴러가지만, 위아래로는 굴러가지 않아요!`,
                answer: '옆으로만 굴러간다',
                wrongs: ['어느 방향으로든 굴러간다', '굴러가지 않는다', '위아래로만 굴러간다']
            })
        }
    ]
};

// 도형 문제 생성 함수
function generateGeometryProblem(difficulty) {
    const { getRandomCharacter, createProblemResult, shuffleArray } = window.ProblemBase;

    const name1 = getRandomCharacter();

    // 난이도에 따른 유형 선택
    let templates;
    if (difficulty <= 3) {
        // 기본 도형 이름, 변/꼭짓점
        const categories = [GEOMETRY_TEMPLATES.shapeNames, GEOMETRY_TEMPLATES.sidesAndVertices];
        templates = categories[Math.floor(Math.random() * categories.length)];
    } else if (difficulty <= 6) {
        // 도형 분류, 합치기/나누기
        const categories = [GEOMETRY_TEMPLATES.sidesAndVertices, GEOMETRY_TEMPLATES.shapeCombination];
        templates = categories[Math.floor(Math.random() * categories.length)];
    } else {
        // 입체도형
        templates = GEOMETRY_TEMPLATES.solidShapes;
    }

    const template = templates[Math.floor(Math.random() * templates.length)];
    const result = template.template(name1);

    return createProblemResult(result.question, result.answer, result.explanation, result.wrongs, 'geometry', difficulty);
}

// 전역으로 내보내기
window.GeometryProblems = {
    TEMPLATES: GEOMETRY_TEMPLATES,
    generate: generateGeometryProblem
};
