/* =========================================================================
   Supabase 문항 난이도 보정 동기화

   서버에는 개인 풀이 로그가 아니라 문항별 집계 통계만 요청합니다. RPC가
   아직 배포되지 않았거나 네트워크가 실패하면 캐시/로컬 보정으로 유지합니다.
   ========================================================================= */

const ITEM_CALIBRATION_STATS_CACHE_KEY = 'math-item-calibration-stats:v1';
const ITEM_CALIBRATION_RPC_NAME = 'get_item_calibration_stats';
const ITEM_CALIBRATION_REMOTE_MIN_ATTEMPTS = 20;
const ITEM_CALIBRATION_REMOTE_MAX_ITEMS = 5000;
const ITEM_CALIBRATION_REMOTE_REFRESH_MS = 10 * 60 * 1000;

let ITEM_CALIBRATION_SYNC_IN_FLIGHT = null;
let ITEM_CALIBRATION_SYNC_LAST_REQUEST_AT = 0;
let ITEM_CALIBRATION_SYNC_STATUS = {
    state: 'idle',
    source: null,
    lastResult: null,
    lastError: null,
    updatedAt: null
};

function setItemCalibrationSyncStatus(patch = {}) {
    ITEM_CALIBRATION_SYNC_STATUS = {
        ...ITEM_CALIBRATION_SYNC_STATUS,
        ...patch,
        updatedAt: new Date().toISOString()
    };
    return ITEM_CALIBRATION_SYNC_STATUS;
}

function getItemCalibrationSyncStatus() {
    return { ...ITEM_CALIBRATION_SYNC_STATUS };
}

function normalizeRemoteCalibrationRows(rows = []) {
    return (Array.isArray(rows) ? rows : [])
        .filter(row => row && (row.item_id || row.itemId))
        .map(row => ({
            item_id: row.item_id || row.itemId,
            attempt_count: Number(row.attempt_count ?? row.attemptCount ?? 0),
            average_theta_before: Number(row.average_theta_before ?? row.averageThetaBefore ?? row.avg_theta_before ?? 0),
            average_response_score: Number(row.average_response_score ?? row.averageResponseScore ?? row.avg_response_score ?? row.correct_rate ?? 0),
            correct_rate: Number(row.correct_rate ?? row.correctRate ?? row.average_response_score ?? 0),
            last_attempt_at: row.last_attempt_at || row.lastAttemptAt || null
        }))
        .filter(row => row.item_id && Number.isFinite(row.attempt_count));
}

function saveItemCalibrationStatsCache(stats) {
    if (!window.localStorage) return null;
    const payload = {
        savedAt: new Date().toISOString(),
        stats: normalizeRemoteCalibrationRows(stats)
    };
    localStorage.setItem(ITEM_CALIBRATION_STATS_CACHE_KEY, JSON.stringify(payload));
    return payload;
}

function loadItemCalibrationStatsCache() {
    if (!window.localStorage) return null;
    const raw = localStorage.getItem(ITEM_CALIBRATION_STATS_CACHE_KEY);
    if (!raw) return null;
    try {
        const parsed = JSON.parse(raw);
        const stats = normalizeRemoteCalibrationRows(parsed.stats || []);
        if (!stats.length) return null;
        return {
            savedAt: parsed.savedAt || null,
            stats
        };
    } catch (_) {
        return null;
    }
}

async function fetchRemoteCalibrationStats(options = {}) {
    const client = window.MathAppSupabase?.getClient?.();
    if (!client || typeof client.rpc !== 'function') {
        return { ok: false, reason: 'supabase_rpc_unavailable', stats: [] };
    }

    const args = {
        min_attempts: Math.max(1, Number(options.minAttempts || ITEM_CALIBRATION_REMOTE_MIN_ATTEMPTS)),
        max_items: Math.max(1, Number(options.maxItems || ITEM_CALIBRATION_REMOTE_MAX_ITEMS))
    };
    const { data, error } = await client.rpc(options.rpcName || ITEM_CALIBRATION_RPC_NAME, args);
    if (error) {
        return { ok: false, reason: 'rpc_failed', error, stats: [] };
    }

    return {
        ok: true,
        source: 'remote',
        stats: normalizeRemoteCalibrationRows(data || [])
    };
}

