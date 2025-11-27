/* =========================================================================
   데이터: 티니핑 메타(이름·유형·설명) + 이미지 로딩
   ========================================================================= */
const baseTinipings = [
    { id: 1, name: "하츄핑", type: "로열", desc: "사랑의 티니핑" },
    { id: 2, name: "사뿐핑", type: "로열", desc: "우아함의 티니핑" },
    { id: 3, name: "아름핑", type: "로열", desc: "아름다움의 티니핑" },
    { id: 4, name: "뽀니핑", type: "로열", desc: "자신감의 티니핑" },
    { id: 5, name: "이클립스핑", type: "전설", desc: "어둠을 지배하는 전설의 티니핑" },
    { id: 6, name: "다이아나핑", type: "전설", desc: "밤과 달의 여신" },
    { id: 7, name: "해핑", type: "서포팅", desc: "행복의 티니핑" },
    { id: 8, name: "포실핑", type: "서포팅", desc: "순수의 티니핑" },
    { id: 9, name: "깡총핑", type: "서포팅", desc: "투지의 티니핑" },
    { id: 10, name: "뽀득핑", type: "일반", desc: "상쾌함의 티니핑" },
    { id: 11, name: "차밍핑", type: "일반", desc: "매력과 장난기의 티니핑" },
    { id: 12, name: "나비핑", type: "일반", desc: "가벼움의 티니핑" },
    { id: 13, name: "실크핑", type: "일반", desc: "모험의 티니핑" },
    { id: 14, name: "샤를핑", type: "일반", desc: "명예의 티니핑" },
    { id: 15, name: "트롯핑", type: "일반", desc: "흥겨움의 티니핑" },
    { id: 16, name: "깨굴핑", type: "일반", desc: "교활함의 티니핑" },
    { id: 17, name: "스노우핑", type: "일반", desc: "빙결의 티니핑" },
    { id: 18, name: "이슬핑", type: "일반", desc: "순수함의 티니핑" },
    { id: 19, name: "쿨쿨핑", type: "일반", desc: "잠의 티니핑" },
    { id: 20, name: "슈슈핑", type: "일반", desc: "성실의 티니핑" },
    { id: 21, name: "큐핑", type: "일반", desc: "짝사랑의 티니핑" },
    { id: 22, name: "롱롱핑", type: "일반", desc: "성장의 티니핑" },
    { id: 23, name: "야옹핑", type: "일반", desc: "도도함의 티니핑" },
    { id: 24, name: "젠틀핑", type: "일반", desc: "정중함의 티니핑" }
];

const tinipingImagesByGroup = {};

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
    let loadedData = null;
    try {
        const response = await fetch('./teenieping_images_base64.json');
        if (!response.ok) {
            throw new Error(`JSON 404/네트워크 오류: ${response.status} ${response.url}`);
        }
        loadedData = await response.json();
    } catch (error) {
        console.warn('이미지 JSON 로드 오류:', error);
        showGlobalError(error);
    }

    if (loadedData) {
        Object.assign(tinipingImagesByGroup, loadedData);
        console.log('teenieping_images_base64.json 로드 성공');
    } else {
        console.warn('teenieping_images_base64.json 로드 실패');
    }

    NAME2IMG = buildNameToImageMap();

    const missingNames = baseTinipings.filter(t => !NAME2IMG.has(t.name)).map(t => t.name);
    if (missingNames.length) {
        const message = `Base64 이미지 누락: ${missingNames.join(', ')}`;
        console.warn(message);
    }

    const imagePromises = [];
    NAME2IMG.forEach((src, name) => {
        const promise = preloadImage(src).then(img => {
            if (img) {
                IMAGE_CACHE.set(name, img);
            }
        });
        imagePromises.push(promise);
    });

    await Promise.all(imagePromises);

    TINIPINGS = baseTinipings.map(t => ({
        ...t,
        image: NAME2IMG.get(t.name) || null,
        imageObj: IMAGE_CACHE.get(t.name) || null
    }));

    console.log('티니핑 이미지 로드 완료:', IMAGE_CACHE.size, '/', baseTinipings.length, '개');
}

async function loadEncyclopedia() {
    try {
        const response = await fetch('teenieping_encyclopedia_verified.json');
        if (response.ok) {
            ENCYCLOPEDIA = await response.json();
            console.log('티니핑 도감 데이터 로드 완료:', ENCYCLOPEDIA.length, '개');
        } else {
            console.warn('도감 데이터 로드 실패');
        }
    } catch (e) {
        console.error('도감 데이터 로드 오류:', e);
    }
}
