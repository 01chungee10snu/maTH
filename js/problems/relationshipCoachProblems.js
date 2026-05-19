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
        skill_tags: ['UNIT_COMPARE', 'INVERSE_RELATION', 'RANKING'],
        irt: { model: 'rasch', b: -0.2 },
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
        skill_tags: ['QUOTATIVE_DIVISION'],
        irt: { model: 'rasch', b: -1.1 },
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
        skill_tags: ['EQUAL_SHARING'],
        irt: { model: 'rasch', b: -0.8 },
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
        skill_tags: ['FRACTION_RELATION', 'MULTIPLICATIVE_COMPARE'],
        irt: { model: 'rasch', b: 0.8 },
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
        skill_tags: ['PROPORTION', 'TRANSFER_FAILURE'],
        irt: { model: 'rasch', b: 1.4 },
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
    },
    {
        problem_id: 'REL_MATH_006',
        grade_band: 'G1_G2',
        level: 1,
        skill_tags: ['DIRECT_COMPARE'],
        irt: { model: 'rasch', b: -1.5 },
        problem_types: ['DIRECT_COMPARE'],
        question: '민지는 구슬 8개, 도윤이는 구슬 5개를 가지고 있어요. 더 많은 구슬을 가진 사람은 누구일까요?',
        base_unit: '구슬 수',
        entities: [
            { id: 'minji', label: '민지', count: 8, relative_value: 8 },
            { id: 'doyun', label: '도윤', count: 5, relative_value: 5 }
        ],
        question_type: 'LARGEST',
        operation: '관계 비교',
        answer: '민지',
        explanation: '8은 5보다 큽니다. 구슬을 더 많이 가진 사람은 민지입니다.'
    },
    {
        problem_id: 'REL_MATH_007',
        grade_band: 'G1_G2',
        level: 4,
        skill_tags: ['UNIT_COMPARE', 'BASE_UNIT_CONFUSION'],
        irt: { model: 'rasch', b: -0.4 },
        problem_types: ['UNIT_COMPARE'],
        question: '작은 컵 4컵을 부으면 큰 병 1개가 가득 차요. 작은 컵 8컵은 큰 병 몇 개와 같을까요?',
        base_unit: '큰 병 1개',
        entities: [
            { id: 'base', label: '큰 병 1개', count: 4, relative_value: 1 },
            { id: 'target', label: '작은 컵 8컵', count: 8, relative_value: 2 }
        ],
        question_type: 'UNIT_AMOUNT',
        operation: '나눗셈',
        answer: '2개',
        explanation: '작은 컵 4컵이 큰 병 1개와 같으므로, 작은 컵 8컵은 4컵 묶음이 2개입니다. 따라서 큰 병 2개와 같습니다.'
    },
    {
        problem_id: 'REL_MATH_008',
        grade_band: 'G1_G2',
        level: 5,
        skill_tags: ['INVERSE_RELATION', 'DIRECTION_CONFUSION'],
        irt: { model: 'rasch', b: 0.2 },
        problem_types: ['UNIT_COMPARE', 'INVERSE_RELATION'],
        question: '노란 병을 가득 채우려면 작은 컵으로는 6번, 큰 컵으로는 3번 부어야 해요. 더 큰 컵은 무엇일까요?',
        base_unit: '노란 병',
        entities: [
            { id: 'small', label: '작은 컵', relation_direction: 'A_to_base', count: 6, relative_value: 0.167 },
            { id: 'large', label: '큰 컵', relation_direction: 'A_to_base', count: 3, relative_value: 0.333 }
        ],
        question_type: 'LARGEST',
        operation: '관계 비교',
        answer: '큰 컵',
        explanation: '같은 노란 병을 채우는 데 적게 부어도 되는 컵이 더 큽니다. 3번이면 되는 큰 컵이 6번 필요한 작은 컵보다 큽니다.'
    },
    {
        problem_id: 'REL_MATH_009',
        grade_band: 'G3_G4',
        level: 8,
        skill_tags: ['RANKING', 'COMPOSITE_RELATION'],
        irt: { model: 'rasch', b: 1.0 },
        problem_types: ['RANKING', 'COMPOSITE_RELATION'],
        question: 'A 막대는 B 막대의 2배이고, C 막대는 A 막대의 절반이에요. 가장 긴 막대는 무엇일까요?',
        base_unit: 'B 막대',
        entities: [
            { id: 'B', label: 'B 막대', relative_value: 1 },
            { id: 'A', label: 'A 막대', relative_value: 2 },
            { id: 'C', label: 'C 막대', relative_value: 1 }
        ],
        question_type: 'LARGEST',
        operation: '관계 비교',
        answer: 'A 막대',
        explanation: 'B를 기준 1로 보면 A는 2입니다. C는 A의 절반이므로 다시 1입니다. 따라서 가장 긴 것은 A 막대입니다.'
    },
    {
        problem_id: 'REL_MATH_010',
        grade_band: 'G3_G4',
        level: 11,
        skill_tags: ['FRACTION_RELATION', 'PROPORTION', 'TRANSFER_FAILURE'],
        irt: { model: 'rasch', b: 1.8 },
        problem_types: ['FRACTION_RELATION', 'PROPORTION', 'TRANSFER_FAILURE'],
        question: '물 3컵으로 주스 2병을 만들 수 있어요. 같은 비율로 주스 6병을 만들려면 물은 몇 컵 필요할까요?',
        base_unit: '주스 2병',
        entities: [
            { id: 'base', label: '주스 2병', count: 2, relative_value: 3 },
            { id: 'target', label: '주스 6병', count: 6, relative_value: 9 }
        ],
        question_type: 'TOTAL_AMOUNT',
        operation: '곱셈',
        answer: '9컵',
        explanation: '주스 6병은 주스 2병 묶음이 3번입니다. 물도 3컵씩 3번 필요하므로 3 × 3 = 9컵입니다.'
    },
    {
        problem_id: 'REL_MATH_011',
        grade_band: 'G1_G2',
        level: 1,
        skill_tags: ['DIRECT_COMPARE'],
        irt: { model: 'rasch', b: -1.4 },
        problem_types: ['DIRECT_COMPARE'],
        question: '하늘이는 색종이 9장, 지우는 색종이 6장을 가지고 있어요. 더 적게 가진 사람은 누구일까요?',
        base_unit: '색종이 수',
        entities: [
            { id: 'haneul', label: '하늘이', count: 9, relative_value: 9 },
            { id: 'jiwoo', label: '지우', count: 6, relative_value: 6 }
        ],
        question_type: 'SMALLEST',
        operation: '관계 비교',
        answer: '지우',
        explanation: '6은 9보다 작습니다. 색종이를 더 적게 가진 사람은 지우입니다.'
    },
    {
        problem_id: 'REL_MATH_012',
        grade_band: 'G1_G2',
        level: 2,
        skill_tags: ['EQUAL_SHARING'],
        irt: { model: 'rasch', b: -1.0 },
        problem_types: ['EQUAL_SHARING'],
        question: '딸기 18개를 접시 3개에 똑같이 나누어 담으려고 해요. 한 접시에는 몇 개씩 담을까요?',
        base_unit: '한 접시',
        entities: [
            { id: 'total', label: '딸기 전체', count: 18, relative_value: 18 },
            { id: 'plate', label: '접시 3개', count: 3, relative_value: 3 }
        ],
        question_type: 'UNIT_AMOUNT',
        operation: '나눗셈',
        answer: '6개',
        explanation: '18개를 3접시에 똑같이 나누면 18 ÷ 3 = 6입니다. 한 접시에 6개씩 담습니다.'
    },
    {
        problem_id: 'REL_MATH_013',
        grade_band: 'G1_G2',
        level: 2,
        skill_tags: ['QUOTATIVE_DIVISION'],
        irt: { model: 'rasch', b: -0.9 },
        problem_types: ['QUOTATIVE_DIVISION'],
        question: '연필 20자루를 한 상자에 5자루씩 넣으려고 해요. 상자는 몇 개 필요할까요?',
        base_unit: '한 상자',
        entities: [
            { id: 'total', label: '연필 전체', count: 20, relative_value: 20 },
            { id: 'box', label: '한 상자', count: 5, relative_value: 5 }
        ],
        question_type: 'GROUP_COUNT',
        operation: '나눗셈',
        answer: '4개',
        explanation: '20자루를 5자루씩 묶으면 20 ÷ 5 = 4입니다. 상자는 4개 필요합니다.'
    },
    {
        problem_id: 'REL_MATH_014',
        grade_band: 'G1_G2',
        level: 4,
        skill_tags: ['UNIT_COMPARE'],
        irt: { model: 'rasch', b: -0.6 },
        problem_types: ['UNIT_COMPARE'],
        question: '작은 봉지 3봉지가 큰 봉지 1봉지와 같아요. 작은 봉지 9봉지는 큰 봉지 몇 봉지와 같을까요?',
        base_unit: '큰 봉지 1봉지',
        entities: [
            { id: 'base', label: '큰 봉지 1봉지', count: 3, relative_value: 1 },
            { id: 'target', label: '작은 봉지 9봉지', count: 9, relative_value: 3 }
        ],
        question_type: 'UNIT_AMOUNT',
        operation: '나눗셈',
        answer: '3봉지',
        explanation: '작은 봉지 3봉지가 큰 봉지 1봉지이므로, 9봉지는 3봉지 묶음이 3개입니다. 큰 봉지 3봉지와 같습니다.'
    },
    {
        problem_id: 'REL_MATH_015',
        grade_band: 'G2_G3',
        level: 5,
        skill_tags: ['INVERSE_RELATION'],
        irt: { model: 'rasch', b: 0.0 },
        problem_types: ['UNIT_COMPARE', 'INVERSE_RELATION'],
        question: '물통을 가득 채우려면 파란 컵으로는 4번, 초록 컵으로는 8번 부어야 해요. 더 작은 컵은 무엇일까요?',
        base_unit: '물통',
        entities: [
            { id: 'blue', label: '파란 컵', relation_direction: 'A_to_base', count: 4, relative_value: 0.25 },
            { id: 'green', label: '초록 컵', relation_direction: 'A_to_base', count: 8, relative_value: 0.125 }
        ],
        question_type: 'SMALLEST',
        operation: '관계 비교',
        answer: '초록 컵',
        explanation: '같은 물통을 채우는 데 더 많이 부어야 하는 컵이 더 작습니다. 8번 필요한 초록 컵이 더 작습니다.'
    },
    {
        problem_id: 'REL_MATH_016',
        grade_band: 'G2_G3',
        level: 6,
        skill_tags: ['MULTIPLICATIVE_COMPARE'],
        irt: { model: 'rasch', b: 0.3 },
        problem_types: ['MULTIPLICATIVE_COMPARE'],
        question: '준호의 스티커는 7장이고, 서연이의 스티커는 준호의 3배예요. 서연이는 스티커를 몇 장 가지고 있을까요?',
        base_unit: '준호의 스티커',
        entities: [
            { id: 'junho', label: '준호', count: 7, relative_value: 1 },
            { id: 'seoyeon', label: '서연이', count: 21, relative_value: 3 }
        ],
        question_type: 'TOTAL_AMOUNT',
        operation: '곱셈',
        answer: '21장',
        explanation: '서연이는 준호의 3배입니다. 7장의 3배는 7 × 3 = 21장이므로 서연이는 21장을 가지고 있습니다.'
    },
    {
        problem_id: 'REL_MATH_017',
        grade_band: 'G3_G4',
        level: 7,
        skill_tags: ['FRACTION_RELATION'],
        irt: { model: 'rasch', b: 0.6 },
        problem_types: ['FRACTION_RELATION'],
        question: '빨간 리본은 12cm이고, 파란 리본은 빨간 리본의 1/4이에요. 파란 리본은 몇 cm일까요?',
        base_unit: '빨간 리본',
        entities: [
            { id: 'red', label: '빨간 리본', count: 12, relative_value: 1 },
            { id: 'blue', label: '파란 리본', count: 3, relative_value: 0.25 }
        ],
        question_type: 'UNIT_AMOUNT',
        operation: '나눗셈',
        answer: '3cm',
        explanation: '파란 리본은 빨간 리본의 1/4입니다. 12를 4로 나누면 3이므로 파란 리본은 3cm입니다.'
    },
    {
        problem_id: 'REL_MATH_018',
        grade_band: 'G2_G3',
        level: 6,
        skill_tags: ['RANKING'],
        irt: { model: 'rasch', b: 0.5 },
        problem_types: ['RANKING'],
        question: '상자 A에는 14개, 상자 B에는 9개, 상자 C에는 17개의 공이 있어요. 두 번째로 많은 상자는 무엇일까요?',
        base_unit: '공 개수',
        entities: [
            { id: 'A', label: '상자 A', count: 14, relative_value: 14 },
            { id: 'B', label: '상자 B', count: 9, relative_value: 9 },
            { id: 'C', label: '상자 C', count: 17, relative_value: 17 }
        ],
        question_type: 'SECOND_LARGEST',
        operation: '관계 비교',
        answer: '상자 A',
        explanation: '공의 수는 C가 17개로 가장 많고, A가 14개로 두 번째입니다. 따라서 두 번째로 많은 상자는 상자 A입니다.'
    },
    {
        problem_id: 'REL_MATH_019',
        grade_band: 'G3_G4',
        level: 8,
        skill_tags: ['COMPOSITE_RELATION'],
        irt: { model: 'rasch', b: 0.9 },
        problem_types: ['COMPOSITE_RELATION', 'MULTIPLICATIVE_COMPARE'],
        question: '동생은 카드 6장을 가지고 있고, 형은 동생의 2배보다 3장 더 많아요. 형은 카드를 몇 장 가지고 있을까요?',
        base_unit: '동생의 카드',
        entities: [
            { id: 'younger', label: '동생', count: 6, relative_value: 1 },
            { id: 'older', label: '형', count: 15, relative_value: 2.5 }
        ],
        question_type: 'TOTAL_AMOUNT',
        operation: '곱셈',
        answer: '15장',
        explanation: '동생의 2배는 6 × 2 = 12장입니다. 여기에 3장을 더하면 15장이므로 형은 15장을 가지고 있습니다.'
    },
    {
        problem_id: 'REL_MATH_020',
        grade_band: 'G3_G4',
        level: 9,
        skill_tags: ['PROPORTION'],
        irt: { model: 'rasch', b: 1.1 },
        problem_types: ['PROPORTION'],
        question: '귤 4개의 값이 1200원이에요. 같은 귤 8개의 값은 얼마일까요?',
        base_unit: '귤 4개',
        entities: [
            { id: 'base', label: '귤 4개', count: 4, relative_value: 1200 },
            { id: 'target', label: '귤 8개', count: 8, relative_value: 2400 }
        ],
        question_type: 'TOTAL_AMOUNT',
        operation: '곱셈',
        answer: '2400원',
        explanation: '8개는 4개 묶음이 2번입니다. 1200원을 2번 더하면 2400원이므로 귤 8개는 2400원입니다.'
    },
    {
        problem_id: 'REL_MATH_021',
        grade_band: 'G1_G2',
        level: 3,
        skill_tags: ['QUOTATIVE_DIVISION'],
        irt: { model: 'rasch', b: -0.7 },
        problem_types: ['QUOTATIVE_DIVISION'],
        question: '블록 24개를 6개씩 묶어 탑을 만들려고 해요. 탑은 몇 개 만들 수 있을까요?',
        base_unit: '탑 1개',
        entities: [
            { id: 'total', label: '블록 전체', count: 24, relative_value: 24 },
            { id: 'tower', label: '탑 1개', count: 6, relative_value: 6 }
        ],
        question_type: 'GROUP_COUNT',
        operation: '나눗셈',
        answer: '4개',
        explanation: '24개를 6개씩 묶으면 24 ÷ 6 = 4입니다. 탑은 4개 만들 수 있습니다.'
    },
    {
        problem_id: 'REL_MATH_022',
        grade_band: 'G1_G2',
        level: 3,
        skill_tags: ['EQUAL_SHARING'],
        irt: { model: 'rasch', b: -0.6 },
        problem_types: ['EQUAL_SHARING'],
        question: '초콜릿 16개를 4명이 똑같이 나누어 먹으려고 해요. 한 명은 몇 개씩 먹을까요?',
        base_unit: '한 명',
        entities: [
            { id: 'total', label: '초콜릿 전체', count: 16, relative_value: 16 },
            { id: 'people', label: '4명', count: 4, relative_value: 4 }
        ],
        question_type: 'UNIT_AMOUNT',
        operation: '나눗셈',
        answer: '4개',
        explanation: '16개를 4명에게 똑같이 나누면 16 ÷ 4 = 4입니다. 한 명은 4개씩 먹습니다.'
    },
    {
        problem_id: 'REL_MATH_023',
        grade_band: 'G2_G3',
        level: 5,
        skill_tags: ['UNIT_COMPARE', 'BASE_UNIT_CONFUSION'],
        irt: { model: 'rasch', b: 0.1 },
        problem_types: ['UNIT_COMPARE'],
        question: '연필 5자루가 한 묶음이에요. 연필 15자루는 몇 묶음일까요?',
        base_unit: '한 묶음',
        entities: [
            { id: 'base', label: '한 묶음', count: 5, relative_value: 1 },
            { id: 'target', label: '연필 15자루', count: 15, relative_value: 3 }
        ],
        question_type: 'GROUP_COUNT',
        operation: '나눗셈',
        answer: '3묶음',
        explanation: '한 묶음이 5자루이므로 15자루는 5자루 묶음이 3개입니다. 따라서 3묶음입니다.'
    },
    {
        problem_id: 'REL_MATH_024',
        grade_band: 'G2_G3',
        level: 6,
        skill_tags: ['INVERSE_RELATION', 'RANKING'],
        irt: { model: 'rasch', b: 0.4 },
        problem_types: ['INVERSE_RELATION', 'RANKING'],
        question: '같은 양의 물을 담으려면 A컵은 2번, B컵은 5번, C컵은 4번 부어야 해요. 가장 큰 컵은 무엇일까요?',
        base_unit: '같은 양의 물',
        entities: [
            { id: 'A', label: 'A컵', relation_direction: 'A_to_base', count: 2, relative_value: 0.5 },
            { id: 'B', label: 'B컵', relation_direction: 'B_to_base', count: 5, relative_value: 0.2 },
            { id: 'C', label: 'C컵', relation_direction: 'C_to_base', count: 4, relative_value: 0.25 }
        ],
        question_type: 'LARGEST',
        operation: '관계 비교',
        answer: 'A컵',
        explanation: '같은 양을 채울 때 적게 부어도 되는 컵이 더 큽니다. A컵은 2번만 부으면 되므로 가장 큽니다.'
    },
    {
        problem_id: 'REL_MATH_025',
        grade_band: 'G3_G4',
        level: 7,
        skill_tags: ['FRACTION_RELATION', 'RANKING'],
        irt: { model: 'rasch', b: 0.7 },
        problem_types: ['FRACTION_RELATION', 'RANKING'],
        question: 'A는 전체의 1/2, B는 전체의 1/4, C는 전체의 3/4이에요. 두 번째로 큰 것은 무엇일까요?',
        base_unit: '전체',
        entities: [
            { id: 'A', label: 'A', relative_value: 0.5 },
            { id: 'B', label: 'B', relative_value: 0.25 },
            { id: 'C', label: 'C', relative_value: 0.75 }
        ],
        question_type: 'SECOND_LARGEST',
        operation: '관계 비교',
        answer: 'A',
        explanation: '3/4가 가장 크고, 1/2가 두 번째이며, 1/4가 가장 작습니다. 따라서 두 번째로 큰 것은 A입니다.'
    },
    {
        problem_id: 'REL_MATH_026',
        grade_band: 'G3_G4',
        level: 9,
        skill_tags: ['MULTIPLICATIVE_COMPARE', 'COMPOSITE_RELATION'],
        irt: { model: 'rasch', b: 1.2 },
        problem_types: ['MULTIPLICATIVE_COMPARE', 'COMPOSITE_RELATION'],
        question: '민수의 저금액은 500원이고, 유나는 민수의 4배보다 200원 적어요. 유나는 얼마를 저금했을까요?',
        base_unit: '민수의 저금액',
        entities: [
            { id: 'minsu', label: '민수', count: 500, relative_value: 1 },
            { id: 'yuna', label: '유나', count: 1800, relative_value: 3.6 }
        ],
        question_type: 'TOTAL_AMOUNT',
        operation: '곱셈',
        answer: '1800원',
        explanation: '민수의 4배는 500 × 4 = 2000원입니다. 여기서 200원을 빼면 1800원이므로 유나는 1800원을 저금했습니다.'
    },
    {
        problem_id: 'REL_MATH_027',
        grade_band: 'G3_G4',
        level: 9,
        skill_tags: ['PROPORTION', 'TRANSFER_FAILURE'],
        irt: { model: 'rasch', b: 1.3 },
        problem_types: ['PROPORTION', 'TRANSFER_FAILURE'],
        question: '자동차가 2시간에 80km를 갔어요. 같은 빠르기로 5시간 동안 가면 몇 km를 갈까요?',
        base_unit: '2시간',
        entities: [
            { id: 'base', label: '2시간', count: 2, relative_value: 80 },
            { id: 'target', label: '5시간', count: 5, relative_value: 200 }
        ],
        question_type: 'TOTAL_AMOUNT',
        operation: '곱셈',
        answer: '200km',
        explanation: '1시간에 40km를 갑니다. 5시간이면 40 × 5 = 200km를 갑니다.'
    },
    {
        problem_id: 'REL_MATH_028',
        grade_band: 'G3_G4',
        level: 10,
        skill_tags: ['FRACTION_RELATION', 'COMPOSITE_RELATION'],
        irt: { model: 'rasch', b: 1.5 },
        problem_types: ['FRACTION_RELATION', 'COMPOSITE_RELATION'],
        question: '전체 길이는 24cm예요. A는 전체의 1/3이고, B는 A의 2배예요. B는 몇 cm일까요?',
        base_unit: '전체 길이',
        entities: [
            { id: 'whole', label: '전체', count: 24, relative_value: 1 },
            { id: 'A', label: 'A', count: 8, relative_value: 0.333 },
            { id: 'B', label: 'B', count: 16, relative_value: 0.667 }
        ],
        question_type: 'UNIT_AMOUNT',
        operation: '나눗셈',
        answer: '16cm',
        explanation: '전체 24cm의 1/3은 8cm입니다. B는 A의 2배이므로 8 × 2 = 16cm입니다.'
    },
    {
        problem_id: 'REL_MATH_029',
        grade_band: 'G3_G4',
        level: 11,
        skill_tags: ['INVERSE_RELATION', 'DIRECTION_CONFUSION', 'COMPOSITE_RELATION', 'RANKING'],
        irt: { model: 'rasch', b: 1.7 },
        problem_types: ['INVERSE_RELATION', 'COMPOSITE_RELATION', 'RANKING'],
        question: '같은 통을 채우는 데 A컵은 3번, B컵은 6번 필요해요. 또 통의 물은 C컵에 2번 나누어 담을 수 있어요. 가장 큰 컵은 무엇일까요?',
        base_unit: '같은 통',
        entities: [
            { id: 'A', label: 'A컵', relation_direction: 'A_to_base', count: 3, relative_value: 0.333 },
            { id: 'B', label: 'B컵', relation_direction: 'B_to_base', count: 6, relative_value: 0.167 },
            { id: 'C', label: 'C컵', relation_direction: 'base_to_C', count: 2, relative_value: 2 }
        ],
        question_type: 'LARGEST',
        operation: '관계 비교',
        answer: 'C컵',
        explanation: 'A컵과 B컵은 통을 채우는 데 여러 번 필요한 작은 컵입니다. C컵은 통의 물을 2번 나누어 담을 만큼 크므로 가장 큰 컵은 C컵입니다.'
    },
    {
        problem_id: 'REL_MATH_030',
        grade_band: 'G3_G4',
        level: 12,
        skill_tags: ['PROPORTION', 'FRACTION_RELATION', 'TRANSFER_FAILURE'],
        irt: { model: 'rasch', b: 2.0 },
        problem_types: ['PROPORTION', 'FRACTION_RELATION', 'TRANSFER_FAILURE'],
        question: '밀가루 3컵으로 빵 4개를 만들 수 있어요. 같은 비율로 빵 10개를 만들려면 밀가루는 몇 컵 필요할까요?',
        base_unit: '빵 4개',
        entities: [
            { id: 'base', label: '빵 4개', count: 4, relative_value: 3 },
            { id: 'target', label: '빵 10개', count: 10, relative_value: 7.5 }
        ],
        question_type: 'TOTAL_AMOUNT',
        operation: '관계 비교',
        answer: '7.5컵',
        explanation: '빵 1개에는 밀가루 3/4컵이 필요합니다. 빵 10개에는 3/4 × 10 = 7.5컵이 필요합니다.'
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

function generateRelationshipCoachProblemForItem(item, difficulty = item?.level || 4) {
    const selected = RELATION_COACH_PROBLEM_BANK.find(problem => problem.problem_id === item?.problem_id) || item;
    return cloneRelationProblem(selected, difficulty);
}

window.RelationshipCoachProblems = {
    generate: generateRelationshipCoachProblem,
    generateForItem: generateRelationshipCoachProblemForItem,
    taxonomy: RELATION_COACH_TAXONOMY,
    errorCodes: RELATION_COACH_ERROR_CODES,
    bank: RELATION_COACH_PROBLEM_BANK
};

globalThis.RelationshipCoachProblems = window.RelationshipCoachProblems;

console.log('관계수학 코치 문제 모듈이 로드되었습니다.');
