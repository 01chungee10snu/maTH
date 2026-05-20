/* =========================================================================
   학습자 프로필

   한 기기에서 여러 사람이 같은 앱을 쓸 수 있으므로 앱 진행 상태, IRT 추정치,
   풀이 로그를 학습자별 localStorage 키로 분리합니다.
   ========================================================================= */

const LEARNER_PROFILE_STORAGE_KEY = 'math-active-learner-id';
const LEARNER_STATE_KEY_PREFIX = 'math-learner-state';
const LEARNER_ATTEMPT_LOG_KEY_PREFIX = 'math-irt-attempt-log';
const LEARNER_RELATION_LOG_KEY_PREFIX = 'math-relation-coach-log';

const LEARNER_PROFILES = Object.freeze([
    Object.freeze({
        id: 'taehee',
        name: '태희',
        seed: 'learner-taehee',
        badge: '태',
        colors: ['#fdf2f8', '#f9a8d4', '#be185d']
    }),
    Object.freeze({
        id: 'sehee',
        name: '세희',
        seed: 'learner-sehee',
        badge: '세',
        colors: ['#ecfeff', '#67e8f9', '#0e7490']
    }),
    Object.freeze({
        id: 'bomi',
        name: '보미',
        seed: 'learner-bomi',
        badge: '보',
        colors: ['#f0fdf4', '#86efac', '#15803d']
    }),
    Object.freeze({
        id: 'chungseok',
        name: '충석',
        seed: 'learner-chungseok',
        badge: '충',
        colors: ['#eef2ff', '#a5b4fc', '#4338ca']
    })
]);

function cloneLearnerProfile(profile) {
    return profile ? { ...profile, colors: [...profile.colors] } : null;
}

function listLearnerProfiles() {
    return LEARNER_PROFILES.map(cloneLearnerProfile);
}

function findLearnerProfile(id) {
    return LEARNER_PROFILES.find(profile => profile.id === id) || null;
}

function getStorage() {
    try {
        return window?.localStorage || globalThis?.localStorage || null;
    } catch (_) {
        return null;
    }
}

function getActiveLearnerId() {
    const storage = getStorage();
    if (!storage) return null;
    const id = storage.getItem(LEARNER_PROFILE_STORAGE_KEY);
    return findLearnerProfile(id) ? id : null;
}

function getActiveLearnerProfile() {
    return cloneLearnerProfile(findLearnerProfile(getActiveLearnerId()));
}

function selectLearnerProfile(id) {
    const profile = findLearnerProfile(id);
    const storage = getStorage();
    if (!profile || !storage) return null;
    storage.setItem(LEARNER_PROFILE_STORAGE_KEY, profile.id);
    return cloneLearnerProfile(profile);
}

function clearActiveLearner() {
    const storage = getStorage();
    if (!storage) return;
    storage.removeItem(LEARNER_PROFILE_STORAGE_KEY);
}

function getLearnerStateKey(id = getActiveLearnerId()) {
    return id ? `${LEARNER_STATE_KEY_PREFIX}:${id}` : null;
}

function getLearnerAttemptLogKey(id = getActiveLearnerId()) {
    return id ? `${LEARNER_ATTEMPT_LOG_KEY_PREFIX}:${id}` : null;
}

function getLearnerRelationLogKey(id = getActiveLearnerId()) {
    return id ? `${LEARNER_RELATION_LOG_KEY_PREFIX}:${id}` : null;
}

window.LearnerProfiles = {
    list: listLearnerProfiles,
    find: id => cloneLearnerProfile(findLearnerProfile(id)),
    select: selectLearnerProfile,
    clearActive: clearActiveLearner,
    getActiveId: getActiveLearnerId,
    getActiveProfile: getActiveLearnerProfile,
    getStateKey: getLearnerStateKey,
    getAttemptLogKey: getLearnerAttemptLogKey,
    getRelationLogKey: getLearnerRelationLogKey
};

globalThis.LearnerProfiles = window.LearnerProfiles;
