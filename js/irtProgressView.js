/* =========================================================================
   IRT 진행 표시 헬퍼

   실제 적응형 출제는 theta와 문항 난이도 b로 움직입니다. 이 헬퍼는 예전
   단계(difficulty) 표시가 아니라 현재 IRT 추정과 선택 문항 난이도를
   화면에서 확인할 수 있는 짧은 문구로 바꿉니다.
   ========================================================================= */

function toIrtDisplayNumber(value, digits = 2) {
    const number = Number(value);
    if (!Number.isFinite(number)) return null;
    return number.toFixed(digits);
}

function getIrtDisplayDifficulty(problem) {
    if (window.IrtEngine?.getDifficulty) {
        const fromEngine = Number(window.IrtEngine.getDifficulty(problem));
        if (Number.isFinite(fromEngine)) return fromEngine;
    }
    const b = Number(problem?.irt?.b);
    if (Number.isFinite(b)) return b;
    const level = Number(problem?.level);
    if (Number.isFinite(level)) return Math.max(-3, Math.min(3, (level - 5) / 3));
    return null;
}

function getIrtDisplayLevel(problem) {
    const explicitLevel = Number(problem?.level);
    if (Number.isFinite(explicitLevel)) {
        return Math.max(1, Math.min(12, Math.round(explicitLevel)));
    }

    const b = getIrtDisplayDifficulty(problem);
    if (Number.isFinite(b)) {
        return Math.max(1, Math.min(12, Math.round(b * 3 + 6)));
    }

    return null;
}

function getIrtPhaseLabel(phase) {
    if (phase === 'diagnostic') return '진단';
    if (phase === 'targeted_practice') return '약점보강';
    if (phase === 'mastery_check') return '숙달확인';
    if (phase === 'adaptive_practice') return '맞춤연습';
    return '맞춤';
}

function buildIrtHeaderStatus(input = {}) {
    const problem = input.problem || {};
    const irtState = input.irtState || {};
    if (!problem?.irt || !irtState) return null;

    const itemLevel = getIrtDisplayLevel(problem);
    const itemDifficulty = getIrtDisplayDifficulty(problem);
    const theta = toIrtDisplayNumber(irtState.theta ?? 0, 2) || '0.00';
    const standardError = toIrtDisplayNumber(irtState.standardError, 2);
    const attemptCount = Number(irtState.attemptCount || 0);
    const phase = getIrtPhaseLabel(problem.selection_policy?.phase);
    const levelLabel = itemLevel ? `L${itemLevel}` : `${input.fallbackDifficulty || 1}단`;
    const difficultyLabel = Number.isFinite(itemDifficulty)
        ? `b ${toIrtDisplayNumber(itemDifficulty, 2)}`
        : 'b 준비중';
    const seLabel = standardError ? `SE ${standardError}` : 'SE 준비중';

    return {
        badge: levelLabel,
        title: 'IRT 맞춤 문제',
        detail: `IRT ${attemptCount}문항 · θ ${theta} · ${difficultyLabel} · ${phase}`,
        reportDetail: `IRT ${attemptCount}문항 · θ ${theta} · ${seLabel} · ${difficultyLabel}`,
        itemLevel,
        itemDifficulty,
        theta: Number(irtState.theta || 0),
        standardError: Number(irtState.standardError || 0),
        attemptCount,
        phase
    };
}

function buildLearnerHeaderStatus(input = {}) {
    const learnerName = input.learnerName || '나';
    const hasAdaptiveItem = Boolean(input.problem?.irt || input.irtState?.attemptCount);
    if (!hasAdaptiveItem) {
        return {
            title: input.fallbackTitle || `${learnerName}의 수학 문제`,
            badge: input.fallbackBadge || '',
            detail: null
        };
    }

    return {
        title: `${learnerName}의 맞춤 문제`,
        badge: '맞춤',
        detail: null
    };
}

function buildLearnerRoutineSummary(input = {}) {
    const attempts = Number(input.irtState?.attemptCount || 0);
    const syncText = input.syncText || '서버 동기화 준비됨';
    const progressText = attempts > 0
        ? `지금까지 ${attempts}문항을 풀었어요 · 오늘도 맞춤 문제로 이어가요`
        : '아직 푼 문제가 없어요 · 첫 문제부터 시작해요';

    return {
        title: '매일 풀수록 더 맞춰지는 수학 루틴',
        progressText,
        syncText,
        startSubtitle: '내 수준에 맞춰 출제돼요'
    };
}

function createIrtProgressUpdate(input = {}) {
    const problem = input.problem || {};
    const stateBefore = input.stateBefore || {};
    const stateAfter = input.stateAfter || {};
    const result = input.result || {};
    const responseScore = window.IrtEngine?.responseScore
        ? window.IrtEngine.responseScore(result)
        : (result.correct ? 1 : 0);

    return {
        thetaBefore: Number(stateBefore.theta || 0),
        thetaAfter: Number(stateAfter.theta || 0),
        standardErrorAfter: Number(stateAfter.standardError || 0),
        attemptCount: Number(stateAfter.attemptCount || 0),
        itemLevel: getIrtDisplayLevel(problem),
        itemDifficulty: getIrtDisplayDifficulty(problem),
        responseScore: Number(responseScore || 0),
        learningPhase: problem.selection_policy?.phase || null
    };
}

function buildIrtUpdateStatus(update) {
    if (!update) return null;
    const before = toIrtDisplayNumber(update.thetaBefore, 2) || '0.00';
    const after = toIrtDisplayNumber(update.thetaAfter, 2) || '0.00';
    const b = toIrtDisplayNumber(update.itemDifficulty, 2);
    const level = update.itemLevel ? `L${update.itemLevel}` : '레벨 확인중';
    const count = Number(update.attemptCount || 0);
    const phase = getIrtPhaseLabel(update.learningPhase);

    return {
        summary: `IRT 갱신: θ ${before} → ${after} · 누적 ${count}문항`,
        detail: `${level}${b ? ` · b ${b}` : ''} · ${phase}`
    };
}

window.IrtProgressView = {
    buildHeaderStatus: buildIrtHeaderStatus,
    buildLearnerHeaderStatus,
    buildLearnerRoutineSummary,
    createUpdate: createIrtProgressUpdate,
    buildUpdateStatus: buildIrtUpdateStatus,
    getItemLevel: getIrtDisplayLevel,
    getItemDifficulty: getIrtDisplayDifficulty
};

globalThis.IrtProgressView = window.IrtProgressView;
