/* =========================================================================
   관계형 문장제 사고력 강화 문제 모듈
   ========================================================================= */

const RELATION_COACH_TAXONOMY = {
    DIRECT_COMPARE: '직접 비교',
    EQUAL_SHARING: '등분 나눗셈',
    QUOTATIVE_DIVISION: '포함 나눗셈',
    UNIT_COMPARE: '단위량 비교',
    MULTIPLICATIVE_COMPARE: '배수 비교',
    FRACTION_RELATION: '분수 관계',
    INVERSE_RELATION: '역관계',
    PROPORTION: '비율·비례',
    RANKING: '순위 판단',
    COMPOSITE_RELATION: '복합 문장제'
};

const RELATION_COACH_ERROR_CODES = {
    NUMBER_SIZE_BIAS: '숫자 크기만 보고 판단함',
    DIRECTION_CONFUSION: '관계 방향을 혼동함',
    BASE_UNIT_CONFUSION: '기준량을 찾지 못함',
    FRACTION_SIZE_CONFUSION: '분수 크기를 혼동함',
    OPERATION_SELECTION_ERROR: '연산 선택을 잘못함',
    RANKING_MISREAD: '질문 조건을 잘못 읽음',
    EXPLANATION_GAP: '답은 골랐지만 이유 설명이 부족함',
    TRANSFER_FAILURE: '소재가 바뀌면 같은 원리를 적용하지 못함'
};

const RELATION_COACH_PROBLEM_BANK = [
    {
        problem_id: 'REL_MATH_001',
        grade_band: 'G1_G2',
        level: 4,
        problem_types: ['UNIT_COMPARE', 'INVERSE_RELATION', 'RANKING'],
        question: '빨간 그릇을 가득 채우려면 ㉮ 그릇으로는 5번, ㉯ 그릇으로는 3번 부어야 해요. 또 빨간 그릇 물을 ㉰ 그릇에는 3번, ㉱ 그릇에는 5번 나누어 담을 수 있어요. 두 번째로 큰 그릇은 무엇일까요?',
        base_unit: '빨간 그릇',
        entities: [
            { id: 'A', label: '그릇 ㉮', relation_direction: 'A_to_base', count: 5, relative_value: 0.2 },
            { id: 'B', label: '그릇 ㉯', relation_direction: 'B_to_base', count: 3, relative_value: 0.333 },
            { id: 'C', label: '그릇 ㉰', relation_direction: 'base_to_C', count: 3, relative_value: 3 },
            { id: 'D', label: '그릇 ㉱', relation_direction: 'base_to_D', count: 5, relative_value: 5 }
        ],
        question_type: 'SECOND_LARGEST',
        operation: '관계 비교',
        answer: '그릇 ㉰',
        explanation: '㉱는 빨간 그릇의 5배, ㉰는 3배입니다. ㉯와 ㉮는 빨간 그릇을 채우는 데 여러 번 필요한 작은 그릇입니다. 따라서 큰 순서는 ㉱, ㉰, ㉯, ㉮이고 두 번째로 큰 것은 ㉰입니다.'
    },
    {
        problem_id: 'REL_MATH_002',
        grade_band: 'G1_G2',
        level: 2,
        problem_types: ['QUOTATIVE_DIVISION'],
        question: '쿠키 12개를 한 봉지에 3개씩 넣으려고 해요. 봉지는 모두 몇 개 필요할까요?',
        base_unit: '한 봉지',
        entities: [
            { id: 'total', label: '쿠키 전체', count: 12, relative_value: 12 },
            { id: 'group', label: '한 봉지', count: 3, relative_value: 3 }
        ],
        question_type: 'GROUP_COUNT',
        operation: '나눗셈',
        answer: '4봉지',
        explanation: '12개를 3개씩 묶는 문제이므로 12 ÷ 3 = 4입니다. 한 봉지에 3개씩 넣으면 4봉지가 필요합니다.'
    },
    {
        problem_id: 'REL_MATH_003',
        grade_band: 'G1_G2',
        level: 3,
        problem_types: ['EQUAL_SHARING'],
        question: '사탕 15개를 친구 5명에게 똑같이 나누어 주려고 해요. 한 명은 사탕을 몇 개씩 받을까요?',
        base_unit: '한 명',
        entities: [
            { id: 'total', label: '사탕 전체', count: 15, relative_value: 15 },
            { id: 'people', label: '친구 5명', count: 5, relative_value: 5 }
        ],
        question_type: 'UNIT_AMOUNT',
        operation: '나눗셈',
        answer: '3개',
        explanation: '15개를 5명에게 똑같이 나누는 문제이므로 15 ÷ 5 = 3입니다. 한 명은 3개씩 받습니다.'
    },
    {
        problem_id: 'REL_MATH_004',
        grade_band: 'G3_G4',
        level: 7,
        problem_types: ['FRACTION_RELATION', 'MULTIPLICATIVE_COMPARE'],
        question: '파란 끈의 길이는 빨간 끈의 1/3이고, 초록 끈의 길이는 빨간 끈의 2배예요. 가장 긴 끈은 무엇일까요?',
        base_unit: '빨간 끈',
        entities: [
            { id: 'red', label: '빨간 끈', relative_value: 1 },
            { id: 'blue', label: '파란 끈', relative_value: 0.333 },
            { id: 'green', label: '초록 끈', relative_value: 2 }
        ],
        question_type: 'LARGEST',
        operation: '관계 비교',
        answer: '초록 끈',
        explanation: '빨간 끈을 기준 1로 보면 파란 끈은 1/3, 초록 끈은 2입니다. 2가 가장 크므로 초록 끈이 가장 깁니다.'
    },
    {
        problem_id: 'REL_MATH_005',
        grade_band: 'G3_G4',
        level: 10,
        problem_types: ['PROPORTION', 'TRANSFER_FAILURE'],
        question: '연필 2자루의 값이 300원이에요. 같은 연필 6자루의 값은 얼마일까요?',
        base_unit: '연필 2자루',
        entities: [
            { id: 'base', label: '연필 2자루', count: 2, relative_value: 300 },
            { id: 'target', label: '연필 6자루', count: 6, relative_value: 900 }
        ],
        question_type: 'TOTAL_AMOUNT',
        operation: '곱셈',
        answer: '900원',
        explanation: '6자루는 2자루 묶음이 3번 있는 것입니다. 300원짜리 묶음이 3개이므로 300 × 3 = 900원입니다.'
    }
];

