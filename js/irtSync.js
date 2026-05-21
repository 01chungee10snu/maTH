/* =========================================================================
   IRT Supabase 동기화

   학습은 local-first로 진행하고, Supabase 인증 세션이 있거나 익명 인증이
   가능한 경우 pending 로그를 백그라운드로 전송합니다. 실패한 로그는
   pending 상태로 남겨 다음 동기화 때 다시 시도합니다.
   ========================================================================= */

let IRT_SYNC_IN_FLIGHT = null;
let IRT_SYNC_REQUESTED = false;
let IRT_SYNC_STATUS = {
    state: 'idle',
    pending: 0,
    lastResult: null,
    lastError: null,
    updatedAt: null
};
let IRT_AUTH_FAILURE_REASON = null;

function mapIrtAttemptToSupabaseRow(record, learnerId) {
    return {
        learner_id: learnerId,
        local_profile_id: record.local_profile_id || record.learner_id || 'local-child',
        local_attempt_id: record.local_id,
        item_id: record.item_id,
        topic: record.topic,
        problem_types: record.problem_types || [],
        skill_tags: record.skill_tags || [],
        selected_answer: record.selected_answer,
        correct: !!record.correct,
        hint_level: record.hint_level || 0,
        step_success_rate: record.step_success_rate,
        response_score: record.response_score,
        theta_before: record.theta_before,
        theta_after: record.theta_after,
        standard_error_after: record.standard_error_after,
        error_type: record.error_type,
        elapsed_seconds: record.elapsed_seconds,
        created_at: record.created_at
    };
}

function getIrtSyncConfig() {
    return window.MathAppSupabase?.getConfig?.() || {};
}

function setIrtSyncStatus(patch = {}) {
    IRT_SYNC_STATUS = {
        ...IRT_SYNC_STATUS,
        ...patch,
        pending: window.IrtLog?.getPendingAttempts ? window.IrtLog.getPendingAttempts().length : 0,
        updatedAt: new Date().toISOString()
    };
    return IRT_SYNC_STATUS;
}

function getIrtSyncStatus() {
    return {
        ...IRT_SYNC_STATUS,
        pending: window.IrtLog?.getPendingAttempts ? window.IrtLog.getPendingAttempts().length : IRT_SYNC_STATUS.pending
    };
}

async function getAuthenticatedLearnerId(client, options = {}) {
    IRT_AUTH_FAILURE_REASON = null;
    if (!client?.auth || typeof client.auth.getUser !== 'function') return null;
    const { data, error } = await client.auth.getUser();
    if (!error && data?.user?.id) return data.user.id;

    const allowAnonymous = options.allowAnonymous === true;
    if (!allowAnonymous || typeof client.auth.signInAnonymously !== 'function') return null;

    const signIn = await client.auth.signInAnonymously();
    if (signIn.error || !signIn.data?.user?.id) {
        IRT_AUTH_FAILURE_REASON = 'anonymous_auth_unavailable';
        setIrtSyncStatus({
            state: 'blocked',
            lastResult: {
                ok: false,
                reason: 'anonymous_auth_unavailable',
                synced: 0
            },
            lastError: signIn.error || null
        });
        return null;
    }

    return signIn.data.user.id;
}

async function syncPendingIrtAttempts(options = {}) {
    if (!window.MathAppSupabase?.getClient || !window.IrtLog) {
        const result = { ok: false, reason: 'sync_unavailable', synced: 0 };
        setIrtSyncStatus({ state: 'blocked', lastResult: result, lastError: null });
        return result;
    }

    const config = getIrtSyncConfig();
    if (config.syncLearningAttempts === false && options.force !== true) {
        const result = { ok: false, reason: 'sync_disabled', synced: 0 };
        setIrtSyncStatus({ state: 'disabled', lastResult: result, lastError: null });
        return result;
    }

    setIrtSyncStatus({ state: 'running', lastError: null });
    const client = window.MathAppSupabase.getClient();
    const learnerId = await getAuthenticatedLearnerId(client, {
        allowAnonymous: options.allowAnonymous ?? config.autoAnonymousAuth === true
    });
    if (!learnerId) {
        const result = { ok: false, reason: IRT_AUTH_FAILURE_REASON || 'auth_required', synced: 0 };
        setIrtSyncStatus({ state: 'blocked', lastResult: result, lastError: null });
        return result;
    }

    const pending = window.IrtLog.getPendingAttempts();
    if (!pending.length) {
        const result = { ok: true, synced: 0 };
        setIrtSyncStatus({ state: 'idle', lastResult: result, lastError: null });
        return result;
    }

    const rows = pending.map(record => mapIrtAttemptToSupabaseRow(record, learnerId));
    const { error } = await client.from('learning_attempts').insert(rows);
    if (error) {
        const result = { ok: false, reason: 'insert_failed', error, synced: 0 };
        setIrtSyncStatus({ state: 'error', lastResult: result, lastError: error });
        return result;
    }

    window.IrtLog.markAttemptsSynced(pending.map(record => record.local_id));
    const result = { ok: true, synced: pending.length };
    setIrtSyncStatus({ state: 'idle', lastResult: result, lastError: null });
    return result;
}

function requestPendingIrtSync(reason = 'auto') {
    if (IRT_SYNC_IN_FLIGHT) {
        IRT_SYNC_REQUESTED = true;
        return IRT_SYNC_IN_FLIGHT;
    }

    IRT_SYNC_IN_FLIGHT = (async () => {
        let result = null;
        do {
            IRT_SYNC_REQUESTED = false;
            result = await syncPendingIrtAttempts({ reason });
        } while (IRT_SYNC_REQUESTED);
        return result;
    })().catch(error => {
        const result = { ok: false, reason: 'sync_exception', error, synced: 0 };
        setIrtSyncStatus({ state: 'error', lastResult: result, lastError: error });
        return result;
    }).finally(() => {
        IRT_SYNC_IN_FLIGHT = null;
    });

    return IRT_SYNC_IN_FLIGHT;
}

window.IrtSync = {
    mapAttemptToRow: mapIrtAttemptToSupabaseRow,
    getStatus: getIrtSyncStatus,
    requestSync: requestPendingIrtSync,
    syncPendingAttempts: syncPendingIrtAttempts
};

globalThis.IrtSync = window.IrtSync;
