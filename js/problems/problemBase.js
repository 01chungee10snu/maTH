/* =========================================================================
   문제 생성 기반 모듈 - 공통 유틸리티 및 상수
   ========================================================================= */

// 문항 구성 원리 (Test Item Construction Principles)
// 1. 문제 상황 제시 (Problem Context): 구체적이고 친숙한 상황 설정
// 2. 발문의 명확성 (Clear Questioning): 무엇을 구해야 하는지 명확히 제시
// 3. 매력적 오답 (Plausible Distractors): 학습자가 흔히 하는 실수를 반영
// 4. 단일 정답 원칙 (Single Correct Answer): 정답이 유일하도록 설계
// 5. 난이도 적합성 (Appropriate Difficulty): 대상 학년에 맞는 수준

const PROBLEM_CONFIG = {
    // 티니핑 캐릭터 이름
    CHARACTERS: ['하츄핑', '바로핑', '아자핑', '차차핑', '라라핑', '해핑', '무루핑', '오로라핑'],

    // 시각적 이모지 기호
    SYMBOLS: [
        { emoji: '⭐', name: '별' },
        { emoji: '💎', name: '보석' },
        { emoji: '🌸', name: '꽃' },
        { emoji: '🎈', name: '풍선' },
        { emoji: '🍎', name: '사과' },
        { emoji: '🌙', name: '달' },
        { emoji: '💖', name: '하트' },
        { emoji: '🎀', name: '리본' }
    ],

    // 사물 카테고리별 이모지
    ITEMS: {
        food: ['🍬', '🍎', '🍊', '🍰', '🧁', '🍪', '🍫', '🍭'],
        stationery: ['✏️', '📚', '📖', '🖍️', '📝', '🎨'],
        nature: ['🌸', '🌺', '🦋', '🐟', '🌻', '🌈'],
        toys: ['🎈', '🧸', '🎁', '🧩', '⚽', '🎯'],
        animals: ['🐰', '🐱', '🐶', '🐼', '🦊', '🐸']
    }
};

// 배열 섞기 함수
function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// 랜덤 캐릭터 선택
function getRandomCharacter() {
    return PROBLEM_CONFIG.CHARACTERS[Math.floor(Math.random() * PROBLEM_CONFIG.CHARACTERS.length)];
}

// 두 개의 다른 랜덤 캐릭터 선택
function getTwoCharacters() {
    const idx1 = Math.floor(Math.random() * PROBLEM_CONFIG.CHARACTERS.length);
    let idx2;
    do {
        idx2 = Math.floor(Math.random() * PROBLEM_CONFIG.CHARACTERS.length);
    } while (idx2 === idx1);
    return [PROBLEM_CONFIG.CHARACTERS[idx1], PROBLEM_CONFIG.CHARACTERS[idx2]];
}

// 세 개의 다른 랜덤 캐릭터 선택
function getThreeCharacters() {
    const indices = [];
    while (indices.length < 3) {
        const idx = Math.floor(Math.random() * PROBLEM_CONFIG.CHARACTERS.length);
        if (!indices.includes(idx)) indices.push(idx);
    }
    return indices.map(i => PROBLEM_CONFIG.CHARACTERS[i]);
}

// 랜덤 이모지 심볼 선택
function getRandomSymbol() {
    return PROBLEM_CONFIG.SYMBOLS[Math.floor(Math.random() * PROBLEM_CONFIG.SYMBOLS.length)];
}

// 오답 생성 유틸리티 (흔한 실수 패턴 반영)
function generateDistractors(answer, count = 3, options = {}) {
    const wrongs = new Set();
    const numAnswer = typeof answer === 'number' ? answer : parseInt(answer);

    if (isNaN(numAnswer)) {
        return buildFallbackDistractors(String(answer), [], count);
    }

    // 일반적인 오답 패턴
    const patterns = [
        numAnswer + 1,      // ±1 오류
        numAnswer - 1,
        numAnswer + 10,     // 자릿수 오류
        numAnswer - 10,
        numAnswer * 2,      // 연산 혼동
        Math.floor(numAnswer / 2),
        numAnswer + (options.operand || 0),  // 연산 결과 혼동
        numAnswer - (options.operand || 0)
    ].filter(v => v > 0 && v !== numAnswer);

    // 랜덤하게 섞어서 선택
    const shuffled = shuffleArray(patterns);
    for (const p of shuffled) {
        if (wrongs.size >= count) break;
        wrongs.add(p);
    }

    // 부족하면 랜덤 추가
    while (wrongs.size < count) {
        const offset = Math.floor(Math.random() * 10) - 5;
        const wrong = numAnswer + offset;
        if (wrong > 0 && wrong !== numAnswer && !wrongs.has(wrong)) {
            wrongs.add(wrong);
        }
    }

    return Array.from(wrongs).slice(0, count);
}