function relationOption(value, label = value) {
    return { value, label };
}

function getRelationDirectionSummary(problem) {
    if (problem.problem_types.includes('INVERSE_RELATION')) {
        return '채우는 데 여러 번 필요한 그릇은 더 작고, 빨간 그릇을 여러 번 나누어 담는 그릇은 더 큽니다.';
    }
    if (problem.problem_types.includes('QUOTATIVE_DIVISION')) {
        return '전체를 같은 크기의 묶음으로 나누어 몇 묶음인지 찾습니다.';
    }
    if (problem.problem_types.includes('EQUAL_SHARING')) {
        return '전체를 같은 수의 사람에게 똑같이 나누어 한 명의 몫을 찾습니다.';
    }
    if (problem.problem_types.includes('FRACTION_RELATION')) {
        return '기준량을 1로 두고 분수와 배수의 크기를 비교합니다.';
    }
    return '기준량과 비교 대상의 관계를 먼저 정리합니다.';
}

function getRelationAnswerOptions(problem) {
    const wrongs = problem.entities
        .map(entity => entity.label)
        .filter(label => label !== problem.answer);

    if (window.ProblemBase?.buildAnswerOptions) {
        return window.ProblemBase.buildAnswerOptions(problem.answer, wrongs, 4);
    }

    return [problem.answer, ...wrongs].slice(0, 4).sort(() => Math.random() - 0.5);
}

