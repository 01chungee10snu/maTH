/* =========================================================================
   데이터: 티니핑 메타(이름·유형·설명) + 이미지 로딩
   시즌 1~6 전체 티니핑 포함 (총 145+ 캐릭터)
   ========================================================================= */
const baseTinipings = [
    // ===================================================================
    // 시즌 1: 캐치! 티니핑 (2020)
    // ===================================================================

    // === 시즌 1 로열핑 (6) ===
    {
        id: 1, name: "하츄핑", nameEn: "Heartsping", type: "로열", season: 1, domain: "수와 연산",
        desc: "사랑의 로열 티니핑. 로미를 돌보는 역할을 맡았어요.",
        theme: "하트", personality: "사랑이 넘치고 친구를 깊이 아끼는 성격",
        ability: "로미를 프린세스 하트로 변신시키고, 마법 거울로 밝은 빛을 비출 수 있어요",
        catchphrase: "사랑해 하츄! 피리피리 매지컬 하트!",
        item: "마법의 거울",
        trivia: "눈물을 흘릴 때마다 위험에 처한 동료를 부활시키는 전개가 있어요"
    },
    {
        id: 2, name: "바로핑", nameEn: "Dadaping", type: "로열", season: 1, domain: "수와 연산",
        desc: "올바름의 로열 감정 티니핑. 공부를 좋아하고 똑똒해요.",
        theme: "구름", personality: "성실하고 정리정돈을 잘하며 존댓말을 사용해요",
        ability: "마법의 책으로 기호와 이모티콘을 만들어 날리고, 바른 생활을 하게 만들어요",
        catchphrase: "바롬! 올바르게 해요!",
        item: "마법의 책",
        trivia: "정해진 시간에만 정해진 일을 해야 하는 스타일이에요"
    },
    {
        id: 3, name: "아자핑", nameEn: "Gogoping", type: "로열", season: 1, domain: "수와 연산",
        desc: "용기의 로열 감정 티니핑. 운동을 좋아하고 용감해요.",
        theme: "별", personality: "에너지가 넘치고 도전을 좋아하며 행동력이 뛰어나요",
        ability: "로미를 프린세스 스타로 변신시키고, 용기를 북돋아줘요",
        catchphrase: "으쌰으쌰 아자! 용기를 줘!",
        item: "마법의 응원봉",
        trivia: "바네핑의 화살을 대신 맞고 혼수상태에 빠졌다가 하츄핑의 눈물로 깨어났어요"
    },
    {
        id: 4, name: "차차핑", nameEn: "Chachaping", type: "로열", season: 1, domain: "도형과 측정",
        desc: "희망의 로열 감정 티니핑. 차분한 성격을 가졌어요.",
        theme: "자연/꽃", personality: "차분하고 자연을 사랑하며 절대 희망을 잃지 않아요",
        ability: "로미를 프린세스 클라우디아로 변신시키고, 희망을 전해줘요",
        catchphrase: "희망을 줄게, 차차~",
        item: "마법의 꽃",
        trivia: "2기부터 왕립 티니핑 스쿨의 교사로 활동해요"
    },
    {
        id: 5, name: "라라핑", nameEn: "Lalaping", type: "로열", season: 1, domain: "도형과 측정",
        desc: "기쁨의 티니핑. 활기차고 쾌활해요.",
        theme: "음악", personality: "노래 부르기를 좋아하고 감정 표현을 잘해요",
        ability: "로미를 프린세스 멜로디로 변신시키고, 즐거운 노래를 불러요",
        catchphrase: "즐거워 라라♪ 노래해요!",
        item: "마법의 마이크",
        trivia: "큰 소리로 노래 부르는 것을 가장 좋아해요"
    },
    {
        id: 6, name: "해피핑", nameEn: "Happying", type: "로열", season: 1, domain: "규칙성",
        desc: "행복의 티니핑. 마지막 실종 로열 티니핑이에요.",
        theme: "햇살", personality: "밝고 행복한 성격이지만 비밀이 있어요",
        ability: "로미를 프린세스 선샤인으로 변신시키고, 행복을 전해줘요",
        catchphrase: "행복해 해피! 햇살처럼 빛나요!",
        item: "마법의 햇살봉",
        trivia: "키킹으로 변해있던 마지막 실종 로열 티니핑이에요"
    },

    // === 시즌 1 일반핑 (감정 티니핑) ===
    { id: 7, name: "키키핑", nameEn: "Kikiping", type: "일반", season: 1, domain: "도형과 측정", desc: "장난의 티니핑. 시끄럽고 장난치는 것을 좋아해요." },
    { id: 8, name: "아잉핑", nameEn: "Aiping", type: "일반", season: 1, domain: "도형과 측정", desc: "애교의 티니핑. 귀여운 애교로 사람들을 홀려요." },
    { id: 9, name: "부끄핑", nameEn: "Shyping", type: "일반", season: 1, domain: "도형과 측정", desc: "부끄러움의 티니핑. 수줍음이 많고 얼굴이 쉽게 빨개져요." },
    { id: 10, name: "베베핑", nameEn: "Babyping", type: "일반", season: 1, domain: "규칙성", desc: "아기의 티니핑. 모든 것을 아기처럼 만들어요." },
    { id: 11, name: "띠용핑", nameEn: "Surpriseping", type: "일반", season: 1, domain: "규칙성", desc: "놀람의 티니핑. 항상 깜짝 놀라요." },
    { id: 12, name: "주르핑", nameEn: "Weepyping", type: "일반", season: 1, domain: "규칙성", desc: "슬픔의 티니핑. 눈물이 많고 쉽게 울어요." },
    { id: 13, name: "차나핑", nameEn: "Lazyping", type: "일반", season: 1, domain: "규칙성", desc: "귀찮음의 티니핑. 모든 것이 귀찮아요." },
    { id: 14, name: "따라핑", nameEn: "Copyping", type: "일반", season: 1, domain: "규칙성", desc: "따라쟁이 티니핑. 남들을 따라해요." },
    { id: 15, name: "나르핑", nameEn: "Narcissping", type: "일반", season: 1, domain: "자료와 가능성", desc: "자아도취 티니핑. 자신을 매우 사랑해요." },
    { id: 16, name: "무거핑", nameEn: "Heavyping", type: "일반", season: 1, domain: "자료와 가능성", desc: "무거움의 티니핑. 분위기를 무겁게 만들어요." },
    { id: 17, name: "시러핑", nameEn: "Nonoping", type: "일반", season: 1, domain: "자료와 가능성", desc: "거절의 티니핑. 모든 것을 싫어해요." },
    { id: 18, name: "바네핑", nameEn: "Crushping", type: "일반", season: 1, domain: "자료와 가능성", desc: "반함의 티니핑. 쉽게 반해버려요." },
    { id: 19, name: "덜덜핑", nameEn: "Trembleping", type: "일반", season: 1, domain: "자료와 가능성", desc: "두려움의 티니핑. 무서움에 덜덜 떨어요." },
    { id: 20, name: "그림핑", nameEn: "Artping", type: "일반", season: 1, domain: "자료와 가능성", desc: "그림의 티니핑. 그림 그리기를 좋아해요." },
    { id: 21, name: "부투핑", nameEn: "Poutping", type: "일반", season: 1, domain: "수와 연산", desc: "삐침의 티니핑. 쉽게 삐져요." },
    { id: 22, name: "깜빡핑", nameEn: "Forgetping", type: "일반", season: 1, domain: "수와 연산", desc: "건망증의 티니핑. 무엇이든 깜빡해요." },
    { id: 23, name: "무셔핑", nameEn: "Scaryping", type: "일반", season: 1, domain: "도형과 측정", desc: "공포의 티니핑. 무서운 것들을 좋아해요." },
    { id: 24, name: "투투핑", nameEn: "Fussyping", type: "일반", season: 1, domain: "도형과 측정", desc: "투정의 티니핑. 투정 부리기의 달인이에요." },
    { id: 25, name: "차캐핑", nameEn: "Coldping", type: "일반", season: 1, domain: "도형과 측정", desc: "차가움의 티니핑. 차가운 성격이에요." },
    { id: 26, name: "떠벌핑", nameEn: "Chattyping", type: "일반", season: 1, domain: "규칙성", desc: "수다의 티니핑. 말하기를 멈출 수 없어요." },
    { id: 27, name: "다조핑", nameEn: "Sweetping", type: "일반", season: 1, domain: "규칙성", desc: "다정함의 티니핑. 매우 다정하고 상냥해요." },
    { id: 28, name: "화나핑", nameEn: "Angryping", type: "일반", season: 1, domain: "규칙성", desc: "화남의 티니핑. 쉽게 화를 내요." },
    { id: 29, name: "꺼꿀핑", nameEn: "Oppositeping", type: "일반", season: 1, domain: "자료와 가능성", desc: "반대의 티니핑. 항상 반대로 행동해요." },
    { id: 30, name: "씽씽핑", nameEn: "Speedping", type: "일반", season: 1, domain: "자료와 가능성", desc: "빠름의 티니핑. 매우 빠르게 움직여요." },
    { id: 31, name: "코자핑", nameEn: "Sleepyping", type: "일반", season: 1, domain: "수와 연산", desc: "졸림의 티니핑. 항상 졸려요." },
    { id: 32, name: "딱풀핑", nameEn: "Clingyping", type: "일반", season: 1, domain: "수와 연산", desc: "집착의 티니핑. 딱 붙어서 떨어지지 않아요." },
    { id: 33, name: "모야핑", nameEn: "Curiousping", type: "일반", season: 1, domain: "도형과 측정", desc: "호기심의 티니핑. 모든 것이 궁금해요." },
    { id: 34, name: "토이핑", nameEn: "Toyping", type: "일반", season: 1, domain: "도형과 측정", desc: "장난감의 티니핑. 장난감을 사랑해요." },
    { id: 35, name: "또까핑", nameEn: "Hiccuping", type: "일반", season: 1, domain: "규칙성", desc: "딸꾹질의 티니핑. 딸꾹질을 하게 만들어요." },
    { id: 36, name: "플라핑", nameEn: "Fibping", type: "일반", season: 1, domain: "규칙성", desc: "거짓말의 티니핑. 거짓말을 하게 만들어요." },
    { id: 37, name: "노라핑", nameEn: "Playing", type: "일반", season: 1, domain: "자료와 가능성", desc: "놀이의 티니핑. 놀기를 좋아해요." },
    { id: 38, name: "노리핑", nameEn: "Gameping", type: "일반", season: 1, domain: "자료와 가능성", desc: "게임의 티니핑. 게임을 사랑해요." },
    { id: 39, name: "아휴핑", nameEn: "Sighping", type: "일반", season: 1, domain: "수와 연산", desc: "한숨의 티니핑. 한숨을 자주 쉬어요." },
    { id: 40, name: "똑똑핑", nameEn: "Smartping", type: "일반", season: 1, domain: "수와 연산", desc: "똑똑함의 티니핑. 매우 영리해요." },
    { id: 41, name: "꽁꽁핑", nameEn: "Freezeping", type: "일반", season: 1, domain: "도형과 측정", desc: "얼음의 티니핑. 모든 것을 얼려요." },
    { id: 42, name: "찌릿핑", nameEn: "Sparkping", type: "일반", season: 1, domain: "도형과 측정", desc: "전기의 티니핑. 전기를 다룰 수 있어요." },
    { id: 43, name: "홀로핑", nameEn: "Lonelyping", type: "일반", season: 1, domain: "규칙성", desc: "외로움의 티니핑. 혼자 있는 것을 좋아해요." },

    // === 시즌 1 빌런핑 ===
    {
        id: 44, name: "키킹", nameEn: "Giggleping", type: "빌런", season: 1, domain: "규칙성",
        desc: "정체불명의 티니핑. 장난과 속임수를 좋아해요.",
        theme: "가면", personality: "장난스럽고 속임수를 좋아하는 수수께끼 캐릭터",
        ability: "일반핑들을 조종하고 혼란을 일으켜요",
        catchphrase: "키킥킥! 재밌겠다!",
        item: "장난 도구",
        trivia: "사실은 해피핑이 어둠에 물들어 변한 모습이에요"
    },
    {
        id: 45, name: "잘난핑", nameEn: "Egoping", type: "빌런", season: 1, domain: "자료와 가능성",
        desc: "이기심의 티니핑. 시즌 1의 최종 보스에요.",
        theme: "왕관", personality: "자기 자신만 최고라고 생각하는 이기적인 성격",
        ability: "다른 티니핑들의 힘을 빼앗고 조종해요",
        catchphrase: "내가 최고야! 다 내꺼야!",
        item: "이기심의 왕관",
        trivia: "시즌 1의 최종 보스로 등장하여 티니핑들과 대결해요"
    },

    // ===================================================================
    // 시즌 2: 반짝반짝 캐치! 티니핑 (2021)
    // ===================================================================

    // === 시즌 2 로열핑 (3) ===
    {
        id: 46, name: "조아핑", nameEn: "Joahping", type: "로열", season: 2, domain: "수와 연산",
        desc: "친절함의 티니핑. 따뜻하고 다정한 성격이에요.",
        theme: "에메랄드", personality: "사랑스럽고 따뜻하며 민감한 성격",
        ability: "마법의 브러쉬로 동물들과 대화하고, 대상을 친절하게 만들어요",
        catchphrase: "친절해져라, 조아~! 피리피리 매지컬 에메랄드!",
        item: "마법의 브러쉬",
        trivia: "3기 이후 자신의 보석으로 만들어진 반지를 메리루가 끼고 있어요"
    },
    {
        id: 47, name: "방글핑", nameEn: "Teeheeping", type: "로열", season: 2, domain: "수와 연산",
        desc: "기쁨/웃음의 티니핑. 털털한 보이쉬한 성격이에요.",
        theme: "루비", personality: "상냥하고 긍정적이며 항상 웃음을 전파해요",
        ability: "폭죽을 터트려 랜덤 아이템을 등장시켜요",
        catchphrase: "웃자, 방글! 피리피리 매지컬 루비!",
        item: "마법의 폭죽",
        trivia: "로미를 프린세스 루비로 변신시킬 수 있어요"
    },
    {
        id: 48, name: "믿어핑", nameEn: "Trustping", type: "로열", season: 2, domain: "도형과 측정",
        desc: "믿음의 티니핑. 귀엽고 순수한 성격이에요.",
        theme: "사파이어", personality: "믿음직하고 책임감이 강해요",
        ability: "마법의 우산으로 공격을 방어하고, 바람과 기상 현상을 만들어요",
        catchphrase: "믿어봐! 피리피리 매지컬 사파이어!",
        item: "마법의 우산",
        trivia: "로열핑들 중 유일한 남성 로열핑(청일점)이에요"
    },

    // === 시즌 2 보석 티니핑 (15) ===
    { id: 49, name: "까르핑", nameEn: "Giggleping", type: "일반", season: 2, domain: "수와 연산", desc: "웃음의 보석 티니핑. 깔깔 웃게 만들어요." },
    { id: 50, name: "아야핑", nameEn: "Ouchping", type: "일반", season: 2, domain: "수와 연산", desc: "아픔의 보석 티니핑. 아픔을 치료해줘요." },
    { id: 51, name: "소원핑", nameEn: "Wishping", type: "일반", season: 2, domain: "도형과 측정", desc: "소원의 보석 티니핑. 소원을 들어줘요." },
    { id: 52, name: "토닥핑", nameEn: "Comfortping", type: "일반", season: 2, domain: "도형과 측정", desc: "위로의 보석 티니핑. 따뜻하게 위로해줘요." },
    { id: 53, name: "쪼꼼핑", nameEn: "Tinyping", type: "일반", season: 2, domain: "도형과 측정", desc: "작음의 보석 티니핑. 모든 것을 작게 만들어요." },
    { id: 54, name: "싹싹핑", nameEn: "Cleanping", type: "일반", season: 2, domain: "규칙성", desc: "청소의 보석 티니핑. 깔끔하게 청소해요." },
    { id: 55, name: "맛나핑", nameEn: "Yummyping", type: "일반", season: 2, domain: "규칙성", desc: "맛의 보석 티니핑. 맛있는 것을 좋아해요." },
    { id: 56, name: "포근핑", nameEn: "Cozying", type: "일반", season: 2, domain: "규칙성", desc: "포근함의 보석 티니핑. 포근하고 따뜻해요." },
    { id: 57, name: "메모핑", nameEn: "Memoping", type: "일반", season: 2, domain: "자료와 가능성", desc: "메모의 보석 티니핑. 메모하는 것을 좋아해요." },
    { id: 58, name: "공쥬핑", nameEn: "Princessping", type: "일반", season: 2, domain: "자료와 가능성", desc: "공주의 보석 티니핑. 공주처럼 우아해요." },
    { id: 59, name: "짝짝핑", nameEn: "Clappping", type: "일반", season: 2, domain: "자료와 가능성", desc: "박수의 보석 티니핑. 박수로 응원해요." },
    { id: 60, name: "주네핑", nameEn: "Hungryping", type: "일반", season: 2, domain: "수와 연산", desc: "배고픔의 보석 티니핑. 항상 배가 고파요." },
    { id: 61, name: "뚝딱핑", nameEn: "Makeping", type: "일반", season: 2, domain: "수와 연산", desc: "만들기의 보석 티니핑. 무엇이든 뚝딱 만들어요." },
    { id: 62, name: "발레핑", nameEn: "Balletping", type: "일반", season: 2, domain: "도형과 측정", desc: "발레의 보석 티니핑. 우아하게 춤춰요." },
    { id: 63, name: "원더핑", nameEn: "Wonderping", type: "일반", season: 2, domain: "도형과 측정", desc: "궁금증의 보석 티니핑. 모든 것이 궁금해요." },

    // === 시즌 2 빌런핑 ===
    { id: 64, name: "다해핑", nameEn: "Greedyping", type: "빌런", season: 2, domain: "규칙성", desc: "욕심의 빌런 티니핑. 모든 것을 다 가지려고 해요." },
    { id: 65, name: "가면핑", nameEn: "Maskping", type: "빌런", season: 2, domain: "자료와 가능성", desc: "속임수의 빌런 티니핑. 가면으로 정체를 숨겨요." },

    // ===================================================================
    // 시즌 3: 알쏭달쏭 캐치! 티니핑 (2022)
    // ===================================================================

    // === 시즌 3 로열핑 (3) ===
    {
        id: 66, name: "꾸래핑", nameEn: "Okeydokeyping", type: "로열", season: 3, domain: "수와 연산",
        desc: "평화의 티니핑. 부드럽고 배려심이 깊은 성격이에요.",
        theme: "겨울/눈송이", personality: "순하고 차분하며 다른 이들을 잘 배려해요",
        ability: "로미를 프린세스 크리스탈로 변신시키고, 평화를 가져와요",
        catchphrase: "평화롭게 해결하자, 꾸래~",
        item: "마법의 눈꽃봉",
        trivia: "사계절 중 겨울을 상징하는 로열핑이에요"
    },
    {
        id: 67, name: "나나핑", nameEn: "Nanaping", type: "로열", season: 3, domain: "수와 연산",
        desc: "열정의 티니핑. 헌신적이고 자신감이 넘쳐요.",
        theme: "여름/태양", personality: "열정적이고 적극적이며 리더십이 있어요",
        ability: "로미를 프린세스 솔라리스로 변신시키고, 열정을 불태워요",
        catchphrase: "열정을 불태우자, 나나!",
        item: "마법의 태양봉",
        trivia: "사계절 중 여름을 상징하는 로열핑이에요"
    },
    {
        id: 68, name: "솔찌핑", nameEn: "Trueping", type: "로열", season: 3, domain: "도형과 측정",
        desc: "솔직함의 티니핑. 언제나 진실만을 말해요.",
        theme: "가을/구름", personality: "귀엽지만 투덜거리며, 거짓에 혐오감을 느껴요",
        ability: "로미를 프린세스 글로리아로 변신시키고, 진실을 밝혀요",
        catchphrase: "솔직히 말해! 솔찌!",
        item: "마법의 진실봉",
        trivia: "로열핑들 중 유일하게 안경을 쓴 남성 로열핑이에요"
    },

    // === 시즌 3 레전드핑 (1) ===
    {
        id: 69, name: "럭키핑", nameEn: "Luckyping", type: "전설", season: 3, domain: "규칙성",
        desc: "행운의 레전드 티니핑. 최초의 레전드핑이에요.",
        theme: "행운/클로버", personality: "상냥하고 친절하며 행운을 가져다줘요",
        ability: "행운의 숨소리로 행운을 전하고, 행운의 별을 조종해요",
        catchphrase: "행운을 빌어! 럭키럭키!",
        item: "행운의 별",
        trivia: "시리즈 최초의 레전드핑으로, 시즌 대부분 상자에 갇혀 있었어요"
    },

    // === 시즌 3 열쇠 티니핑 (15) ===
    { id: 70, name: "빨리핑", nameEn: "Rushping", type: "일반", season: 3, domain: "수와 연산", desc: "빠름의 열쇠 티니핑. 빨리빨리 서두르게 해요." },
    { id: 71, name: "얌얌핑", nameEn: "Yumyumping", type: "일반", season: 3, domain: "수와 연산", desc: "먹보의 열쇠 티니핑. 맛있는 음식을 찾아요." },
    { id: 72, name: "힘내핑", nameEn: "Cheerping", type: "일반", season: 3, domain: "도형과 측정", desc: "응원의 열쇠 티니핑. 힘을 북돋아줘요." },
    { id: 73, name: "뜨거핑", nameEn: "Hotping", type: "일반", season: 3, domain: "도형과 측정", desc: "뜨거움의 열쇠 티니핑. 열정을 불태워요." },
    { id: 74, name: "삐뽀핑", nameEn: "Rescueping", type: "일반", season: 3, domain: "도형과 측정", desc: "구조의 열쇠 티니핑. 위험에서 구해줘요." },
    { id: 75, name: "고쳐핑", nameEn: "Fixping", type: "일반", season: 3, domain: "규칙성", desc: "수리의 열쇠 티니핑. 고장난 것을 고쳐요." },
    { id: 76, name: "아라핑", nameEn: "Discoverping", type: "일반", season: 3, domain: "규칙성", desc: "탐구의 열쇠 티니핑. 새로운 것을 알아내요." },
    { id: 77, name: "패션핑", nameEn: "Fashionping", type: "일반", season: 3, domain: "규칙성", desc: "패션의 열쇠 티니핑. 멋지게 꾸며줘요." },
    { id: 78, name: "꼼딱핑", nameEn: "Freezeping", type: "일반", season: 3, domain: "자료와 가능성", desc: "멈춤의 열쇠 티니핑. 모든 것을 멈춰요." },
    { id: 79, name: "퐁당핑", nameEn: "Splashping", type: "일반", season: 3, domain: "자료와 가능성", desc: "물의 열쇠 티니핑. 물을 다룰 수 있어요." },
    { id: 80, name: "파티핑", nameEn: "Partyping", type: "일반", season: 3, domain: "자료와 가능성", desc: "파티의 열쇠 티니핑. 신나는 파티를 열어요." },
    { id: 81, name: "꾸며핑", nameEn: "Decorping", type: "일반", season: 3, domain: "수와 연산", desc: "꾸밈의 열쇠 티니핑. 예쁘게 꾸며요." },
    { id: 82, name: "삐짐핑", nameEn: "Sulkyping", type: "일반", season: 3, domain: "수와 연산", desc: "삐침의 열쇠 티니핑. 쉽게 삐쳐요." },
    { id: 83, name: "아아핑", nameEn: "Singping", type: "일반", season: 3, domain: "도형과 측정", desc: "노래의 열쇠 티니핑. 아름다운 노래를 불러요." },
    { id: 84, name: "빙글핑", nameEn: "Spinping", type: "일반", season: 3, domain: "도형과 측정", desc: "회전의 열쇠 티니핑. 빙글빙글 돌아요." },

    // ===================================================================
    // 시즌 4: 새콤달콤 캐치! 티니핑 (2023)
    // ===================================================================

    // === 시즌 4 로열핑 (3) ===
    {
        id: 85, name: "젤리핑", nameEn: "Jellyping", type: "로열", season: 4, domain: "수와 연산",
        desc: "재미의 젤리 테마 로열핑. 활기차고 엉뚱해요.",
        theme: "젤리", personality: "지치지 않는 발랄함과 재미를 추구해요",
        ability: "젤리처럼 탱글탱글한 마법으로 즐거움을 선사해요",
        catchphrase: "젤리젤리! 탱글탱글!",
        item: "마법의 젤리봉",
        trivia: "디저트 공장에서 젤리 장식을 담당해요"
    },
    {
        id: 86, name: "말랑핑", nameEn: "Fluffyping", type: "로열", season: 4, domain: "수와 연산",
        desc: "순수함의 솜사탕 테마 로열핑. 모두에게 친절해요.",
        theme: "솜사탕", personality: "다정하고 상냥하며 순수한 마음을 가졌어요",
        ability: "마법의 솜사탕 구름을 만들어 이동하고 보호해요",
        catchphrase: "말랑말랑! 포근해져라!",
        item: "마법의 솜사탕 항아리",
        trivia: "솜사탕같은 귀를 가진 여성 로열핑이에요"
    },
    {
        id: 87, name: "샤샤핑", nameEn: "Shashaping", type: "로열", season: 4, domain: "도형과 측정",
        desc: "긍정의 아이스크림 테마 로열핑. 언제나 긍정적이에요.",
        theme: "아이스크림", personality: "낙관적이고 긍정적인 마음으로 모두를 이끌어요",
        ability: "디저트 생산을 계획하고 아이스크림 마법을 사용해요",
        catchphrase: "긍정긍정! 샤샤샤!",
        item: "아이스크림 트럭",
        trivia: "아이스크림 콘을 머리에 꽂고 아이스크림 장사를 해요"
    },

    // === 시즌 4 레전드핑 (2) ===
    {
        id: 88, name: "스위핑", nameEn: "Sweetping", type: "전설", season: 4, domain: "규칙성",
        desc: "달콤함의 레전드 스위트 테마 티니핑이에요.",
        theme: "케이크", personality: "달콤하고 상냥하며 모든 이에게 단맛을 전해줘요",
        ability: "달콤한 마법으로 사람들을 행복하게 해요. 그 힘은 영원해요",
        catchphrase: "달콤해져라! 스위트스위트!",
        item: "마법의 케이크봉",
        trivia: "시리즈 최초의 2인 레전드핑 중 한 명이에요"
    },
    {
        id: 89, name: "포실핑", nameEn: "Posilping", type: "전설", season: 4, domain: "규칙성",
        desc: "포근함의 레전드 티니핑. 따뜻한 느낌을 줘요.",
        theme: "푸딩", personality: "따뜻하고 편안한 느낌을 주며 포용력이 넘쳐요",
        ability: "포근한 마법으로 마음을 편안하게 해줘요",
        catchphrase: "포근해져라! 포실포실!",
        item: "마법의 푸딩봉",
        trivia: "시리즈 최초의 2인 레전드핑 중 한 명이에요"
    },

    // === 시즌 4 디저트 티니핑 (15) ===
    { id: 90, name: "캔디핑", nameEn: "Candyping", type: "일반", season: 4, domain: "수와 연산", desc: "사탕의 디저트 티니핑. 달콤한 사탕을 나눠줘요." },
    { id: 91, name: "머랭핑", nameEn: "Meringueping", type: "일반", season: 4, domain: "수와 연산", desc: "머랭의 디저트 티니핑. 달콤하고 부드러워요." },
    { id: 92, name: "샌드핑", nameEn: "Sandwichping", type: "일반", season: 4, domain: "도형과 측정", desc: "샌드위치의 디저트 티니핑. 맛있는 샌드위치를 만들어요." },
    { id: 93, name: "또너핑", nameEn: "Donutping", type: "일반", season: 4, domain: "도형과 측정", desc: "도넛의 디저트 티니핑. 동그란 도넛을 좋아해요." },
    { id: 94, name: "와플핑", nameEn: "Waffleping", type: "일반", season: 4, domain: "도형과 측정", desc: "와플의 디저트 티니핑. 바삭한 와플을 만들어요." },
    { id: 95, name: "롤링핑", nameEn: "Rollcakeping", type: "일반", season: 4, domain: "규칙성", desc: "롤케이크의 디저트 티니핑. 맛있는 롤케이크에요." },
    { id: 96, name: "마카핑", nameEn: "Macaronping", type: "일반", season: 4, domain: "규칙성", desc: "마카롱의 디저트 티니핑. 예쁜 마카롱을 만들어요." },
    { id: 97, name: "핫케핑", nameEn: "Pancakeping", type: "일반", season: 4, domain: "자료와 가능성", desc: "핫케이크의 디저트 티니핑. 폭신한 핫케이크를 만들어요." },
    { id: 98, name: "커핑", nameEn: "Cupcakeping", type: "일반", season: 4, domain: "자료와 가능성", desc: "컵케이크의 디저트 티니핑. 귀여운 컵케이크에요." },
    { id: 99, name: "머핑", nameEn: "Muffinping", type: "일반", season: 4, domain: "자료와 가능성", desc: "머핀의 디저트 티니핑. 따뜻한 머핀을 좋아해요." },
    { id: 100, name: "요거핑", nameEn: "Yogurtping", type: "일반", season: 4, domain: "수와 연산", desc: "요거트의 디저트 티니핑. 상큼한 요거트에요." },
    { id: 101, name: "눈꽃핑", nameEn: "Snowflakeping", type: "일반", season: 4, domain: "수와 연산", desc: "빙수의 디저트 티니핑. 시원한 빙수를 만들어요." },
    { id: 102, name: "푸딩핑", nameEn: "Puddingping", type: "일반", season: 4, domain: "도형과 측정", desc: "푸딩의 디저트 티니핑. 말랑한 푸딩이에요." },
    { id: 103, name: "멜로핑", nameEn: "Melonping", type: "일반", season: 4, domain: "도형과 측정", desc: "멜론의 디저트 티니핑. 달콤한 멜론을 좋아해요." },
    { id: 104, name: "쪼꼬핑", nameEn: "Chocolateping", type: "일반", season: 4, domain: "규칙성", desc: "초콜릿의 디저트 티니핑. 달콤한 초콜릿이에요." },

    // === 시즌 4 빌런핑 ===
    { id: 105, name: "뿌뿌핑", nameEn: "Ppuppuping", type: "빌런", season: 4, domain: "자료와 가능성", desc: "욕심쟁이 빌런 티니핑. 뿌린다는 이름처럼 문제를 뿌려요." },

    // ===================================================================
    // 시즌 5: 슈팅스타 캐치! 티니핑 (2024)
    // ===================================================================

    // === 시즌 5 로열핑 (4) ===
    {
        id: 106, name: "빛나핑", nameEn: "Shimmerping", type: "로열", season: 5, domain: "수와 연산",
        desc: "치유의 스타 로열핑. 상냥하고 감성적이에요.",
        theme: "빛/별", personality: "부드럽고 감성적이며 상냥하고 친절해요",
        ability: "마법의 플루트로 상처받은 마음을 치유하고, 얼음 속에 가둘 수 있어요",
        catchphrase: "치유해줄게! 빛나빛나!",
        item: "마법의 플루트",
        trivia: "음표 모양의 팅클퍼프를 발사해서 공격할 수 있어요"
    },
    {
        id: 107, name: "초롱핑", nameEn: "Sparkleping", type: "로열", season: 5, domain: "수와 연산",
        desc: "소망의 스타 로열핑. 자신감 넘치고 활발해요.",
        theme: "별/반짝임", personality: "자존감이 높고 발랄하며 당당해요",
        ability: "마법의 별 머리핀을 부메랑처럼 던지고, 실드로 방어해요",
        catchphrase: "소망을 이뤄줄게! 초롱초롱!",
        item: "마법의 별 머리핀",
        trivia: "두려움이 없고 당당한 성격의 스타 로열핑이에요"
    },
    {
        id: 108, name: "빤짝핑", nameEn: "Twinkleping", type: "로열", season: 5, domain: "도형과 측정",
        desc: "밝음의 스타 로열핑. 해맑고 엉뚱해요.",
        theme: "빛/반짝임", personality: "순진하고 아이 같지만 똑똒한 면도 있어요",
        ability: "밝은 에너지로 주변을 환하게 비춰요",
        catchphrase: "반짝반짝! 빤짝빤짝!",
        item: "마법의 빛봉",
        trivia: "우주 쓰레기로 간이 우주선을 만들 정도로 손재주가 있어요"
    },
    {
        id: 109, name: "프린스핑", nameEn: "Princeping", type: "로열", season: 5, domain: "도형과 측정",
        desc: "탁월함의 스타 로열핑. 고귀하지만 슬픈 과거가 있어요.",
        theme: "왕자/유니콘", personality: "충성스럽고 헌신적이며 고귀한 마음을 가졌어요",
        ability: "마법의 요술봉으로 유니콘을 타고 비행하며 공격과 방어를 해요",
        catchphrase: "탁월하게! 프린스!",
        item: "마법의 요술봉",
        trivia: "본래 왕자핑이었으나 오로라핑과 헤어진 후 나그네핑이 되었다가 돌아왔어요"
    },

    // === 시즌 5 레전드핑 (1) ===
    {
        id: 110, name: "오로라핑", nameEn: "Auroraping", type: "전설", season: 5, domain: "규칙성",
        desc: "약속의 레전드 티니핑. 별을 수호해요.",
        theme: "오로라/별", personality: "상냥하고 친절하며 별들을 깊이 사랑해요",
        ability: "등의 날개로 자유롭게 날고, 마법의 활과 화살로 오로라를 발산해요",
        catchphrase: "약속을 지킬게! 오로라!",
        item: "마법의 활과 화살",
        trivia: "티니핑 최초의 네 글자 티니핑이자, 왕자핑과 특별한 인연이 있어요"
    },

    // === 시즌 5 스타 티니핑 (18) ===
    { id: 111, name: "나눔핑", nameEn: "Shareping", type: "일반", season: 5, domain: "수와 연산", desc: "나눔의 스타 티니핑. 나누는 기쁨을 알려줘요." },
    { id: 112, name: "함께핑", nameEn: "Togetherping", type: "일반", season: 5, domain: "수와 연산", desc: "함께의 스타 티니핑. 함께하는 것의 소중함을 알아요." },
    { id: 113, name: "훌라핑", nameEn: "Hulaping", type: "일반", season: 5, domain: "도형과 측정", desc: "훌라의 스타 티니핑. 훌라 춤을 춰요." },
    { id: 114, name: "댄스핑", nameEn: "Danceping", type: "일반", season: 5, domain: "도형과 측정", desc: "춤의 스타 티니핑. 춤추는 것을 사랑해요." },
    { id: 115, name: "깡총핑", nameEn: "Hoppping", type: "일반", season: 5, domain: "도형과 측정", desc: "점프의 스타 티니핑. 깡총깡총 뛰어다녀요." },
    { id: 116, name: "뽀뽀핑", nameEn: "Kissping", type: "일반", season: 5, domain: "규칙성", desc: "뽀뽀의 스타 티니핑. 뽀뽀로 사랑을 전해요." },
    { id: 117, name: "고고핑", nameEn: "Gogoing", type: "일반", season: 5, domain: "규칙성", desc: "달리기의 스타 티니핑. 고고! 빠르게 달려요." },
    { id: 118, name: "루루핑", nameEn: "Luluping", type: "일반", season: 5, domain: "규칙성", desc: "노래의 스타 티니핑. 아름다운 노래를 불러요." },
    { id: 119, name: "유리핑", nameEn: "Glassping", type: "일반", season: 5, domain: "자료와 가능성", desc: "유리의 스타 티니핑. 투명하고 맑은 마음이에요." },
    { id: 120, name: "몰래핑", nameEn: "Sneakyping", type: "일반", season: 5, domain: "자료와 가능성", desc: "몰래의 스타 티니핑. 살금살금 몰래 다녀요." },
    { id: 121, name: "뿌쵸핑", nameEn: "Proudping", type: "일반", season: 5, domain: "자료와 가능성", desc: "뿌듯함의 스타 티니핑. 뿌듯한 기분을 느끼게 해요." },
    { id: 122, name: "여우핑", nameEn: "Foxyping", type: "일반", season: 5, domain: "수와 연산", desc: "여우의 스타 티니핑. 영리하고 귀여운 여우에요." },
    { id: 123, name: "뽀송핑", nameEn: "Fluffyping", type: "일반", season: 5, domain: "수와 연산", desc: "보송함의 스타 티니핑. 뽀송뽀송 부드러워요." },
    { id: 124, name: "고마핑", nameEn: "Thanksping", type: "일반", season: 5, domain: "도형과 측정", desc: "감사의 스타 티니핑. 감사하는 마음을 전해요." },
    { id: 125, name: "아롱핑", nameEn: "Patternping", type: "일반", season: 5, domain: "도형과 측정", desc: "무늬의 스타 티니핑. 예쁜 무늬를 만들어요." },
    { id: 126, name: "다롱핑", nameEn: "Sweetyping", type: "일반", season: 5, domain: "규칙성", desc: "달콤함의 스타 티니핑. 달콤한 기분을 선물해요." },
    { id: 127, name: "딩동핑", nameEn: "Dingdongping", type: "일반", season: 5, domain: "규칙성", desc: "초인종의 스타 티니핑. 딩동! 방문을 알려요." },
    { id: 128, name: "나그네핑", nameEn: "Wanderping", type: "일반", season: 5, domain: "자료와 가능성", desc: "방랑의 스타 티니핑. 여행을 좋아해요." },

    // ===================================================================
    // 시즌 6: 프린세스 캐치! 티니핑 (2025)
    // ===================================================================

    // === 시즌 6 로열핑 (3) ===
    {
        id: 129, name: "사뿐핑", nameEn: "Graceping", type: "로열", season: 6, domain: "수와 연산",
        desc: "우아함의 프린세스 로열핑. 강한 마음을 가졌어요.",
        theme: "우아함/발레", personality: "무뚝뚝하고 쿨하지만 속마음은 따뜻해요",
        ability: "우아한 마법으로 적을 제압하고 친구를 보호해요",
        catchphrase: "우아하게! 사뿐사뿐!",
        item: "마법의 발레 슈즈",
        trivia: "처음으로 무뚝뚝한 성격의 파란색 여성 로열핑이에요"
    },
    {
        id: 130, name: "아름핑", nameEn: "Claireping", type: "로열", season: 6, domain: "수와 연산",
        desc: "소망의 프린세스 로열핑. 순수하고 순진해요.",
        theme: "아름다움/꽃", personality: "순수하고 순진하며 모든 것을 아름답게 봐요",
        ability: "아름다움의 마법으로 주변을 환하게 만들어요",
        catchphrase: "아름다워져라! 아름아름!",
        item: "마법의 꽃 왕관",
        trivia: "순진하지만 친구들을 진심으로 아끼는 로열핑이에요"
    },
    {
        id: 131, name: "뽀니핑", nameEn: "Bonnyping", type: "로열", season: 6, domain: "도형과 측정",
        desc: "밝음의 프린세스 로열핑. 쾌활하고 외향적이에요.",
        theme: "자신감/리본", personality: "쾌활하고 외향적이며 책임감이 강해요",
        ability: "밝은 에너지로 친구들을 이끌고 보호해요",
        catchphrase: "자신있게! 뽀니뽀니!",
        item: "마법의 리본봉",
        trivia: "말썽쟁이처럼 보이지만 하츄핑 다음으로 책임감이 강해요"
    },

    // === 시즌 6 레전드핑 (2) ===
    {
        id: 132, name: "다이아나핑", nameEn: "Dianaping", type: "전설", season: 6, domain: "규칙성",
        desc: "영광의 레전드 프린세스 티니핑. 프린세스 협회 의장이에요.",
        theme: "달/밤", personality: "위엄있고 품위있으며 모든 티니핑에게 존경받아요",
        ability: "달과 밤의 힘으로 프린세스 협회를 이끌어요",
        catchphrase: "영광을 위해! 다이아나!",
        item: "달의 지팡이",
        trivia: "이클립스핑의 쌍둥이 언니이자 시리즈 최초의 5음절 레전드핑이에요"
    },
    {
        id: 133, name: "이클립스핑", nameEn: "Eclipseping", type: "빌런", season: 6, domain: "자료와 가능성",
        desc: "고독의 레전드 프린세스 티니핑. 시즌 6의 메인 빌런이에요.",
        theme: "일식/어둠", personality: "제멋대로이지만 사실은 외로움에 삐뚤어진 마음이에요",
        ability: "마법의 거울로 상대를 봉인하고 어둠의 마법을 사용해요",
        catchphrase: "다 내꺼야! 이클립스!",
        item: "마법의 거울",
        trivia: "다이아나핑의 쌍둥이 동생으로, 언니에게 소홀히 받아 타락했어요"
    },

    // === 시즌 6 프린세스 티니핑 (15) ===
    { id: 134, name: "뽀득핑", nameEn: "Squeakyping", type: "일반", season: 6, domain: "수와 연산", desc: "깨끗함의 프린세스 티니핑. 뽀드득 깨끗하게 만들어요." },
    { id: 135, name: "차밍핑", nameEn: "Charmingping", type: "일반", season: 6, domain: "수와 연산", desc: "매력의 프린세스 티니핑. 차밍한 매력이 넘쳐요." },
    { id: 136, name: "나비핑", nameEn: "Butterflyping", type: "일반", season: 6, domain: "도형과 측정", desc: "나비의 프린세스 티니핑. 아름다운 나비 날개를 가졌어요." },
    { id: 137, name: "실크핑", nameEn: "Silkping", type: "일반", season: 6, domain: "도형과 측정", desc: "부드러움의 프린세스 티니핑. 실크처럼 부드러워요." },
    { id: 138, name: "샤를핑", nameEn: "Nobleping", type: "일반", season: 6, domain: "도형과 측정", desc: "고귀함의 프린세스 티니핑. 고귀하고 품위있어요." },
    { id: 139, name: "트롯핑", nameEn: "Trotping", type: "일반", season: 6, domain: "규칙성", desc: "노래의 프린세스 티니핑. 트로트 노래를 잘 불러요." },
    { id: 140, name: "깨굴핑", nameEn: "Frogping", type: "일반", season: 6, domain: "규칙성", desc: "개구리의 프린세스 티니핑. 개구리 왕자를 기다려요." },
    { id: 141, name: "스노우핑", nameEn: "Snowping", type: "일반", season: 6, domain: "규칙성", desc: "눈의 프린세스 티니핑. 눈처럼 하얗고 순수해요." },
    { id: 142, name: "이슬핑", nameEn: "Dewping", type: "일반", season: 6, domain: "자료와 가능성", desc: "이슬의 프린세스 티니핑. 아침 이슬처럼 맑아요." },
    { id: 143, name: "쿨쿨핑", nameEn: "Sleepyping", type: "일반", season: 6, domain: "자료와 가능성", desc: "잠의 프린세스 티니핑. 쿨쿨 잠을 잘 자요." },
    { id: 144, name: "슈슈핑", nameEn: "Shoeping", type: "일반", season: 6, domain: "자료와 가능성", desc: "구두의 프린세스 티니핑. 유리 구두를 좋아해요." },
    { id: 145, name: "큐핑", nameEn: "Cupidping", type: "일반", season: 6, domain: "수와 연산", desc: "사랑의 화살 프린세스 티니핑. 큐피드처럼 사랑의 화살을 쏴요." },
    { id: 146, name: "롱롱핑", nameEn: "Rapunzelping", type: "일반", season: 6, domain: "수와 연산", desc: "긴 머리의 프린세스 티니핑. 라푼젤처럼 긴 머리를 가졌어요." },
    { id: 147, name: "야옹핑", nameEn: "Kittyping", type: "일반", season: 6, domain: "도형과 측정", desc: "고양이의 프린세스 티니핑. 야옹야옹 귀여운 고양이에요." },
    { id: 148, name: "젠틀핑", nameEn: "Gentleping", type: "일반", season: 6, domain: "도형과 측정", desc: "신사의 프린세스 티니핑. 신사처럼 예의 바르고 젠틀해요." }
];

