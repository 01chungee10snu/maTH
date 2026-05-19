/* =========================================================================
   Supabase Auth & Data Logic

   The app is still local-first. Supabase is initialized with a public
   publishable key so future authenticated sync can be added without putting
   admin secrets in the browser bundle.
   ========================================================================= */
let SUPABASE_CLIENT = null;

function isSupabaseConfigured() {
    return Boolean(
        typeof SUPABASE_CONFIG !== 'undefined'
        && SUPABASE_CONFIG.enabled
        && SUPABASE_CONFIG.url
        && SUPABASE_CONFIG.publishableKey
    );
}

function getSupabaseClient() {
    if (!isSupabaseConfigured()) return null;
    if (SUPABASE_CLIENT) return SUPABASE_CLIENT;
    if (!window.supabase || typeof window.supabase.createClient !== 'function') {
        console.warn('Supabase SDK가 로드되지 않았습니다. 로컬 모드로 실행합니다.');
        return null;
    }

    SUPABASE_CLIENT = window.supabase.createClient(
        SUPABASE_CONFIG.url,
        SUPABASE_CONFIG.publishableKey,
        {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true
            }
        }
    );
    return SUPABASE_CLIENT;
}

async function checkSession() {
    const client = getSupabaseClient();
    if (client) {
        console.log(`Supabase 연결 설정 로드: ${SUPABASE_CONFIG.projectName || SUPABASE_CONFIG.url}`);
    } else {
        console.log('Supabase 미설정 또는 SDK 미로드. 로컬 모드로 실행합니다.');
    }
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
    console.log('학습 데이터는 현재 브라우저 로컬 저장소를 사용합니다.');
}

async function saveTinipingToDB(tinipingId, tinipingName) {
    // DB 저장은 아직 켜지지 않았습니다. RLS 정책과 로그인 흐름이 확정된 뒤 활성화합니다.
}

window.MathAppSupabase = {
    isConfigured: isSupabaseConfigured,
    getClient: getSupabaseClient,
    getConfig: () => SUPABASE_CONFIG
};