function buildCoachSteps(problem) {
    const baseOptions = [
        relationOption(problem.base_unit),
        ...problem.entities.map(entity => relationOption(entity.label))
    ];

    const directionSummary = getRelationDirectionSummary(problem);
    const explanationOptions = [
        relationOption(problem.explanation),
        relationOption('숫자가 가장 큰 대상이 항상 가장 큽니다.'),
        relationOption('문제에 나온 순서대로 답을 고르면 됩니다.')
    ];

    return [
        {
            id: 'base',
            label: '기준량 찾기',
            prompt: '이 문제에서 기준이 되는 대상은 무엇일까?',
            options: baseOptions,
            answer: problem.base_unit,
            hint: '다른 대상들이 이것과 비교되고 있는지 찾아보세요.',
            errorType: 'BASE_UNIT_CONFUSION'
        },
        {
            id: 'direction',
            label: '관계 방향',
            prompt: '관계의 방향을 어떻게 읽어야 할까?',
            options: [
                relationOption(directionSummary),
                relationOption('숫자가 많이 나온 대상이 무조건 큽니다.'),
                relationOption('문장에 먼저 나온 대상이 항상 기준입니다.')
            ],
            answer: directionSummary,
            hint: 'A가 기준을 채우는지, 기준이 A에 나누어 담기는지 구분하세요.',
            errorType: 'DIRECTION_CONFUSION'
        },
        {
            id: 'visualization',
            label: '표상 만들기',
            prompt: '이 관계를 어떤 도구로 정리하면 좋을까?',
            options: [
                relationOption('기준량을 1로 둔 표와 바 모델'),
                relationOption('정답만 바로 계산하기'),
                relationOption('문제에 나온 숫자만 큰 순서로 정렬하기')
            ],
            answer: '기준량을 1로 둔 표와 바 모델',
            hint: '기준량을 1로 놓고 각 대상이 몇 배인지 적어보세요.',
            errorType: 'NUMBER_SIZE_BIAS'
        },
        {
            id: 'operation',
            label: '연산 선택',
            prompt: '마지막으로 어떤 사고나 연산이 필요할까?',
            options: [
                relationOption('덧셈'),
                relationOption('뺄셈'),
                relationOption('곱셈'),
                relationOption('나눗셈'),
                relationOption('관계 비교')
            ],
            answer: problem.operation,
            hint: '질문이 전체, 한 몫, 묶음 수, 순위 중 무엇을 묻는지 확인하세요.',
            errorType: 'OPERATION_SELECTION_ERROR'
        },
        {
            id: 'explanation',
            label: '설명 완성',
            prompt: '왜 그 답이 되는지 가장 잘 설명한 문장은?',
            options: explanationOptions,
            answer: problem.explanation,
            hint: '기준량과 관계 방향이 모두 들어간 설명을 고르세요.',
            errorType: 'EXPLANATION_GAP'
        }
    ];
}

function cloneRelationProblem(template, difficulty) {
    const problem = JSON.parse(JSON.stringify(template));
    problem.type = 'relationshipCoach';
    problem.relationCoach = true;
    problem.taxonomy = RELATION_COACH_TAXONOMY;
    problem.errorCodes = RELATION_COACH_ERROR_CODES;
    problem.options = getRelationAnswerOptions(problem);
    problem.coachSteps = buildCoachSteps(problem);
    problem.problemKey = `${problem.problem_id}-${difficulty}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    return problem;
}

function generateRelationshipCoachProblem(difficulty) {
    const available = RELATION_COACH_PROBLEM_BANK.filter(problem => problem.level <= Math.max(2, difficulty + 2));
    const pool = available.length ? available : RELATION_COACH_PROBLEM_BANK;
    const selected = pool[Math.floor(Math.random() * pool.length)];
    return cloneRelationProblem(selected, difficulty);
}

window.RelationshipCoachProblems = {
    generate: generateRelationshipCoachProblem,
    taxonomy: RELATION_COACH_TAXONOMY,
    errorCodes: RELATION_COACH_ERROR_CODES,
    bank: RELATION_COACH_PROBLEM_BANK
};

globalThis.RelationshipCoachProblems = window.RelationshipCoachProblems;

console.log('관계수학 코치 문제 모듈이 로드되었습니다.');
