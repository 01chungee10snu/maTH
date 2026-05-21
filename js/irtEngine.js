/* =========================================================================
   IRT 기반 적응형 학습 엔진

   MVP는 Rasch/1PL 모델을 사용합니다. 문항 난이도 b와 학습자 능력 theta의
   차이를 기준으로 다음 문항을 고르고, 힌트와 사고 단계 성공률을 반영해
   정답 가중치를 조정합니다.
   ========================================================================= */

const IRT_STATE_VERSION = 1;
const IRT_THETA_MIN = -3;
const IRT_THETA_MAX = 3;
const IRT_STORAGE_SEED_KEY = 'taehee-irt-learner-seed';
const IRT_INITIAL_THETA_BY_TOPIC = {
    relationship_math: 0,
    k12_math: -2.85
};
const IRT_ERROR_TAGS = new Set([
    'NUMBER_SIZE_BIAS',
    'DIRECTION_CONFUSION',
    'BASE_UNIT_CONFUSION',
    'FRACTION_SIZE_CONFUSION',
    'OPERATION_SELECTION_ERROR',
    'RANKING_MISREAD',
    'EXPLANATION_GAP',
    'TRANSFER_FAILURE'
]);

function clampIrt(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function getLocalDateKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function createRuntimeSeed() {
    return `learner-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function getStoredLearnerSeed(topic) {
    try {
        const activeProfile = window?.LearnerProfiles?.getActiveProfile?.()
            || globalThis?.LearnerProfiles?.getActiveProfile?.();
        if (activeProfile?.seed) return activeProfile.seed;

        const storage = window?.localStorage || globalThis?.localStorage;
        if (!storage) return `anonymous-${topic}`;
        const existing = storage.getItem(IRT_STORAGE_SEED_KEY);
        if (existing) return existing;
        const created = createRuntimeSeed();
        storage.setItem(IRT_STORAGE_SEED_KEY, created);
        return created;
    } catch (error) {
        return `anonymous-${topic}`;
    }
}

function createInitialIrtState(topic = 'relationship_math', options = {}) {
    const learnerSeed = options.learnerSeed || getStoredLearnerSeed(topic);
    const dailySeed = options.dailySeed || `${learnerSeed}:${getLocalDateKey()}`;
    const defaultTheta = Object.prototype.hasOwnProperty.call(IRT_INITIAL_THETA_BY_TOPIC, topic)
        ? IRT_INITIAL_THETA_BY_TOPIC[topic]
        : 0;
    const initialTheta = Number.isFinite(options.initialTheta)
        ? clampIrt(options.initialTheta, IRT_THETA_MIN, IRT_THETA_MAX)
        : defaultTheta;
    return {
        version: IRT_STATE_VERSION,
        topic,
        learnerSeed,
        dailySeed,
        theta: initialTheta,
        standardError: 1,
        attemptCount: 0,
        lastItemIds: [],
        lastItemFamilies: [],
        lastItemStructures: [],
        lastItemTemplates: [],
        presentedItemIds: [],
        presentedItemFamilies: [],
        presentedItemStructures: [],
        presentedItemTemplates: [],
        skillStates: {},
        updatedAt: new Date().toISOString()
    };
}

function getIrtDifficulty(item) {
    const b = Number(item?.irt?.b);
    if (Number.isFinite(b)) return b;
    const level = Number(item?.level || 5);
    return clampIrt((level - 5) / 3, IRT_THETA_MIN, IRT_THETA_MAX);
}

function raschProbability(theta, b) {
    const x = clampIrt(theta - b, -6, 6);
    return 1 / (1 + Math.exp(-x));
}

function getItemInformation(theta, item) {
    const p = raschProbability(theta, getIrtDifficulty(item));
    return p * (1 - p);
}

function getResponseScore(result = {}) {
    const hintLevel = clampIrt(Number(result.hintLevel || 0), 0, 7);
    const stepSuccessRate = clampIrt(
        typeof result.stepSuccessRate === 'number' ? result.stepSuccessRate : (result.correct ? 1 : 0),
        0,
        1
    );

    if (result.correct) {
        const hintPenalty = Math.min(0.55, hintLevel * 0.08);
        return clampIrt(1 - hintPenalty, 0.35, 1);
    }

    return clampIrt(stepSuccessRate * 0.35, 0, 0.35);
}

function getItemSkills(item) {
    const skills = item?.skill_tags || item?.problem_types || [];
    return Array.from(new Set(skills.filter(skill => skill && !IRT_ERROR_TAGS.has(skill))));
}

function getItemFamily(item) {
    if (item?.type_family) return item.type_family;
    if (Array.isArray(item?.problem_types) && item.problem_types.length) return item.problem_types[0];
    if (item?.question_type) return item.question_type;
    return null;
}

function getItemTemplate(item) {
    if (item?.template_signature) return item.template_signature;
    const family = getItemFamily(item);
    if (!family) return item?.problem_id || item?.problemKey || null;
    return String(family)
        .replace(/^COMPLEX_D\d+_/, 'COMPLEX_DXX_')
        .replace(/_V\d+$/, '_VX');
}

function getItemStructure(item) {
    if (item?.structure_signature) return item.structure_signature;
    const template = getItemTemplate(item);
    if (template) return String(template).split(':')[0];
    return null;
}

function updateSkillState(previous, score) {
    const state = previous || { attempts: 0, mastery: 0, lastScore: 0 };
    const attempts = state.attempts + 1;
    const mastery = clampIrt((state.mastery * state.attempts + score) / attempts, 0, 1);
    return {
        attempts,
        mastery,
        lastScore: score
    };
}

function updateIrtState(previousState, item, result = {}) {
    const state = previousState || createInitialIrtState();
    const b = getIrtDifficulty(item);
    const p = raschProbability(state.theta, b);
    const score = getResponseScore(result);
    const minimumLearningRate = state.topic === 'k12_math' ? 0.24 : 0.18;
    const learningRate = Math.max(minimumLearningRate, 0.55 / Math.sqrt((state.attemptCount || 0) + 1));
    const theta = clampIrt(state.theta + learningRate * (score - p), IRT_THETA_MIN, IRT_THETA_MAX);
    const attemptCount = (state.attemptCount || 0) + 1;
    const information = getItemInformation(theta, item);
    const standardError = Math.max(0.25, 1 / Math.sqrt(1 + attemptCount * Math.max(0.08, information) * 4));
    const lastItemIds = [item?.problem_id || item?.problemKey, ...(state.lastItemIds || [])]
        .filter(Boolean)
        .slice(0, 50);
    const lastItemFamilies = [getItemFamily(item), ...(state.lastItemFamilies || [])]
        .filter(Boolean)
        .slice(0, 50);
    const lastItemStructures = [getItemStructure(item), ...(state.lastItemStructures || [])]
        .filter(Boolean)
        .slice(0, 50);
    const lastItemTemplates = [getItemTemplate(item), ...(state.lastItemTemplates || [])]
        .filter(Boolean)
        .slice(0, 50);
    const skillStates = { ...(state.skillStates || {}) };

    getItemSkills(item).forEach(skill => {
        skillStates[skill] = updateSkillState(skillStates[skill], score);
    });

    return {
        ...state,
        theta,
        standardError,
        attemptCount,
        lastItemIds,
        lastItemFamilies,
        lastItemStructures,
        lastItemTemplates,
        presentedItemIds: state.presentedItemIds || [],
        presentedItemFamilies: state.presentedItemFamilies || [],
        presentedItemStructures: state.presentedItemStructures || [],
        presentedItemTemplates: state.presentedItemTemplates || [],
        skillStates,
        updatedAt: new Date().toISOString()
    };
}

function registerIrtExposure(previousState, item) {
    const state = previousState || createInitialIrtState();
    const itemId = item?.problem_id || item?.problemKey;
    if (!itemId) return state;
    const family = getItemFamily(item);
    const structure = getItemStructure(item);
    const template = getItemTemplate(item);
    const withoutSameItem = (state.presentedItemIds || []).filter(id => id !== itemId);
    const withoutSameFamily = (state.presentedItemFamilies || []).filter(value => value !== family);
    const withoutSameStructure = (state.presentedItemStructures || []).filter(value => value !== structure);
    const withoutSameTemplate = (state.presentedItemTemplates || []).filter(value => value !== template);

    return {
        ...state,
        presentedItemIds: [itemId, ...withoutSameItem].slice(0, 80),
        presentedItemFamilies: [family, ...withoutSameFamily].filter(Boolean).slice(0, 80),
        presentedItemStructures: [structure, ...withoutSameStructure].filter(Boolean).slice(0, 80),
        presentedItemTemplates: [template, ...withoutSameTemplate].filter(Boolean).slice(0, 80),
        lastPresentedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
}

function getSkillWeaknessPenalty(item, state) {
    const skills = getItemSkills(item);
    if (!skills.length || !state?.skillStates) return 0;
    const weakSkills = skills.filter(skill => {
        const skillState = state.skillStates[skill];
        return skillState && skillState.attempts >= 2 && skillState.mastery < 0.65;
    });
    return weakSkills.length ? -0.18 * weakSkills.length : 0;
}

function selectNextIrtItem(items, state = createInitialIrtState()) {
    const pool = (items || []).filter(item => item && item.problem_id);
    if (!pool.length) return null;

    const recent = new Set(state.lastItemIds || []);
    const immediateLastId = state.lastItemIds?.[0];
    let candidatePool = pool.length > 1 && immediateLastId
        ? pool.filter(item => item.problem_id !== immediateLastId)
        : pool;
    const freshPool = candidatePool.filter(item => !recent.has(item.problem_id));
    if (freshPool.length >= Math.min(8, Math.ceil(pool.length * 0.25))) {
        candidatePool = freshPool;
    }
    const theta = Number.isFinite(state.theta) ? state.theta : 0;

    return [...candidatePool].sort((a, b) => {
        const aRecentIndex = (state.lastItemIds || []).indexOf(a.problem_id);
        const bRecentIndex = (state.lastItemIds || []).indexOf(b.problem_id);
        const aRecent = aRecentIndex >= 0 ? 1.25 - Math.min(aRecentIndex, 8) * 0.1 : 0;
        const bRecent = bRecentIndex >= 0 ? 1.25 - Math.min(bRecentIndex, 8) * 0.1 : 0;
        const aFamilyIndex = (state.lastItemFamilies || []).indexOf(getItemFamily(a));
        const bFamilyIndex = (state.lastItemFamilies || []).indexOf(getItemFamily(b));
        const aFamilyRecent = aFamilyIndex >= 0 ? 0.8 - Math.min(aFamilyIndex, 6) * 0.08 : 0;
        const bFamilyRecent = bFamilyIndex >= 0 ? 0.8 - Math.min(bFamilyIndex, 6) * 0.08 : 0;
        const aScore = Math.abs(getIrtDifficulty(a) - theta) - getItemInformation(theta, a) + aRecent + aFamilyRecent + getSkillWeaknessPenalty(a, state);
        const bScore = Math.abs(getIrtDifficulty(b) - theta) - getItemInformation(theta, b) + bRecent + bFamilyRecent + getSkillWeaknessPenalty(b, state);
        return aScore - bScore;
    })[0];
}

function summarizeIrtState(state) {
    const theta = Number.isFinite(state?.theta) ? state.theta : 0;
    const lower = Math.round((theta - (state?.standardError || 1)) * 10) / 10;
    const upper = Math.round((theta + (state?.standardError || 1)) * 10) / 10;
    return {
        topic: state?.topic || 'relationship_math',
        theta: Math.round(theta * 100) / 100,
        standardError: Math.round((state?.standardError || 1) * 100) / 100,
        independentRange: `${lower} ~ ${upper}`,
        attemptCount: state?.attemptCount || 0,
        skillStates: state?.skillStates || {}
    };
}

window.IrtEngine = {
    createInitialState: createInitialIrtState,
    getDifficulty: getIrtDifficulty,
    probability: raschProbability,
    information: getItemInformation,
    responseScore: getResponseScore,
    getItemFamily,
    getItemStructure,
    getItemTemplate,
    registerExposure: registerIrtExposure,
    updateState: updateIrtState,
    selectNextItem: selectNextIrtItem,
    summarize: summarizeIrtState
};

globalThis.IrtEngine = window.IrtEngine;
