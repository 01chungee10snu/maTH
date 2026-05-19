/* =========================================================================
   커리큘럼 데이터 로드 및 관리
   ========================================================================= */

async function loadCurriculumData() {
    try {
        const response = await fetch('js/curriculum_standard_2022.json');
        if (!response.ok) {
            throw new Error(`커리큘럼 데이터 로드 실패: ${response.status}`);
        }
        CURRICULUM_DATA = await response.json();
        console.log('커리큘럼 데이터 로드 완료');
        return CURRICULUM_DATA;
    } catch (error) {
        console.error('커리큘럼 로드 중 오류 발생:', error);
        return null;
    }
}

function getCurriculumTopicSections(domainData) {
    if (!domainData || typeof domainData !== 'object') return [];

    const sections = [];

    Object.entries(domainData).forEach(([title, value]) => {
        appendCurriculumSection(sections, title, value);
    });

    return sections;
}

function appendCurriculumSection(sections, title, value, parentTitle = null) {
    if (Array.isArray(value)) {
        sections.push({
            title,
            parentTitle,
            topics: value
        });
        return;
    }

    if (!value || typeof value !== 'object') return;

    if (Array.isArray(value.topics)) {
        sections.push({
            title,
            parentTitle,
            description: value.description || '',
            topics: value.topics
        });
        return;
    }

    Object.entries(value).forEach(([childTitle, childValue]) => {
        appendCurriculumSection(sections, childTitle, childValue, title);
    });
}

function getCurriculumTopicCount(domainData) {
    return getCurriculumTopicSections(domainData)
        .reduce((sum, section) => sum + section.topics.length, 0);
}

globalThis.getCurriculumTopicSections = getCurriculumTopicSections;
globalThis.getCurriculumTopicCount = getCurriculumTopicCount;
if (typeof window !== 'undefined') {
    window.getCurriculumTopicSections = getCurriculumTopicSections;
    window.getCurriculumTopicCount = getCurriculumTopicCount;
}

// 초기 로드 시 실행 (game.js에서 제어하므로 주석 처리)
// loadCurriculumData();