function addUniqueOption(options, candidate, answerString) {
    const value = String(candidate);
    if (!value || value === answerString || options.includes(value)) return false;
    options.push(value);
    return true;
}

function buildFallbackDistractors(answerString, existingOptions, requiredCount) {
    const options = [...existingOptions];
    const fractionMatch = answerString.match(/^(\d+)\/(\d+)$/);
    if (fractionMatch) {
        const numerator = parseInt(fractionMatch[1], 10);
        const denominator = parseInt(fractionMatch[2], 10);
        const candidates = [
            `${numerator}/${denominator + 1}`,
            `${numerator}/${Math.max(2, denominator - 1)}`,
            `${numerator + 1}/${denominator}`,
            `${Math.max(1, numerator - 1)}/${denominator}`,
            `${denominator}/${Math.max(1, numerator)}`
        ];
        candidates.forEach(candidate => addUniqueOption(options, candidate, answerString));
    }

    const numericMatch = answerString.match(/^(-?\d+)(.*)$/);
    if (numericMatch) {
        const value = parseInt(numericMatch[1], 10);
        const suffix = numericMatch[2] || '';
        const offsets = [1, -1, 2, -2, 5, -5, 10, -10, 20, -20];
        offsets.forEach(offset => {
            const candidate = value + offset;
            if (candidate > 0) addUniqueOption(options, `${candidate}${suffix}`, answerString);
        });
    }

    if (/^\d+번째$/.test(answerString)) {
        ['1번째', '2번째', '3번째', '4번째', '5번째'].forEach(candidate => addUniqueOption(options, candidate, answerString));
    } else if (/^\d+등$/.test(answerString)) {
        ['1등', '2등', '3등', '4등', '5등'].forEach(candidate => addUniqueOption(options, candidate, answerString));
    } else {
        const labelCandidates = [
            '태희', '민지', '하준', '서아', '지우', '도윤', '수빈', '연우',
            '하츄핑', '바로핑', '아자핑', '차차핑', '라라핑', '해핑', '무루핑', '오로라핑',
            '사과', '바나나', '수박', '배', '상자 A', '상자 B', '컵 A', '컵 B',
            '첫 번째 대상', '두 번째 대상', '세 번째 대상', '네 번째 대상'
        ];
        labelCandidates.forEach(candidate => addUniqueOption(options, candidate, answerString));
    }

    let guard = 1;
    while (options.length < requiredCount && guard < 50) {
        const fallbackLabels = ['가 대상', '나 대상', '다 대상', '라 대상', '마 대상'];
        addUniqueOption(options, fallbackLabels[(guard - 1) % fallbackLabels.length], answerString);
        guard += 1;
    }

    return options.slice(0, requiredCount);
}

function buildAnswerOptions(answer, wrongs, optionCount = 4) {
    const answerString = String(answer);
    const wrongValues = Array.isArray(wrongs) ? wrongs : Array.from(wrongs || []);
    const uniqueWrongs = [];

    wrongValues.forEach(wrong => {
        addUniqueOption(uniqueWrongs, wrong, answerString);
    });

    const completedWrongs = buildFallbackDistractors(answerString, uniqueWrongs, optionCount - 1);
    return shuffleArray([answerString, ...completedWrongs].slice(0, optionCount));
}

// 문제 결과 객체 생성
function createProblemResult(question, answer, explanation, wrongs, problemType, difficulty) {
    return {
        question,
        options: buildAnswerOptions(answer, wrongs, 4),
        answer: String(answer),
        explanation,
        problemKey: `${problemType}-${difficulty}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
    };
}

// 단위 문자열 처리
function formatWithUnit(value, unit) {
    if (!unit) return String(value);
    return `${value}${unit}`;
}

// 문항 템플릿 검증 (개발용)
function validateTemplate(template) {
    const required = ['question', 'answer', 'explanation'];
    for (const key of required) {
        if (!template[key]) {
            console.warn(`Template missing required field: ${key}`);
            return false;
        }
    }
    return true;
}

// 전역으로 내보내기
window.ProblemBase = {
    CONFIG: PROBLEM_CONFIG,
    shuffleArray,
    getRandomCharacter,
    getTwoCharacters,
    getThreeCharacters,
    getRandomSymbol,
    generateDistractors,
    buildAnswerOptions,
    createProblemResult,
    formatWithUnit,
    validateTemplate
};
