/* =========================================================================
   초등 과정 통합형 관계 사고 라우팅

   관계형 문장제는 별도 코치 모드가 아니라 관계 사고가 중요한 초등 단원
   안에서만 출제합니다.
   ========================================================================= */

const ELEMENTARY_RELATION_TOPIC_PROFILES = [
    {
        key: 'division_word',
        matches: ['자연수의 곱셈과 나눗셈', '나눗셈', '곱셈의 의미'],
        skills: ['EQUAL_SHARING', 'QUOTATIVE_DIVISION', 'UNIT_COMPARE', 'INVERSE_RELATION', 'DIRECTION_REASONING', 'BASE_UNIT_IDENTIFICATION']
    },
    {
        key: 'fraction_relation',
        matches: ['분수와 소수의 이해', '분수의 덧셈과 뺄셈', '분수의 곱셈과 나눗셈'],
        skills: ['FRACTION_RELATION', 'MULTIPLICATIVE_COMPARE', 'UNIT_COMPARE', 'COMPOSITE_RELATION']
    },
    {
        key: 'measurement_relation',
        matches: ['길이, 시각, 시간', '들이와 무게', '시간과 길이'],
        skills: ['DIRECT_COMPARE', 'UNIT_COMPARE', 'INVERSE_RELATION', 'RANKING', 'DIRECTION_REASONING']
    },
    {
        key: 'multiple_relation',
        matches: ['약수와 배수'],
        skills: ['MULTIPLICATIVE_COMPARE', 'UNIT_COMPARE', 'COMPOSITE_RELATION']
    },
    {
        key: 'ratio_relation',
        matches: ['비와 비율', '비례식과 비례배분', '규칙과 대응'],
        skills: ['PROPORTION', 'MULTIPLICATIVE_COMPARE', 'COMPOSITE_RELATION', 'UNIT_COMPARE', 'TRANSFER']
    },
    {
        key: 'data_relation',
        matches: ['평균', '막대그래프', '꺾은선그래프', '띠그래프와 원그래프'],
        skills: ['DIRECT_COMPARE', 'RANKING', 'COMPOSITE_RELATION']
    }
];

function normalizeRelationTopic(topic) {
    return String(topic || '').replace(/\s+/g, '');
}

function getRelationTopicProfile(topic) {
    const normalized = normalizeRelationTopic(topic);
    if (!normalized) return null;
    const matches = [];
    ELEMENTARY_RELATION_TOPIC_PROFILES.forEach(profile => {
        profile.matches.forEach(match => {
            const normalizedMatch = normalizeRelationTopic(match);
            if (normalized.includes(normalizedMatch)) {
                matches.push({ profile, length: normalizedMatch.length });
            }
        });
    });
    matches.sort((a, b) => b.length - a.length);
    return matches[0]?.profile || null;
}

function isRelationThinkingTopic(topic) {
    return Boolean(getRelationTopicProfile(topic));
}

function filterRelationItemsForTopic(items, topic) {
    const profile = getRelationTopicProfile(topic);
    if (!profile) return [];
    const allowed = new Set(profile.skills);
    const filtered = (items || []).filter(item => (
        (item.skill_tags || item.problem_types || []).some(skill => allowed.has(skill))
    ));
    return filtered.length ? filtered : (items || []);
}

window.RelationCurriculum = {
    profiles: ELEMENTARY_RELATION_TOPIC_PROFILES,
    getProfile: getRelationTopicProfile,
    isRelationThinkingTopic,
    filterItemsForTopic: filterRelationItemsForTopic
};

globalThis.RelationCurriculum = window.RelationCurriculum;
