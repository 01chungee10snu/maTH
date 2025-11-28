/* =========================================================================
   Supabase Auth & Data Logic (Disabled)
   ========================================================================= */
// 로그인 기능 제거로 인해 더미 함수로 대체

async function checkSession() {
    console.log('로그인 기능이 비활성화되었습니다.');
    // 로그인 없이 바로 로컬 데이터 사용
    loadDataFromDB();
}

function updateUserUI() {
    // UI 제거됨
}

async function handleLogin() {
    // 기능 제거됨
}

function handleLogout() {
    // 기능 제거됨
}

function closeLoginModal() {
    // 기능 제거됨
}

async function loadDataFromDB() {
    // 로컬 스토리지 데이터만 사용하므로 별도 DB 로드 불필요
    // 기존 로직 유지를 위해 빈 함수로 둠
    console.log('로컬 모드로 실행 중');
}

async function saveTinipingToDB(tinipingId, tinipingName) {
    // DB 저장 안 함
}
