/* =========================================================================
   대규모 초등 문장제 seed bank 런타임 변환

   data/elementary_word_problem_seed_bank.json을 IRT 출제 엔진이 바로 사용할 수
   있는 relationshipCoach 호환 문항으로 변환합니다.
   ========================================================================= */

const EXPANDED_WORD_BANK_URL = 'data/elementary_word_problem_seed_bank.json';

function clampExpandedBank(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function seedDifficultyToTheta(difficulty) {
    const d = clampExpandedBank(Number(difficulty || 6), 1, 12);
    return Math.round((-2 + ((d - 1) / 11) * 4) * 100) / 100;
}

function uniqueExpandedList(values) {
    return Array.from(new Set((values || []).filter(Boolean)));
}

function inferSeedOperation(item) {
    const text = `${item.type_family || ''} ${(item.skill_tags || []).join(' ')}`.toUpperCase();
    if (text.includes('SUB')) return '뺄셈';
    if (text.includes('MULT') || text.includes('MUL')) return '곱셈';
    if (text.includes('DIV') || text.includes('SHARING') || text.includes('QUOTATIVE')) return '나눗셈';
    if (text.includes('ADD') || text.includes('JOIN')) return '덧셈';
    return '관계 비교';
}

function inferSeedQuestionType(item) {
    const family = String(item.type_family || '').toUpperCase();
    if (family.includes('COMPARE')) return 'COMPARE';
    if (family.includes('RANK')) return 'RANKING';
    if (family.includes('UNKNOWN')) return 'UNKNOWN_VALUE';
    if (family.includes('RATE') || family.includes('RATIO')) return 'TOTAL_AMOUNT';
    return 'WORD_PROBLEM';
}

function parseAnswerNumber(answer) {
    const match = String(answer || '').match(/-?\d+(?:\.\d+)?/);
    if (!match) return null;
    return {
        value: Number(match[0]),
        raw: match[0],
        unit: String(answer).slice(match.index + match[0].length)
    };
}

function buildSeedDistractors(answer) {
    const parsed = parseAnswerNumber(answer);
    if (!parsed || !Number.isFinite(parsed.value)) {
        return ['다시 계산이 필요해요', '문제 조건 부족', '알 수 없음'];
    }

    const offsets = parsed.value <= 3 ? [1, 2, 3] : [-1, 1, 2, -2, 5, -5];
    return offsets
        .map(offset => parsed.value + offset)
        .filter(value => Number.isFinite(value) && value >= 0 && value !== parsed.value)
        .map(value => `${value}${parsed.unit}`)
        .filter(value => value !== answer)
        .slice(0, 5);
}

function buildSeedEntities(item) {
    const options = uniqueExpandedList([item.answer, ...buildSeedDistractors(item.answer)]).slice(0, 5);
    while (options.length < 4) {
        options.push(`${item.answer}이 아님 ${options.length}`);
    }
    return options.map((label, index) => ({
        id: index === 0 ? 'answer' : `distractor_${index}`,
        label,
        relative_value: index === 0 ? 1 : 0
    }));
}

function convertSeedItem(item) {
    const skillTags = uniqueExpandedList(item.skill_tags || []);
    const operation = inferSeedOperation(item);
    return {
        problem_id: item.id,
        grade_band: item.grade_band,
        level: Number(item.difficulty || 6),
        skill_tags: skillTags,
        irt: { model: 'rasch', b: seedDifficultyToTheta(item.difficulty) },
        problem_types: uniqueExpandedList([item.type_family, item.type, ...skillTags]),
        question: item.problem,
        base_unit: item.topic || item.curriculum_domain || '문장제 관계',
        entities: buildSeedEntities(item),
        question_type: inferSeedQuestionType(item),
        operation,
        answer: item.answer,
        explanation: item.solution,
        source: 'elementary_seed_bank',
        curriculum_domain: item.curriculum_domain,
        topic: item.topic,
        type_family: item.type_family,
        level_label: item.level_label
    };
}

function convertSeedBank(rawBank) {
    const items = Array.isArray(rawBank?.items) ? rawBank.items : [];
    return items
        .filter(item => item && item.id && item.problem && item.answer && item.solution)
        .map(convertSeedItem);
}

function mergeSeedBank(rawBank) {
    const converted = convertSeedBank(rawBank);
    const current = window.RelationshipCoachProblems?.bank || [];
    const seen = new Set(current.map(item => item.problem_id));
    const additions = converted.filter(item => !seen.has(item.problem_id));
    if (window.RelationshipCoachProblems) {
        window.RelationshipCoachProblems.bank = [...current, ...additions];
    }
    return {
        added: additions.length,
        total: window.RelationshipCoachProblems?.bank?.length || additions.length,
        items: additions
    };
}

async function loadExpandedSeedBank(url = EXPANDED_WORD_BANK_URL) {
    if (typeof fetch !== 'function') {
        return { ok: false, reason: 'fetch_unavailable', added: 0 };
    }
    const response = await fetch(url);
    if (!response.ok) {
        return { ok: false, reason: `http_${response.status}`, added: 0 };
    }
    const rawBank = await response.json();
    const merged = mergeSeedBank(rawBank);
    return { ok: true, ...merged };
}

window.ExpandedWordProblemBank = {
    url: EXPANDED_WORD_BANK_URL,
    convert: convertSeedBank,
    convertItem: convertSeedItem,
    merge: mergeSeedBank,
    load: loadExpandedSeedBank
};

globalThis.ExpandedWordProblemBank = window.ExpandedWordProblemBank;
