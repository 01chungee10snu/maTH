/* =========================================================================
   IRT 바로 학습 진입 흐름

   아이가 학교급과 단원을 매번 고르지 않아도 현재 IRT 상태와 약한 skill을
   기준으로 초등 관계 사고 문장제 풀을 자동 선택합니다.
   ========================================================================= */

const ADAPTIVE_DEFAULT_TOPIC = '자연수의 곱셈과 나눗셈';

function getAdaptiveProfiles() {
    return window.RelationCurriculum?.profiles || [];
}

function getProfilePrimaryTopic(profile) {
    return profile?.matches?.[0] || ADAPTIVE_DEFAULT_TOPIC;
}

function getWeakestAdaptiveSkill(irtState) {
    const entries = Object.entries(irtState?.skillStates || {})
        .filter(([, state]) => (state?.attempts || 0) >= 2)
        .sort((a, b) => (
            (a[1].mastery || 0) - (b[1].mastery || 0)
            || (b[1].attempts || 0) - (a[1].attempts || 0)
        ));
    const weak = entries.find(([, state]) => (state?.mastery || 0) < 0.65);
    return weak?.[0] || null;
}

function findTopicForSkill(skill) {
    if (!skill) return null;
    const profile = getAdaptiveProfiles().find(item => (item.skills || []).includes(skill));
    return profile ? getProfilePrimaryTopic(profile) : null;
}

function chooseStartTopic(options = {}) {
    const weakSkillTopic = findTopicForSkill(getWeakestAdaptiveSkill(options.irtState));
    if (weakSkillTopic) return weakSkillTopic;

    const currentTopic = options.currentTopic || options.currentCurriculum;
    if (window.RelationCurriculum?.isRelationThinkingTopic?.(currentTopic)) {
        return currentTopic;
    }

    return ADAPTIVE_DEFAULT_TOPIC;
}

function createStartPatch(state = {}) {
    return {
        mode: 'quiz',
        currentCurriculum: chooseStartTopic({
            currentTopic: state.currentCurriculum,
            irtState: state.irt
        }),
        mapSelection: { grade: null, subGrade: null, domain: null },
        problem: null,
        selected: null,
        isCorrect: null,
        confirmed: null,
        relationCoach: null,
        symbolAnswers: { square: null, circle: null, triangle: null },
        learningEntry: 'adaptive'
    };
}

window.AdaptiveLearningFlow = {
    defaultTopic: ADAPTIVE_DEFAULT_TOPIC,
    chooseStartTopic,
    createStartPatch
};

globalThis.AdaptiveLearningFlow = window.AdaptiveLearningFlow;
