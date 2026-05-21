/* =========================================================================
   대규모 초등 문장제 seed bank 런타임 변환

   data/elementary_word_problem_seed_bank.json을 IRT 출제 엔진이 바로 사용할 수
   있는 relationshipCoach 호환 문항으로 변환합니다.
   ========================================================================= */

const EXPANDED_WORD_BANK_URL = 'data/elementary_word_problem_seed_bank.json?v=20260521-diversity-v3';

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

function parseExpandedNumberPart(text) {
    const source = String(text || '').trim();
    const match = source.match(/-?\d+(?:\.\d+)?/);
    if (!match) return null;
    return {
        value: Number(match[0]),
        raw: match[0],
        prefix: source.slice(0, match.index),
        unit: source.slice(match.index + match[0].length)
    };
}

function getExpandedOffsets(value) {
    return value <= 3 ? [1, 2, 3, -1] : [-1, 1, 2, -2, 5, -5];
}

function formatExpandedNumberPart(part, value) {
    return `${part.prefix || ''}${value}${part.unit || ''}`;
}

function extractExpandedLabelCandidates(item, answerLabel) {
    const text = `${item.problem || ''} ${answerLabel || ''}`;
    const candidates = [
        '태희', '민지', '하준', '서아', '지우', '도윤', '수빈', '연우', '지민', '유나',
        '월요일과 화요일', '수요일과 목요일', '월요일', '화요일', '수요일', '목요일',
        '첫 번째 상자', '두 번째 상자', '이어 붙인 길이', '리본 길이', '더 받은 수', '친구가 가진 수',
        '첫째 날', '둘째 날', '큰 컵', '작은 컵'
    ];
    const regexCandidates = [];
    const patterns = [
        /(리본|물병|상자|기차|막대|컵)\s*[A-D]/g,
        /[A-D]\s*(컵|막대|상자|팀)/g,
        /(빨간|파란|노란|초록|보라|하얀|검은|분홍|주황|남색)\s*(공|컵|끈|바구니|상자|막대|삽)(?![가-힣])/g,
        /(큰|작은)\s*(컵|그릇|상자|막대)/g
    ];
    patterns.forEach(pattern => {
        Array.from(text.matchAll(pattern)).forEach(match => regexCandidates.push(match[0].replace(/\s+/g, ' ').trim()));
    });
    return uniqueExpandedList([...candidates, ...regexCandidates].filter(label => text.includes(label)));
}

function buildTextDistractors(item, answer) {
    const options = [];
    const add = candidate => {
        const value = normalizeExpandedText(candidate);
        if (value && value !== answer && !options.includes(value)) options.push(value);
    };

    extractExpandedLabelCandidates(item, answer)
        .filter(candidate => candidate !== answer)
        .forEach(add);

    if (answer === '같다') {
        ['다르다', '첫 번째가 더 크다', '두 번째가 더 크다', '두 양이 다르다'].forEach(add);
    } else if (/컵/.test(answer)) {
        ['큰 컵', '작은 컵', '두 컵이 같다', '컵 크기는 관계없다'].forEach(add);
    } else if (/^[가-힣]{2,3}$/.test(answer)) {
        ['두 사람이 같다', '앞사람', '뒷사람'].forEach(add);
    } else if (/[A-D]/.test(answer)) {
        ['A', 'B', 'C', 'D', 'A와 B가 같다', 'B와 C가 같다'].forEach(add);
    } else {
        ['첫 번째 대상', '두 번째 대상', '두 대상이 같다', '반대 대상'].forEach(add);
    }

    return options.slice(0, 5);
}

function normalizeExpandedText(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
}

