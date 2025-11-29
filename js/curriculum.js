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

// 초기 로드 시 실행 (game.js에서 제어하므로 주석 처리)
// loadCurriculumData();
