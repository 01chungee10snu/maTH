/* =========================================================================
   IRT Supabase 동기화

   자동 업로드는 하지 않습니다. 인증된 사용자와 RLS 정책이 준비된 경우에만
   명시적으로 pending 로그를 전송할 수 있는 얇은 동기화 레이어입니다.
   ========================================================================= */

function mapIrtAttemptToSupabaseRow(record, learnerId) {
    return {
        learner_id: learnerId,
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

async function getAuthenticatedLearnerId(client) {
    if (!client?.auth || typeof client.auth.getUser !== 'function') return null;
    const { data, error } = await client.auth.getUser();
    if (error || !data?.user?.id) return null;
    return data.user.id;
}

async function syncPendingIrtAttempts() {
    if (!window.MathAppSupabase?.getClient || !window.IrtLog) {
        return { ok: false, reason: 'sync_unavailable', synced: 0 };
    }

    const client = window.MathAppSupabase.getClient();
    const learnerId = await getAuthenticatedLearnerId(client);
    if (!learnerId) {
        return { ok: false, reason: 'auth_required', synced: 0 };
    }

    const pending = window.IrtLog.getPendingAttempts();
    if (!pending.length) {
        return { ok: true, synced: 0 };
    }

    const rows = pending.map(record => mapIrtAttemptToSupabaseRow(record, learnerId));
    const { error } = await client.from('learning_attempts').insert(rows);
    if (error) {
        return { ok: false, reason: 'insert_failed', error, synced: 0 };
    }

    window.IrtLog.markAttemptsSynced(pending.map(record => record.local_id));
    return { ok: true, synced: pending.length };
}

window.IrtSync = {
    mapAttemptToRow: mapIrtAttemptToSupabaseRow,
    syncPendingAttempts: syncPendingIrtAttempts
};

globalThis.IrtSync = window.IrtSync;
