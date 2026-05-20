/* =========================================================================
   IRT 기반 부모 리포트

   점수 하나로 단정하지 않고 theta, 표준오차, 힌트 의존도, skill별 evidence를
   함께 보여 부모가 다음 학습을 판단할 수 있게 합니다.
   ========================================================================= */

const MATH_ABILITY_SKILL_LABELS = {
    DIRECT_COMPARE: '직접 비교',
    EQUAL_SHARING: '등분 나눗셈',
    QUOTATIVE_DIVISION: '포함 나눗셈',
    UNIT_COMPARE: '단위량 비교',
    MULTIPLICATIVE_COMPARE: '배수 비교',
    FRACTION_RELATION: '분수 관계',
    INVERSE_RELATION: '역관계 해석',
    PROPORTION: '비례 추론',
    RANKING: '순위 판단',
    COMPOSITE_RELATION: '복합 관계',
    DIRECTION_CONFUSION: '관계 방향',
    BASE_UNIT_CONFUSION: '기준량 찾기',
    OPERATION_SELECTION_ERROR: '연산 선택',
    EXPLANATION_GAP: '풀이 설명'
};

const MATH_ABILITY_RECOMMENDATIONS = {
    DIRECTION_CONFUSION: '화살표로 누가 누구에게 작용하는지 먼저 표시하는 문제를 풀어보세요.',
    BASE_UNIT_CONFUSION: '문제에서 기준이 되는 양을 고르는 연습을 먼저 하세요.',
    EQUAL_SHARING: '전체를 같은 크기로 나누는 등분 나눗셈 문장제를 보강하세요.',
    QUOTATIVE_DIVISION: '몇 개씩 묶으면 몇 묶음인지 묻는 포함 나눗셈을 연습하세요.',
    FRACTION_RELATION: '같은 전체에서 분수의 크기와 단위분수를 비교하는 문제를 풀어보세요.',
    PROPORTION: '한 단위 값을 구한 뒤 전체로 확장하는 비례 문제를 연습하세요.',
    UNIT_COMPARE: '한 개, 한 컵, 한 사람당 양을 먼저 구하는 문제를 보강하세요.',
    RANKING: '가장 큰 것과 두 번째 큰 것을 구분하는 순위 문제를 연습하세요.',
    COMPOSITE_RELATION: '두 관계 이상을 표로 정리한 뒤 식을 고르는 문제를 풀어보세요.'
};