const tinipingImagesByGroup = {};

// 로컬 이미지 파일 매핑 (다운로드된 이미지 파일들)
const localImageMap = {
    // 시즌 1 로열핑
    "하츄핑": "시즌1하츄핑.png",
    "바로핑": "바로핑.png",
    "아자핑": "아자핑.png",
    "차차핑": "차차핑.png",
    "라라핑": "라라핑.png",
    "해피핑": "해피핑.png",

    // 시즌 1 빌런핑
    "키킹": "키킹.png",
    "잘난핑": "잘난핑.png",

    // 시즌 2 로열핑
    "조아핑": "조아핑.png",
    "방글핑": "방글핑.png",
    "믿어핑": "믿어핑.png",

    // 시즌 3 로열핑 & 레전드핑
    "꾸래핑": "꾸래핑.png",
    "나나핑": "나나핑.png",
    "솔찌핑": "솔찌핑.png",
    "럭키핑": "럭키핑.png",

    // 시즌 4 로열핑 & 레전드핑
    "포실핑": "포실핑.png",
    "말랑핑": "말랑핑.png",
    "샤샤핑": "샤샤핑.png",
    "젤리핑": "젤리핑.png",
    "스위핑": "스위핑.png",

    // 시즌 5 로열핑 & 레전드핑
    "빛나핑": "빛나핑.png",
    "초롱핑": "초롱핑.png",
    "빤짝핑": "빤짝핑.png",
    "프린스핑": "프린스핑.png",
    "오로라핑": "오로라핑.png",

    // 시즌 6 로열핑 & 레전드핑
    "사뿐핑": "사뿐핑.png",
    "아름핑": "아름핑.png",
    "뽀니핑": "뽀니핑.png",
    "이클립스핑": "이클핑.png",
    "다이아나핑": "다이아나핑.png",

    // 추가 다운로드 이미지
    "탕이핑": "탕이핑.png",
    "푸핑": "푸핑.png",
    "온리핑": "온리핑.png"
};

