/* =========================================================================
   Supabase Auth & Data Logic
   ========================================================================= */
let supabaseClient = null;
let currentUser = null;

if (typeof supabase !== 'undefined') {
    const { createClient } = supabase;
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);
}

async function checkSession() {
    if (!supabaseClient) return;
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        currentUser = session.user;
        updateUserUI();
        await loadDataFromDB();
    } else {
        // 로그인 모달 자동 표시 제거 (맵을 먼저 보여줌)
        // document.getElementById('loginModal').style.display = 'flex';
        updateUserUI(); // 로그인 버튼 표시
    }

    supabaseClient.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN') {
            currentUser = session.user;
            updateUserUI();
            await loadDataFromDB();
        } else if (event === 'SIGNED_OUT') {
            currentUser = null;
            updateUserUI();
        }
    });
}

function updateUserUI() {
    const badge = document.getElementById('userBadge');
    if (currentUser) {
        badge.style.display = 'flex';
        badge.innerHTML = `👤 ${currentUser.email.split('@')[0]} (로그아웃)`;
        document.getElementById('loginModal').style.display = 'none';
    } else {
        badge.style.display = 'flex';
        badge.innerHTML = `👤 로그인`;
    }
}

async function handleLogin() {
    const email = document.getElementById('emailInput').value;
    const password = document.getElementById('passwordInput').value;
    const msg = document.getElementById('loginMsg');

    if (!email || !password) {
        msg.textContent = '이메일과 비밀번호를 입력해주세요.';
        return;
    }

    msg.textContent = '로그인 중...';

    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

    if (error) {
        if (error.message.includes('Invalid login') || error.message.includes('not found')) {
            msg.textContent = '계정이 없어 회원가입을 진행합니다...';
            const { data: signUpData, error: signUpError } = await supabaseClient.auth.signUp({ email, password });
            if (signUpError) {
                msg.textContent = '오류: ' + signUpError.message;
            } else {
                msg.textContent = '회원가입 완료! 자동 로그인됩니다.';
            }
        } else {
            msg.textContent = '오류: ' + error.message;
        }
    } else {
        msg.textContent = '성공!';
    }
}

function handleLogout() {
    if (currentUser) {
        if (confirm('로그아웃 하시겠습니까?')) {
            supabaseClient.auth.signOut();
        }
    } else {
        document.getElementById('loginModal').style.display = 'flex';
    }
}

function closeLoginModal() {
    document.getElementById('loginModal').style.display = 'none';
}

async function loadDataFromDB() {
    if (!currentUser || !supabaseClient) return;

    try {
        const { data: inventory, error: invError } = await supabaseClient
            .from('inventory')
            .select('tiniping_id');

        if (!invError && inventory) {
            const dbIds = inventory.map(i => i.tiniping_id);
            const merged = new Set([...STATE.caughtIds, ...dbIds]);
            STATE.caughtIds = Array.from(merged);
        }
        saveState();
        console.log('DB 동기화 완료');
    } catch (e) {
        console.error('DB 로드 실패', e);
    }
}

async function saveTinipingToDB(tinipingId, tinipingName) {
    if (!currentUser || !supabaseClient) return;

    const { data } = await supabaseClient
        .from('inventory')
        .select('id')
        .eq('user_id', currentUser.id)
        .eq('tiniping_id', tinipingId);

    if (data && data.length > 0) return;

    await supabaseClient.from('inventory').insert({
        user_id: currentUser.id,
        tiniping_id: tinipingId,
        tiniping_name: tinipingName
    });
}