function buildLabeledNumberDistractors(item, answer, label, numberPart) {
    const labels = extractExpandedLabelCandidates(item, label);
    let otherLabels = labels.filter(candidate => candidate !== label);
    const options = [];
    const add = candidate => {
        if (candidate && candidate !== answer && !options.includes(candidate)) options.push(candidate);
    };
    const sortedOtherLabels = [...otherLabels].sort((a, b) => {
        const aMatch = /과|와/.test(a) ? 1 : 0;
        const bMatch = /과|와/.test(b) ? 1 : 0;
        return bMatch - aMatch;
    });

    if (!sortedOtherLabels.length) {
        otherLabels = ['다른 대상'];
        sortedOtherLabels.push('다른 대상');
    }

    const offsets = getExpandedOffsets(numberPart.value)
        .filter(offset => {
            const nextValue = numberPart.value + offset;
            return Number.isFinite(nextValue) && nextValue >= 0;
        });
    const primaryOtherLabel = sortedOtherLabels[0];
    add(`${primaryOtherLabel}, ${formatExpandedNumberPart(numberPart, numberPart.value)}`);
    offsets.slice(0, 2).forEach(offset => {
        add(`${label}, ${formatExpandedNumberPart(numberPart, numberPart.value + offset)}`);
    });
    if (offsets.length) {
        add(`${primaryOtherLabel}, ${formatExpandedNumberPart(numberPart, numberPart.value + offsets[0])}`);
    }

    sortedOtherLabels.slice(1).forEach(otherLabel => add(`${otherLabel}, ${formatExpandedNumberPart(numberPart, numberPart.value)}`));
    offsets.slice(2).forEach(offset => {
        add(`${label}, ${formatExpandedNumberPart(numberPart, numberPart.value + offset)}`);
    });
    sortedOtherLabels.forEach(otherLabel => {
        offsets.forEach(offset => {
            const nextValue = numberPart.value + offset;
            add(`${otherLabel}, ${formatExpandedNumberPart(numberPart, nextValue)}`);
        });
    });

    return options.slice(0, 5);
}

function buildCommaNumberDistractors(answer, parts, parsedParts) {
    const options = [];
    const add = candidate => {
        if (candidate && candidate !== answer && !options.includes(candidate)) options.push(candidate);
    };

    parsedParts.forEach((part, index) => {
        getExpandedOffsets(part.value).forEach(offset => {
            const nextValue = part.value + offset;
            if (!Number.isFinite(nextValue) || nextValue < 0) return;
            const candidateParts = [...parts];
            candidateParts[index] = formatExpandedNumberPart(part, nextValue);
            add(candidateParts.join(', '));
        });
    });

    if (parsedParts.length >= 2) {
        const candidateParts = [...parts];
        parsedParts.slice(0, 2).forEach((part, index) => {
            const nextValue = part.value + 1;
            candidateParts[index] = formatExpandedNumberPart(part, nextValue);
        });
        add(candidateParts.join(', '));
    }

    return options.slice(0, 5);
}

function buildSeedDistractors(item) {
    const answer = String(item.answer || '');
    const commaParts = answer.split(',').map(part => part.trim());

    if (commaParts.length >= 2) {
        const firstNumber = parseExpandedNumberPart(commaParts[0]);
        const secondNumber = parseExpandedNumberPart(commaParts[1]);
        if (!firstNumber && secondNumber && Number.isFinite(secondNumber.value)) {
            const labeled = buildLabeledNumberDistractors(item, answer, commaParts[0], secondNumber);
            if (labeled.length >= 3) return labeled;
        }

        const parsedParts = commaParts.map(parseExpandedNumberPart);
        if (parsedParts.every(part => part && Number.isFinite(part.value))) {
            const commaDistractors = buildCommaNumberDistractors(answer, commaParts, parsedParts);
            if (commaDistractors.length >= 3) return commaDistractors;
        }
    }

    const parsed = parseExpandedNumberPart(answer);
    if (!parsed || !Number.isFinite(parsed.value)) {
        return buildTextDistractors(item, answer).slice(0, 5);
    }

    return getExpandedOffsets(parsed.value)
        .map(offset => parsed.value + offset)
        .filter(value => Number.isFinite(value) && value >= 0 && value !== parsed.value)
        .map(value => formatExpandedNumberPart(parsed, value))
        .filter(value => value !== answer)
        .slice(0, 5);
}

function buildSeedEntities(item) {
    const options = uniqueExpandedList([item.answer, ...buildSeedDistractors(item)]).slice(0, 5);
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
        problem_types: uniqueExpandedList([item.type_family, item.type, ...skillTags, ...(item.reasoning_tags || [])]),
        question: item.problem,
        base_unit: '문제에서 묻는 값',
        entities: buildSeedEntities(item),
        question_type: inferSeedQuestionType(item),
        operation,
        answer: item.answer,
        explanation: item.solution,
        source: 'elementary_seed_bank',
        curriculum_domain: item.curriculum_domain,
        topic: item.topic,
        type_family: item.type_family,
        structure_signature: item.structure_signature || item.template_signature || item.type_family || item.type,
        template_signature: item.template_signature || item.type_family || item.type,
        level_label: item.level_label,
        reasoning_depth: Number(item.reasoning_depth || 1),
        reasoning_tags: uniqueExpandedList(item.reasoning_tags || []),
        requires_multi_step_reasoning: Boolean(item.requires_multi_step_reasoning),
        representation_hint: item.representation_hint || 'bar_model'
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
