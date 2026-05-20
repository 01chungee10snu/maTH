/* =========================================================================
   문장제 관계 사고 상태, 평가, 로그
   ========================================================================= */

const RELATION_COACH_LOG_KEY = 'taehee-relation-coach-log';

function getRelationCoachLogKey() {
    return window.LearnerProfiles?.getRelationLogKey?.()
        || globalThis.LearnerProfiles?.getRelationLogKey?.()
        || RELATION_COACH_LOG_KEY;
}

function createRelationCoachState(problem) {
    return {
        problemId: problem.problem_id,
        stepIndex: 0,
        selections: {},
        feedback: '',
        hintLevel: 0,
        errors: [],
        startedAt: Date.now()
    };
}

function normalizeCoachValue(value) {
    if (value && typeof value === 'object' && typeof value.value !== 'undefined') {
        return String(value.value).trim();
    }
    return String(value ?? '').trim();
}

function getRelationCoachSteps(problem) {
    if (!problem || !Array.isArray(problem.coachSteps)) return [];
    const streak = getRelationCoachSuccessStreak(problem);

    if (streak >= 5) {
        return problem.coachSteps.filter(step => ['base', 'direction', 'operation'].includes(step.id));
    }
    if (streak >= 3) {
        return problem.coachSteps.filter(step => step.id !== 'visualization');
    }
    if (streak >= 2) {
        return problem.coachSteps.filter(step => step.id !== 'explanation');
    }

    return problem.coachSteps;
}

function getCurrentRelationCoachStep(problem, state) {
    const steps = getRelationCoachSteps(problem);
    return steps[state?.stepIndex || 0] || null;
}

function evaluateRelationCoachStep(problem, step, selectedValue) {
    const selected = normalizeCoachValue(selectedValue);
    const answer = normalizeCoachValue(step?.answer);
    const correct = selected === answer;

    return {
        correct,
        selected,
        answer,
        errorType: correct ? null : (step?.errorType || inferRelationCoachError(problem, step)),
        feedback: correct ? '좋아요. 다음 단계로 가볼게요.' : '다시 생각해볼까요? 기준과 방향을 먼저 확인해요.'
    };
}

function inferRelationCoachError(problem, step) {
    if (step?.id === 'base') return 'BASE_UNIT_CONFUSION';
    if (step?.id === 'direction') return 'DIRECTION_CONFUSION';
    if (step?.id === 'operation') return 'OPERATION_SELECTION_ERROR';
    if (step?.id === 'explanation') return 'EXPLANATION_GAP';
    if (problem?.problem_types?.includes('FRACTION_RELATION')) return 'FRACTION_SIZE_CONFUSION';
    if (problem?.question_type?.includes('RANK')) return 'RANKING_MISREAD';
    return 'NUMBER_SIZE_BIAS';
}

function loadRelationCoachLog() {
    if (typeof localStorage === 'undefined') return [];
    try {
        const raw = localStorage.getItem(getRelationCoachLogKey());
        return raw ? JSON.parse(raw) : [];
    } catch (_) {
        return [];
    }
}

function saveRelationCoachLog(log) {
    if (typeof localStorage === 'undefined') return;
    try {
        localStorage.setItem(getRelationCoachLogKey(), JSON.stringify(log.slice(-200)));
    } catch (_) {
        // 로컬 저장소가 막힌 환경에서는 게임 진행을 우선합니다.
    }
}

function getRelationCoachSuccessStreak(problem) {
    const types = problem?.problem_types || [];
    const log = loadRelationCoachLog()
        .filter(item => (item.problem_types || []).some(type => types.includes(type)));

    let streak = 0;
    for (let i = log.length - 1; i >= 0; i--) {
        if (log[i].answer_correct && log[i].explanation_success && (log[i].hint_level || 0) <= 2) {
            streak += 1;
        } else {
            break;
        }
    }
    return streak;
}

function appendRelationCoachAttempt(problem, state, selectedAnswer, answerCorrect) {
    const elapsed = Math.max(0, Math.round((Date.now() - (state?.startedAt || Date.now())) / 1000));
    const explanationSuccess = !state?.errors?.includes('EXPLANATION_GAP');
    const log = loadRelationCoachLog();

    log.push({
        learner_id: window.LearnerProfiles?.getActiveId?.()
            || globalThis.LearnerProfiles?.getActiveId?.()
            || 'local-child',
        problem_id: problem.problem_id,
        problem_types: problem.problem_types || [],
        attempt: log.filter(item => item.problem_id === problem.problem_id).length + 1,
        base_unit_correct: !state?.errors?.includes('BASE_UNIT_CONFUSION'),
        direction_mapping_correct: !state?.errors?.includes('DIRECTION_CONFUSION'),
        visualization_used: true,
        hint_level: state?.hintLevel || 0,
        selected_answer: selectedAnswer,
        answer_correct: !!answerCorrect,
        error_type: answerCorrect ? null : inferRelationCoachError(problem, null),
        explanation_success: explanationSuccess,
        support_fading_streak: getRelationCoachSuccessStreak(problem),
        time_spent_seconds: elapsed
    });

    saveRelationCoachLog(log);
}

function summarizeRelationCoachLog() {
    const log = loadRelationCoachLog();
    const total = log.length || 1;
    const rate = key => Math.round((log.filter(item => item[key]).length / total) * 100);
    const hintAverage = log.length
        ? Math.round((log.reduce((sum, item) => sum + (item.hint_level || 0), 0) / log.length) * 10) / 10
        : 0;

    return {
        attempts: log.length,
        baseUnitAccuracy: rate('base_unit_correct'),
        directionAccuracy: rate('direction_mapping_correct'),
        explanationSuccess: rate('explanation_success'),
        unsupportedSolveRate: Math.round((log.filter(item => (item.hint_level || 0) <= 1 && item.answer_correct).length / total) * 100),
        averageHintLevel: hintAverage
    };
}

window.RelationCoach = {
    createState: createRelationCoachState,
    getSteps: getRelationCoachSteps,
    getCurrentStep: getCurrentRelationCoachStep,
    evaluateStep: evaluateRelationCoachStep,
    appendAttempt: appendRelationCoachAttempt,
    summarize: summarizeRelationCoachLog,
    getSuccessStreak: getRelationCoachSuccessStreak,
    getLogKey: getRelationCoachLogKey,
    logKey: RELATION_COACH_LOG_KEY
};

globalThis.RelationCoach = window.RelationCoach;