// 시즌별 하츄핑 변신 버전
const seasonHatchupingMap = {
    1: "시즌1하츄핑.png",
    2: "반짝하츄핑.png",
    3: "플로라하츄핑.png",
    4: "베리하츄핑.png",
    5: "스타하츄핑.png",
    6: "하츄핑.png"
};

function detectMimeTypeFromBase64(data) {
    if (!data) return null;
    if (data.startsWith('/9j/')) return 'image/jpeg';
    if (data.startsWith('iVBOR')) return 'image/png';
    if (data.startsWith('R0lGOD')) return 'image/gif';
    if (data.startsWith('UklGR')) return 'image/webp';
    return 'image/png';
}

function normalizeImageSource(raw) {
    if (typeof raw !== 'string') return null;
    const trimmed = raw.trim();
    if (!trimmed) return null;
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    if (trimmed.startsWith('data:')) return trimmed;
    const mime = detectMimeTypeFromBase64(trimmed);
    return `data:${mime};base64,${trimmed}`;
}

function buildNameToImageMap() {
    const map = new Map();
    const groups = [
        "로열 프린세스 티니핑",
        "전설 티니핑",
        "서포팅 티니핑",
        "일반 프린세스 티니핑"
    ];
    for (const g of groups) {
        const arr = tinipingImagesByGroup?.[g] || [];
        for (const it of arr) {
            const name = it["이름"];
            const imageData = it["이미지"];
            if (!name || !imageData) continue;
            const url = normalizeImageSource(imageData);
            if (!url) {
                console.warn('이미지 데이터 파싱 실패:', name);
                continue;
            }
            map.set(name, url);
        }
    }
    return map;
}

function preloadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        if (!src.startsWith('data:')) {
            img.crossOrigin = 'anonymous';
        }
        img.onload = () => resolve(img);
        img.onerror = () => {
            console.warn('이미지 로드 실패:', src.substring(0, 100) + '...');
            resolve(null);
        };
        img.src = src;
    });
}

async function loadTinipingImages() {
    // 1단계: 로컬 이미지 먼저 로드
    const localImagePromises = [];
    const localLoadedNames = new Set();

    for (const [name, filename] of Object.entries(localImageMap)) {
        const imagePath = `./images/tinipings/${filename}`;
        const promise = preloadImage(imagePath).then(img => {
            if (img) {
                IMAGE_CACHE.set(name, img);
                NAME2IMG.set(name, imagePath);
                localLoadedNames.add(name);
            }
        });
        localImagePromises.push(promise);
    }

    // 시즌별 하츄핑 이미지도 로드
    for (const [season, filename] of Object.entries(seasonHatchupingMap)) {
        const imagePath = `./images/tinipings/${filename}`;
        const seasonKey = `하츄핑_시즌${season}`;
        const promise = preloadImage(imagePath).then(img => {
            if (img) {
                IMAGE_CACHE.set(seasonKey, img);
                NAME2IMG.set(seasonKey, imagePath);
            }
        });
        localImagePromises.push(promise);
    }

    await Promise.all(localImagePromises);
    console.log('로컬 이미지 로드 완료:', localLoadedNames.size, '개');

    // 2단계: base64 JSON에서 추가 이미지 로드 (로컬에 없는 것만)
    let loadedData = null;
    try {
        const response = await fetch('./teenieping_images_base64.json');
        if (response.ok) {
            loadedData = await response.json();
            Object.assign(tinipingImagesByGroup, loadedData);
            console.log('teenieping_images_base64.json 로드 성공');
        }
    } catch (error) {
        console.warn('이미지 JSON 로드 오류 (선택적):', error.message);
    }

    // 기존 buildNameToImageMap 실행 (로컬에 없는 이미지만 추가)
    const jsonMap = buildNameToImageMap();
    jsonMap.forEach((src, name) => {
        if (!NAME2IMG.has(name)) {
            NAME2IMG.set(name, src);
        }
    });

    // base64 이미지 프리로드
    const base64Promises = [];
    NAME2IMG.forEach((src, name) => {
        if (!IMAGE_CACHE.has(name)) {
            const promise = preloadImage(src).then(img => {
                if (img) {
                    IMAGE_CACHE.set(name, img);
                }
            });
            base64Promises.push(promise);
        }
    });

    await Promise.all(base64Promises);

    // 이미지가 없는 티니핑은 경고만 출력 (정상 동작에는 영향 없음)
    const missingNames = baseTinipings.filter(t => !NAME2IMG.has(t.name)).map(t => t.name);
    if (missingNames.length) {
        console.log(`이미지 미보유 티니핑 (${missingNames.length}개):`, missingNames.slice(0, 5).join(', ') + (missingNames.length > 5 ? '...' : ''));
    }

    TINIPINGS = baseTinipings.map(t => ({
        ...t,
        image: NAME2IMG.get(t.name) || null,
        imageObj: IMAGE_CACHE.get(t.name) || null
    }));

    console.log('티니핑 이미지 로드 완료:', IMAGE_CACHE.size, '/', baseTinipings.length, '개');
}

async function loadEncyclopedia() {
    // 새로운 종합 도감 파일 먼저 시도, 실패시 기존 파일 사용
    const files = ['teenieping_encyclopedia_full.json', 'teenieping_encyclopedia_verified.json'];

    for (const file of files) {
        try {
            const response = await fetch(file);
            if (response.ok) {
                ENCYCLOPEDIA = await response.json();
                console.log(`티니핑 도감 데이터 로드 완료 (${file}):`, ENCYCLOPEDIA.length, '개');
                return;
            }
        } catch (e) {
            console.warn(`도감 파일 로드 실패 (${file}):`, e.message);
        }
    }

    console.warn('모든 도감 데이터 로드 실패');
}
