/* =========================================================================
   IRT 기반 부모 리포트

   점수 하나로 단정하지 않고 theta, 표준오차, 힌트 의존도, skill별 evidence를
   함께 보여 부모가 다음 학습을 판단할 수 있게 합니다.
   ========================================================================= */

const MATH_ABILITY_SKILL_LABELS = {
    ADDITION: '덧셈 관계',
    ADD_SINGLE_DIGIT: '한 자리 수 덧셈',
    TWO_DIGIT_ADDITION: '두 자리 수 덧셈',
    SUBTRACTION: '뺄셈 관계',
    SUB_SINGLE_DIGIT: '한 자리 수 뺄셈',
    TWO_DIGIT_SUBTRACTION: '두 자리 수 뺄셈',
    MULTIPLICATION: '곱셈 관계',
    MULTIPLICATION_FACT: '구구단 곱셈',
    DIVISION: '나눗셈 관계',
    DIVISION_FACT: '기초 나눗셈',
    DECIMAL: '소수 관계',
    RATIO: '비와 비율',
    PERCENT: '백분율',
    AVERAGE: '평균',
    PROBABILITY: '가능성',
    PROBABILITY_DISTRIBUTION: '확률분포',
    EXPECTED_VALUE: '기댓값',
    PLACE_VALUE: '자릿값',
    NUMBER_SENSE: '수 감각',
    PATTERN: '규칙 찾기',
    STRUCTURE: '수 구조',
    DIRECT_REASONING: '직접 계산',
    STRUCTURE_REASONING: '구조 파악',
    COMPARE: '비교',
    CHANGE_RELATION: '변화 관계',
    COMPARE_RELATION: '비교 관계',
    PART_WHOLE: '전체와 부분',
    PART_PART_WHOLE_TOTAL: '부분-전체 관계',
    MULTI_STEP_RELATION: '두 단계 관계',
    UNKNOWN_CHANGE: '변화량 찾기',
    UNKNOWN_START: '처음 값 찾기',
    UNKNOWN_FACTOR: '곱셈 요소 찾기',
    UNKNOWN_VALUE: '미지수 찾기',
    UNIT_AMOUNT: '단위량',
    UNIT_RATE: '단위비율',
    UNIT_PRICE_FIND: '단위 가격',
    UNIT_RATE_PRICE: '단위 가격',
    UNIT_CONVERSION: '단위 환산',
    MEASUREMENT: '측정',
    TIME: '시간',
    VOLUME: '부피',
    CAPACITY_CONVERSION_COMPARE: '들이 환산 비교',
    WEIGHT_DIFFERENCE: '무게 차이',
    DATA_READING: '자료 읽기',
    DATA_REASONING: '자료 추론',
    INTEGER_OPERATION: '정수 계산',
    RATIONAL_NUMBER: '유리수',
    SIGNED_NUMBER_REASONING: '부호 있는 수',
    GCF: '최대공약수',
    FACTOR_MULTIPLE: '약수와 배수',
    LINEAR_EQUATION: '일차방정식',
    EQUATION_REASONING: '방정식 세우기',
    PROPORTIONAL_GRAPH: '정비례 그래프',
    FUNCTION: '함수',
    FUNCTION_VALUE: '함숫값',
    FUNCTION_REASONING: '함수 추론',
    LINEAR_FUNCTION: '일차함수',
    SYSTEM_OF_EQUATIONS: '연립방정식',
    PYTHAGOREAN: '피타고라스 정리',
    GEOMETRY_REASONING: '기하 추론',
    QUADRATIC_EQUATION: '이차방정식',
    FACTORING: '인수분해',
    ALGEBRAIC_REASONING: '대수 추론',
    QUADRATIC_FUNCTION: '이차함수',
    FUNCTION_GRAPH: '함수 그래프',
    REMAINDER_THEOREM: '나머지정리',
    POLYNOMIAL: '다항식',
    MATRIX_OPERATION: '행렬 계산',
    ALGEBRAIC_STRUCTURE: '대수 구조',
    SET_OPERATION: '집합 연산',
    COMBINATION: '조합',
    COUNTING: '경우의 수',
    COUNTING_REASONING: '경우의 수 추론',
    LOGARITHM: '로그',
    EXPONENTIAL: '지수',
    TRIGONOMETRIC_FUNCTION: '삼각함수',
    SPECIAL_ANGLE: '특수각',
    SEQUENCE: '수열',
    ALGEBRAIC_PATTERN: '대수적 규칙',
    PATTERN_REASONING: '규칙 추론',
    DERIVATIVE: '미분',
    FUNCTION_RATE: '변화율',
    RATE_REASONING: '변화율 추론',
    INTEGRAL: '적분',
    ACCUMULATION: '누적량',
    ACCUMULATION_REASONING: '누적량 추론',
    CSAT_INTEGRATED: '수능형 통합',
    CSAT_TOP_TIER: '수능 최상위',
    PARAMETER_REASONING: '매개변수 추론',
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
    COMPOSITE_REASONING: '복합 추론',
    BASE_UNIT_IDENTIFICATION: '기준량 찾기',
    DIRECTION_REASONING: '관계 방향',
    TRANSFER: '전이 적용',
    DIRECTION_CONFUSION: '관계 방향',
    BASE_UNIT_CONFUSION: '기준량 찾기',
    OPERATION_SELECTION_ERROR: '연산 선택',
    EXPLANATION_GAP: '풀이 설명'
};

