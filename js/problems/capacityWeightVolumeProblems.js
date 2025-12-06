/* =========================================================================
   들이/무게/부피 문제 템플릿 - Capacity, Weight, Volume Problems
   문항 구성 원리 적용:
   1. L/mL, kg/g, 쌓기나무 등 측정 단위
   2. 명확한 발문 ("몇 mL?", "몇 kg?", "몇 개?")
   3. 매력적 오답 (단위 변환 오류, 계산 오류)
   4. 시각적 이모지로 측정 상황 표현
   ========================================================================= */

const CAPACITY_TEMPLATES = {
    // 단위 변환 L <-> mL
    conversion: [
        {
            template: (liters, ml, name1) => ({
                question: `🧴 ${name1}이(가) 물 ${liters}L를 가지고 있어요. 이것은 몇 mL일까요?`,
                explanation: `1L = 1000mL이므로, ${liters}L = ${liters} × 1000 = ${ml}mL입니다.`,
                answer: `${ml}mL`,
                wrongs: [`${ml / 10}mL`, `${ml * 10}mL`, `${ml + 100}mL`]
            })
        }
    ],

    // 들이 비교
    comparison: [
        {
            template: (a, b, name1, bigger) => ({
                question: `🧃 ${name1}의 컵에는 물이 ${a}mL, 태희의 컵에는 ${b}mL가 있어요. 누구의 컵에 물이 더 많을까요?`,
                explanation: `${Math.max(a, b)}mL > ${Math.min(a, b)}mL이므로, ${bigger}의 컵에 물이 더 많습니다.`,
                answer: bigger,
                wrongs: [bigger === name1 ? '태희' : name1, '같다', '모른다']
            })
        }
    ],

    // 들이 덧셈
    addition: [
        {
            template: (a, b, total, name1) => ({
                question: `🥤 ${name1}이(가) 주스 ${a}mL를 마시고, 또 ${b}mL를 더 마셨어요. 모두 몇 mL를 마셨을까요?`,
                explanation: `${a}mL + ${b}mL = ${total}mL입니다.`,
                answer: `${total}mL`,
                wrongs: [`${total + 50}mL`, `${total - 50}mL`, `${a}mL`]
            })
        }
    ]
};

const WEIGHT_TEMPLATES = {
    // 단위 변환 kg <-> g
    conversion: [
        {
            template: (kg, g) => ({
                question: `⚖️ 수박의 무게가 ${kg}kg이에요. 이것은 몇 g일까요?`,
                explanation: `1kg = 1000g이므로, ${kg}kg = ${kg} × 1000 = ${g}g입니다.`,
                answer: `${g}g`,
                wrongs: [`${g / 10}g`, `${g + 100}g`, `${kg}g`]
            })
        }
    ],

    // 무게 비교
    comparison: [
        {
            template: (a, b, heavier, lighter, itemA, itemB) => ({
                question: `⚖️ ${itemA}의 무게가 ${a}g, ${itemB}의 무게가 ${b}g이에요. 더 무거운 것은 무엇일까요?`,
                explanation: `${heavier}g > ${lighter}g이므로, ${a > b ? itemA : itemB}이(가) 더 무겁습니다.`,
                answer: a > b ? itemA : itemB,
                wrongs: [a > b ? itemB : itemA, '같다', '모름']
            })
        }
    ],

    // 무게 덧셈
    addition: [
        {
            template: (a, b, total, name1) => ({
                question: `🎒 ${name1}의 가방에 책이 ${a}g, 필통이 ${b}g 있어요. 모두 몇 g일까요?`,
                explanation: `${a}g + ${b}g = ${total}g입니다.`,
                answer: `${total}g`,
                wrongs: [`${total + 50}g`, `${total - 50}g`, `${a}g`]
            })
        }
    ]
};

const VOLUME_TEMPLATES = {
    // 쌓기나무 세기
    counting: [
        {
            template: (layers, total, name1) => ({
                question: `🧱 ${name1}이(가) 쌓기나무를 쌓았어요.\n${layers}\n쌓기나무는 모두 몇 개일까요?`,
                explanation: `${layers}를 더하면 ${total}개입니다!`,
                answer: `${total}개`,
                wrongs: [`${total + 1}개`, `${total - 1}개`, `${total + 2}개`]
            })
        }
    ],

    // 직육면체 면 세기
    faces: [
        {
            template: (name1) => ({
                question: `📦 ${name1}이(가) 상자(직육면체)를 관찰하고 있어요.\n상자의 면은 모두 몇 개일까요?`,
                explanation: `직육면체는 면이 6개입니다. (위, 아래, 앞, 뒤, 왼쪽, 오른쪽)`,
                answer: '6개',
                wrongs: ['4개', '5개', '8개']
            })
        }
    ]
};

