/* =========================================================================
   측정 품질 관리

   IRT 추정치를 과장하지 않도록 신뢰도와 타당도 근거를 분리해 판정합니다.
   이 값은 표준화 검사 인증이 아니라 앱 내부 학습 추천의 해석 가능 범위입니다.
   ========================================================================= */

const MEASUREMENT_EXPECTED_SKILLS = [
    'DIRECT_COMPARE',
    'EQUAL_SHARING',
    'QUOTATIVE_DIVISION',
    'UNIT_COMPARE',
    'MULTIPLICATIVE_COMPARE',
    'FRACTION_RELATION',
    'INVERSE_RELATION',
    'PROPORTION',
    'RANKING',
    'COMPOSITE_RELATION',
    'BASE_UNIT_IDENTIFICATION',
    'DIRECTION_REASONING',
    'TRANSFER'
];

function clampQuality(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function roundQuality(value, digits = 2) {
    const factor = 10 ** digits;
    return Math.round(Number(value || 0) * factor) / factor;
}

function getQualityAttempts(inputAttempts) {
    return Array.isArray(inputAttempts) ? inputAttempts : [];
}

function getAttemptCount(attempts, irtState = {}) {
    return Math.max(attempts.length, Number(irtState.attemptCount || 0));
}

function getStandardError(attempts, irtState = {}) {
    if (typeof irtState.standardError === 'number') return irtState.standardError;
    const latest = attempts[attempts.length - 1];
    if (typeof latest?.standard_error_after === 'number') return latest.standard_error_after;
    return 1;
}

function getSkillCounts(attempts) {
    const counts = new Map();
    attempts.forEach(record => {
        (record.skill_tags || []).forEach(skill => {
            counts.set(skill, (counts.get(skill) || 0) + 1);
        });
    });
    return counts;
}

function getProcessCaptureRate(attempts) {
    if (!attempts.length) return 0;
    const captured = attempts.filter(record => (
        typeof record.hint_level === 'number'
        && typeof record.response_score === 'number'
    )).length;
    return captured / attempts.length;
}

function getResponseProcessRate(attempts) {
    if (!attempts.length) return 0;
    const captured = attempts.filter(record => (
        typeof record.hint_level === 'number'
        && typeof record.response_score === 'number'
        && typeof record.step_success_rate === 'number'
    )).length;
    return captured / attempts.length;
}

function evaluateReliability(attempts, irtState = {}) {
    const attemptCount = getAttemptCount(attempts, irtState);
    const standardError = getStandardError(attempts, irtState);
    const uniqueItemCount = new Set(attempts.map(record => record.item_id).filter(Boolean)).size;
    const skillCounts = getSkillCounts(attempts);
    const repeatedSkillCount = Array.from(skillCounts.values()).filter(count => count >= 3).length;
    const processCaptureRate = getProcessCaptureRate(attempts);

    const attemptScore = clampQuality(attemptCount / 30, 0, 1) * 30;
    const standardErrorScore = clampQuality((0.95 - standardError) / 0.6, 0, 1) * 30;
    const repeatedSkillScore = clampQuality(repeatedSkillCount / 5, 0, 1) * 20;
    const itemDiversityScore = clampQuality(uniqueItemCount / Math.min(Math.max(attemptCount, 1), 10), 0, 1) * 10;
    const processScore = processCaptureRate * 10;
    const score = Math.round(attemptScore + standardErrorScore + repeatedSkillScore + itemDiversityScore + processScore);

    const warnings = [];
    if (attemptCount < 8) warnings.push('풀이 기록이 8문항 미만이라 능력 추정은 관찰 단계입니다.');
    if (attemptCount < 30) warnings.push('안정적인 개인 추세를 보려면 최소 30문항 이상의 누적 기록이 필요합니다.');
    if (standardError > 0.55) warnings.push('표준오차가 커서 theta 값을 좁은 범위로 해석하면 안 됩니다.');
    if (repeatedSkillCount < 3) warnings.push('같은 skill을 반복 측정한 근거가 부족합니다.');
    if (uniqueItemCount < Math.min(attemptCount, 10)) warnings.push('서로 다른 문항으로 측정한 다양성 근거가 더 필요합니다.');

    let level = '운영 주의';
    if (attemptCount < 8 || standardError > 0.75 || repeatedSkillCount === 0) {
        level = '관찰 단계';
    } else if (score >= 75 && attemptCount >= 30 && standardError <= 0.4 && repeatedSkillCount >= 5) {
        level = '안정적';
    } else if (score >= 55 && attemptCount >= 15 && standardError <= 0.55) {
        level = '운영 가능';
    }

    return {
        level,
        score,
        evidence: {
            attemptCount,
            standardError: roundQuality(standardError, 2),
            uniqueItemCount,
            itemDiversityRate: attemptCount ? roundQuality(uniqueItemCount / attemptCount, 2) : 0,
            observedSkillCount: skillCounts.size,
            repeatedSkillCount,
            processCaptureRate: Math.round(processCaptureRate * 100)
        },
        warnings
    };
}

function getBankSkillCounts(itemBank) {
    const counts = new Map();
    (itemBank || []).forEach(item => {
        (item.skill_tags || item.problem_types || []).forEach(skill => {
            counts.set(skill, (counts.get(skill) || 0) + 1);
        });
    });
    return counts;
}

function evaluateValidity(attempts, itemBank = []) {
    const bank = Array.isArray(itemBank) ? itemBank : [];
    const attemptCount = attempts.length;
    const bankSkillCounts = getBankSkillCounts(bank);
    const contentCoveredSkills = MEASUREMENT_EXPECTED_SKILLS.filter(skill => (bankSkillCounts.get(skill) || 0) >= 3);
    const contentCoverageRate = MEASUREMENT_EXPECTED_SKILLS.length
        ? contentCoveredSkills.length / MEASUREMENT_EXPECTED_SKILLS.length
        : 0;
    const calibratedItemRate = bank.length
        ? bank.filter(item => typeof item.irt?.b === 'number' && item.irt?.model === 'rasch').length / bank.length
        : 0;
    const constructTagRate = bank.length
        ? bank.filter(item => Array.isArray(item.skill_tags) && item.skill_tags.length && Array.isArray(item.problem_types) && item.problem_types.length).length / bank.length
        : 0;
    const gradeCoverageCount = new Set(bank.map(item => item.grade_band).filter(Boolean)).size;
    const observedSkillCount = getSkillCounts(attempts).size;
    const responseProcessRate = getResponseProcessRate(attempts);

    const score = Math.round(
        contentCoverageRate * 30
        + calibratedItemRate * 20
        + constructTagRate * 15
        + clampQuality(gradeCoverageCount / 3, 0, 1) * 10
        + responseProcessRate * 15
        + clampQuality(observedSkillCount / 6, 0, 1) * 10
    );

    const gaps = [];
    if (!bank.length) gaps.push('운영 문제 은행을 전달받지 못해 내용타당도 근거를 확인할 수 없습니다.');
    if (contentCoverageRate < 1) gaps.push('관계 사고 핵심 skill별 최소 3문항 기준을 더 채워야 합니다.');
    if (calibratedItemRate < 1) gaps.push('모든 운영 문항에 Rasch 난이도 b 값이 필요합니다.');
    if (constructTagRate < 1) gaps.push('모든 문항에 skill_tags와 problem_types가 함께 필요합니다.');
    if (gradeCoverageCount < 3) gaps.push('초등 저학년, 중학년, 고학년 범위가 모두 포함되어야 합니다.');
    if (attemptCount < 8) gaps.push('실제 응답 로그가 부족해 응답 과정 타당도는 아직 관찰 단계입니다.');
    if (observedSkillCount < 4) gaps.push('풀이 로그가 일부 skill에만 몰려 있어 전체 수리능력으로 일반화하기 어렵습니다.');
    if (responseProcessRate < 0.8) gaps.push('힌트, 사고 단계 성공률, 응답 점수가 함께 기록되어야 과정 타당도가 높아집니다.');

    let level = '타당도 근거 축적 중';
    if (!bank.length || contentCoverageRate < 0.6 || calibratedItemRate < 0.8) {
        level = '설계 보강 필요';
    } else if (attemptCount < 8) {
        level = '내용타당도 중심';
    } else if (responseProcessRate < 0.7) {
        level = '과정타당도 부족';
    } else if (score >= 75 && attemptCount >= 30) {
        level = '운영 타당도 축적';
    }

    return {
        level,
        score,
        evidence: {
            itemCount: bank.length,
            contentCoverageRate: Math.round(contentCoverageRate * 100),
            contentCoveredSkillCount: contentCoveredSkills.length,
            calibratedItemRate: Math.round(calibratedItemRate * 100),
            constructTagRate: Math.round(constructTagRate * 100),
            gradeCoverageCount,
            observedSkillCount,
            responseProcessRate: Math.round(responseProcessRate * 100)
        },
        gaps
    };
}

function buildInterpretation(reliability, validity) {
    const canUseFor = ['다음 학습 추천과 보완 skill 관찰'];
    const cannotUseFor = ['표준화 검사 점수나 학년 수준 확정 판정'];

    if (reliability.level !== '관찰 단계' && validity.level !== '설계 보강 필요') {
        canUseFor.push('앱 내부 개인화 난이도 조정');
    }
    if (reliability.level === '안정적' && validity.level === '운영 타당도 축적') {
        canUseFor.push('동일 앱 안에서 기간별 성장 추세 비교');
    }
    if (reliability.level !== '안정적') {
        cannotUseFor.push('다른 아동과 능력 비교');
    }
    cannotUseFor.push('의학적 또는 심리학적 진단');

    return { canUseFor, cannotUseFor };
}

function buildMinimumNextActions(reliability, validity) {
    return [
        ...reliability.warnings.slice(0, 2),
        ...validity.gaps.slice(0, 2)
    ].slice(0, 4);
}

function evaluateMeasurementQuality(options = {}) {
    const attempts = getQualityAttempts(options.attempts);
    const reliability = evaluateReliability(attempts, options.irtState || {});
    const validity = evaluateValidity(attempts, options.itemBank || []);
    const interpretation = buildInterpretation(reliability, validity);

    return {
        reliability,
        validity,
        interpretation,
        minimumNextActions: buildMinimumNextActions(reliability, validity)
    };
}

window.MeasurementQuality = {
    evaluate: evaluateMeasurementQuality,
    expectedSkills: MEASUREMENT_EXPECTED_SKILLS
};

globalThis.MeasurementQuality = window.MeasurementQuality;
