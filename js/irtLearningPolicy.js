/* =========================================================================
   IRT 학습 촉진 정책

   단순히 theta와 가까운 문항을 고르는 것이 아니라,
   진단, 약점 보강, 적응 연습, 숙달 확인 목적에 맞춰 다음 문항을 고릅니다.
   ========================================================================= */

const IRT_POLICY_MIN_DIAGNOSTIC_ATTEMPTS = 12;
const IRT_POLICY_WEAK_MASTERY = 0.65;
const IRT_POLICY_ERROR_TAGS = new Set([
    'NUMBER_SIZE_BIAS',
    'DIRECTION_CONFUSION',
    'BASE_UNIT_CONFUSION',
    'FRACTION_SIZE_CONFUSION',
    'OPERATION_SELECTION_ERROR',
    'RANKING_MISREAD',
    'EXPLANATION_GAP',
    'TRANSFER_FAILURE'
]);

function clampPolicy(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function roundPolicy(value, digits = 3) {
    const factor = 10 ** digits;
    return Math.round(Number(value || 0) * factor) / factor;
}

function getPolicyDifficulty(item) {
    if (window.IrtEngine?.getDifficulty) return window.IrtEngine.getDifficulty(item);
    const b = Number(item?.irt?.b);
    if (Number.isFinite(b)) return b;
    return clampPolicy((Number(item?.level || 6) - 6) / 2, -3, 3);
}

function getPolicyProbability(theta, item) {
    if (window.IrtEngine?.probability) return window.IrtEngine.probability(theta, getPolicyDifficulty(item));
    const x = clampPolicy(theta - getPolicyDifficulty(item), -6, 6);
    return 1 / (1 + Math.exp(-x));
}

function getPolicyInformation(theta, item) {
    if (window.IrtEngine?.information) return window.IrtEngine.information(theta, item);
    const p = getPolicyProbability(theta, item);
    return p * (1 - p);
}

function getPolicySkills(item) {
    const skillTags = Array.isArray(item?.skill_tags)
        ? item.skill_tags.filter(skill => skill && !IRT_POLICY_ERROR_TAGS.has(skill))
        : [];
    if (skillTags.length) return Array.from(new Set(skillTags));

    const problemTypes = Array.isArray(item?.problem_types)
        ? item.problem_types.filter(skill => skill && !IRT_POLICY_ERROR_TAGS.has(skill))
        : [];
    return Array.from(new Set(problemTypes));
}

function hasPolicySkill(item, skill) {
    return Boolean(skill && getPolicySkills(item).includes(skill));
}

function getPolicyFamily(item) {
    if (window.IrtEngine?.getItemFamily) return window.IrtEngine.getItemFamily(item);
    if (item?.type_family) return item.type_family;
    if (Array.isArray(item?.problem_types) && item.problem_types.length) return item.problem_types[0];
    if (item?.question_type) return item.question_type;
    return null;
}

function getPolicyReasoningDepth(item) {
    const depth = Number(item?.reasoning_depth);
    if (Number.isFinite(depth)) return clampPolicy(depth, 1, 4);
    if (item?.requires_multi_step_reasoning) return 2;
    const tags = [
        ...(Array.isArray(item?.skill_tags) ? item.skill_tags : []),
        ...(Array.isArray(item?.reasoning_tags) ? item.reasoning_tags : []),
        ...(Array.isArray(item?.problem_types) ? item.problem_types : [])
    ].join(' ');
    if (/COMPOSITE_RELATION|MULTI_STEP_RELATION|PROPORTION|FRACTION_RELATION|INVERSE_RELATION|RANKING/.test(tags)) return 3;
    if (/UNIT_COMPARE|COMPARE_RELATION|MULTIPLICATIVE_COMPARE/.test(tags)) return 2;
    return 1;
}

function isPolicyComplexWordProblem(item) {
    const tags = [
        ...(Array.isArray(item?.skill_tags) ? item.skill_tags : []),
        ...(Array.isArray(item?.reasoning_tags) ? item.reasoning_tags : []),
        ...(Array.isArray(item?.problem_types) ? item.problem_types : [])
    ];
    const hasComplexTag = tags.some(tag => /BASE_UNIT_IDENTIFICATION|COMPARE_RELATION|COMPOSITE_RELATION|FRACTION_RELATION|INVERSE_RELATION|MULTI_STEP_RELATION|MULTIPLICATIVE_COMPARE|PROPORTION|RANKING|TRANSFER|UNIT_COMPARE/.test(tag));
    const text = String(item?.question || item?.problem || '');
    const sentenceCount = (text.match(/[.?!?]/g) || []).length;
    return (item?.requires_multi_step_reasoning === true || getPolicyReasoningDepth(item) >= 3)
        && getPolicyReasoningDepth(item) >= 2
        && text.length >= 40
        && sentenceCount >= 2
        && hasComplexTag;
}

function getSkillState(state, skill) {
    return state?.skillStates?.[skill] || { attempts: 0, mastery: 0 };
}

function getWeakSkills(state = {}) {
    return Object.entries(state.skillStates || {})
        .filter(([, skillState]) => (skillState.attempts || 0) >= 2 && (skillState.mastery || 0) < IRT_POLICY_WEAK_MASTERY)
        .sort((a, b) => (
            (a[1].mastery || 0) - (b[1].mastery || 0)
            || (b[1].attempts || 0) - (a[1].attempts || 0)
        ))
        .map(([skill]) => skill);
}

function getUnderMeasuredSkill(items, state = {}) {
    const complexItems = (items || []).filter(isPolicyComplexWordProblem);
    const sourceItems = complexItems.length >= Math.min(30, Math.ceil((items || []).length * 0.2))
        ? complexItems
        : (items || []);
    const counts = new Map();
    sourceItems.forEach(item => {
        getPolicySkills(item).forEach(skill => {
            if (!counts.has(skill)) counts.set(skill, getSkillState(state, skill).attempts || 0);
        });
    });
    return Array.from(counts.entries())
        .sort((a, b) => a[1] - b[1] || String(a[0]).localeCompare(String(b[0])))
        [0]?.[0] || null;
}

function getLearningPhase(items, state = {}) {
    const attempts = state.attemptCount || 0;
    const standardError = typeof state.standardError === 'number' ? state.standardError : 1;
    if (attempts < IRT_POLICY_MIN_DIAGNOSTIC_ATTEMPTS || standardError > 0.65) return 'diagnostic';
    if (getWeakSkills(state).length) return 'targeted_practice';
    if (attempts >= 30 && standardError <= 0.38) return 'mastery_check';
    return 'adaptive_practice';
}

function getTargetSkill(items, state = {}, phase) {
    if (phase === 'targeted_practice') return getWeakSkills(state)[0] || null;
    if (phase === 'diagnostic') return getUnderMeasuredSkill(items, state);
    return null;
}

function getTargetProbability(phase) {
    if (phase === 'diagnostic') return 0.5;
    if (phase === 'targeted_practice') return 0.65;
    if (phase === 'mastery_check') return 0.55;
    return 0.6;
}

function getRecentPenalty(item, state = {}) {
    const recentIds = [
        ...(state.lastItemIds || []),
        ...(state.presentedItemIds || [])
    ];
    const index = recentIds.indexOf(item.problem_id);
    if (index < 0) return 0;
    return 2.5 - Math.min(index, 10) * 0.15;
}

function getRecentFamilyPenalty(item, state = {}) {
    const family = getPolicyFamily(item);
    if (!family) return 0;
    const recentFamilies = [
        ...(state.lastItemFamilies || []),
        ...(state.presentedItemFamilies || [])
    ];
    const index = recentFamilies.indexOf(family);
    if (index < 0) return 0;
    return 1.4 - Math.min(index, 8) * 0.12;
}

function scorePolicyItem(item, state = {}, context = {}) {
    const theta = Number.isFinite(state.theta) ? state.theta : 0;
    const phase = context.phase || getLearningPhase(context.items || [], state);
    const targetSkill = context.targetSkill || null;
    const targetProbability = getTargetProbability(phase);
    const p = getPolicyProbability(theta, item);
    const information = getPolicyInformation(theta, item);
    const skills = getPolicySkills(item);
    const skillAttempts = skills.map(skill => getSkillState(state, skill).attempts || 0);
    const skillMasteryValues = skills.map(skill => getSkillState(state, skill).mastery || 0);
    const minSkillAttempts = skillAttempts.length ? Math.min(...skillAttempts) : 0;
    const skillMastery = skillMasteryValues.length ? Math.min(...skillMasteryValues) : 0;
    const reasoningDepth = getPolicyReasoningDepth(item);

    const probabilityFit = clampPolicy(1 - Math.abs(p - targetProbability) / 0.5, 0, 1);
    const targetSkillBonus = targetSkill && skills.includes(targetSkill) ? 4.5 : 0;
    const diagnosticCoverageBonus = phase === 'diagnostic' ? clampPolicy((4 - minSkillAttempts) / 4, 0, 1) * 2.5 : 0;
    const weakSkillBonus = phase === 'targeted_practice' ? clampPolicy((IRT_POLICY_WEAK_MASTERY - skillMastery) / IRT_POLICY_WEAK_MASTERY, 0, 1) * 1.5 : 0;
    const masteryChallengeBonus = phase === 'mastery_check' ? clampPolicy((getPolicyDifficulty(item) - theta + 0.6) / 1.2, 0, 1) * 1.4 : 0;
    const complexReasoningBonus = clampPolicy((reasoningDepth - 1) / 3, 0, 1) * 1.25;
    const shallowWordProblemPenalty = reasoningDepth <= 1 ? 0.9 : 0;
    const tooHardPenalty = phase === 'targeted_practice' && p < 0.35 ? 2.5 : 0;
    const tooEasyPenalty = phase === 'mastery_check' && p > 0.8 ? 1.5 : 0;

    return roundPolicy(
        information * 5
        + probabilityFit * 3
        + targetSkillBonus
        + diagnosticCoverageBonus
        + weakSkillBonus
        + masteryChallengeBonus
        + complexReasoningBonus
        - getRecentPenalty(item, state)
        - getRecentFamilyPenalty(item, state)
        - shallowWordProblemPenalty
        - tooHardPenalty
        - tooEasyPenalty
    );
}

function selectPolicyNextItem(items, state = {}) {
    const pool = (items || []).filter(item => item && item.problem_id);
    if (!pool.length) return null;

    const phase = getLearningPhase(pool, state);
    const targetSkill = getTargetSkill(pool, state, phase);
    const context = { items: pool, phase, targetSkill };
    const recentIds = [
        ...(state.lastItemIds || []),
        ...(state.presentedItemIds || [])
    ];
    const recent = new Set(recentIds);
    const immediateId = state.presentedItemIds?.[0] || state.lastItemIds?.[0];
    const notImmediate = pool.filter(item => item.problem_id !== immediateId);
    const fresh = notImmediate.filter(item => !recent.has(item.problem_id));
    const broadCandidatePool = fresh.length >= Math.min(30, Math.ceil(pool.length * 0.1))
        ? fresh
        : notImmediate;
    const freshTargetPool = targetSkill
        ? broadCandidatePool.filter(item => hasPolicySkill(item, targetSkill))
        : [];
    const fallbackTargetPool = targetSkill
        ? notImmediate.filter(item => hasPolicySkill(item, targetSkill))
        : [];
    const targetPool = freshTargetPool.length ? freshTargetPool : fallbackTargetPool;
    let candidatePool;
    if (phase === 'targeted_practice' && targetPool.length) {
        const targetComplexPool = targetPool.filter(isPolicyComplexWordProblem);
        candidatePool = targetComplexPool.length >= Math.min(4, Math.ceil(targetPool.length * 0.3))
            ? targetComplexPool
            : targetPool;
    } else {
        const complexCandidatePool = broadCandidatePool.filter(isPolicyComplexWordProblem);
        candidatePool = complexCandidatePool.length >= Math.min(20, Math.ceil(broadCandidatePool.length * 0.15))
            ? complexCandidatePool
            : broadCandidatePool;
    }
    const candidates = candidatePool
        .map(item => ({
            item,
            phase,
            targetSkill,
            utility: scorePolicyItem(item, state, context),
            probability: roundPolicy(getPolicyProbability(Number.isFinite(state.theta) ? state.theta : 0, item)),
            difficulty: getPolicyDifficulty(item)
        }))
        .sort((a, b) => (
            b.utility - a.utility
            || Math.abs(a.difficulty - (state.theta || 0)) - Math.abs(b.difficulty - (state.theta || 0))
            || String(a.item.problem_id).localeCompare(String(b.item.problem_id))
        ));

    const selected = candidates[0];
    return {
        ...selected,
        reason: buildPolicyReason(selected)
    };
}

function buildPolicyReason(selection) {
    if (!selection) return '';
    if (selection.phase === 'diagnostic') return `${selection.targetSkill || 'skill'} 진단 근거를 넓히는 문항입니다.`;
    if (selection.phase === 'targeted_practice') return `${selection.targetSkill || '약점 skill'} 보강을 위한 적정 난이도 문항입니다.`;
    if (selection.phase === 'mastery_check') return '숙달이 안정적인지 확인하는 도전 문항입니다.';
    return '현재 능력과 학습 범위를 균형 있게 맞춘 문항입니다.';
}

function summarizeLearningPolicy(state = {}) {
    const phase = getLearningPhase([], state);
    const weakSkills = getWeakSkills(state);
    return {
        phase,
        weakSkills,
        description: phase === 'diagnostic'
            ? '진단 단계: 다양한 skill을 넓게 측정합니다.'
            : phase === 'targeted_practice'
                ? `약점 보강 단계: ${weakSkills[0] || '낮은 숙달 skill'}을 우선 연습합니다.`
                : phase === 'mastery_check'
                    ? '숙달 확인 단계: 약간 도전적인 문항으로 안정성을 확인합니다.'
                    : '적응 연습 단계: 정보량과 학습 범위를 균형 있게 맞춥니다.'
    };
}

window.IrtLearningPolicy = {
    getPhase: getLearningPhase,
    getWeakSkills,
    getReasoningDepth: getPolicyReasoningDepth,
    isComplexWordProblem: isPolicyComplexWordProblem,
    scoreItem: scorePolicyItem,
    selectNextItem: selectPolicyNextItem,
    summarize: summarizeLearningPolicy
};

globalThis.IrtLearningPolicy = window.IrtLearningPolicy;