// 들이 문제 생성 함수
function generateCapacityProblem(difficulty) {
    const { getRandomCharacter, createProblemResult } = window.ProblemBase;

    const name1 = getRandomCharacter();
    const type = Math.floor(Math.random() * 3);
    let result;

    if (type === 0) {
        // L와 mL 변환
        const liters = Math.floor(Math.random() * 5) + 1;
        const ml = liters * 1000;
        result = CAPACITY_TEMPLATES.conversion[0].template(liters, ml, name1);

    } else if (type === 1) {
        // 들이 비교
        const a = Math.floor(Math.random() * 500) + 200;
        const b = a + Math.floor(Math.random() * 200) + 50;
        const bigger = b > a ? '태희' : name1;
        result = CAPACITY_TEMPLATES.comparison[0].template(a, b, name1, bigger);

    } else {
        // 들이 덧셈
        const a = Math.floor(Math.random() * 300) + 100;
        const b = Math.floor(Math.random() * 300) + 100;
        const total = a + b;
        result = CAPACITY_TEMPLATES.addition[0].template(a, b, total, name1);
    }

    return createProblemResult(result.question, result.answer, result.explanation, result.wrongs, 'capacity', difficulty);
}

// 무게 문제 생성 함수
function generateWeightProblem(difficulty) {
    const { getRandomCharacter, createProblemResult } = window.ProblemBase;

    const name1 = getRandomCharacter();
    const type = Math.floor(Math.random() * 3);
    let result;

    if (type === 0) {
        // kg와 g 변환
        const kg = Math.floor(Math.random() * 5) + 1;
        const g = kg * 1000;
        result = WEIGHT_TEMPLATES.conversion[0].template(kg, g);

    } else if (type === 1) {
        // 무게 비교
        const a = Math.floor(Math.random() * 400) + 100;
        const b = Math.floor(Math.random() * 400) + 100;
        if (a === b) {
            a += 50;
        }
        const heavier = Math.max(a, b);
        const lighter = Math.min(a, b);
        result = WEIGHT_TEMPLATES.comparison[0].template(a, b, heavier, lighter, '사과', '바나나');

    } else {
        // 무게 덧셈
        const a = Math.floor(Math.random() * 200) + 50;
        const b = Math.floor(Math.random() * 200) + 50;
        const total = a + b;
        result = WEIGHT_TEMPLATES.addition[0].template(a, b, total, name1);
    }

    return createProblemResult(result.question, result.answer, result.explanation, result.wrongs, 'weight', difficulty);
}

// 부피 문제 생성 함수
function generateVolumeProblem(difficulty) {
    const { getRandomCharacter, createProblemResult } = window.ProblemBase;

    const name1 = getRandomCharacter();
    const type = Math.floor(Math.random() * 2);
    let result;

    if (type === 0) {
        // 쌓기나무 세기
        const layerOptions = [
            { layers: '1층에 4개, 2층에 1개', total: 5 },
            { layers: '1층에 3개, 2층에 2개', total: 5 },
            { layers: '1층에 6개, 2층에 2개', total: 8 },
            { layers: '1층에 4개, 2층에 2개, 3층에 1개', total: 7 },
            { layers: '1층에 9개, 2층에 4개, 3층에 1개', total: 14 }
        ];
        const layer = layerOptions[Math.floor(Math.random() * layerOptions.length)];
        result = VOLUME_TEMPLATES.counting[0].template(layer.layers, layer.total, name1);

    } else {
        // 직육면체 면 세기
        result = VOLUME_TEMPLATES.faces[0].template(name1);
    }

    return createProblemResult(result.question, result.answer, result.explanation, result.wrongs, 'volume', difficulty);
}

// 전역으로 내보내기
window.CapacityProblems = {
    TEMPLATES: CAPACITY_TEMPLATES,
    generate: generateCapacityProblem
};

window.WeightProblems = {
    TEMPLATES: WEIGHT_TEMPLATES,
    generate: generateWeightProblem
};

window.VolumeProblems = {
    TEMPLATES: VOLUME_TEMPLATES,
    generate: generateVolumeProblem
};
