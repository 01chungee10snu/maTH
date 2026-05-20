/* =========================================================================
   IRT 풀이 로그 큐

   아동 데이터 보호 정책과 Supabase RLS가 확정되기 전까지는 local-first로
   기록하고, 나중에 learning_attempts 테이블로 옮길 수 있는 형태를 유지합니다.
   ========================================================================= */

const IRT_ATTEMPT_LOG_KEY = 'taehee-irt-attempt-log';
const IRT_ATTEMPT_LOG_LIMIT = 500;

function safeJsonParseIrtLog(raw, fallback) {
    if (!raw) return fallback;
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : fallback;
    } catch (_) {
        return fallback;
    }
}

function normalizeIrtLogNumber(value, fallback = null) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
}

function loadIrtAttempts() {
    return safeJsonParseIrtLog(localStorage.getItem(IRT_ATTEMPT_LOG_KEY), []);
}

function saveIrtAttempts(attempts) {
    const compact = (Array.isArray(attempts) ? attempts : []).slice(-IRT_ATTEMPT_LOG_LIMIT);
    localStorage.setItem(IRT_ATTEMPT_LOG_KEY, JSON.stringify(compact));
    return compact;
}

function createIrtAttemptRecord(input = {}) {
    const problem = input.problem || {};
    const result = input.result || {};
    const stateBefore = input.stateBefore || {};
    const stateAfter = input.stateAfter || {};
    const skillTags = Array.from(new Set([
        ...(problem.skill_tags || []),
        ...(problem.problem_types || [])
    ].filter(Boolean)));
    const responseScore = window.IrtEngine?.responseScore
        ? window.IrtEngine.responseScore(result)
        : (result.correct ? 1 : 0);

    return {
        local_id: `irt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        learner_id: input.learnerId || 'local-child',
        item_id: problem.problem_id || problem.problemKey || 'unknown',
        topic: stateAfter.topic || stateBefore.topic || 'relationship_math',
        problem_types: problem.problem_types || [],
        skill_tags: skillTags,
        selected_answer: input.selectedAnswer ?? null,
        correct: !!result.correct,
        hint_level: normalizeIrtLogNumber(result.hintLevel, 0),
        step_success_rate: normalizeIrtLogNumber(result.stepSuccessRate, null),
        response_score: normalizeIrtLogNumber(responseScore, 0),
        theta_before: normalizeIrtLogNumber(stateBefore.theta, 0),
        theta_after: normalizeIrtLogNumber(stateAfter.theta, 0),
        standard_error_after: normalizeIrtLogNumber(stateAfter.standardError, null),
        error_type: input.errorType || null,
        elapsed_seconds: Math.max(0, normalizeIrtLogNumber(input.elapsedSeconds, 0)),
        sync_status: 'pending',
        created_at: new Date().toISOString()
    };
}

function appendIrtAttempt(record) {
    if (!record || !record.local_id) return null;
    const attempts = loadIrtAttempts();
    attempts.push(record);
    saveIrtAttempts(attempts);
    return record;
}

function getPendingIrtAttempts() {
    return loadIrtAttempts().filter(record => record.sync_status === 'pending');
}

function markIrtAttemptsSynced(localIds = []) {
    const idSet = new Set(localIds);
    if (!idSet.size) return loadIrtAttempts();
    const syncedAt = new Date().toISOString();
    return saveIrtAttempts(loadIrtAttempts().map(record => (
        idSet.has(record.local_id)
            ? { ...record, sync_status: 'synced', synced_at: syncedAt }
            : record
    )));
}

function summarizeIrtAttempts() {
    const attempts = loadIrtAttempts();
    const total = attempts.length;
    const pending = attempts.filter(record => record.sync_status === 'pending').length;
    const correct = attempts.filter(record => record.correct).length;
    const averageHintLevel = total
        ? attempts.reduce((sum, record) => sum + (record.hint_level || 0), 0) / total
        : 0;

    return {
        total,
        pending,
        correctRate: total ? Math.round((correct / total) * 100) : 0,
        averageHintLevel: Math.round(averageHintLevel * 10) / 10
    };
}

window.IrtLog = {
    createAttemptRecord: createIrtAttemptRecord,
    appendAttempt: appendIrtAttempt,
    loadAttempts: loadIrtAttempts,
    saveAttempts: saveIrtAttempts,
    getPendingAttempts: getPendingIrtAttempts,
    markAttemptsSynced: markIrtAttemptsSynced,
    summarize: summarizeIrtAttempts
};

globalThis.IrtLog = window.IrtLog;