const MATH_ABILITY_RECOMMENDATIONS = {
    DIRECTION_REASONING: '화살표로 누가 누구에게 작용하는지 먼저 표시하는 문제를 풀어보세요.',
    BASE_UNIT_IDENTIFICATION: '문제에서 기준이 되는 양을 고르는 연습을 먼저 하세요.',
    TRANSFER: '같은 수학 관계를 거리, 시간, 가격처럼 다른 소재로 바꾸어 적용해 보세요.',
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

function normalCdfApprox(value) {
    const x = Number(value || 0);
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp(-x * x / 2);
    const probability = d * t * (
        0.3193815
        + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274)))
    );
    return x >= 0 ? 1 - probability : probability;
}

function getSkillLabel(skill) {
    const raw = String(skill || '').trim();
    if (!raw) return '기타 수학 사고';
    if (MATH_ABILITY_SKILL_LABELS[raw]) return MATH_ABILITY_SKILL_LABELS[raw];

    const code = raw.toUpperCase()
        .replace(/^COMPLEX_D\d+_/, '')
        .replace(/_V\d+$/, '');
    if (MATH_ABILITY_SKILL_LABELS[code]) return MATH_ABILITY_SKILL_LABELS[code];

    if (code.includes('BASE_UNIT')) return '기준량 찾기';
    if (code.includes('DIRECTION')) return '관계 방향';
    if (code.includes('RANK')) return '순위 판단';
    if (code.includes('COMPARE')) return '비교 관계';
    if (code.includes('UNKNOWN')) return '미지수 찾기';
    if (code.includes('CHANGE')) return '변화 관계';
    if (code.includes('PART_WHOLE') || code.includes('PART_PART')) return '전체와 부분';
    if (code.includes('ADD') || code.includes('ADDITION')) return '덧셈 관계';
    if (code.includes('SUB') || code.includes('TAKE') || code.includes('SUBTRACTION')) return '뺄셈 관계';
    if (code.includes('MUL') || code.includes('MULTIPLICATION') || code.includes('ARRAY')) return '곱셈 관계';
    if (code.includes('DIV') || code.includes('SHARING') || code.includes('GROUP_COUNT')) return '나눗셈 관계';
    if (code.includes('FRACTION') || code.includes('FRAC') || code.includes('DENOMINATOR')) return '분수 관계';
    if (code.includes('DECIMAL')) return '소수 관계';
    if (code.includes('RATIO') || code.includes('PROPORTION') || code.includes('PERCENT') || code.includes('SCALE') || code.includes('RATE')) return '비율과 단위량';
    if (code.includes('UNIT')) return '단위량';
    if (code.includes('AVERAGE')) return '평균';
    if (code.includes('DATA') || code.includes('GRAPH') || code.includes('PICTOGRAPH') || code.includes('PROBABILITY')) return '자료와 가능성';
    if (code.includes('TIME')) return '시간';
    if (code.includes('MEAS') || code.includes('LENGTH') || code.includes('CAPACITY') || code.includes('WEIGHT') || code.includes('VOLUME') || code.includes('MAP')) return '측정';
    if (code.includes('GCF') || code.includes('LCM') || code.includes('FACTOR') || code.includes('MULTIPLE')) return '약수와 배수';
    if (code.includes('PATTERN') || code.includes('STRUCTURE') || code.includes('EQUIVALENCE') || code.includes('PLACE_VALUE') || code.includes('NUMBER')) return '수 구조와 규칙';
    if (code.includes('TRANSFER')) return '전이 적용';
    if (code.includes('COMPOSITE') || code.includes('MULTI') || code.includes('MIXED') || code.includes('COMPLEX')) return '복합 문장제';
    if (code.includes('REMAINDER')) return '나머지 해석';
    return '기타 수학 사고';
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

function getNormBand(percentile) {
    if (percentile < 20) return '기초 보강 구간';
    if (percentile < 40) return '성장 하위 구간';
    if (percentile <= 60) return '중간 구간';
    if (percentile <= 80) return '성장 상위 구간';
    return '확장 도전 구간';
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
            attempts: 0,
            stateAttempts: state.attempts || 0,
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
        const responseAttempts = item.attempts || 0;
        const displayAttempts = responseAttempts || item.stateAttempts || 0;
        const averageResponseScore = responseAttempts && typeof item.responseTotal === 'number'
            ? item.responseTotal / responseAttempts
            : item.averageResponseScore;
        return {
            skill: item.skill,
            label: item.label,
            attempts: displayAttempts,
            mastery: roundAbility(item.mastery || averageResponseScore || 0, 2),
            correctRate: responseAttempts
                ? Math.round(((item.correctCount || 0) / responseAttempts) * 100)
                : Math.round((item.mastery || averageResponseScore || 0) * 100),
            averageHintLevel: responseAttempts ? roundAbility((item.hintTotal || 0) / responseAttempts, 1) : 0,
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

function getPlainConfidenceText(confidenceLabel, totalAttempts) {
    if (totalAttempts < 3 || confidenceLabel === '데이터 부족') return '아직 참고용으로만 보세요';
    if (confidenceLabel === '관찰 중') return '조금 더 풀면 더 정확해져요';
    if (confidenceLabel === '추정 안정화') return '대체로 방향을 볼 수 있어요';
    return '비교적 안정적으로 볼 수 있어요';
}

function getPlainQualityLevel(level) {
    if (level === '안정적') return '비교적 안정적으로 볼 수 있는 기록입니다.';
    if (level === '운영 가능') return '다음 학습을 정하는 데 참고할 수 있는 기록입니다.';
    if (level === '운영 주의') return '아직 조심해서 참고해야 하는 기록입니다.';
    if (level === '관찰 단계') return '아직 관찰 중인 기록입니다.';
    return '조금 더 기록이 쌓이면 더 정확해집니다.';
}

function simplifyParentFacingText(text) {
    return String(text || '')
        .replace(/IRT/g, '맞춤 출제 기록')
        .replace(/theta 값/g, '세부 추정값')
        .replace(/theta/g, '세부 추정값')
        .replace(/표준오차/g, '추정 오차')
        .replace(/Rasch 난이도 b 값/g, '문항 난이도 정보')
        .replace(/skill_tags와 problem_types/g, '문항 유형 정보')
        .replace(/skill별/g, '사고 유형별')
        .replace(/skill에만/g, '사고 유형에만')
        .replace(/skill을/g, '사고 유형을')
        .replace(/skill/g, '사고 유형')
        .replace(/내용타당도/g, '내용 구성')
        .replace(/응답 과정 타당도/g, '풀이 과정 기록')
        .replace(/과정타당도/g, '풀이 과정 기록')
        .replace(/타당도/g, '구성 근거');
}

function toDisplayPercent(value, fallback = 0) {
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    return Math.round(clampAbility(number, 0, 1) * 100);
}

function getHintUseLabel(averageHintLevel) {
    const level = Number(averageHintLevel || 0);
    if (level <= 0.5) return '거의 없음';
    if (level <= 1.5) return '낮음';
    if (level <= 3) return '보통';
    return '높음';
}

function buildOverview(measurement, summary, confidenceText, quality) {
    const qualityText = quality?.reliability?.level
        ? getPlainQualityLevel(quality.reliability.level)
        : confidenceText;
    const comment = summary.totalAttempts < 8
        ? `현재 ${summary.totalAttempts}문항 기록이라 관찰 단계입니다. 문제를 더 풀면 전체 수준 판단이 안정됩니다.`
        : `${measurement.band} 단계로 볼 수 있습니다. ${qualityText}`;

    return {
        title: '전체 수준',
        value: measurement.band,
        scorePercent: clampAbility(Number(measurement.abilityIndex || 0), 1, 99),
        confidenceText,
        comment: simplifyParentFacingText(comment)
    };
}

function buildNormPosition(measurement, summary) {
    const percentile = Math.max(1, Math.min(99, Number(measurement.percentile || 50)));
    const upperPercent = Math.max(1, Math.min(99, 101 - percentile));
    const lowerPercent = Math.max(1, Math.min(99, percentile));
    const value = percentile >= 45 && percentile <= 55
        ? '중간 구간'
        : percentile > 55
            ? `상위 ${upperPercent}%권`
            : `하위 ${lowerPercent}%권`;
    const comment = summary.totalAttempts < 8
        ? '누적 기록이 적어 참고 위치로만 보세요. 전국 표준화 검사 규준이 아니라 앱 내부 문항과 응답 기록 기준입니다.'
        : '전국 표준화 검사 규준이 아니라 앱 내부 문항과 누적 응답 기록으로 계산한 위치입니다.';

    return {
        title: '앱 내부 위치',
        value,
        percentile,
        band: getNormBand(percentile),
        referenceText: '앱 내부 누적 기준',
        comment
    };
}

function buildStatusCards(summary) {
    return [
        {
            title: '누적 문항',
            value: `${summary.totalAttempts}문항`,
            subtitle: summary.totalAttempts < 8 ? '관찰 시작' : '기록 누적',
            percent: clampAbility(summary.totalAttempts / 30, 0, 1)
        },
        {
            title: '정답률',
            value: `${summary.correctRate}%`,
            subtitle: summary.correctRate >= 70 ? '잘 맞히는 편' : '추가 연습 필요',
            percent: clampAbility(summary.correctRate / 100, 0, 1)
        },
        {
            title: '스스로 푼 비율',
            value: `${summary.independentSolveRate}%`,
            subtitle: summary.independentSolveRate >= 60 ? '독립 풀이 양호' : '도움 줄이기 필요',
            percent: clampAbility(summary.independentSolveRate / 100, 0, 1)
        },
        {
            title: '도움 사용',
            value: getHintUseLabel(summary.averageHintLevel),
            subtitle: `평균 힌트 ${summary.averageHintLevel}단계`,
            percent: clampAbility(1 - (summary.averageHintLevel || 0) / 7, 0, 1)
        }
    ];
}

function buildSkillRowComment(item, mode) {
    if (!item || !item.attempts) return '아직 판단할 기록이 부족합니다.';
    if (mode === 'strength') {
        if (item.correctRate >= 80 && item.averageHintLevel <= 1) {
            return `${item.label} 영역은 스스로 해결한 비율이 높아 안정적인 강점으로 볼 수 있습니다.`;
        }
        if (item.correctRate >= 60) {
            return `${item.label} 영역은 대체로 맞히지만, 힌트를 줄이며 유지 연습을 하면 좋습니다.`;
        }
        return `${item.label} 영역은 상대적으로 나은 편이지만 기록이 더 필요합니다.`;
    }

    if (item.correctRate < 50 && item.averageHintLevel >= 2) {
        return `${item.label} 영역은 오답과 힌트 사용이 함께 나타나 먼저 보완할 약점입니다.`;
    }
    if (item.correctRate < 50) {
        return `${item.label} 영역은 오답이 반복되어 문제 조건을 천천히 확인하는 연습이 필요합니다.`;
    }
    if (item.averageHintLevel >= 2) {
        return `${item.label} 영역은 맞히더라도 힌트 의존이 있어 스스로 설명하는 연습이 필요합니다.`;
    }
    return `${item.label} 영역은 정답률보다 관계를 설명하는 과정 확인이 더 필요합니다.`;
}

function buildSkillVisualRows(items, mode, limit) {
    return (items || []).slice(0, limit).map(item => ({
        skill: item.skill,
        label: item.label,
        attempts: item.attempts || 0,
        correctRate: item.correctRate || 0,
        averageHintLevel: item.averageHintLevel || 0,
        scorePercent: toDisplayPercent(item.averageResponseScore),
        comment: buildSkillRowComment(item, mode)
    }));
}

function buildParentComments(measurement, summary, strengthRows, weaknessRows, confidenceText, normPosition) {
    const comments = [
        `전체 수준은 ${measurement.band} 단계입니다. ${confidenceText}.`
    ];

    if (normPosition?.value) {
        comments.push(`현재 위치는 ${normPosition.referenceText}으로 ${normPosition.value}입니다. ${normPosition.comment}`);
    }

    if (strengthRows.length) {
        comments.push(`강점은 ${strengthRows[0].label}입니다. ${strengthRows[0].comment}`);
    } else {
        comments.push('강점은 아직 충분히 분리되지 않았습니다. 여러 유형을 조금 더 풀어보면 뚜렷해집니다.');
    }

    if (weaknessRows.length) {
        comments.push(`보완할 약점은 ${weaknessRows[0].label}입니다. ${weaknessRows[0].comment}`);
    } else {
        comments.push('반복되는 약점은 아직 뚜렷하지 않습니다. 새로운 유형으로 범위를 넓혀보세요.');
    }

    if (summary.independentSolveRate < 50 && summary.totalAttempts >= 3) {
        comments.push('스스로 푼 비율이 아직 낮습니다. 정답을 누르기 전에 기준량과 관계 방향을 말로 설명하게 해주세요.');
    }

    return comments.map(simplifyParentFacingText).slice(0, 4);
}

function buildParentSummary(measurement, summary, weakSkills, strengths, recommendations, quality) {
    const topWeak = weakSkills[0];
    const topStrength = strengths[0];
    const headline = `${measurement.band} 단계`;
    const confidenceText = getPlainConfidenceText(measurement.confidenceLabel, summary.totalAttempts);
    const coreMessage = summary.totalAttempts < 8
        ? `현재 ${summary.totalAttempts}문항 기록이라 아직 관찰 중입니다. 문제를 더 풀수록 아이에게 맞는 문제 선택이 더 좋아집니다.`
        : `최근 ${summary.totalAttempts}문항 기록을 보면 ${measurement.band} 단계로 추정됩니다. ${confidenceText}.`;
    const concernText = topWeak
        ? `${topWeak.label}에서 도움이 더 필요합니다. 이 유형은 답보다 문제의 관계를 먼저 말하게 해주세요.`
        : '아직 반복되는 약점은 뚜렷하지 않습니다. 다양한 문장제를 조금 더 풀어보세요.';
    const strengthText = topStrength
        ? `${topStrength.label} 유형은 비교적 잘 처리하고 있습니다.`
        : '강점은 기록이 조금 더 쌓인 뒤 안정적으로 볼 수 있습니다.';
    const cautionItems = [
        quality?.reliability?.level ? getPlainQualityLevel(quality.reliability.level) : null,
        ...(quality?.reliability?.warnings || []),
        ...(quality?.validity?.gaps || [])
    ].filter(Boolean).map(simplifyParentFacingText).slice(0, 3);
    const strengthRows = buildSkillVisualRows(strengths, 'strength', 3);
    const weaknessRows = buildSkillVisualRows(weakSkills, 'weakness', 4);
    const normPosition = buildNormPosition(measurement, summary);

    return {
        headline,
        coreMessage,
        concernText,
        strengthText,
        nextAction: recommendations[0] || '오늘은 관계형 문장제 5문항을 천천히 풀어보세요.',
        cautionItems,
        overview: buildOverview(measurement, summary, confidenceText, quality),
        normPosition,
        statusCards: buildStatusCards(summary),
        strengthRows,
        weaknessRows,
        parentComments: buildParentComments(measurement, summary, strengthRows, weaknessRows, confidenceText, normPosition),
        metricCards: [
            {
                title: '현재 단계',
                value: measurement.band,
                subtitle: confidenceText
            },
            {
                title: '스스로 푼 비율',
                value: `${summary.independentSolveRate}%`,
                subtitle: '힌트를 거의 쓰지 않고 맞힌 비율'
            },
            {
                title: '정답률',
                value: `${summary.correctRate}%`,
                subtitle: `${summary.totalAttempts}문항 기록 기준`
            }
        ]
    };
}

function buildQualityRecommendations(quality) {
    if (!quality?.minimumNextActions) return [];
    return quality.minimumNextActions.map(action => `기록 해석: ${simplifyParentFacingText(action)}`);
}

function buildParentNarrative(measurement, summary, weakSkills, quality) {
    if (!summary.totalAttempts) {
        return '아직 IRT 풀이 기록이 없어 수리능력 추정을 시작하지 못했습니다. 먼저 관계 사고가 필요한 초등 문장제를 몇 문항 풀어보세요.';
    }

    const weakText = weakSkills.length
        ? `보완이 필요한 영역은 ${weakSkills.map(item => item.label).join(', ')}입니다.`
        : '뚜렷하게 반복되는 약점은 아직 관찰되지 않았습니다.';
    const qualityText = quality
        ? getPlainQualityLevel(quality.reliability.level)
        : '';

    return `현재 수리능력은 ${measurement.band} 단계로 추정됩니다. ${getPlainConfidenceText(measurement.confidenceLabel, summary.totalAttempts)}. ${qualityText} ${weakText}`;
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
        percentile: Math.max(1, Math.min(99, Math.round(normalCdfApprox(theta) * 100))),
        band: getAbilityBand(theta),
        confidenceLabel: getConfidenceLabel(summary.totalAttempts || irtState.attemptCount || 0, standardError)
    };
    const quality = window.MeasurementQuality?.evaluate
        ? window.MeasurementQuality.evaluate({ attempts, irtState, itemBank })
        : null;
    const learningPolicy = window.IrtLearningPolicy?.summarize
        ? window.IrtLearningPolicy.summarize(irtState)
        : null;
    const recommendations = [
        ...buildRecommendations(weakSkills, summary),
        ...buildQualityRecommendations(quality)
    ];
    const uniqueRecommendations = Array.from(new Set(recommendations)).slice(0, 5);

    return {
        generatedAt: new Date().toISOString(),
        measurement,
        summary,
        skillEvidence,
        weakSkills,
        strengths,
        quality,
        learningPolicy,
        recommendations: uniqueRecommendations,
        parentSummary: buildParentSummary(measurement, summary, weakSkills, strengths, uniqueRecommendations, quality),
        parentNarrative: buildParentNarrative(measurement, summary, weakSkills, quality)
    };
}

window.MathAbilityReport = {
    buildParentReport,
    getSkillLabel
};

globalThis.MathAbilityReport = window.MathAbilityReport;