function applyRemoteCalibrationStats(itemBank = [], stats = [], options = {}) {
    if (!window.ItemCalibration?.applyStatsToBank) {
        return { ok: false, reason: 'item_calibration_unavailable' };
    }

    const summary = window.ItemCalibration.applyStatsToBank(itemBank, stats, {
        minAttempts: options.minAttempts || ITEM_CALIBRATION_REMOTE_MIN_ATTEMPTS,
        fullWeightAttempts: options.fullWeightAttempts || 80,
        maxWeight: options.maxWeight || 0.85,
        source: 'remote'
    });
    return { ok: true, source: 'remote', summary };
}

async function refreshRemoteItemCalibration(itemBank = [], options = {}) {
    if (ITEM_CALIBRATION_SYNC_IN_FLIGHT) return ITEM_CALIBRATION_SYNC_IN_FLIGHT;

    const now = Date.now();
    const throttleMs = Number(options.throttleMs ?? ITEM_CALIBRATION_REMOTE_REFRESH_MS);
    if (!options.force && throttleMs > 0 && now - ITEM_CALIBRATION_SYNC_LAST_REQUEST_AT < throttleMs) {
        const result = { ok: false, reason: 'throttled', status: getItemCalibrationSyncStatus() };
        return result;
    }
    ITEM_CALIBRATION_SYNC_LAST_REQUEST_AT = now;

    ITEM_CALIBRATION_SYNC_IN_FLIGHT = (async () => {
        setItemCalibrationSyncStatus({ state: 'running', lastError: null });
        const remote = await fetchRemoteCalibrationStats(options);
        if (remote.ok) {
            saveItemCalibrationStatsCache(remote.stats);
            const applied = applyRemoteCalibrationStats(itemBank, remote.stats, options);
            const result = { ...applied, fetchedCount: remote.stats.length };
            setItemCalibrationSyncStatus({
                state: applied.ok ? 'applied' : 'error',
                source: 'remote',
                lastResult: result,
                lastError: applied.ok ? null : applied
            });
            return result;
        }

        const cached = options.allowCacheFallback !== false ? loadItemCalibrationStatsCache() : null;
        if (cached?.stats?.length) {
            const applied = applyRemoteCalibrationStats(itemBank, cached.stats, options);
            const result = { ...applied, source: 'cache', fetchedCount: cached.stats.length, remoteError: remote };
            setItemCalibrationSyncStatus({
                state: applied.ok ? 'cache_applied' : 'error',
                source: 'cache',
                lastResult: result,
                lastError: remote.error || remote
            });
            return result;
        }

        const result = { ok: false, source: 'local', reason: remote.reason || 'remote_unavailable', error: remote.error || null };
        setItemCalibrationSyncStatus({
            state: 'fallback_local',
            source: 'local',
            lastResult: result,
            lastError: remote.error || remote
        });
        return result;
    })().catch(error => {
        const result = { ok: false, source: 'local', reason: 'remote_exception', error };
        setItemCalibrationSyncStatus({
            state: 'error',
            source: 'local',
            lastResult: result,
            lastError: error
        });
        return result;
    }).finally(() => {
        ITEM_CALIBRATION_SYNC_IN_FLIGHT = null;
    });

    return ITEM_CALIBRATION_SYNC_IN_FLIGHT;
}

window.ItemCalibrationSync = {
    refresh: refreshRemoteItemCalibration,
    fetchStats: fetchRemoteCalibrationStats,
    applyStats: applyRemoteCalibrationStats,
    loadCache: loadItemCalibrationStatsCache,
    saveCache: saveItemCalibrationStatsCache,
    getStatus: getItemCalibrationSyncStatus,
    cacheKey: ITEM_CALIBRATION_STATS_CACHE_KEY,
    rpcName: ITEM_CALIBRATION_RPC_NAME
};

globalThis.ItemCalibrationSync = window.ItemCalibrationSync;