function clampAbility(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function roundAbility(value, digits = 2) {
    const factor = 10 ** digits;
    return Math.round(Number(value || 0) * factor) / factor;
}

function getSkillLabel(skill) {
    return MATH_ABILITY_SKILL_LABELS[skill] || skill;
}

function getConfidenceLabel(attempts, standardError) {
    if (attempts < 3) return '데이터 부족';
    if (attempts < 8 || standardError > 0.55) return '관찰 중';
    if (standardError > 0.35) return '추정 안정화';
    return '안정적';
}

function getAbilityBand(theta) {
    if (theta < -0.75) return '기초 다지기';
    if (theta < 0.25) return '성장 중';
    if (theta < 1) return '안정적 적용';
    return '확장 도전';
}

function getAttempts(inputAttempts) {
    if (Array.isArray(inputAttempts)) return inputAttempts;
    if (window.IrtLog?.loadAttempts) return window.IrtLog.loadAttempts();
    return [];
}

function summarizeAttempts(attempts) {
    const total = attempts.length;
    const correct = attempts.filter(item => item.correct).length;
    const independent = attempts.filter(item => item.correct && (item.hint_level || 0) <= 1).length;
    const averageHint = total
        ? attempts.reduce((sum, item) => sum + (item.hint_level || 0), 0) / total
        : 0;
    const averageResponseScore = total
        ? attempts.reduce((sum, item) => sum + Number(item.response_score || 0), 0) / total
        : 0;

    return {
        totalAttempts: total,
        correctRate: total ? Math.round((correct / total) * 100) : 0,
        independentSolveRate: total ? Math.round((independent / total) * 100) : 0,
        averageHintLevel: roundAbility(averageHint, 1),
        averageResponseScore: roundAbility(averageResponseScore, 2)
    };
}

function buildSkillEvidence(attempts, skillStates = {}) {
    const evidence = new Map();

    Object.entries(skillStates || {}).forEach(([skill, state]) => {
        evidence.set(skill, {
            skill,
            label: getSkillLabel(skill),
            attempts: state.attempts || 0,
            mastery: roundAbility(state.mastery || 0, 2),
            correctRate: 0,
            averageHintLevel: 0,
            averageResponseScore: roundAbility(state.mastery || 0, 2),
            errorCount: 0
        });
    });

    attempts.forEach(record => {
        (record.skill_tags || []).forEach(skill => {
            const current = evidence.get(skill) || {
                skill,
                label: getSkillLabel(skill),
                attempts: 0,
                mastery: 0,
                correctCount: 0,
                hintTotal: 0,
                responseTotal: 0,
                errorCount: 0
            };

            current.attempts += 1;
            current.correctCount = (current.correctCount || 0) + (record.correct ? 1 : 0);
            current.hintTotal = (current.hintTotal || 0) + (record.hint_level || 0);
            current.responseTotal = (current.responseTotal || 0) + Number(record.response_score || 0);
            current.errorCount = (current.errorCount || 0) + (record.correct ? 0 : 1);
            evidence.set(skill, current);
        });
    });

    return Array.from(evidence.values()).map(item => {
        const attempts = item.attempts || 0;
        const averageResponseScore = attempts && typeof item.responseTotal === 'number'
            ? item.responseTotal / attempts
            : item.averageResponseScore;
        return {
            skill: item.skill,
            label: item.label,
            attempts,
            mastery: roundAbility(item.mastery || averageResponseScore || 0, 2),
            correctRate: attempts ? Math.round(((item.correctCount || 0) / attempts) * 100) : 0,
            averageHintLevel: attempts ? roundAbility((item.hintTotal || 0) / attempts, 1) : 0,
            averageResponseScore: roundAbility(averageResponseScore || 0, 2),
            errorCount: item.errorCount || 0
        };
    }).sort((a, b) => b.attempts - a.attempts || a.averageResponseScore - b.averageResponseScore);
}

function pickWeakSkills(skillEvidence) {
    return [...skillEvidence]
        .filter(item => item.attempts > 0)
        .sort((a, b) => (
            a.averageResponseScore - b.averageResponseScore
            || b.averageHintLevel - a.averageHintLevel
            || b.errorCount - a.errorCount
        ))
        .slice(0, 4);
}

function pickStrengths(skillEvidence) {
    return [...skillEvidence]
        .filter(item => item.attempts > 0)
        .sort((a, b) => (
            b.averageResponseScore - a.averageResponseScore
            || a.averageHintLevel - b.averageHintLevel
            || b.correctRate - a.correctRate
        ))
        .slice(0, 3);
}

function buildRecommendations(weakSkills, summary) {
    const recommendations = weakSkills
        .map(item => MATH_ABILITY_RECOMMENDATIONS[item.skill] || `${item.label} 유형을 낮은 힌트 단계에서 다시 연습하세요.`)
        .slice(0, 3);

    if (summary.totalAttempts < 8) {
        recommendations.unshift('측정 정확도를 높이려면 관계형 문장제를 8문항 이상 더 풀어보세요.');
    }
    if (summary.independentSolveRate < 50 && summary.totalAttempts >= 3) {
        recommendations.push('정답 확인 전 기준량과 방향을 말로 설명하는 연습을 유지하세요.');
    }

    return Array.from(new Set(recommendations)).slice(0, 4);
}

function buildQualityRecommendations(quality) {
    if (!quality?.minimumNextActions) return [];
    return quality.minimumNextActions.map(action => `측정 품질: ${action}`);
}

function buildParentNarrative(measurement, summary, weakSkills, quality) {
    if (!summary.totalAttempts) {
        return '아직 IRT 풀이 기록이 없어 수리능력 추정을 시작하지 못했습니다. 먼저 관계 사고가 필요한 초등 문장제를 몇 문항 풀어보세요.';
    }

    const weakText = weakSkills.length
        ? `보완이 필요한 영역은 ${weakSkills.map(item => item.label).join(', ')}입니다.`
        : '뚜렷하게 반복되는 약점은 아직 관찰되지 않았습니다.';
    const qualityText = quality
        ? `신뢰도는 ${quality.reliability.level}, 타당도는 ${quality.validity.level}입니다.`
        : '';

    return `현재 수리능력은 ${measurement.band} 단계로 추정됩니다. 추정치는 ${measurement.theta}이고 표준오차는 ${measurement.standardError}이므로 ${measurement.confidenceLabel} 수준으로 해석해야 합니다. ${qualityText} ${weakText}`;
}

function buildParentReport(options = {}) {
    const attempts = getAttempts(options.attempts);
    const irtState = options.irtState || {};
    const itemBank = options.itemBank || window.RelationshipCoachProblems?.bank || [];
    const summary = summarizeAttempts(attempts);
    const latestRecord = attempts[attempts.length - 1] || {};
    const theta = roundAbility(
        typeof irtState.theta === 'number' ? irtState.theta : latestRecord.theta_after,
        2
    );
    const standardError = roundAbility(
        typeof irtState.standardError === 'number' ? irtState.standardError : latestRecord.standard_error_after || 1,
        2
    );
    const abilityIndex = Math.round(clampAbility(50 + theta * 15, 1, 99));
    const lower = roundAbility(theta - standardError, 2);
    const upper = roundAbility(theta + standardError, 2);
    const skillEvidence = buildSkillEvidence(attempts, irtState.skillStates || {});
    const weakSkills = pickWeakSkills(skillEvidence);
    const strengths = pickStrengths(skillEvidence);
    const measurement = {
        theta,
        standardError,
        interval: `${lower} ~ ${upper}`,
        abilityIndex,
        band: getAbilityBand(theta),
        confidenceLabel: getConfidenceLabel(summary.totalAttempts || irtState.attemptCount || 0, standardError)
    };
    const quality = window.MeasurementQuality?.evaluate
        ? window.MeasurementQuality.evaluate({ attempts, irtState, itemBank })
        : null;
    const recommendations = [
        ...buildRecommendations(weakSkills, summary),
        ...buildQualityRecommendations(quality)
    ];

    return {
        generatedAt: new Date().toISOString(),
        measurement,
        summary,
        skillEvidence,
        weakSkills,
        strengths,
        quality,
        recommendations: Array.from(new Set(recommendations)).slice(0, 5),
        parentNarrative: buildParentNarrative(measurement, summary, weakSkills, quality)
    };
}

window.MathAbilityReport = {
    buildParentReport,
    getSkillLabel
};

globalThis.MathAbilityReport = window.MathAbilityReport;
