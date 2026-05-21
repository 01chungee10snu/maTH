/* =========================================================================
   게임 로직 및 렌더링
   ========================================================================= */

const IRT_ACTIVE_TOPIC = 'k12_math';

if (ERROR_BOX) {
    ERROR_BOX.setAttribute('aria-hidden', 'true');
}

function extractErrorMessage(error) {
    if (error == null) return '알 수 없는 오류가 발생했어요.';
    if (typeof error === 'string') return error;
    if (typeof error.message === 'string' && error.message.trim()) return error.message;
    if (typeof error.status !== 'undefined' && error?.url) {
        return `${error.status} ${error.url}`;
    }
    try {
        return JSON.stringify(error);
    } catch (_) {
        return String(error);
    }
}

function showGlobalError(error) {
    if (!ERROR_BOX) return;
    const message = extractErrorMessage(error);
    if (!message || shownErrorMessages.has(message)) return;
    shownErrorMessages.add(message);
    ERROR_BOX.textContent = `[오류] ${message}`;
    ERROR_BOX.style.display = 'block';
    ERROR_BOX.setAttribute('aria-hidden', 'false');
    console.error(error);
}

window.addEventListener('error', evt => {
    const err = evt?.error || evt?.message || evt;
    showGlobalError(err);
});

window.addEventListener('unhandledrejection', evt => {
    const reason = evt?.reason || '비동기 처리 중 알 수 없는 오류가 발생했어요.';
    showGlobalError(reason);
});

function getHomeLayout(width) {
    const titleY = Math.round(60 * SCALE);
    const subtitleY = Math.round(90 * SCALE);
    const startY = Math.round(120 * SCALE);
    const gap = Math.max(8, Math.round(12 * SCALE));
    const cardPadding = Math.round(20 * SCALE);
    const cardMargin = Math.round(20 * SCALE);
    const availableWidth = Math.max(160, width - cardMargin * 2);
    const maxCols = Math.max(1, Math.min(7, TINIPINGS.length || 1));
    const minTileSize = Math.max(48, Math.round(56 * SCALE));
    const maxTileSize = Math.round(88 * SCALE);

    let cols = Math.max(1, Math.min(maxCols, Math.floor((availableWidth + gap) / (minTileSize + gap))));
    let tileSize = Math.floor((availableWidth - (cols - 1) * gap) / cols);
    while (cols > 1 && tileSize < minTileSize) {
        cols -= 1;
        tileSize = Math.floor((availableWidth - (cols - 1) * gap) / cols);
    }
    tileSize = Math.min(maxTileSize, tileSize);

    const rows = Math.ceil(TINIPINGS.length / cols);
    const gridWidth = cols * (tileSize + gap) - gap + cardPadding * 2;
    const gridHeight = rows * (tileSize + gap) - gap + cardPadding * 2;
    const cardX = (width - gridWidth) / 2;
    const btnW = Math.round(200 * SCALE);
    const btnH = Math.max(48, Math.round(50 * SCALE));
    const btnY = startY + gridHeight + Math.round(40 * SCALE);
    const totalHeight = btnY + btnH + Math.round(80 * SCALE);

    return {
        titleY, subtitleY, startY, gap, cardPadding, cardX,
        cols, rows, tileSize, gridWidth, gridHeight,
        btnW, btnH, btnY, totalHeight,
    };
}

function getMapRequiredHeight(width) {
    const contentY = Math.round(110 * SCALE);
    const bottomPad = Math.round(40 * SCALE);

    if (!STATE || !STATE.mapSelection?.grade) {
        return contentY + Math.round(520 * SCALE);
    }

    if (!CURRICULUM_DATA) return contentY + Math.round(420 * SCALE);

    const gradeData = CURRICULUM_DATA[STATE.mapSelection.grade];
    if (!gradeData) return contentY + Math.round(420 * SCALE);

    if (!STATE.mapSelection.subGrade) {
        const subGradeCount = Object.keys(gradeData).length;
        return contentY + Math.round(90 * SCALE) + subGradeCount * Math.round(95 * SCALE) + bottomPad;
    }

    const domainData = gradeData[STATE.mapSelection.subGrade];
    const sections = typeof getCurriculumTopicSections === 'function'
        ? getCurriculumTopicSections(domainData)
        : [];
    const colCount = Math.max(1, Math.floor((width - 60) / 180));
    let height = contentY + Math.round(20 * SCALE);

    sections.forEach(section => {
        const rows = Math.ceil(section.topics.length / colCount);
        height += Math.round(40 * SCALE) + rows * Math.round(62 * SCALE) + Math.round(30 * SCALE);
    });

    return height + bottomPad;
}

function getCollectionTabs() {
    return ['전체', '수와 연산', '도형과 측정', '규칙성', '자료와 가능성', '부모 리포트'];
}

function getCollectionTabLayout(width, startY = Math.round(100 * SCALE)) {
    const x = Math.round(24 * SCALE);
    const availableWidth = width - x * 2;
    if (window.CanvasText?.getWrappedTabLayout) {
        return window.CanvasText.getWrappedTabLayout(getCollectionTabs(), {
            x,
            y: startY,
            width: availableWidth,
            minTabWidth: Math.max(82, Math.round(96 * SCALE)),
            tabHeight: Math.max(40, Math.round(46 * SCALE)),
            gap: Math.max(7, Math.round(10 * SCALE))
        });
    }

    const tabs = getCollectionTabs();
    const tabGap = Math.round(10 * SCALE);
    const tabW = (availableWidth - (tabs.length - 1) * tabGap) / tabs.length;
    const tabH = Math.max(40, Math.round(46 * SCALE));
    return {
        x,
        y: startY,
        width: availableWidth,
        rows: 1,
        height: tabH,
        tabs: tabs.map((label, i) => ({
            label,
            x: x + i * (tabW + tabGap),
            y: startY,
            w: tabW,
            h: tabH
        }))
    };
}

function getCollectionGridMetrics(width, gridY) {
    const gridX = Math.round(24 * SCALE);
    const minCellW = Math.max(82, Math.round(96 * SCALE));
    const cols = Math.max(2, Math.min(8, Math.floor((width - Math.round(48 * SCALE)) / minCellW)));
    const cellW = Math.floor((width - Math.round(48 * SCALE)) / cols);
    const cellH = Math.max(116, Math.round(132 * SCALE));
    const pad = Math.max(8, Math.round(10 * SCALE));
    return { gridX, gridY, cols, cellW, cellH, pad };
}

function getCollectionRequiredHeight(width) {
    const tabLayout = getCollectionTabLayout(width);
    if ((STATE.collectionTab || '전체') === '부모 리포트') {
        return tabLayout.y + tabLayout.height + Math.round(1320 * SCALE);
    }

    const targetTab = STATE.collectionTab || '전체';
    const filteredCount = targetTab === '전체'
        ? (TINIPINGS?.length || 0)
        : (TINIPINGS || []).filter(t => t.domain === targetTab).length;
    const gridY = tabLayout.y + tabLayout.height + Math.round(25 * SCALE);
    const metrics = getCollectionGridMetrics(width, gridY);
    const rows = Math.ceil(Math.max(1, filteredCount) / metrics.cols);
    return gridY + rows * metrics.cellH + Math.round(36 * SCALE);
}

function getCatchRequiredHeight() {
    return Math.max(640, Math.round(860 * SCALE));
}

function isProblemTopicSupported(topic) {
    const text = String(topic || '');
    if (!text) return false;

    if (text.includes('관계수학') || text.includes('미지수') || text.includes('방정식')) return true;

    const unsupportedKeywords = [
        '다항식', '나머지 정리', '인수분해', '복소수', '부등식', '행렬',
        '집합', '명제', '함수', '순열', '조합', '이항정리', '확률분포',
        '통계적 추정', '미분', '적분', '극한', '급수', '벡터', '이차곡선',
        '공간좌표', '공간벡터', '좌표평면', '소인수분해', '제곱근', '근호', '유리수',
        '정수', '정비례', '반비례', '피타고라스', '삼각비', '상관관계'
    ];
    if (unsupportedKeywords.some(keyword => text.includes(keyword))) return false;

    const supportedKeywords = [
        '수', '덧셈', '뺄셈', '곱셈', '나눗셈', '분수', '소수',
        '도형', '모양', '삼각형', '사각형', '원', '각', '길이', '시각', '시간',
        '들이', '무게', '부피', '쌓기', '직육면체', '규칙',
        '자료', '그래프', '표', '분류', '평균', '가능성',
        '창의', '영재', '사고력'
    ];

    return supportedKeywords.some(keyword => text.includes(keyword));
}

function setHiDPI() {
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    const cssW = Math.max(280, Math.min(viewportW - 24, 720));
    const baseW = 720;
    const widthScale = cssW / baseW;
    SCALE = Math.max(0.7, Math.min(1.5, widthScale));

    let cssH = Math.round(cssW * (16 / 9));
    const currentMode = typeof STATE !== 'undefined' ? STATE.mode : null;
    if (currentMode === 'home') {
        const layout = getHomeLayout(cssW);
        cssH = Math.max(cssH, layout.totalHeight);
    } else if (currentMode === 'map') {
        cssH = Math.max(cssH, getMapRequiredHeight(cssW), viewportH - 48);
    } else if (currentMode === 'collection') {
        cssH = Math.max(cssH, getCollectionRequiredHeight(cssW), viewportH - 48);
    } else if (currentMode === 'catch') {
        cssH = Math.max(cssH, getCatchRequiredHeight(), viewportH - 48);
    } else if (viewportH > viewportW) {
        cssH = Math.max(cssH, viewportH - 48);
    }

    if (lastCssW === cssW && lastCssH === cssH) {
        return;
    }

    CANVAS.style.width = cssW + 'px';
    CANVAS.style.height = cssH + 'px';
    CANVAS.width = Math.round(cssW * DPR);
    CANVAS.height = Math.round(cssH * DPR);
    CTX.setTransform(DPR, 0, 0, DPR, 0, 0);

    lastCssW = cssW;
    lastCssH = cssH;
}
setHiDPI();
window.addEventListener('resize', () => {
    lastCssW = null;
    lastCssH = null;
    setHiDPI();
});

function roundRect(ctx, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
}

function fillTextWrap(ctx, text, x, y, maxWidth, lineHeight) {
    const words = (text || '').toString().split(/\s+/);
    let line = '', outY = y;
    let lineArray = [];

    // 먼저 줄바꿈 계산
    for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const m = ctx.measureText(testLine);
        if (m.width > maxWidth && n > 0) {
            lineArray.push(line);
            line = words[n] + ' ';
        } else {
            line = testLine;
        }
    }
    lineArray.push(line);

    // 그리기
    for (let k = 0; k < lineArray.length; k++) {
        ctx.fillText(lineArray[k], x, y + k * lineHeight);
    }
    return y + lineArray.length * lineHeight;
}

function getLines(ctx, text, maxWidth) {
    const words = (text || '').toString().split(/\s+/);
    let line = '';
    const lines = [];

    for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const m = ctx.measureText(testLine);
        if (m.width > maxWidth && n > 0) {
            lines.push(line);
            line = words[n] + ' ';
        } else {
            line = testLine;
        }
    }
    lines.push(line);
    return lines;
}

function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function buildExplanation(dividend, divisor, quotient, answer) {
    const learnerName = getActiveLearnerName('친구');
    const patterns = [
        [`🎯 ${learnerName}야, 같이 생각해볼까?`, `${dividend}개를 ${divisor}명에게 똑같이 나누면...`, `한 명당 ${quotient}개씩 받을 수 있어!`, `✨ 검산: ${quotient} × ${divisor} = ${dividend} (딱 맞네!)`],
        [`💡 거꾸로 생각해보자!`, `${divisor} × ${quotient} = ${dividend}이니까`, `반대로 ${dividend} ÷ ${divisor} = ${quotient}이지!`, `곱셈과 나눗셈은 친구야! 잘했어! 👍`],
        [`🍰 케이크로 생각해보자!`, `케이크 ${dividend}조각을 ${divisor}명이 나눠 먹으면`, `한 명이 ${quotient}조각씩 먹을 수 있어!`, `간단하지? 멋지게 풀었어! 🎉`]
    ];
    const selected = patterns[Math.floor(Math.random() * patterns.length)];
    return `${selected.join('\n')}\n\n💖 정답은 ${answer}이야!`;
}

function buildSimpleExplanation(a, b, op, ans) {
    return `정답은 ${ans}이야!\n${a} ${op} ${b} = ${ans}`;
}

function getDefaultMapSelection() {
    return { grade: null, subGrade: null, domain: null };
}

function getActiveLearnerProfileFromState() {
    if (STATE.activeLearnerId && window.LearnerProfiles?.find) {
        return window.LearnerProfiles.find(STATE.activeLearnerId);
    }
    return window.LearnerProfiles?.getActiveProfile?.() || null;
}

function getActiveLearnerId() {
    return STATE.activeLearnerId || window.LearnerProfiles?.getActiveId?.() || null;
}

function getActiveLearnerName(fallback = '학습자') {
    return STATE.activeLearnerName || getActiveLearnerProfileFromState()?.name || fallback;
}

function createBaseStateForLearner(profile) {
    const activeProfile = profile ? { ...profile, colors: [...(profile.colors || [])] } : null;
    return {
        mode: activeProfile ? 'map' : 'learnerSelect',
        activeLearnerId: activeProfile?.id || null,
        activeLearnerName: activeProfile?.name || null,
        activeLearnerProfile: activeProfile,
        questionIndex: 0,
        totalQuestions: 0,
        score: 0,
        difficulty: 2,
        consecutiveCorrect: 0,
        caughtIds: [],
        usedProblems: [],
        problem: null,
        selected: null,
        isCorrect: null,
        confirmed: null,
        catchStart: 0,
        newTiniping: null,
        hitboxes: [],
        currentCurriculum: 'division',
        mapSelection: getDefaultMapSelection(),
        collectionTab: '전체',
        symbolAnswers: { square: null, circle: null, triangle: null },
        relationCoach: null,
        irt: activeProfile && window.IrtEngine ? window.IrtEngine.createInitialState(IRT_ACTIVE_TOPIC) : null,
        learningEntry: null,
        lastIrtUpdate: null
    };
}

function getLearnerStateStorageKey(profileId = getActiveLearnerId()) {
    return window.LearnerProfiles?.getStateKey?.(profileId) || (profileId ? `${LS_KEY}:${profileId}` : null);
}

function applySavedLearnerState(saved, profile) {
    const base = createBaseStateForLearner(profile);
    const safe = saved && typeof saved === 'object' ? saved : {};
    const savedMode = safe.mode && !['home', 'learnerSelect'].includes(safe.mode) ? safe.mode : base.mode;

    STATE = {
        ...base,
        mode: savedMode,
        questionIndex: safe.questionIndex || 0,
        totalQuestions: safe.totalQuestions || 0,
        score: safe.score || 0,
        difficulty: safe.difficulty || 2,
        consecutiveCorrect: safe.consecutiveCorrect || 0,
        caughtIds: Array.isArray(safe.caughtIds) ? safe.caughtIds : [],
        usedProblems: Array.isArray(safe.usedProblems) ? safe.usedProblems : [],
        currentCurriculum: safe.currentCurriculum || 'division',
        mapSelection: safe.mapSelection || getDefaultMapSelection(),
        collectionTab: safe.collectionTab || '전체',
        relationCoach: safe.relationCoach || null,
        irt: safe.irt || base.irt,
        learningEntry: safe.learningEntry || null,
        lastIrtUpdate: safe.lastIrtUpdate || null
    };

    if (!STATE.activeLearnerId) {
        STATE.mode = 'learnerSelect';
    }
    if (['quiz', 'explain', 'catch'].includes(STATE.mode) && !STATE.problem) {
        STATE.mode = 'map';
    }
}

function saveState() {
    const key = getLearnerStateStorageKey();
    if (!key) return;
    const s = {
        mode: STATE.mode,
        activeLearnerId: STATE.activeLearnerId,
        activeLearnerName: STATE.activeLearnerName,
        questionIndex: STATE.questionIndex,
        totalQuestions: STATE.totalQuestions,
        score: STATE.score,
        difficulty: STATE.difficulty,
        consecutiveCorrect: STATE.consecutiveCorrect,
        caughtIds: STATE.caughtIds,
        usedProblems: STATE.usedProblems,
        currentCurriculum: STATE.currentCurriculum,
        mapSelection: STATE.mapSelection,
        collectionTab: STATE.collectionTab,
        relationCoach: STATE.relationCoach,
        irt: STATE.irt,
        learningEntry: STATE.learningEntry,
        lastIrtUpdate: STATE.lastIrtUpdate
    };
    localStorage.setItem(key, JSON.stringify(s));
}

function loadState() {
    const profile = window.LearnerProfiles?.getActiveProfile?.() || null;
    if (!profile) {
        STATE = createBaseStateForLearner(null);
        return;
    }

    const raw = localStorage.getItem(getLearnerStateStorageKey(profile.id));
    if (!raw) {
        STATE = createBaseStateForLearner(profile);
        saveState();
        return;
    }
    try {
        const s = JSON.parse(raw);
        applySavedLearnerState(s, profile);
    } catch (e) {
        STATE = createBaseStateForLearner(profile);
        saveState();
    }
}

function selectLearner(id) {
    if (STATE.activeLearnerId) saveState();
    const profile = window.LearnerProfiles?.select?.(id);
    if (!profile) return null;

    const raw = localStorage.getItem(getLearnerStateStorageKey(profile.id));
    if (raw) {
        try {
            applySavedLearnerState(JSON.parse(raw), profile);
        } catch (_) {
            STATE = createBaseStateForLearner(profile);
        }
    } else {
        STATE = createBaseStateForLearner(profile);
    }

    STATE.mode = STATE.mode === 'learnerSelect' || STATE.mode === 'home' ? 'map' : STATE.mode;
    refreshItemCalibration();
    saveState();
    return profile;
}

function switchToLearnerSelect() {
    if (STATE.activeLearnerId) saveState();
    window.LearnerProfiles?.clearActive?.();
    STATE = createBaseStateForLearner(null);
}

function genProblem(diff) {
    const topic = STATE.currentCurriculum || 'division';

    if (shouldUseRelationThinkingProblem(topic) && window.IrtEngine && window.RelationshipCoachProblems?.bank) {
        ensureIrtState();
        const pool = window.AdaptiveLearningFlow?.getCandidateItems
            ? window.AdaptiveLearningFlow.getCandidateItems(window.RelationshipCoachProblems.bank, STATE)
            : window.RelationCurriculum?.filterItemsForTopic
                ? window.RelationCurriculum.filterItemsForTopic(window.RelationshipCoachProblems.bank, topic)
                : window.RelationshipCoachProblems.bank;
        const policySelection = window.IrtLearningPolicy?.selectNextItem?.(pool, STATE.irt);
        const selectedItem = policySelection?.item || window.IrtEngine.selectNextItem(pool, STATE.irt);
        if (selectedItem && policySelection) {
            selectedItem.selection_policy = {
                phase: policySelection.phase,
                targetSkill: policySelection.targetSkill,
                utility: policySelection.utility,
                probability: policySelection.probability,
                reason: policySelection.reason
            };
        }
        if (selectedItem && window.RelationshipCoachProblems.generateForItem) {
            if (window.IrtEngine.registerExposure) {
                STATE.irt = window.IrtEngine.registerExposure(STATE.irt, selectedItem);
            }
            return window.RelationshipCoachProblems.generateForItem(selectedItem, diff);
        }
    }

    // 모듈 시스템 우선 사용 (로드된 경우)
    if (window.ProblemLoader && window.ProblemBase) {
        try {
            const problem = window.ProblemLoader.generate(topic, diff);
            if (problem && problem.question) {
                return problem;
            }
        } catch (e) {
            console.warn('모듈 문제 생성 실패, 인라인 함수 사용:', e);
        }
    }

    // 폴백: 기존 인라인 함수 사용
    if (topic.includes('덧셈') || topic.includes('합')) return genAdditionProblem(diff);
    if (topic.includes('뺄셈') || topic.includes('차')) return genSubtractionProblem(diff);
    if (topic.includes('곱셈') || topic.includes('구구')) return genMultiplicationProblem(diff);
    if (topic.includes('나눗셈') || topic.includes('나머지') || topic === 'division') return genDivisionProblem(diff);
    if (topic.includes('분수')) return genFractionProblem(diff);
    if (topic.includes('도형') || topic.includes('모양') || topic.includes('삼각형') || topic.includes('사각형')) return genGeometryProblem(diff);
    if (topic.includes('시계') || topic.includes('시각') || topic.includes('시간')) return genMeasurementProblem(diff);
    if (topic.includes('규칙') || topic.includes('수열')) return genPatternProblem(diff);
    if (topic.includes('길이')) return genLengthProblem(diff);
    if (topic.includes('자료') || topic.includes('그래프') || topic.includes('표') || topic.includes('분류')) return genGraphProblem(diff);
    if (topic.includes('수') && !topic.includes('수열')) return genNumberProblem(diff);
    if (topic.includes('창의') || topic.includes('영재') || topic.includes('사고력')) return genCreativeProblem(diff);
    // 새로 추가된 영역
    if (topic.includes('들이') || topic.includes('용량') || topic.includes('mL') || topic.includes('L')) return genCapacityProblem(diff);
    if (topic.includes('무게') || topic.includes('kg') || topic.includes('g')) return genWeightProblem(diff);
    if (topic.includes('부피') || topic.includes('쌓기') || topic.includes('직육면체')) return genVolumeProblem(diff);

    // 난이도가 높으면(15 이상) 20% 확률로 창의력 문제 출제
    if (diff >= 15 && Math.random() < 0.2) return genCreativeProblem(diff);

    // 기본값: 덧셈
    return genAdditionProblem(diff);
}

function isRelationshipCoachTopic(topic) {
    return String(topic || '').includes('관계수학')
        || String(topic || '').includes('관계형')
        || String(topic || '').includes('문장제 코치')
        || topic === 'relationshipCoach';
}

function shouldUseRelationThinkingProblem(topic) {
    return Boolean(window.RelationCurriculum?.isRelationThinkingTopic?.(topic));
}

function ensureIrtState() {
    if (!window.IrtEngine) return null;
    const expectedSeed = getActiveLearnerProfileFromState()?.seed || null;
    const canCarryThetaForward = STATE.irt
        && Number.isFinite(STATE.irt.theta)
        && (STATE.irt.attemptCount || 0) > 0;
    const initialOptions = canCarryThetaForward ? { initialTheta: STATE.irt.theta } : {};
    if (
        !STATE.irt
        || STATE.irt.version !== 1
        || STATE.irt.topic !== IRT_ACTIVE_TOPIC
        || (expectedSeed && STATE.irt.learnerSeed !== expectedSeed)
    ) {
        STATE.irt = window.IrtEngine.createInitialState(IRT_ACTIVE_TOPIC, initialOptions);
    }
    return STATE.irt;
}

function refreshItemCalibration() {
    if (!window.ItemCalibration?.applyToBank || !window.RelationshipCoachProblems?.bank || !window.IrtLog?.loadAttempts) {
        return null;
    }

    return window.ItemCalibration.applyToBank(
        window.RelationshipCoachProblems.bank,
        window.IrtLog.loadAttempts()
    );
}

function getRelationCoachStepSuccessRate() {
    if (!STATE.problem?.coachSteps?.length || !STATE.relationCoach) return undefined;
    const steps = window.RelationCoach?.getSteps?.(STATE.problem) || STATE.problem.coachSteps;
    const attempted = steps.filter(step => STATE.relationCoach.selections && Object.prototype.hasOwnProperty.call(STATE.relationCoach.selections, step.id));
    if (!attempted.length) return 0;
    const errors = new Set(STATE.relationCoach.errors || []);
    const correctSteps = attempted.filter(step => !errors.has(step.errorType)).length;
    return correctSteps / attempted.length;
}

function updateIrtAfterAnswer(correct) {
    if (!window.IrtEngine || !STATE.problem?.irt) return;
    ensureIrtState();
    const stateBefore = { ...STATE.irt };
    const result = {
        correct: !!correct,
        hintLevel: STATE.relationCoach?.hintLevel || 0,
        stepSuccessRate: getRelationCoachStepSuccessRate()
    };
    STATE.irt = window.IrtEngine.updateState(STATE.irt, STATE.problem, result);
    STATE.lastIrtUpdate = window.IrtProgressView?.createUpdate
        ? window.IrtProgressView.createUpdate({
            problem: STATE.problem,
            stateBefore,
            stateAfter: STATE.irt,
            result
        })
        : {
            thetaBefore: stateBefore.theta || 0,
            thetaAfter: STATE.irt.theta || 0,
            standardErrorAfter: STATE.irt.standardError || 0,
            attemptCount: STATE.irt.attemptCount || 0,
            itemLevel: STATE.problem.level || null,
            itemDifficulty: STATE.problem.irt?.b ?? null,
            responseScore: window.IrtEngine.responseScore ? window.IrtEngine.responseScore(result) : (correct ? 1 : 0),
            learningPhase: STATE.problem.selection_policy?.phase || null
        };

    if (window.IrtLog) {
        const elapsedSeconds = Math.max(0, Math.round((Date.now() - (STATE.relationCoach?.startedAt || Date.now())) / 1000));
        const errorType = correct
            ? null
            : (STATE.relationCoach?.errors?.slice(-1)[0] || window.RelationCoach?.inferError?.(STATE.problem, null) || null);
        const record = window.IrtLog.createAttemptRecord({
            learnerId: getActiveLearnerId() || 'local-child',
            problem: STATE.problem,
            result,
            stateBefore,
            stateAfter: STATE.irt,
            selectedAnswer: STATE.selected,
            errorType,
            elapsedSeconds
        });
        window.IrtLog.appendAttempt(record);
        refreshItemCalibration();
        if (window.IrtSync?.requestSync) {
            window.IrtSync.requestSync('attempt_saved');
        }
    }
}

function genNumberProblem(diff) {
    const type = Math.floor(Math.random() * 3);
    let question, answer, explanation;
    const wrongs = new Set();

    const names = ['하츄핑', '바로핑', '아자핑', '차차핑', '라라핑', '해핑'];
    const name1 = names[Math.floor(Math.random() * names.length)];
    const name2 = names[(names.indexOf(name1) + 1) % names.length];

    if (type === 0) {
        // 크기 비교 (100% 문장제, 이모지 포함)
        const a = Math.floor(Math.random() * 90) + 10;
        const b = Math.floor(Math.random() * 90) + 10;
        if (a === b) return genNumberProblem(diff);

        const bigger = Math.max(a, b);
        const smaller = Math.min(a, b);

        const templates = [
            { q: `⭐ ${name1}이(가) 스티커를 ${a}장, ${name2}이(가) ${b}장 모았어요. 더 많이 모은 티니핑의 스티커 수는 몇 장일까요?`, e: `${a}와 ${b}를 비교하면 ${bigger}가 더 크므로, 더 많이 모은 티니핑은 ${bigger}장을 가지고 있습니다.` },
            { q: `🏃 태희는 줄넘기를 ${a}번, 친구는 ${b}번 했어요. 더 많이 한 기록은 몇 번일까요?`, e: `${a}와 ${b}를 비교하면 ${bigger}가 더 크므로, 더 많이 한 기록은 ${bigger}번입니다.` },
            { q: `🔴🔵 빨간 상자에 구슬 ${a}개, 파란 상자에 ${b}개가 있어요. 더 많은 상자에는 몇 개가 있을까요?`, e: `${a}와 ${b}를 비교하면 ${bigger}가 더 크므로, 더 많은 상자에는 ${bigger}개가 있습니다.` },
            { q: `🍎 ${name1}은 사과 ${a}개, ${name2}은 ${b}개를 가지고 있어요. 더 많이 가진 사과는 몇 개일까요?`, e: `${a}와 ${b}를 비교하면 ${bigger}가 더 큽니다. 정답은 ${bigger}개입니다.` },
            { q: `📚 ${name1}은 책 ${a}권, ${name2}은 ${b}권을 읽었어요. 더 많이 읽은 책은 몇 권일까요?`, e: `${a}와 ${b}를 비교하면 ${bigger}가 더 큽니다. 정답은 ${bigger}권입니다.` }
        ];

        const t = templates[Math.floor(Math.random() * templates.length)];
        question = t.q;
        answer = String(bigger);
        explanation = t.e;

        wrongs.add(String(smaller));
        wrongs.add(String(bigger + 1));
        wrongs.add(String(bigger + 10));
    } else if (type === 1) {
        // 자릿수 (100% 문장제, 이모지 포함)
        const num = Math.floor(Math.random() * 900) + 100;
        const digit = Math.floor(Math.random() * 3);
        const place = ['일', '십', '백'][digit];
        const val = String(num)[2 - digit];

        const templates = [
            { q: `🎴 ${name1}의 카드 번호는 ${num}이에요. ${place}의 자리 숫자는 무엇일까요?`, e: `${num}에서 백의 자리 ${String(num)[0]}, 십의 자리 ${String(num)[1]}, 일의 자리 ${String(num)[2]}입니다. ${place}의 자리 숫자는 ${val}입니다.` },
            { q: `📚 학교 도서관에 책이 ${num}권 있어요. ${place}의 자리 숫자는 무엇일까요?`, e: `${num}에서 백의 자리 ${String(num)[0]}, 십의 자리 ${String(num)[1]}, 일의 자리 ${String(num)[2]}입니다. ${place}의 자리 숫자는 ${val}입니다.` },
            { q: `🏠 태희네 아파트는 ${num}동이에요. ${place}의 자리 숫자는 무엇일까요?`, e: `${num}에서 백의 자리 ${String(num)[0]}, 십의 자리 ${String(num)[1]}, 일의 자리 ${String(num)[2]}입니다. ${place}의 자리 숫자는 ${val}입니다.` },
            { q: `🎟️ 영화표 번호가 ${num}번이에요. ${place}의 자리 숫자는 무엇일까요?`, e: `${num}에서 백의 자리 ${String(num)[0]}, 십의 자리 ${String(num)[1]}, 일의 자리 ${String(num)[2]}입니다. ${place}의 자리 숫자는 ${val}입니다.` }
        ];

        const t = templates[Math.floor(Math.random() * templates.length)];
        question = t.q;
        answer = val;
        explanation = t.e;

        while (wrongs.size < 3) {
            const w = Math.floor(Math.random() * 10);
            if (String(w) !== answer) wrongs.add(String(w));
        }
    } else {
        // 뛰어 세기 (100% 문장제, 이모지 포함)
        const start = Math.floor(Math.random() * 50) + 1;
        const step = [2, 5, 10][Math.floor(Math.random() * 3)];
        const targetIdx = 3;

        const seq = [];
        for (let i = 0; i < 5; i++) seq.push(start + i * step);

        const templates = [
            { q: `🚌 버스 정류장 번호가 ${start}부터 ${step}씩 커져요. 네 번째 정류장 번호는? (${start}, ${seq[1]}, ${seq[2]}, ?)`, e: `${start}부터 ${step}씩 커지므로: ${start} → ${seq[1]} → ${seq[2]} → ${seq[3]}. 네 번째 번호는 ${seq[targetIdx]}입니다.` },
            { q: `🍬 ${name1}이(가) ${step}개씩 묶어서 사탕을 세어요. ${start}부터 시작하면 네 번째 수는 몇일까요?`, e: `${start}부터 ${step}씩 커지므로: ${start} → ${seq[1]} → ${seq[2]} → ${seq[3]}. 네 번째 수는 ${seq[targetIdx]}입니다.` },
            { q: `🪜 계단 번호가 ${start}, ${seq[1]}, ${seq[2]}, ? 순서예요. ?에 알맞은 수는 몇일까요?`, e: `${start}부터 ${step}씩 커지므로: ${start} → ${seq[1]} → ${seq[2]} → ${seq[3]}. 네 번째 수는 ${seq[targetIdx]}입니다.` },
            { q: `🔢 ${name1}이(가) 수를 세고 있어요. ${step}씩 뛰어 세면 ${start}, ${seq[1]}, ${seq[2]}, ?가 돼요. ?는 몇일까요?`, e: `${step}씩 뛰어 세므로: ${start} → ${seq[1]} → ${seq[2]} → ${seq[3]}. ?는 ${seq[targetIdx]}입니다.` }
        ];

        const t = templates[Math.floor(Math.random() * templates.length)];
        question = t.q;
        answer = String(seq[targetIdx]);
        explanation = t.e;

        wrongs.add(String(seq[targetIdx] - step));
        wrongs.add(String(seq[targetIdx] + step));
        wrongs.add(String(seq[targetIdx] + step * 2));
    }

    return {
        question,
        options: shuffleArray([answer, ...Array.from(wrongs)].slice(0, 4)),
        answer,
        explanation,
        problemKey: `number-${type}-${Math.random()}`
    };
}

function genAdditionProblem(diff) {
    const max = diff * 10;
    const a = Math.floor(Math.random() * max) + 1;
    const b = Math.floor(Math.random() * max) + 1;
    const answer = a + b;

    // 티니핑 이름
    const names = ['하츄핑', '바로핑', '아자핑', '차차핑', '라라핑', '해핑'];
    const name1 = names[Math.floor(Math.random() * names.length)];
    const name2 = names[(names.indexOf(name1) + 1 + Math.floor(Math.random() * (names.length - 1))) % names.length];

    // 100% 문장제 템플릿 (시각적 이모지 포함)
    const templates = [
        { q: `🍬 ${name1}이(가) 사탕 ${a}개를 가지고 있었어요. ${name2}이(가) ${b}개를 더 주었다면, 사탕은 모두 몇 개일까요?`, e: `${name1}의 사탕 ${a}개에 ${name2}이(가) 준 ${b}개를 더하면 ${a} + ${b} = ${answer}개입니다.` },
        { q: `🚌 버스에 ${a}명이 타고 있었어요. 다음 정류장에서 ${b}명이 더 탔다면, 버스에는 모두 몇 명이 있을까요?`, e: `처음 ${a}명에 새로 탄 ${b}명을 더하면 ${a} + ${b} = ${answer}명입니다.` },
        { q: `📖 태희가 동화책을 아침에 ${a}쪽, 저녁에 ${b}쪽 읽었어요. 오늘 모두 몇 쪽을 읽었을까요?`, e: `아침에 읽은 ${a}쪽과 저녁에 읽은 ${b}쪽을 더하면 ${a} + ${b} = ${answer}쪽입니다.` },
        { q: `👧👦 운동장에 남학생 ${a}명과 여학생 ${b}명이 있어요. 학생은 모두 몇 명일까요?`, e: `남학생 ${a}명과 여학생 ${b}명을 더하면 ${a} + ${b} = ${answer}명입니다.` },
        { q: `⭐ ${name1}이(가) 스티커 ${a}장을 모았어요. 퀴즈를 맞혀서 ${b}장을 더 받았다면, 스티커는 모두 몇 장일까요?`, e: `원래 ${a}장에 받은 ${b}장을 더하면 ${a} + ${b} = ${answer}장입니다.` },
        { q: `🎈 빨간 풍선 ${a}개와 파란 풍선 ${b}개가 있어요. 풍선은 모두 몇 개일까요?`, e: `빨간 풍선 ${a}개와 파란 풍선 ${b}개를 더하면 ${a} + ${b} = ${answer}개입니다.` },
        { q: `🍎 과일 바구니에 사과 ${a}개가 있었어요. 엄마가 ${b}개를 더 넣었다면, 사과는 모두 몇 개일까요?`, e: `원래 ${a}개에 추가된 ${b}개를 더하면 ${a} + ${b} = ${answer}개입니다.` },
        { q: `🌸 정원에 꽃이 ${a}송이 피었어요. 오늘 ${b}송이가 더 피었다면, 꽃은 모두 몇 송이일까요?`, e: `처음 ${a}송이에 새로 핀 ${b}송이를 더하면 ${a} + ${b} = ${answer}송이입니다.` },
        { q: `🦋 나비 ${a}마리가 날아왔어요. 잠시 후 ${b}마리가 더 왔다면, 나비는 모두 몇 마리일까요?`, e: `처음 ${a}마리에 ${b}마리를 더하면 ${a} + ${b} = ${answer}마리입니다.` },
        { q: `🏠 ${name1}이(가) 블록으로 집을 만들고 있어요. 빨간 블록 ${a}개와 파란 블록 ${b}개를 사용했다면, 블록은 모두 몇 개일까요?`, e: `빨간 블록 ${a}개와 파란 블록 ${b}개를 더하면 ${a} + ${b} = ${answer}개입니다.` },
        { q: `🐟 수족관에 물고기가 ${a}마리 있었어요. ${b}마리를 더 넣었다면, 물고기는 모두 몇 마리일까요?`, e: `원래 ${a}마리에 ${b}마리를 더하면 ${a} + ${b} = ${answer}마리입니다.` },
        { q: `✏️ 연필통에 연필이 ${a}자루 있었어요. 새 연필 ${b}자루를 더 넣었다면, 연필은 모두 몇 자루일까요?`, e: `원래 ${a}자루에 ${b}자루를 더하면 ${a} + ${b} = ${answer}자루입니다.` }
    ];

    const t = templates[Math.floor(Math.random() * templates.length)];
    const question = t.q;
    const explanation = t.e;

    const wrongs = new Set();
    while (wrongs.size < 4) {
        let w = answer + Math.floor(Math.random() * 10) - 5;
        if (w < 0) w = answer + 1;
        if (w !== answer) wrongs.add(w);
    }
    const options = shuffleArray([answer, ...wrongs].slice(0, 4));

    return {
        question,
        options,
        answer,
        explanation,
        problemKey: `add-${a}-${b}`
    };
}

function genSubtractionProblem(diff) {
    const max = diff * 10;
    let a = Math.floor(Math.random() * max) + 1;
    let b = Math.floor(Math.random() * max) + 1;
    if (a < b) [a, b] = [b, a];

    const answer = a - b;

    const names = ['하츄핑', '바로핑', '아자핑', '차차핑', '라라핑', '해핑'];
    const name1 = names[Math.floor(Math.random() * names.length)];

    // 100% 문장제 템플릿 (시각적 이모지 포함)
    const templates = [
        { q: `🍬 ${name1}이(가) 사탕 ${a}개를 가지고 있었어요. 친구에게 ${b}개를 주었다면, 남은 사탕은 몇 개일까요?`, e: `원래 ${a}개에서 준 ${b}개를 빼면 ${a} - ${b} = ${answer}개가 남습니다.` },
        { q: `🚌 버스에 ${a}명이 타고 있었어요. 정류장에서 ${b}명이 내렸다면, 남은 사람은 몇 명일까요?`, e: `처음 ${a}명에서 내린 ${b}명을 빼면 ${a} - ${b} = ${answer}명입니다.` },
        { q: `✏️ 책상 위에 연필이 ${a}자루 있었어요. 동생이 ${b}자루를 가져갔다면, 남은 연필은 몇 자루일까요?`, e: `원래 ${a}자루에서 가져간 ${b}자루를 빼면 ${a} - ${b} = ${answer}자루입니다.` },
        { q: `🍪 과자가 ${a}개 있었는데 ${b}개를 먹었어요. 남은 과자는 몇 개일까요?`, e: `원래 ${a}개에서 먹은 ${b}개를 빼면 ${a} - ${b} = ${answer}개입니다.` },
        { q: `⭐ ${name1}이(가) 스티커 ${a}장을 가지고 있었어요. 친구에게 ${b}장을 선물했다면, 남은 스티커는 몇 장일까요?`, e: `원래 ${a}장에서 선물한 ${b}장을 빼면 ${a} - ${b} = ${answer}장입니다.` },
        { q: `🎈 풍선이 ${a}개 있었는데 ${b}개가 터졌어요. 남은 풍선은 몇 개일까요?`, e: `원래 ${a}개에서 터진 ${b}개를 빼면 ${a} - ${b} = ${answer}개입니다.` },
        { q: `📖 태희가 동화책 ${a}쪽을 읽으려고 해요. 이미 ${b}쪽을 읽었다면, 남은 쪽수는?`, e: `전체 ${a}쪽에서 읽은 ${b}쪽을 빼면 ${a} - ${b} = ${answer}쪽 남았습니다.` },
        { q: `🍎 바구니에 사과가 ${a}개 있었어요. ${b}개를 먹었다면, 남은 사과는 몇 개일까요?`, e: `원래 ${a}개에서 먹은 ${b}개를 빼면 ${a} - ${b} = ${answer}개입니다.` },
        { q: `🌸 정원에 꽃이 ${a}송이 있었어요. ${b}송이가 시들었다면, 남은 꽃은 몇 송이일까요?`, e: `원래 ${a}송이에서 시든 ${b}송이를 빼면 ${a} - ${b} = ${answer}송이입니다.` },
        { q: `🐟 수족관에 물고기가 ${a}마리 있었어요. ${b}마리를 다른 곳으로 옮겼다면, 남은 물고기는 몇 마리일까요?`, e: `원래 ${a}마리에서 옮긴 ${b}마리를 빼면 ${a} - ${b} = ${answer}마리입니다.` },
        { q: `🎁 선물 상자에 초콜릿이 ${a}개 있었어요. ${b}개를 나눠줬다면, 남은 초콜릿은 몇 개일까요?`, e: `원래 ${a}개에서 나눠준 ${b}개를 빼면 ${a} - ${b} = ${answer}개입니다.` },
        { q: `🏠 ${name1}이(가) 블록 ${a}개로 탑을 쌓았어요. ${b}개가 떨어졌다면, 남은 블록은 몇 개일까요?`, e: `원래 ${a}개에서 떨어진 ${b}개를 빼면 ${a} - ${b} = ${answer}개입니다.` }
    ];

    const t = templates[Math.floor(Math.random() * templates.length)];
    const question = t.q;
    const explanation = t.e;

    const wrongs = new Set();
    while (wrongs.size < 4) {
        let w = answer + Math.floor(Math.random() * 10) - 5;
        if (w < 0) w = answer + 1;
        if (w !== answer) wrongs.add(w);
    }
    const options = shuffleArray([answer, ...wrongs].slice(0, 4));

    return {
        question,
        options,
        answer,
        explanation,
        problemKey: `sub-${a}-${b}`
    };
}

function genMultiplicationProblem(diff) {
    const dan = Math.max(2, Math.min(19, diff));
    const a = dan;
    const b = Math.floor(Math.random() * 9) + 1;
    const answer = a * b;

    const names = ['하츄핑', '바로핑', '아자핑', '차차핑', '라라핑', '해핑'];
    const name1 = names[Math.floor(Math.random() * names.length)];

    // 100% 문장제 템플릿 (시각적 이모지 포함)
    const templates = [
        { q: `🍬 한 봉지에 사탕이 ${a}개씩 들어 있어요. ${b}봉지에는 사탕이 모두 몇 개 있을까요?`, e: `한 봉지에 ${a}개씩 ${b}봉지이므로 ${a} × ${b} = ${answer}개입니다.` },
        { q: `⭐ ${name1}이(가) 하루에 스티커를 ${a}장씩 모아요. ${b}일 동안 모으면 스티커는 모두 몇 장일까요?`, e: `하루에 ${a}장씩 ${b}일이므로 ${a} × ${b} = ${answer}장입니다.` },
        { q: `🍊 한 상자에 귤이 ${a}개씩 들어 있어요. ${b}상자에는 귤이 모두 몇 개 있을까요?`, e: `한 상자에 ${a}개씩 ${b}상자이므로 ${a} × ${b} = ${answer}개입니다.` },
        { q: `🚌 버스 한 대에 ${a}명씩 탈 수 있어요. 버스 ${b}대에는 모두 몇 명이 탈 수 있을까요?`, e: `한 대에 ${a}명씩 ${b}대이므로 ${a} × ${b} = ${answer}명입니다.` },
        { q: `✏️ 연필 한 묶음에 ${a}자루씩 있어요. ${b}묶음에는 연필이 모두 몇 자루 있을까요?`, e: `한 묶음에 ${a}자루씩 ${b}묶음이므로 ${a} × ${b} = ${answer}자루입니다.` },
        { q: `🍫 ${name1}이(가) 친구 ${b}명에게 초콜릿을 ${a}개씩 나눠주려고 해요. 초콜릿은 모두 몇 개 필요할까요?`, e: `친구 한 명에게 ${a}개씩 ${b}명이므로 ${a} × ${b} = ${answer}개입니다.` },
        { q: `🪑 한 줄에 의자가 ${a}개씩 놓여 있어요. ${b}줄에는 의자가 모두 몇 개 있을까요?`, e: `한 줄에 ${a}개씩 ${b}줄이므로 ${a} × ${b} = ${answer}개입니다.` },
        { q: `🌸 꽃밭에 꽃이 한 줄에 ${a}송이씩 심어져 있어요. ${b}줄이면 꽃은 모두 몇 송이일까요?`, e: `한 줄에 ${a}송이씩 ${b}줄이므로 ${a} × ${b} = ${answer}송이입니다.` },
        { q: `🎁 선물 상자 하나에 사탕이 ${a}개씩 들어있어요. 상자 ${b}개에는 사탕이 모두 몇 개일까요?`, e: `한 상자에 ${a}개씩 ${b}상자이므로 ${a} × ${b} = ${answer}개입니다.` },
        { q: `🐟 수족관 한 칸에 물고기가 ${a}마리씩 있어요. ${b}칸에는 물고기가 모두 몇 마리일까요?`, e: `한 칸에 ${a}마리씩 ${b}칸이므로 ${a} × ${b} = ${answer}마리입니다.` },
        { q: `📚 책장 한 칸에 책이 ${a}권씩 꽂혀 있어요. ${b}칸에는 책이 모두 몇 권일까요?`, e: `한 칸에 ${a}권씩 ${b}칸이므로 ${a} × ${b} = ${answer}권입니다.` },
        { q: `🧁 접시 하나에 컵케이크가 ${a}개씩 있어요. ${b}접시에는 컵케이크가 모두 몇 개일까요?`, e: `한 접시에 ${a}개씩 ${b}접시이므로 ${a} × ${b} = ${answer}개입니다.` }
    ];

    const t = templates[Math.floor(Math.random() * templates.length)];
    const question = t.q;
    const explanation = t.e;

    const wrongs = new Set();
    while (wrongs.size < 4) {
        let w = answer + Math.floor(Math.random() * 10) - 5;
        if (w < 1) w = answer + 1;
        if (w !== answer) wrongs.add(w);
    }
    const options = shuffleArray([answer, ...wrongs].slice(0, 4));

    return {
        question,
        options,
        answer,
        explanation,
        problemKey: `mul-${a}-${b}`
    };
}

function genDivisionProblem(diff) {
    const dan = Math.max(2, Math.min(19, diff));
    let attempts = 0;
    const maxAttempts = 50;

    while (attempts < maxAttempts) {
        attempts++;
        const divisor = dan;
        const quotient = Math.floor(Math.random() * 9) + 1;
        const dividend = divisor * quotient;
        const problemKey = `${dividend}-${divisor}-${quotient}`;

        // 너무 많은 문제가 쌓이면 초기화 (메모리 및 무한 루프 방지)
        if (STATE.usedProblems.length > 200) {
            STATE.usedProblems = [];
        }

        if (STATE.usedProblems.includes(problemKey)) continue;

        // 100% 문장제 템플릿 (시각적 이모지 포함)
        const templates = [
            { q: `🍰 케이크 ${dividend}개를 ${divisor}명에게 똑같이 나누어 주면 한 명은 몇 개를 받을까요?`, e: `${dividend}개를 ${divisor}명에게 똑같이 나누면 ${dividend} ÷ ${divisor} = ${quotient}개입니다.` },
            { q: `⭐ 티니핑 스티커 ${dividend}개를 ${divisor}개씩 묶으면 몇 묶음이 될까요?`, e: `${dividend}개를 ${divisor}개씩 묶으면 ${dividend} ÷ ${divisor} = ${quotient}묶음입니다.` },
            { q: `✏️ 색연필 ${dividend}자루를 ${divisor}명이 똑같이 나누면 한 명은 몇 자루를 받을까요?`, e: `${dividend}자루를 ${divisor}명에게 나누면 ${dividend} ÷ ${divisor} = ${quotient}자루입니다.` },
            { q: `🍬 사탕 ${dividend}개를 ${divisor}봉지에 똑같이 담으면 한 봉지에 몇 개가 들어갈까요?`, e: `${dividend}개를 ${divisor}봉지에 나누면 ${dividend} ÷ ${divisor} = ${quotient}개입니다.` },
            { q: `🍎 사과 ${dividend}개를 친구 ${divisor}명에게 똑같이 나눠주면 한 명이 몇 개를 받을까요?`, e: `${dividend}개를 ${divisor}명에게 나누면 ${dividend} ÷ ${divisor} = ${quotient}개입니다.` },
            { q: `📚 책 ${dividend}권을 책장 ${divisor}칸에 똑같이 나눠 꽂으면 한 칸에 몇 권이 들어갈까요?`, e: `${dividend}권을 ${divisor}칸에 나누면 ${dividend} ÷ ${divisor} = ${quotient}권입니다.` },
            { q: `🎈 풍선 ${dividend}개를 ${divisor}묶음으로 나누면 한 묶음에 몇 개일까요?`, e: `${dividend}개를 ${divisor}묶음으로 나누면 ${dividend} ÷ ${divisor} = ${quotient}개입니다.` },
            { q: `🌸 꽃 ${dividend}송이를 꽃병 ${divisor}개에 똑같이 나눠 꽂으면 한 꽃병에 몇 송이일까요?`, e: `${dividend}송이를 ${divisor}개에 나누면 ${dividend} ÷ ${divisor} = ${quotient}송이입니다.` },
            { q: `🍪 쿠키 ${dividend}개를 접시 ${divisor}개에 똑같이 나눠 담으면 한 접시에 몇 개일까요?`, e: `${dividend}개를 ${divisor}접시에 나누면 ${dividend} ÷ ${divisor} = ${quotient}개입니다.` },
            { q: `🐟 물고기 ${dividend}마리를 수조 ${divisor}개에 똑같이 나눠 넣으면 한 수조에 몇 마리일까요?`, e: `${dividend}마리를 ${divisor}개에 나누면 ${dividend} ÷ ${divisor} = ${quotient}마리입니다.` },
            { q: `🎁 선물 ${dividend}개를 ${divisor}명에게 똑같이 나눠주면 한 명이 몇 개를 받을까요?`, e: `${dividend}개를 ${divisor}명에게 나누면 ${dividend} ÷ ${divisor} = ${quotient}개입니다.` },
            { q: `👧👦 학생 ${dividend}명을 ${divisor}모둠으로 나누면 한 모둠은 몇 명일까요?`, e: `${dividend}명을 ${divisor}모둠으로 나누면 ${dividend} ÷ ${divisor} = ${quotient}명입니다.` }
        ];

        const t = templates[Math.floor(Math.random() * templates.length)];
        const question = t.q;
        const answer = quotient;

        const wrongs = new Set();
        while (wrongs.size < 4) {
            let w = answer + Math.floor(Math.random() * 10) - 5;
            if (w < 1) w = answer + wrongs.size + 1;
            if (w !== answer) wrongs.add(w);
        }
        const options = shuffleArray([answer, ...[...wrongs]].slice(0, 4));
        const explanation = t.e;

        STATE.usedProblems.push(problemKey);
        return { question, options, answer, explanation, problemKey };
    }

    // Fallback - 100% 문장제로 변경
    const divisor = dan;
    const quotient = Math.floor(Math.random() * 9) + 1;
    const dividend = divisor * quotient;
    const question = `🍰 케이크 ${dividend}개를 친구 ${divisor}명에게 똑같이 나눠주면 한 명이 몇 개를 받을까요?`;
    const answer = quotient;
    const options = [answer, answer + 1, answer - 1, answer + 2, answer - 2].filter(n => n > 0).slice(0, 5);
    return { question, options, answer, explanation: `${dividend}개를 ${divisor}명에게 나누면 ${dividend} ÷ ${divisor} = ${answer}개입니다.`, problemKey: `div-fallback-${dividend}-${divisor}` };
}

function genFractionProblem(diff) {
    const denom = Math.floor(Math.random() * 8) + 2; // 2~9
    const num1 = Math.floor(Math.random() * (denom - 1)) + 1;
    const num2 = Math.floor(Math.random() * (denom - num1)) + 1;

    const names = ['하츄핑', '바로핑', '아자핑', '차차핑'];
    const name1 = names[Math.floor(Math.random() * names.length)];
    const name2 = names[(names.indexOf(name1) + 1) % names.length];

    const isAdd = Math.random() < 0.5;
    let question, answerStr, explanation;

    if (isAdd) {
        const sumNum = num1 + num2;
        answerStr = `${sumNum}/${denom}`;

        // 100% 문장제 템플릿 (시각적 이모지 포함)
        const templates = [
            { q: `🍕 피자를 ${denom}조각으로 똑같이 나누었어요. ${name1}이(가) ${num1}조각, ${name2}이(가) ${num2}조각을 먹었다면, 둘이 먹은 양은 전체의 얼마일까요?`, e: `${name1}이 먹은 ${num1}/${denom}과 ${name2}이 먹은 ${num2}/${denom}을 더하면 ${num1}/${denom} + ${num2}/${denom} = ${sumNum}/${denom}입니다.` },
            { q: `🎀 리본을 ${denom}등분 했어요. ${num1}만큼 빨간색, ${num2}만큼 파란색으로 칠했다면, 색칠한 부분은 전체의 얼마일까요?`, e: `빨간색 ${num1}/${denom}과 파란색 ${num2}/${denom}을 더하면 ${sumNum}/${denom}입니다.` },
            { q: `🍰 케이크를 ${denom}조각으로 나누어 어제 ${num1}조각, 오늘 ${num2}조각을 먹었어요. 먹은 양은 전체의 얼마일까요?`, e: `어제 ${num1}/${denom}과 오늘 ${num2}/${denom}을 더하면 ${sumNum}/${denom}입니다.` },
            { q: `🍫 초콜릿을 ${denom}조각으로 나눴어요. 아침에 ${num1}조각, 저녁에 ${num2}조각을 먹었다면, 먹은 양은 전체의 얼마일까요?`, e: `아침 ${num1}/${denom}과 저녁 ${num2}/${denom}을 더하면 ${sumNum}/${denom}입니다.` },
            { q: `🥧 사과 파이를 ${denom}조각으로 나눴어요. ${name1}이(가) ${num1}조각, ${name2}이(가) ${num2}조각을 먹었다면, 먹은 양은?`, e: `${num1}/${denom} + ${num2}/${denom} = ${sumNum}/${denom}입니다.` },
            { q: `📐 색종이를 ${denom}등분 했어요. ${num1}부분에 별을, ${num2}부분에 하트를 그렸다면, 그림을 그린 부분은 전체의 얼마일까요?`, e: `별 ${num1}/${denom}과 하트 ${num2}/${denom}을 더하면 ${sumNum}/${denom}입니다.` }
        ];

        const t = templates[Math.floor(Math.random() * templates.length)];
        question = t.q;
        explanation = t.e;
    } else {
        const big = Math.max(num1, num2);
        const small = Math.min(num1, num2);
        const diffNum = big - small;
        if (diffNum === 0) return genFractionProblem(diff);
        answerStr = `${diffNum}/${denom}`;

        // 100% 문장제 템플릿 (시각적 이모지 포함)
        const templates = [
            { q: `🍕 피자를 ${denom}조각으로 나누었어요. ${big}조각이 있었는데 ${small}조각을 먹었다면, 남은 양은 전체의 얼마일까요?`, e: `있던 ${big}/${denom}에서 먹은 ${small}/${denom}을 빼면 ${diffNum}/${denom}입니다.` },
            { q: `💧 물통에 물이 전체의 ${big}/${denom}만큼 있었어요. ${small}/${denom}만큼 마셨다면, 남은 물은 전체의 얼마일까요?`, e: `있던 ${big}/${denom}에서 마신 ${small}/${denom}을 빼면 ${diffNum}/${denom}입니다.` },
            { q: `📐 색종이의 ${big}/${denom}에 그림을 그리고 ${small}/${denom}만큼 잘라냈어요. 그림이 남은 부분은 전체의 얼마일까요?`, e: `그린 부분 ${big}/${denom}에서 자른 ${small}/${denom}을 빼면 ${diffNum}/${denom}입니다.` },
            { q: `🍰 케이크가 전체의 ${big}/${denom}만큼 남아있었어요. ${small}/${denom}만큼 먹었다면, 남은 케이크는 전체의 얼마일까요?`, e: `있던 ${big}/${denom}에서 먹은 ${small}/${denom}을 빼면 ${diffNum}/${denom}입니다.` },
            { q: `🎀 리본의 ${big}/${denom}만큼 사용할 수 있었어요. ${small}/${denom}만큼 사용했다면, 남은 리본은 전체의 얼마일까요?`, e: `있던 ${big}/${denom}에서 사용한 ${small}/${denom}을 빼면 ${diffNum}/${denom}입니다.` },
            { q: `🍫 초콜릿이 전체의 ${big}/${denom}만큼 있었어요. ${name1}이(가) ${small}/${denom}만큼 먹었다면, 남은 초콜릿은?`, e: `${big}/${denom} - ${small}/${denom} = ${diffNum}/${denom}입니다.` }
        ];

        const t = templates[Math.floor(Math.random() * templates.length)];
        question = t.q;
        explanation = t.e;
    }

    const wrongs = new Set();
    while (wrongs.size < 4) {
        const wNum = Math.floor(Math.random() * denom) + 1;
        const wDenom = Math.random() < 0.3 ? denom + 1 : denom;
        const wStr = `${wNum}/${wDenom}`;
        if (wStr !== answerStr) wrongs.add(wStr);
    }

    return {
        question,
        options: shuffleArray([answerStr, ...wrongs].slice(0, 4)),
        answer: answerStr,
        explanation,
        problemKey: `frac-${question}`
    };
}

function genGeometryProblem(diff) {
    const names = ['하츄핑', '바로핑', '아자핑', '차차핑', '라라핑', '해핑'];
    const name1 = names[Math.floor(Math.random() * names.length)];
    const name2 = names[(names.indexOf(name1) + 1) % names.length];

    // 난이도별 문제 유형 풀 정의
    let problemTypes = [];

    if (diff <= 5) {
        problemTypes = ['basic', 'counting_simple', 'pattern_basic', 'symmetry_basic'];
    } else if (diff <= 10) {
        problemTypes = ['counting_medium', 'area_unit', 'perimeter', 'pattern_medium', 'symmetry', 'rotation'];
    } else if (diff <= 15) {
        problemTypes = ['counting_hard', 'area_compare', 'angle', 'diagonal', 'special_quad', 'net'];
    } else {
        problemTypes = ['counting_expert', 'area_advanced', 'angle_advanced', 'combination', 'transform', 'net_advanced'];
    }

    const problemType = problemTypes[Math.floor(Math.random() * problemTypes.length)];
    let question, answer, explanation, shapeType = 'mixed';
    const wrongs = new Set();

    switch (problemType) {
        // ===== 기본 도형 (난이도 1-5) =====
        case 'basic': {
            const quizzes = [
                { q: `📐 ${name1}이(가) 색종이를 접어서 꼭짓점 3개인 도형을 만들었어요. 이 도형은?`, a: "삼각형", wrong: ["사각형", "오각형", "육각형"], e: `꼭짓점이 3개인 도형은 삼각형입니다.` },
                { q: `🏠 ${name1}이(가) 집을 그렸어요. 지붕 모양은 변이 3개예요. 이 도형은?`, a: "삼각형", wrong: ["사각형", "원", "오각형"], e: `변이 3개인 도형은 삼각형입니다.` },
                { q: `📺 TV 화면, 창문, 책... 모두 변이 4개예요. 이 도형의 이름은?`, a: "사각형", wrong: ["삼각형", "원", "오각형"], e: `변이 4개인 도형은 사각형입니다.` },
                { q: `⚽ 축구공은 어떤 도형들로 이루어져 있을까요? 검은 부분은?`, a: "오각형", wrong: ["삼각형", "사각형", "육각형"], e: `축구공의 검은 부분은 오각형입니다.` },
                { q: `🐝 벌집은 어떤 도형이 빈틈없이 모여 있을까요?`, a: "육각형", wrong: ["사각형", "오각형", "삼각형"], e: `벌집은 육각형들이 빈틈없이 모여 있습니다.` }
            ];
            const q = quizzes[Math.floor(Math.random() * quizzes.length)];
            question = q.q; answer = q.a; explanation = q.e;
            q.wrong.forEach(w => wrongs.add(w));
            break;
        }

        // ===== 도형 세기 (초급) =====
        case 'counting_simple': {
            const total = Math.floor(Math.random() * 3) + 3; // 3~5개
            const templates = [
                { q: `🔺 ${name1}이(가) 삼각형을 ${total}개 그렸어요. 꼭짓점은 모두 몇 개일까요?`, a: total * 3, e: `삼각형 1개에 꼭짓점 3개 × ${total}개 = ${total * 3}개` },
                { q: `◻️ 사각형 ${total}개를 그렸어요. 변은 모두 몇 개일까요?`, a: total * 4, e: `사각형 1개에 변 4개 × ${total}개 = ${total * 4}개` },
                { q: `⬡ ${name1}이(가) 오각형 ${total}개를 오렸어요. 꼭짓점은 모두 몇 개일까요?`, a: total * 5, e: `오각형 1개에 꼭짓점 5개 × ${total}개 = ${total * 5}개` }
            ];
            const t = templates[Math.floor(Math.random() * templates.length)];
            question = t.q; answer = `${t.a}개`; explanation = t.e;
            wrongs.add(`${t.a - 3}개`); wrongs.add(`${t.a + 3}개`); wrongs.add(`${t.a + 1}개`);
            break;
        }

        // ===== 패턴 기본 =====
        case 'pattern_basic': {
            const shapes = ['🔺', '◻️', '⭕'];
            const pattern = [shapes[0], shapes[1], shapes[0], shapes[1], '?'];
            question = `🧩 ${name1}이(가) 도형을 규칙적으로 늘어놓았어요.\n${pattern.join(' ')} \n?에 올 도형은?`;
            answer = "삼각형";
            explanation = `삼각형, 사각형이 반복되는 규칙이에요. 다음은 삼각형!`;
            wrongs.add("사각형"); wrongs.add("원"); wrongs.add("오각형");
            break;
        }

        // ===== 대칭 기본 =====
        case 'symmetry_basic': {
            const quizzes = [
                { q: `🦋 나비 날개처럼 반으로 접으면 똑같이 겹치는 도형이 있어요. 정사각형을 반으로 접으면?`, a: "직사각형", wrong: ["삼각형", "정사각형", "원"], e: `정사각형을 반으로 접으면 직사각형이 됩니다.` },
                { q: `✂️ ${name1}이(가) 종이를 반으로 접고 삼각형을 오렸어요. 펼치면 어떤 모양일까요?`, a: "마름모", wrong: ["삼각형", "사각형", "원"], e: `반으로 접은 삼각형을 펼치면 마름모 모양이 됩니다.` },
                { q: `🪞 거울에 비친 것처럼 좌우가 똑같은 도형은?`, a: "정삼각형", wrong: ["직각삼각형", "평행사변형", "사다리꼴"], e: `정삼각형은 좌우 대칭입니다.` }
            ];
            const q = quizzes[Math.floor(Math.random() * quizzes.length)];
            question = q.q; answer = q.a; explanation = q.e;
            q.wrong.forEach(w => wrongs.add(w));
            break;
        }

        // ===== 도형 세기 (중급) - 숨은 도형 찾기 =====
        case 'counting_medium': {
            const quizzes = [
                { q: `📐 큰 삼각형 안에 선을 2개 그어 작은 삼각형들을 만들었어요.\n🔺 안에 선 2개를 그으면 삼각형이 최대 몇 개 생길까요?`, a: "4개", wrong: ["3개", "5개", "6개"], e: `큰 삼각형 1개 + 작은 삼각형 3개 = 4개 (또는 배치에 따라 다름)` },
                { q: `◻️ 2×2 정사각형 격자가 있어요. 크고 작은 정사각형이 모두 몇 개일까요?`, a: "5개", wrong: ["4개", "6개", "9개"], e: `작은 정사각형 4개 + 큰 정사각형 1개 = 5개` },
                { q: `📏 직사각형 안에 대각선을 1개 그으면 삼각형이 몇 개 생길까요?`, a: "2개", wrong: ["1개", "3개", "4개"], e: `대각선 1개는 직사각형을 삼각형 2개로 나눕니다.` },
                { q: `🔷 정사각형 안에 대각선을 2개 모두 그으면 삼각형이 몇 개 생길까요?`, a: "4개", wrong: ["2개", "3개", "8개"], e: `대각선 2개가 정사각형을 삼각형 4개로 나눕니다.` }
            ];
            const q = quizzes[Math.floor(Math.random() * quizzes.length)];
            question = q.q; answer = q.a; explanation = q.e;
            q.wrong.forEach(w => wrongs.add(w));
            break;
        }

        // ===== 넓이 (단위 넓이 세기) =====
        case 'area_unit': {
            const width = Math.floor(Math.random() * 3) + 2;
            const height = Math.floor(Math.random() * 3) + 2;
            const area = width * height;
            question = `📐 ${name1}이(가) 가로 ${width}칸, 세로 ${height}칸인 직사각형을 그렸어요.\n작은 정사각형이 모두 몇 개 들어갈까요?`;
            answer = `${area}개`;
            explanation = `가로 ${width}칸 × 세로 ${height}칸 = ${area}개`;
            wrongs.add(`${area + 1}개`); wrongs.add(`${area - 1}개`); wrongs.add(`${width + height}개`);
            break;
        }

        // ===== 둘레 =====
        case 'perimeter': {
            const side = Math.floor(Math.random() * 4) + 2;
            const templates = [
                { q: `🏃 ${name1}이(가) 한 변이 ${side}cm인 정사각형 운동장을 한 바퀴 돌았어요. 몇 cm를 걸었을까요?`, a: side * 4, e: `정사각형 둘레 = ${side} × 4 = ${side * 4}cm` },
                { q: `🎀 정삼각형 모양 액자에 리본을 둘러요. 한 변이 ${side}cm면 리본이 몇 cm 필요할까요?`, a: side * 3, e: `정삼각형 둘레 = ${side} × 3 = ${side * 3}cm` },
                { q: `⬡ 정육각형 모양 벌집 한 칸의 둘레를 재요. 한 변이 ${side}cm면 둘레는?`, a: side * 6, e: `정육각형 둘레 = ${side} × 6 = ${side * 6}cm` }
            ];
            const t = templates[Math.floor(Math.random() * templates.length)];
            question = t.q; answer = `${t.a}cm`; explanation = t.e;
            wrongs.add(`${t.a + 2}cm`); wrongs.add(`${t.a - 2}cm`); wrongs.add(`${t.a + side}cm`);
            break;
        }

        // ===== 패턴 중급 =====
        case 'pattern_medium': {
            const n = Math.floor(Math.random() * 3) + 3;
            const quizzes = [
                { q: `🔺 ${name1}이(가) 삼각형을 1층에 1개, 2층에 2개, 3층에 3개... 이렇게 쌓아요.\n${n}층까지 쌓으면 삼각형이 모두 몇 개일까요?`, a: (n * (n + 1)) / 2, e: `1+2+3+...+${n} = ${(n * (n + 1)) / 2}개` },
                { q: `◻️ 정사각형으로 계단을 만들어요. 1층 1개, 2층 2개... ${n}층까지 만들면?`, a: (n * (n + 1)) / 2, e: `1+2+...+${n} = ${(n * (n + 1)) / 2}개` }
            ];
            const q = quizzes[Math.floor(Math.random() * quizzes.length)];
            question = q.q; answer = `${q.a}개`; explanation = q.e;
            wrongs.add(`${q.a + 1}개`); wrongs.add(`${q.a - 1}개`); wrongs.add(`${n * n}개`);
            break;
        }

        // ===== 대칭 =====
        case 'symmetry': {
            const quizzes = [
                { q: `🪞 ${name1}이(가) 대칭축을 찾고 있어요. 정사각형의 대칭축은 몇 개일까요?`, a: "4개", wrong: ["1개", "2개", "8개"], e: `정사각형은 가로, 세로, 대각선 2개 = 대칭축 4개` },
                { q: `🦋 직사각형(정사각형 아님)의 대칭축은 몇 개일까요?`, a: "2개", wrong: ["1개", "4개", "0개"], e: `직사각형은 가로, 세로 대칭축 2개` },
                { q: `⬡ 정육각형의 대칭축은 몇 개일까요?`, a: "6개", wrong: ["3개", "4개", "12개"], e: `정육각형은 대칭축이 6개입니다.` },
                { q: `🔶 마름모의 대칭축은 몇 개일까요?`, a: "2개", wrong: ["1개", "4개", "0개"], e: `마름모는 두 대각선이 대칭축이므로 2개` }
            ];
            const q = quizzes[Math.floor(Math.random() * quizzes.length)];
            question = q.q; answer = q.a; explanation = q.e;
            q.wrong.forEach(w => wrongs.add(w));
            break;
        }

        // ===== 회전 =====
        case 'rotation': {
            const quizzes = [
                { q: `🔄 정사각형을 90° 돌리면 어떻게 보일까요?`, a: "똑같은 정사각형", wrong: ["직사각형", "마름모", "평행사변형"], e: `정사각형은 90° 회전해도 같은 모양입니다.` },
                { q: `🔄 정삼각형을 120° 돌리면 어떻게 보일까요?`, a: "똑같은 정삼각형", wrong: ["이등변삼각형", "직각삼각형", "다른 모양"], e: `정삼각형은 120° 회전해도 같은 모양입니다.` },
                { q: `🔄 직사각형(정사각형 아님)을 90° 돌리면?`, a: "가로세로가 바뀐 직사각형", wrong: ["정사각형", "마름모", "똑같은 직사각형"], e: `직사각형은 90° 회전하면 가로세로가 바뀝니다.` }
            ];
            const q = quizzes[Math.floor(Math.random() * quizzes.length)];
            question = q.q; answer = q.a; explanation = q.e;
            q.wrong.forEach(w => wrongs.add(w));
            break;
        }

        // ===== 도형 세기 (고급) =====
        case 'counting_hard': {
            const quizzes = [
                { q: `📐 3×3 정사각형 격자에서 찾을 수 있는 모든 정사각형은 몇 개일까요?\n(1×1, 2×2, 3×3 모두 포함)`, a: "14개", wrong: ["9개", "10개", "13개"], e: `1×1: 9개 + 2×2: 4개 + 3×3: 1개 = 14개` },
                { q: `🔺 큰 삼각형을 4개의 작은 정삼각형으로 나눴어요. 찾을 수 있는 모든 삼각형은?`, a: "5개", wrong: ["4개", "6개", "8개"], e: `작은 삼각형 4개 + 큰 삼각형 1개 = 5개` },
                { q: `◻️ ${name1}이(가) 2×3 직사각형 격자를 그렸어요. 직사각형이 모두 몇 개일까요?`, a: "18개", wrong: ["6개", "12개", "15개"], e: `가로선 3개 중 2개 선택 × 세로선 4개 중 2개 선택 = 3×6 = 18개` }
            ];
            const q = quizzes[Math.floor(Math.random() * quizzes.length)];
            question = q.q; answer = q.a; explanation = q.e;
            q.wrong.forEach(w => wrongs.add(w));
            break;
        }

        // ===== 넓이 비교 =====
        case 'area_compare': {
            const quizzes = [
                { q: `📐 ${name1}이(가) 직사각형 2개를 비교해요.\n🅰️ 가로 6cm, 세로 4cm\n🅱️ 가로 5cm, 세로 5cm\n어느 것이 더 넓을까요?`, a: "🅱️", wrong: ["🅰️", "같다", "둘 다 넓지 않다"], e: `🅰️: 6×4=24cm² / 🅱️: 5×5=25cm² → 🅱️가 더 넓음` },
                { q: `◻️ 한 변이 4cm인 정사각형과 가로 8cm, 세로 2cm인 직사각형의 넓이를 비교하면?`, a: "같다", wrong: ["정사각형이 넓다", "직사각형이 넓다", "둘 다 넓지 않다"], e: `정사각형: 4×4=16cm² / 직사각형: 8×2=16cm² → 같음` },
                { q: `🔺 밑변 6cm, 높이 4cm인 삼각형과 한 변 3cm인 정사각형, 어느 것이 더 넓을까요?`, a: "삼각형", wrong: ["정사각형", "같다", "둘 다 넓지 않다"], e: `삼각형: 6×4÷2=12cm² / 정사각형: 3×3=9cm² → 삼각형이 넓음` }
            ];
            const q = quizzes[Math.floor(Math.random() * quizzes.length)];
            question = q.q; answer = q.a; explanation = q.e;
            q.wrong.forEach(w => wrongs.add(w));
            break;
        }

        // ===== 각도 =====
        case 'angle': {
            const quizzes = [
                { q: `📐 삼각형의 세 내각의 합은 몇 도일까요?`, a: "180도", wrong: ["90도", "270도", "360도"], e: `삼각형의 내각의 합은 항상 180°입니다.` },
                { q: `◻️ 사각형의 네 내각의 합은 몇 도일까요?`, a: "360도", wrong: ["180도", "270도", "540도"], e: `사각형의 내각의 합은 항상 360°입니다.` },
                { q: `📐 ${name1}이(가) 삼각형에서 두 각이 60°, 70°예요. 나머지 한 각은?`, a: "50도", wrong: ["60도", "70도", "80도"], e: `180° - 60° - 70° = 50°` },
                { q: `◻️ 직사각형의 한 각은 몇 도일까요?`, a: "90도", wrong: ["60도", "120도", "180도"], e: `직사각형의 모든 각은 90°(직각)입니다.` }
            ];
            const q = quizzes[Math.floor(Math.random() * quizzes.length)];
            question = q.q; answer = q.a; explanation = q.e;
            q.wrong.forEach(w => wrongs.add(w));
            break;
        }

        // ===== 대각선 =====
        case 'diagonal': {
            const n = Math.floor(Math.random() * 4) + 4; // 4~7각형
            const diag = n * (n - 3) / 2;
            question = `📐 ${name1}이(가) ${n}각형의 대각선을 모두 그리려고 해요. 대각선은 몇 개일까요?`;
            answer = `${diag}개`;
            explanation = `${n}각형의 대각선 = ${n}×(${n}-3)÷2 = ${diag}개`;
            wrongs.add(`${diag + 1}개`); wrongs.add(`${diag - 1}개`); wrongs.add(`${n}개`);
            break;
        }

        // ===== 특수 사각형 =====
        case 'special_quad': {
            const quizzes = [
                { q: `💎 ${name1}이(가) 네 변의 길이가 같고 네 각이 직각인 도형을 그렸어요. 이 도형은?`, a: "정사각형", wrong: ["직사각형", "마름모", "평행사변형"], e: `네 변이 같고 네 각이 직각인 사각형은 정사각형입니다.` },
                { q: `🔶 네 변의 길이가 모두 같지만 각이 직각이 아닌 사각형은?`, a: "마름모", wrong: ["정사각형", "직사각형", "사다리꼴"], e: `네 변이 같은 사각형은 마름모입니다.` },
                { q: `📏 마주보는 두 쌍의 변이 각각 평행한 사각형은?`, a: "평행사변형", wrong: ["사다리꼴", "마름모", "직사각형"], e: `두 쌍의 대변이 평행한 사각형은 평행사변형입니다.` },
                { q: `🪜 한 쌍의 대변만 평행한 사각형은?`, a: "사다리꼴", wrong: ["평행사변형", "직사각형", "마름모"], e: `한 쌍의 대변만 평행한 사각형은 사다리꼴입니다.` }
            ];
            const q = quizzes[Math.floor(Math.random() * quizzes.length)];
            question = q.q; answer = q.a; explanation = q.e;
            q.wrong.forEach(w => wrongs.add(w));
            break;
        }

        // ===== 전개도 =====
        case 'net': {
            const quizzes = [
                { q: `📦 정육면체 전개도를 접으면 면이 몇 개인 도형이 될까요?`, a: "6개", wrong: ["4개", "8개", "12개"], e: `정육면체는 면이 6개입니다.` },
                { q: `🎲 주사위 전개도에서 마주보는 면의 눈의 합은 항상?`, a: "7", wrong: ["6", "8", "12"], e: `주사위에서 마주보는 면의 합은 항상 7입니다.` },
                { q: `📦 직육면체를 펼치면 어떤 도형이 몇 개 나올까요?`, a: "직사각형 6개", wrong: ["정사각형 6개", "직사각형 4개", "삼각형 6개"], e: `직육면체를 펼치면 직사각형 6개가 나옵니다.` },
                { q: `🔺 삼각기둥을 펼치면 삼각형이 몇 개 나올까요?`, a: "2개", wrong: ["3개", "4개", "6개"], e: `삼각기둥의 밑면 2개가 삼각형입니다.` }
            ];
            const q = quizzes[Math.floor(Math.random() * quizzes.length)];
            question = q.q; answer = q.a; explanation = q.e;
            q.wrong.forEach(w => wrongs.add(w));
            break;
        }

        // ===== 도형 세기 (전문가) =====
        case 'counting_expert': {
            const quizzes = [
                { q: `📐 4×4 정사각형 격자에서 찾을 수 있는 모든 정사각형은 몇 개일까요?`, a: "30개", wrong: ["16개", "25개", "36개"], e: `1×1:16 + 2×2:9 + 3×3:4 + 4×4:1 = 30개` },
                { q: `🔺 정삼각형을 16개의 작은 정삼각형으로 나눴어요. 찾을 수 있는 모든 정삼각형은?`, a: "27개", wrong: ["16개", "20개", "25개"], e: `1칸:16 + 4칸:7 + 9칸:3 + 16칸:1 = 27개` }
            ];
            const q = quizzes[Math.floor(Math.random() * quizzes.length)];
            question = q.q; answer = q.a; explanation = q.e;
            q.wrong.forEach(w => wrongs.add(w));
            break;
        }

        // ===== 넓이 고급 =====
        case 'area_advanced': {
            const quizzes = [
                { q: `📐 한 변이 10cm인 정사각형에서 한 변이 4cm인 정사각형을 잘라냈어요. 남은 넓이는?`, a: "84cm²", wrong: ["60cm²", "96cm²", "100cm²"], e: `10×10 - 4×4 = 100 - 16 = 84cm²` },
                { q: `🔺 밑변 8cm, 높이 6cm인 평행사변형의 넓이는?`, a: "48cm²", wrong: ["24cm²", "14cm²", "42cm²"], e: `평행사변형 넓이 = 밑변×높이 = 8×6 = 48cm²` },
                { q: `🔶 대각선이 6cm, 8cm인 마름모의 넓이는?`, a: "24cm²", wrong: ["48cm²", "14cm²", "28cm²"], e: `마름모 넓이 = 대각선×대각선÷2 = 6×8÷2 = 24cm²` }
            ];
            const q = quizzes[Math.floor(Math.random() * quizzes.length)];
            question = q.q; answer = q.a; explanation = q.e;
            q.wrong.forEach(w => wrongs.add(w));
            break;
        }

        // ===== 각도 고급 =====
        case 'angle_advanced': {
            const quizzes = [
                { q: `📐 정오각형의 한 내각의 크기는 몇 도일까요?`, a: "108도", wrong: ["100도", "120도", "135도"], e: `정오각형 내각 = (5-2)×180÷5 = 108°` },
                { q: `⬡ 정육각형의 한 내각의 크기는 몇 도일까요?`, a: "120도", wrong: ["108도", "135도", "150도"], e: `정육각형 내각 = (6-2)×180÷6 = 120°` },
                { q: `📐 ${name1}이(가) 삼각형에서 한 외각이 110°예요. 이웃하지 않은 두 내각의 합은?`, a: "110도", wrong: ["70도", "180도", "250도"], e: `외각 = 이웃하지 않은 두 내각의 합 = 110°` }
            ];
            const q = quizzes[Math.floor(Math.random() * quizzes.length)];
            question = q.q; answer = q.a; explanation = q.e;
            q.wrong.forEach(w => wrongs.add(w));
            break;
        }

        // ===== 도형 조합 =====
        case 'combination': {
            const quizzes = [
                { q: `🧩 ${name1}이(가) 정삼각형 2개를 붙여 새 도형을 만들었어요. 만들 수 있는 도형은?`, a: "마름모", wrong: ["정사각형", "직사각형", "사다리꼴"], e: `정삼각형 2개를 붙이면 마름모가 됩니다.` },
                { q: `🧩 직각이등변삼각형 2개를 붙이면 어떤 도형이 될까요?`, a: "정사각형", wrong: ["직사각형", "마름모", "평행사변형"], e: `직각이등변삼각형 2개를 빗변끼리 붙이면 정사각형이 됩니다.` },
                { q: `🧩 정사각형을 대각선으로 자르면 어떤 삼각형 2개가 될까요?`, a: "직각이등변삼각형", wrong: ["정삼각형", "직각삼각형", "이등변삼각형"], e: `정사각형을 대각선으로 자르면 직각이등변삼각형 2개가 됩니다.` }
            ];
            const q = quizzes[Math.floor(Math.random() * quizzes.length)];
            question = q.q; answer = q.a; explanation = q.e;
            q.wrong.forEach(w => wrongs.add(w));
            break;
        }

        // ===== 변환 =====
        case 'transform': {
            const quizzes = [
                { q: `🔄 ${name1}이(가) 도형을 밀고, 돌리고, 뒤집었어요. 도형의 모양이 변하지 않는 것은?`, a: "밀기", wrong: ["늘이기", "줄이기", "찌그러뜨리기"], e: `밀기(평행이동)는 도형의 모양과 크기가 변하지 않습니다.` },
                { q: `🪞 ${name1}이(가) 도형을 거울에 비춰봤어요. 바뀌지 않는 것은?`, a: "넓이", wrong: ["방향", "좌우", "앞뒤"], e: `거울에 비춰도 도형의 넓이는 변하지 않습니다.` }
            ];
            const q = quizzes[Math.floor(Math.random() * quizzes.length)];
            question = q.q; answer = q.a; explanation = q.e;
            q.wrong.forEach(w => wrongs.add(w));
            break;
        }

        // ===== 전개도 고급 =====
        case 'net_advanced': {
            const quizzes = [
                { q: `📦 정육면체 전개도에서 한 면과 마주보는 면을 찾으려면 몇 칸 떨어져 있어야 할까요?`, a: "2칸", wrong: ["1칸", "3칸", "바로 옆"], e: `전개도에서 마주보는 면은 한 면을 사이에 두고 2칸 떨어져 있습니다.` },
                { q: `🔺 정사면체(삼각뿔)의 면은 모두 몇 개일까요?`, a: "4개", wrong: ["3개", "5개", "6개"], e: `정사면체는 정삼각형 4개로 이루어져 있습니다.` },
                { q: `📦 정육면체의 모서리는 몇 개일까요?`, a: "12개", wrong: ["6개", "8개", "10개"], e: `정육면체는 모서리가 12개입니다.` },
                { q: `📦 정육면체의 꼭짓점은 몇 개일까요?`, a: "8개", wrong: ["4개", "6개", "12개"], e: `정육면체는 꼭짓점이 8개입니다.` }
            ];
            const q = quizzes[Math.floor(Math.random() * quizzes.length)];
            question = q.q; answer = q.a; explanation = q.e;
            q.wrong.forEach(w => wrongs.add(w));
            break;
        }

        default: {
            // 기본 문제
            question = `📐 ${name1}이(가) 세 변의 길이가 모두 같은 삼각형을 그렸어요. 이 삼각형의 이름은?`;
            answer = "정삼각형";
            explanation = `세 변의 길이가 같은 삼각형은 정삼각형입니다.`;
            wrongs.add("이등변삼각형"); wrongs.add("직각삼각형"); wrongs.add("둔각삼각형");
        }
    }

    // 오답 배열로 변환 및 정답 포함하여 셔플
    const wrongsArray = Array.from(wrongs).filter(w => w !== answer).slice(0, 3);
    const options = shuffleArray([answer, ...wrongsArray]);

    return {
        question,
        options,
        answer,
        explanation: explanation || `정답은 ${answer}입니다!`,
        problemKey: `geo-${problemType}-${Math.random()}`,
        shapeType
    };
}

function genMeasurementProblem(diff) {
    const names = ['하츄핑', '바로핑', '아자핑', '차차핑', '라라핑'];
    const name1 = names[Math.floor(Math.random() * names.length)];

    // 시계 보기 문제
    let h, m;

    if (diff <= 3) {
        // 정각
        h = Math.floor(Math.random() * 12) + 1;
        m = 0;
    } else if (diff <= 6) {
        // 30분 단위
        h = Math.floor(Math.random() * 12) + 1;
        m = Math.random() < 0.5 ? 0 : 30;
    } else if (diff <= 10) {
        // 5분 단위
        h = Math.floor(Math.random() * 12) + 1;
        m = Math.floor(Math.random() * 12) * 5;
    } else {
        // 1분 단위
        h = Math.floor(Math.random() * 12) + 1;
        m = Math.floor(Math.random() * 60);
    }

    const answer = `${h}시` + (m > 0 ? ` ${m}분` : '');

    // 100% 문장제 템플릿 (시각적 이모지 포함)
    const templates = [
        `🕐 ${name1}이(가) 시계를 보고 있어요. 지금 몇 시 몇 분일까요?`,
        `⏰ 태희가 학교에 가려고 시계를 봤어요. 지금 시간은 몇 시 몇 분일까요?`,
        `🕐 ${name1}의 방에 있는 시계가 가리키는 시간은 몇 시 몇 분일까요?`,
        `⏰ 점심을 먹으려고 시계를 봤어요. 지금 몇 시 몇 분일까요?`,
        `🕐 ${name1}이(가) 친구와 만나기로 한 시간을 확인해요. 시계가 가리키는 시간은?`,
        `⏰ 태희가 숙제를 시작하려고 시계를 봤어요. 지금 시간을 읽어볼까요?`
    ];
    const question = templates[Math.floor(Math.random() * templates.length)];

    // 오답 생성
    const wrongs = new Set();
    while (wrongs.size < 4) {
        let wh = h + Math.floor(Math.random() * 5) - 2;
        if (wh < 1) wh += 12;
        if (wh > 12) wh -= 12;

        let wm = m + Math.floor(Math.random() * 6) * 5 - 15; // 5분 단위 오차
        if (wm < 0) wm += 60;
        if (wm >= 60) wm -= 60;

        // 난이도 높으면 분침을 헷갈리게 (예: 55분을 11분으로 착각)
        if (diff > 8 && Math.random() < 0.3) {
            const fakeM = Math.floor(m / 5);
            if (fakeM > 0) wm = fakeM;
        }

        const wStr = `${wh}시` + (wm > 0 ? ` ${wm}분` : '');
        if (wStr !== answer) wrongs.add(wStr);
    }

    return {
        question,
        options: shuffleArray([answer, ...wrongs].slice(0, 4)),
        answer,
        explanation: `짧은 바늘(시침)이 ${h} 근처를 가리키고, 긴 바늘(분침)이 ${m === 0 ? '12' : Math.floor(m / 5)}을 가리키고 있어요!\n정답은 ${answer}입니다.`,
        problemKey: `clock-${h}-${m}`,
        clockTime: { h, m }
    };
}

function genPatternProblem(diff) {
    const names = ['하츄핑', '바로핑', '아자핑', '차차핑', '라라핑', '해핑'];
    const name1 = names[Math.floor(Math.random() * names.length)];

    // 난이도별 패턴 유형 선택
    let patternTypes = [];
    if (diff <= 5) {
        patternTypes = ['arithmetic_simple', 'repeat'];
    } else if (diff <= 10) {
        patternTypes = ['arithmetic', 'skip_count', 'decreasing'];
    } else if (diff <= 15) {
        patternTypes = ['arithmetic_hard', 'geometric_simple', 'fibonacci_simple', 'alternating'];
    } else {
        patternTypes = ['geometric', 'fibonacci', 'square', 'triangle_num'];
    }

    const patternType = patternTypes[Math.floor(Math.random() * patternTypes.length)];
    let question, answer, explanation;
    const wrongs = new Set();

    switch (patternType) {
        // 등차수열 (간단)
        case 'arithmetic_simple': {
            const start = Math.floor(Math.random() * 5) + 1;
            const step = Math.floor(Math.random() * 3) + 1;
            const seq = [start, start + step, start + 2 * step, '?', start + 4 * step];
            answer = start + 3 * step;
            question = `🔢 ${name1}이(가) 규칙을 찾고 있어요!\n${seq.join(', ')}\n?에 알맞은 수는?`;
            explanation = `${step}씩 커지는 규칙이에요. ?는 ${answer}`;
            wrongs.add(answer + step); wrongs.add(answer - step); wrongs.add(answer + 1);
            break;
        }

        // 반복 패턴
        case 'repeat': {
            const patterns = [
                { seq: [1, 2, 1, 2, '?'], a: 1, e: '1, 2가 반복되는 규칙이에요.' },
                { seq: [3, 3, 5, 3, 3, '?'], a: 5, e: '3, 3, 5가 반복되는 규칙이에요.' },
                { seq: [2, 4, 2, 4, '?'], a: 2, e: '2, 4가 반복되는 규칙이에요.' },
                { seq: [1, 2, 3, 1, 2, '?'], a: 3, e: '1, 2, 3이 반복되는 규칙이에요.' }
            ];
            const p = patterns[Math.floor(Math.random() * patterns.length)];
            question = `🔁 ${name1}이(가) 반복되는 규칙을 찾아요!\n${p.seq.join(', ')}\n?에 알맞은 수는?`;
            answer = p.a;
            explanation = p.e;
            wrongs.add(p.a + 1); wrongs.add(p.a + 2); wrongs.add(p.a - 1 > 0 ? p.a - 1 : p.a + 3);
            break;
        }

        // 등차수열 (일반)
        case 'arithmetic': {
            const start = Math.floor(Math.random() * 10) + 1;
            const step = Math.floor(Math.random() * 5) + 2;
            const blankIdx = Math.floor(Math.random() * 4) + 1;
            const seq = [];
            for (let i = 0; i < 5; i++) seq.push(start + i * step);
            answer = seq[blankIdx];
            seq[blankIdx] = '?';
            question = `💰 ${name1}이(가) ${step}원씩 저금해요.\n${seq.join(', ')}\n?에 알맞은 수는?`;
            explanation = `${step}씩 커지는 규칙이에요. ?는 ${answer}`;
            wrongs.add(answer + step); wrongs.add(answer - step); wrongs.add(answer + 1);
            break;
        }

        // 뛰어 세기
        case 'skip_count': {
            const skip = [2, 3, 5, 10][Math.floor(Math.random() * 4)];
            const start = skip;
            const seq = [start, start + skip, start + 2 * skip, start + 3 * skip, '?'];
            answer = start + 4 * skip;
            question = `🦘 ${skip}씩 뛰어 세기를 해요!\n${seq.join(', ')}\n?에 알맞은 수는?`;
            explanation = `${skip}씩 뛰어 세면 ?는 ${answer}`;
            wrongs.add(answer + skip); wrongs.add(answer - skip); wrongs.add(answer + 1);
            break;
        }

        // 감소 수열
        case 'decreasing': {
            const start = Math.floor(Math.random() * 10) + 20;
            const step = Math.floor(Math.random() * 3) + 2;
            const seq = [start, start - step, start - 2 * step, '?', start - 4 * step];
            answer = start - 3 * step;
            question = `📉 수가 ${step}씩 줄어들어요!\n${seq.join(', ')}\n?에 알맞은 수는?`;
            explanation = `${step}씩 작아지는 규칙이에요. ?는 ${answer}`;
            wrongs.add(answer + step); wrongs.add(answer - step); wrongs.add(answer + 1);
            break;
        }

        // 등차수열 (고급)
        case 'arithmetic_hard': {
            const start = Math.floor(Math.random() * 5) + 1;
            const step = Math.floor(Math.random() * 7) + 3;
            const seq = [start, start + step, '?', start + 3 * step, start + 4 * step];
            answer = start + 2 * step;
            question = `🧠 규칙을 찾아 ?에 알맞은 수를 구하세요.\n${seq.join(', ')}`;
            explanation = `첫째항 ${start}, 공차 ${step}인 등차수열이에요. ?는 ${answer}`;
            wrongs.add(answer + step); wrongs.add(answer - step); wrongs.add(start + step + 1);
            break;
        }

        // 등비수열 (간단)
        case 'geometric_simple': {
            const start = Math.floor(Math.random() * 2) + 1;
            const ratio = 2;
            const seq = [start, start * ratio, start * ratio * ratio, '?'];
            answer = start * ratio * ratio * ratio;
            question = `📈 ${name1}이(가) 세균을 관찰해요. 2배씩 늘어나요!\n${seq.join(', ')}\n?에 알맞은 수는?`;
            explanation = `2배씩 커지는 규칙이에요. ?는 ${answer}`;
            wrongs.add(answer / 2); wrongs.add(answer * 2); wrongs.add(answer + start);
            break;
        }

        // 피보나치 (간단)
        case 'fibonacci_simple': {
            const seq = [1, 1, 2, 3, '?'];
            answer = 5;
            question = `🌀 앞의 두 수를 더하면 다음 수가 되는 신기한 규칙!\n${seq.join(', ')}\n?에 알맞은 수는?`;
            explanation = `2 + 3 = 5이므로 ?는 5`;
            wrongs.add(4); wrongs.add(6); wrongs.add(8);
            break;
        }

        // 교대 패턴
        case 'alternating': {
            const a = Math.floor(Math.random() * 3) + 1;
            const b = a + Math.floor(Math.random() * 5) + 3;
            const seq = [a, b, a + 1, b + 1, a + 2, '?'];
            answer = b + 2;
            question = `🔀 두 줄기로 나뉘어 커지는 규칙이에요!\n${seq.join(', ')}\n?에 알맞은 수는?`;
            explanation = `홀수 번째는 ${a}부터 1씩, 짝수 번째는 ${b}부터 1씩 커져요. ?는 ${answer}`;
            wrongs.add(a + 3); wrongs.add(b + 1); wrongs.add(b + 3);
            break;
        }

        // 등비수열
        case 'geometric': {
            const start = Math.floor(Math.random() * 2) + 1;
            const ratio = 3;
            const seq = [start, start * ratio, '?', start * ratio * ratio * ratio];
            answer = start * ratio * ratio;
            question = `📈 세균이 3배씩 증식해요!\n${seq.join(', ')}\n?에 알맞은 수는?`;
            explanation = `3배씩 커지는 규칙이에요. ?는 ${answer}`;
            wrongs.add(answer / 3); wrongs.add(answer * 3); wrongs.add(answer + 3);
            break;
        }

        // 피보나치
        case 'fibonacci': {
            const seq = [1, 1, 2, 3, 5, '?'];
            answer = 8;
            question = `🌀 ${name1}이(가) 피보나치 수열을 찾았어요! 앞의 두 수를 더하면 다음 수!\n${seq.join(', ')}\n?에 알맞은 수는?`;
            explanation = `3 + 5 = 8이므로 ?는 8`;
            wrongs.add(7); wrongs.add(9); wrongs.add(10);
            break;
        }

        // 제곱수
        case 'square': {
            const seq = [1, 4, 9, 16, '?'];
            answer = 25;
            question = `⬛ 1×1=1, 2×2=4, 3×3=9, 4×4=16, 5×5=?\n정사각형 수를 찾아보세요!`;
            explanation = `5×5 = 25이므로 ?는 25`;
            wrongs.add(20); wrongs.add(24); wrongs.add(36);
            break;
        }

        // 삼각수
        case 'triangle_num': {
            const seq = [1, 3, 6, 10, '?'];
            answer = 15;
            question = `🔺 삼각형으로 점을 쌓아요!\n1층: 1개, 2층: 1+2=3개, 3층: 1+2+3=6개...\n${seq.join(', ')}\n5층까지 쌓으면 점은 몇 개?`;
            explanation = `1+2+3+4+5 = 15이므로 ?는 15`;
            wrongs.add(14); wrongs.add(16); wrongs.add(21);
            break;
        }

        default: {
            const start = 2;
            const step = 3;
            const seq = [start, start + step, start + 2 * step, start + 3 * step, '?'];
            answer = start + 4 * step;
            question = `🔢 규칙을 찾아보세요!\n${seq.join(', ')}\n?에 알맞은 수는?`;
            explanation = `${step}씩 커지는 규칙이에요. ?는 ${answer}`;
            wrongs.add(answer + 1); wrongs.add(answer - 1); wrongs.add(answer + step);
        }
    }

    const wrongsArray = Array.from(wrongs).filter(w => w !== answer && w > 0).slice(0, 3);
    while (wrongsArray.length < 3) {
        const w = answer + wrongsArray.length + 1;
        if (w !== answer && !wrongsArray.includes(w)) wrongsArray.push(w);
    }
    const options = shuffleArray([answer, ...wrongsArray]);

    return {
        question,
        options,
        answer,
        explanation,
        problemKey: `pattern-${patternType}-${Math.random()}`
    };
}

function genLengthProblem(diff) {
    const names = ['하츄핑', '바로핑', '아자핑', '차차핑', '라라핑'];
    const name1 = names[Math.floor(Math.random() * names.length)];

    // 길이 재기 (자 눈금 읽기)
    const length = Math.floor(Math.random() * 8) + 2; // 2~9cm
    const start = Math.floor(Math.random() * 3); // 0, 1, 2cm에서 시작 (난이도)

    const answer = `${length}cm`;

    // 100% 문장제 템플릿 (시각적 이모지 포함)
    const templates = [
        `✏️ ${name1}이(가) 연필의 길이를 재고 있어요. 이 연필의 길이는 몇 cm일까요?`,
        `📏 태희가 자로 크레파스의 길이를 재요. 크레파스의 길이는 몇 cm일까요?`,
        `✏️ ${name1}의 새 연필이에요! 이 연필의 길이를 자로 재면 몇 cm일까요?`,
        `📏 미술 시간에 색연필의 길이를 재요. 색연필의 길이는 몇 cm일까요?`,
        `✏️ 태희가 필통에서 연필을 꺼내 길이를 재요. 몇 cm일까요?`,
        `📏 ${name1}이(가) 리본의 길이를 재고 있어요. 리본의 길이는 몇 cm일까요?`
    ];
    const question = templates[Math.floor(Math.random() * templates.length)];

    const wrongs = new Set();
    while (wrongs.size < 4) {
        let w = length + Math.floor(Math.random() * 5) - 2;
        if (w < 1) w = length + 1;
        if (w !== length) wrongs.add(`${w}cm`);
    }

    // 시작점이 0이 아닐 때 헷갈리는 오답 (끝 눈금만 읽은 경우)
    if (start > 0) {
        wrongs.add(`${start + length}cm`);
    }

    return {
        question,
        options: shuffleArray([answer, ...Array.from(wrongs)].slice(0, 4)),
        answer,
        explanation: `물건의 한쪽 끝이 눈금 ${start}에 있고, 다른 쪽 끝이 눈금 ${start + length}에 있으니까,\n${start + length} - ${start} = ${length}cm입니다!`,
        problemKey: `length-${length}-${start}`,
        rulerData: { length, start }
    };
}

function genGraphProblem(diff) {
    const names = ['하츄핑', '바로핑', '아자핑', '차차핑', '라라핑'];
    const name1 = names[Math.floor(Math.random() * names.length)];

    // 막대그래프 해석 - 다양한 주제
    const themes = [
        { items: ['🍎 사과', '🍌 바나나', '🍇 포도', '🍊 귤'], topic: '과일', unit: '개' },
        { items: ['🐶 강아지', '🐱 고양이', '🐰 토끼', '🐹 햄스터'], topic: '좋아하는 동물', unit: '명' },
        { items: ['⚽ 축구', '🏀 농구', '⚾ 야구', '🎾 테니스'], topic: '좋아하는 운동', unit: '명' },
        { items: ['🍦 바닐라', '🍫 초콜릿', '🍓 딸기', '🍵 녹차'], topic: '좋아하는 아이스크림', unit: '명' }
    ];
    const theme = themes[Math.floor(Math.random() * themes.length)];
    const items = theme.items;

    // 최대/최소값이 유일하도록 counts 생성 (버그 수정)
    let counts;
    let attempts = 0;
    do {
        counts = items.map(() => Math.floor(Math.random() * 8) + 2); // 2~9개
        attempts++;
    } while (attempts < 10 && (
        counts.filter(c => c === Math.max(...counts)).length > 1 ||
        counts.filter(c => c === Math.min(...counts)).length > 1
    ));

    // 여전히 중복이면 강제로 유일하게 만듦
    const maxVal = Math.max(...counts);
    const minVal = Math.min(...counts);
    const maxIndices = counts.map((c, i) => c === maxVal ? i : -1).filter(i => i >= 0);
    const minIndices = counts.map((c, i) => c === minVal ? i : -1).filter(i => i >= 0);

    if (maxIndices.length > 1) {
        // 첫 번째를 제외하고 나머지 최대값들을 조정
        for (let i = 1; i < maxIndices.length; i++) {
            counts[maxIndices[i]] = maxVal - 1 - i;
            if (counts[maxIndices[i]] < 1) counts[maxIndices[i]] = 1;
        }
    }
    if (minIndices.length > 1) {
        // 첫 번째를 제외하고 나머지 최소값들을 조정
        for (let i = 1; i < minIndices.length; i++) {
            counts[minIndices[i]] = minVal + 1 + i;
            if (counts[minIndices[i]] > 9) counts[minIndices[i]] = 9;
        }
    }

    // 질문 유형 랜덤 선택
    const qType = Math.floor(Math.random() * 3);
    let question, answer, explanation;

    if (qType === 0) {
        // 가장 많은 것 찾기
        const maxVal = Math.max(...counts);
        const maxIdx = counts.indexOf(maxVal);
        const maxItem = items[maxIdx];
        question = `📊 ${name1}이(가) 반 친구들이 좋아하는 ${theme.topic}을 조사해서 그래프로 나타냈어요. 가장 많은 것은 무엇일까요?`;
        answer = maxItem;
        explanation = `그래프에서 막대가 가장 높은 것은 ${maxItem}이에요. ${maxVal}${theme.unit}으로 가장 많습니다!`;
    } else if (qType === 1) {
        // 특정 항목 개수 묻기
        const targetIdx = Math.floor(Math.random() * items.length);
        question = `📊 태희네 반에서 좋아하는 ${theme.topic}을 조사했어요. ${items[targetIdx]}을(를) 좋아하는 친구는 몇 ${theme.unit}일까요?`;
        answer = `${counts[targetIdx]}${theme.unit}`;
        explanation = `그래프에서 ${items[targetIdx]}의 막대 높이를 보면 ${counts[targetIdx]}${theme.unit}입니다.`;
    } else {
        // 전체 개수 묻기
        const total = counts.reduce((a, b) => a + b, 0);
        question = `📊 ${name1}이(가) 조사한 ${theme.topic} 그래프를 보세요. 조사에 참여한 친구는 모두 몇 ${theme.unit}일까요?`;
        answer = `${total}${theme.unit}`;
        explanation = `모든 막대의 수를 더하면 ${counts.join(' + ')} = ${total}${theme.unit}입니다.`;
    }

    const wrongs = new Set();
    if (qType === 0) {
        items.forEach(it => { if (it !== answer) wrongs.add(it); });
    } else {
        while (wrongs.size < 4) {
            let wVal = parseInt(answer) + Math.floor(Math.random() * 7) - 3;
            if (wVal < 1) wVal = 1;
            const wStr = `${wVal}${theme.unit}`;
            if (wStr !== answer) wrongs.add(wStr);
        }
    }

    // graphData에서 이모지 제거하여 렌더링 호환
    const cleanItems = items.map(i => i.replace(/^[^\s]+\s/, ''));

    return {
        question,
        options: shuffleArray([answer, ...Array.from(wrongs)].slice(0, 4)),
        answer,
        explanation,
        problemKey: `graph-${qType}-${counts.join('-')}`,
        graphData: { items: cleanItems, counts }
    };
}

function genCreativeProblem(diff) {
    // 영재/사고력 수학 문제 - 난이도별 다양한 유형
    const names = ['하츄핑', '바로핑', '아자핑', '차차핑', '라라핑', '해핑'];
    const name1 = names[Math.floor(Math.random() * names.length)];
    const name2 = names[(names.indexOf(name1) + 1) % names.length];
    const name3 = names[(names.indexOf(name1) + 2) % names.length];

    let problemTypes = [];
    if (diff <= 5) {
        // 1~2학년 영재교육 수준 문제 유형 확대
        problemTypes = [
            'cryptarithm_simple', 'age_simple', 'order_simple', 'pyramid_simple', 'pattern_simple',
            'blocks_counting', 'number_decompose', 'reverse_think', 'shape_logic', 'balance_scale',
            'number_box', 'hidden_number', 'compare_logic', 'simple_sequence'
        ];
    } else if (diff <= 10) {
        problemTypes = [
            'cryptarithm_medium', 'age_medium', 'order_medium', 'pyramid_medium', 'magic_simple', 'logic_simple',
            'blocks_advanced', 'number_relation', 'magic_box', 'path_counting'
        ];
    } else if (diff <= 15) {
        problemTypes = [
            'cryptarithm_hard', 'age_hard', 'order_hard', 'magic_medium', 'logic_medium', 'combinatorics_simple',
            'spatial_rotation', 'number_puzzle'
        ];
    } else {
        problemTypes = ['cryptarithm_expert', 'magic_hard', 'logic_hard', 'combinatorics_medium', 'cipher', 'optimization'];
    }

    const problemType = problemTypes[Math.floor(Math.random() * problemTypes.length)];
    let question, answer, explanation;
    const wrongs = new Set();

    const symbols = [
        { s: '⭐', name: '별' }, { s: '💎', name: '보석' },
        { s: '🌸', name: '꽃' }, { s: '🎈', name: '풍선' },
        { s: '🍎', name: '사과' }, { s: '🌙', name: '달' }
    ];

    switch (problemType) {
        // ===== 복면산 (초급) =====
        case 'cryptarithm_simple': {
            const val = Math.floor(Math.random() * 8) + 1;
            const sum = val * 2;
            const sym = symbols[Math.floor(Math.random() * symbols.length)];
            question = `🧩 ${name1}이(가) 비밀 암호를 풀고 있어요!\n${sym.s} + ${sym.s} = ${sum}일 때, ${sym.s}(${sym.name})은 얼마일까요?`;
            answer = String(val);
            explanation = `${sym.s} + ${sym.s} = ${sum}이므로, ${sym.s} = ${sum}÷2 = ${val}`;
            while (wrongs.size < 3) {
                const w = Math.floor(Math.random() * 10) + 1;
                if (w !== val) wrongs.add(String(w));
            }
            break;
        }

        // ===== 복면산 (중급) =====
        case 'cryptarithm_medium': {
            const a = Math.floor(Math.random() * 5) + 2;
            const b = Math.floor(Math.random() * 5) + 2;
            const sym1 = symbols[0], sym2 = symbols[1];
            question = `🧩 ${name1}이(가) 암호를 풀어요!\n${sym1.s} + ${sym2.s} = ${a + b}, ${sym1.s} - ${sym2.s} = ${a - b}\n${sym1.s}(${sym1.name})은 얼마일까요?`;
            answer = String(a);
            explanation = `두 식을 더하면 2×${sym1.s} = ${2 * a}, ${sym1.s} = ${a}`;
            wrongs.add(String(b)); wrongs.add(String(a + b)); wrongs.add(String(a + 1));
            break;
        }

        // ===== 복면산 (고급) =====
        case 'cryptarithm_hard': {
            const x = Math.floor(Math.random() * 4) + 2;
            const y = Math.floor(Math.random() * 4) + 1;
            const sym1 = symbols[0], sym2 = symbols[1];
            question = `🧩 ${sym1.s} × ${sym2.s} = ${x * y}, ${sym1.s} + ${sym2.s} = ${x + y}\n${sym1.s}(${sym1.name})이 ${sym2.s}(${sym2.name})보다 클 때, ${sym1.s}은?`;
            answer = String(Math.max(x, y));
            explanation = `곱이 ${x * y}, 합이 ${x + y}인 두 수는 ${x}와 ${y}. 큰 수는 ${Math.max(x, y)}`;
            wrongs.add(String(Math.min(x, y))); wrongs.add(String(x + y)); wrongs.add(String(x * y));
            break;
        }

        // ===== 복면산 (전문가) =====
        case 'cryptarithm_expert': {
            const a = Math.floor(Math.random() * 3) + 2;
            const b = Math.floor(Math.random() * 3) + 1;
            const c = Math.floor(Math.random() * 3) + 1;
            const sym1 = symbols[0], sym2 = symbols[1], sym3 = symbols[2];
            question = `🧩 ${sym1.s}+${sym2.s}+${sym3.s}=${a + b + c}, ${sym1.s}×${sym2.s}=${a * b}\n${sym1.s}=${a}, ${sym2.s}=${b}일 때, ${sym3.s}(${sym3.name})은?`;
            answer = String(c);
            explanation = `${a}+${b}+${sym3.s}=${a + b + c}이므로 ${sym3.s}=${c}`;
            wrongs.add(String(c + 1)); wrongs.add(String(c + 2)); wrongs.add(String(a));
            break;
        }

        // ===== 나이 문제 (초급) =====
        case 'age_simple': {
            const ageB = Math.floor(Math.random() * 4) + 6;
            const diffAge = Math.floor(Math.random() * 3) + 1;
            question = `🎂 ${name1}은(는) ${name2}보다 ${diffAge}살 많아요.\n${name2}이(가) ${ageB}살이면, ${name1}은 몇 살?`;
            answer = `${ageB + diffAge}살`;
            explanation = `${ageB} + ${diffAge} = ${ageB + diffAge}살`;
            wrongs.add(`${ageB}살`); wrongs.add(`${ageB - diffAge}살`); wrongs.add(`${ageB + diffAge + 1}살`);
            break;
        }

        // ===== 나이 문제 (중급) =====
        case 'age_medium': {
            const ageNow = Math.floor(Math.random() * 5) + 7;
            const years = Math.floor(Math.random() * 3) + 2;
            question = `🎂 ${name1}은(는) 지금 ${ageNow}살이에요.\n${years}년 후에는 몇 살이 될까요?`;
            answer = `${ageNow + years}살`;
            explanation = `${ageNow} + ${years} = ${ageNow + years}살`;
            wrongs.add(`${ageNow}살`); wrongs.add(`${ageNow - years}살`); wrongs.add(`${ageNow + years + 1}살`);
            break;
        }

        // ===== 나이 문제 (고급) =====
        case 'age_hard': {
            const childAge = Math.floor(Math.random() * 4) + 8;
            const parentAge = childAge + 25;
            const yearsAgo = Math.floor(Math.random() * 3) + 2;
            question = `🎂 ${name1}(엄마)는 ${parentAge}살, ${name2}(아이)는 ${childAge}살이에요.\n${yearsAgo}년 전 두 사람의 나이 차이는?`;
            answer = `${parentAge - childAge}살`;
            explanation = `나이 차이는 항상 같아요: ${parentAge} - ${childAge} = ${parentAge - childAge}살`;
            wrongs.add(`${parentAge - childAge - yearsAgo}살`); wrongs.add(`${parentAge - childAge + yearsAgo}살`); wrongs.add(`${parentAge - childAge - 2}살`);
            break;
        }

        // ===== 순서 문제 (초급) =====
        case 'order_simple': {
            question = `🏃 달리기 시합에서 ${name1}이 1등, ${name3}이 3등이에요.\n${name2}은 ${name1}보다 늦고 ${name3}보다 빨랐어요. ${name2}은 몇 등?`;
            answer = '2등';
            explanation = `1등과 3등 사이이므로 ${name2}은 2등!`;
            wrongs.add('1등'); wrongs.add('3등'); wrongs.add('4등');
            break;
        }

        // ===== 순서 문제 (중급) =====
        case 'order_medium': {
            question = `📏 ${name1}, ${name2}, ${name3}이 키 순서대로 줄을 섰어요.\n${name1}이 가장 크고, ${name3}이 가장 작아요. ${name2}은 앞에서 몇 번째?`;
            answer = '2번째';
            explanation = `가장 큰 사람이 맨 앞이면, ${name2}은 가운데인 2번째!`;
            wrongs.add('1번째'); wrongs.add('3번째'); wrongs.add('4번째');
            break;
        }

        // ===== 순서 문제 (고급) =====
        case 'order_hard': {
            const n = Math.floor(Math.random() * 3) + 5;
            const fromFront = Math.floor(Math.random() * 3) + 2;
            const fromBack = n - fromFront + 1;
            question = `👧👦 ${name1}은 줄의 앞에서 ${fromFront}번째, 뒤에서 ${fromBack}번째예요.\n줄에 선 사람은 모두 몇 명일까요?`;
            answer = `${n}명`;
            explanation = `앞에서 ${fromFront}번째 + 뒤에서 ${fromBack}번째 - 1 = ${n}명`;
            wrongs.add(`${n + 1}명`); wrongs.add(`${n - 1}명`); wrongs.add(`${fromFront + fromBack}명`);
            break;
        }

        // ===== 수 피라미드 (초급) =====
        case 'pyramid_simple': {
            const a = Math.floor(Math.random() * 5) + 1;
            const b = Math.floor(Math.random() * 5) + 1;
            const c = Math.floor(Math.random() * 5) + 1;
            question = `🔺 수 피라미드예요! 위 칸은 아래 두 수의 합이에요.\n    [?]\n  [${a + b}] [${b + c}]\n[${a}] [${b}] [${c}]\n맨 위 ?는 얼마?`;
            answer = String(a + 2 * b + c);
            explanation = `(${a}+${b}) + (${b}+${c}) = ${a + 2 * b + c}`;
            wrongs.add(String(a + b + c)); wrongs.add(String(a + b + c + 1)); wrongs.add(String(2 * (a + b + c)));
            break;
        }

        // ===== 수 피라미드 (중급) =====
        case 'pyramid_medium': {
            const a = Math.floor(Math.random() * 4) + 1;
            const b = Math.floor(Math.random() * 4) + 1;
            const top = a + b;
            question = `🔺 수 피라미드에서 위 칸은 아래 두 수의 합!\n   [${top}]\n [?] [${b}]\n맨 아래 왼쪽 ?는 얼마일까요?`;
            answer = String(a);
            explanation = `? + ${b} = ${top}이므로 ? = ${a}`;
            wrongs.add(String(a + 1)); wrongs.add(String(b)); wrongs.add(String(top));
            break;
        }

        // ===== 패턴 (초급) =====
        case 'pattern_simple': {
            const start = Math.floor(Math.random() * 5) + 1;
            const step = Math.floor(Math.random() * 3) + 2;
            const seq = [start, start + step, start + 2 * step, '?'];
            question = `🔢 규칙을 찾아보세요!\n${seq.join(', ')}\n?에 알맞은 수는?`;
            answer = String(start + 3 * step);
            explanation = `${step}씩 커지는 규칙! ${start + 2 * step} + ${step} = ${start + 3 * step}`;
            wrongs.add(String(start + 2 * step)); wrongs.add(String(start + 4 * step)); wrongs.add(String(start + 3 * step + 1));
            break;
        }

        // ===== 마방진 (초급) =====
        case 'magic_simple': {
            // 간단한 3×3 마방진 빈칸
            question = `🔢 마방진이에요! 가로, 세로, 대각선의 합이 모두 15예요.\n8 1 6\n3 ? 7\n4 9 2\n가운데 ?는 얼마?`;
            answer = '5';
            explanation = `가운데 줄: 3 + ? + 7 = 15이므로 ? = 5`;
            wrongs.add('4'); wrongs.add('6'); wrongs.add('10');
            break;
        }

        // ===== 마방진 (중급) =====
        case 'magic_medium': {
            question = `🔢 마방진에서 가로, 세로, 대각선의 합이 모두 같아요.\n2 7 6\n9 ? 1\n4 3 8\n?에 알맞은 수는?`;
            answer = '5';
            explanation = `첫째 줄 합: 2+7+6=15, 가운데 줄: 9+?+1=15이므로 ?=5`;
            wrongs.add('4'); wrongs.add('6'); wrongs.add('10');
            break;
        }

        // ===== 마방진 (고급) =====
        case 'magic_hard': {
            question = `🔢 1부터 9까지 수로 3×3 마방진을 만들면, 각 줄의 합은 얼마일까요?`;
            answer = '15';
            explanation = `1+2+...+9=45, 3줄로 나누면 45÷3=15`;
            wrongs.add('12'); wrongs.add('18'); wrongs.add('21');
            break;
        }

        // ===== 논리 (초급) =====
        case 'logic_simple': {
            question = `🧠 ${name1}이(가) 말해요: "나는 사과 또는 바나나를 좋아해."\n${name1}이(가) 사과를 싫어한다면, 무엇을 좋아할까요?`;
            answer = '바나나';
            explanation = `"또는" 중 하나가 거짓이면, 다른 하나는 참!`;
            wrongs.add('사과'); wrongs.add('둘 다'); wrongs.add('바나나도 사과도 아님');
            break;
        }

        // ===== 논리 (중급) =====
        case 'logic_medium': {
            question = `🧠 ${name1}, ${name2}이(가) 말해요.\n${name1}: "나는 사탕을 좋아해."\n${name2}: "나도 ${name1}이(가) 좋아하는 것을 좋아해."\n${name2}은 무엇을 좋아할까요?`;
            answer = '사탕';
            explanation = `${name1}이 사탕을 좋아하고, ${name2}은 ${name1}이 좋아하는 것을 좋아하므로 사탕!`;
            wrongs.add(name1); wrongs.add('초콜릿'); wrongs.add('사탕도 초콜릿도 아님');
            break;
        }

        // ===== 논리 (고급) =====
        case 'logic_hard': {
            question = `🧠 세 명이 각각 빨강, 파랑, 노랑 모자를 썼어요.\n${name1}은 빨강이 아니에요. ${name2}은 노랑이 아니에요.\n${name3}은 빨강이에요. ${name1}의 모자 색은?`;
            answer = '노랑';
            explanation = `${name3}=빨강, ${name1}≠빨강, ${name2}≠노랑\n→ ${name1}=노랑, ${name2}=파랑`;
            wrongs.add('빨강'); wrongs.add('파랑'); wrongs.add('초록');
            break;
        }

        // ===== 경우의 수 (초급) =====
        case 'combinatorics_simple': {
            const shirts = Math.floor(Math.random() * 2) + 2;
            const pants = Math.floor(Math.random() * 2) + 2;
            question = `👕👖 ${name1}에게 윗옷 ${shirts}벌, 바지 ${pants}벌이 있어요.\n옷을 입는 방법은 모두 몇 가지?`;
            answer = `${shirts * pants}가지`;
            explanation = `${shirts} × ${pants} = ${shirts * pants}가지`;
            wrongs.add(`${shirts + pants}가지`); wrongs.add(`${shirts * pants + 1}가지`); wrongs.add(`${shirts * pants - 1}가지`);
            break;
        }

        // ===== 경우의 수 (중급) =====
        case 'combinatorics_medium': {
            question = `🎲 1, 2, 3 세 수로 만들 수 있는 두 자리 수는 몇 개?\n(같은 숫자 반복 가능)`;
            answer = '9개';
            explanation = `십의 자리 3가지 × 일의 자리 3가지 = 9개`;
            wrongs.add('6개'); wrongs.add('8개'); wrongs.add('12개');
            break;
        }

        // ===== 암호 =====
        case 'cipher': {
            const shift = Math.floor(Math.random() * 3) + 1;
            question = `🔐 암호 규칙: 각 글자를 알파벳 순서로 ${shift}칸 뒤로!\nA→${String.fromCharCode(65 + shift)}, B→${String.fromCharCode(66 + shift)}...\nCAT은 어떻게 될까요?`;
            const encrypted = 'CAT'.split('').map(c => String.fromCharCode(c.charCodeAt(0) + shift)).join('');
            answer = encrypted;
            explanation = `C→${String.fromCharCode(67 + shift)}, A→${String.fromCharCode(65 + shift)}, T→${String.fromCharCode(84 + shift)} = ${encrypted}`;
            wrongs.add('CAT'); wrongs.add(encrypted.split('').reverse().join('')); wrongs.add(String.fromCharCode(67 + shift + 1) + String.fromCharCode(65 + shift) + String.fromCharCode(84 + shift));
            break;
        }

        // ===== 최적화 =====
        case 'optimization': {
            const coins = [100, 50, 10];
            const target = Math.floor(Math.random() * 3) * 50 + 150; // 150, 200, 250
            const min100 = Math.floor(target / 100);
            const remaining = target - min100 * 100;
            const min50 = Math.floor(remaining / 50);
            const minCoins = min100 + min50 + (remaining - min50 * 50) / 10;
            question = `💰 ${target}원을 100원, 50원, 10원 동전으로 만들어요.\n동전을 가장 적게 쓰면 몇 개가 필요할까요?`;
            answer = `${minCoins}개`;
            explanation = `100원 ${min100}개 + 50원 ${min50}개 = ${minCoins}개`;
            wrongs.add(`${minCoins + 1}개`); wrongs.add(`${minCoins + 2}개`); wrongs.add(`${Math.floor(target / 10)}개`);
            break;
        }

        // ===== 1~2학년 영재교육: 쌓기나무 세기 =====
        case 'blocks_counting': {
            const layers = [
                { desc: '1층에 4개, 2층에 1개', total: 5, visual: '🧱🧱\n🧱🧱\n  🧊' },
                { desc: '1층에 3개, 2층에 2개', total: 5, visual: '🧱🧱🧱\n 🧊🧊' },
                { desc: '1층에 6개, 2층에 2개', total: 8, visual: '🧱🧱🧱\n🧱🧱🧱\n 🧊🧊' },
                { desc: '1층에 4개, 2층에 2개, 3층에 1개', total: 7, visual: '계단 모양' },
                { desc: '1층에 9개, 2층에 4개, 3층에 1개', total: 14, visual: '피라미드 모양' }
            ];
            const layer = layers[Math.floor(Math.random() * 3)]; // 쉬운 것만
            question = `🧱 ${name1}이(가) 블록을 쌓았어요!\n${layer.desc}로 쌓았어요. 블록은 모두 몇 개일까요?`;
            answer = `${layer.total}개`;
            explanation = `${layer.desc}를 더하면 ${layer.total}개입니다!`;
            wrongs.add(`${layer.total + 1}개`); wrongs.add(`${layer.total - 1}개`); wrongs.add(`${layer.total + 2}개`);
            break;
        }

        // ===== 1~2학년 영재교육: 수 분해 =====
        case 'number_decompose': {
            const target = Math.floor(Math.random() * 8) + 5; // 5~12
            const part1 = Math.floor(Math.random() * (target - 2)) + 1;
            const part2 = target - part1;
            const templates = [
                { q: `🎯 ${name1}이(가) 사탕 ${target}개를 두 봉지에 나눠 담았어요.\n한 봉지에 ${part1}개를 담았다면, 다른 봉지에는 몇 개?`, a: part2, e: `${target} - ${part1} = ${part2}개` },
                { q: `🔢 ${target}을 두 수로 가를 수 있어요.\n한 수가 ${part1}이면, 다른 수는?`, a: part2, e: `${target} = ${part1} + ${part2}이므로 다른 수는 ${part2}` },
                { q: `🎁 선물 ${target}개를 ${name1}과 ${name2}이(가) 나눠 가져요.\n${name1}이 ${part1}개 가지면, ${name2}은 몇 개?`, a: part2, e: `${target} - ${part1} = ${part2}개` }
            ];
            const t = templates[Math.floor(Math.random() * templates.length)];
            question = t.q;
            answer = `${t.a}개`;
            explanation = t.e;
            wrongs.add(`${part2 + 1}개`); wrongs.add(`${part2 - 1}개`); wrongs.add(`${target}개`);
            break;
        }

        // ===== 1~2학년 영재교육: 거꾸로 생각하기 =====
        case 'reverse_think': {
            const original = Math.floor(Math.random() * 10) + 3;
            const change = Math.floor(Math.random() * 5) + 1;
            const templates = [
                { q: `🔙 ${name1}이(가) 생각한 수에 ${change}을 더했더니 ${original + change}이 되었어요.\n처음 생각한 수는 얼마일까요?`, a: original, e: `${original + change} - ${change} = ${original}` },
                { q: `🔙 어떤 수에서 ${change}을 빼면 ${original - change}이 돼요.\n어떤 수는 얼마일까요?`, a: original, e: `${original - change} + ${change} = ${original}` },
                { q: `🤔 ${name1}이(가) 사탕을 ${change}개 먹었더니 ${original - change}개가 남았어요.\n처음에 몇 개였을까요?`, a: original, e: `${original - change} + ${change} = ${original}개` }
            ];
            const t = templates[Math.floor(Math.random() * templates.length)];
            question = t.q;
            answer = String(t.a);
            explanation = t.e;
            wrongs.add(String(t.a + 1)); wrongs.add(String(t.a - 1)); wrongs.add(String(t.a + change));
            break;
        }

        // ===== 1~2학년 영재교육: 도형 논리 =====
        case 'shape_logic': {
            const quizzes = [
                { q: `🔵🔴 파란 동그라미와 빨간 동그라미가 있어요.\n파란 것이 3개, 동그라미가 5개예요.\n빨간 동그라미는 몇 개일까요?`, a: '2개', wrong: ['3개', '5개', '8개'], e: `동그라미 5개 중 파란 것이 3개이므로, 빨간 것은 5-3=2개` },
                { q: `⬛⬜ 검은 네모와 흰 네모가 모두 7개 있어요.\n검은 네모가 4개면, 흰 네모는 몇 개?`, a: '3개', wrong: ['4개', '7개', '11개'], e: `7 - 4 = 3개` },
                { q: `🔺🔻 위를 향한 삼각형과 아래를 향한 삼각형이 합쳐서 6개예요.\n위를 향한 것이 2개면, 아래를 향한 것은?`, a: '4개', wrong: ['2개', '6개', '8개'], e: `6 - 2 = 4개` }
            ];
            const q = quizzes[Math.floor(Math.random() * quizzes.length)];
            question = q.q;
            answer = q.a;
            explanation = q.e;
            q.wrong.forEach(w => wrongs.add(w));
            break;
        }

        // ===== 1~2학년 영재교육: 저울 균형 =====
        case 'balance_scale': {
            const unit = Math.floor(Math.random() * 3) + 2; // 2~4
            const count = Math.floor(Math.random() * 3) + 2; // 2~4
            const total = unit * count;
            question = `⚖️ 저울이 균형을 이루고 있어요!\n한쪽에 ${total}g 추가 있고, 다른 쪽에 ${count}개의 같은 추가 있어요.\n추 하나는 몇 g일까요?`;
            answer = `${unit}g`;
            explanation = `${total} ÷ ${count} = ${unit}g`;
            wrongs.add(`${unit + 1}g`); wrongs.add(`${unit - 1}g`); wrongs.add(`${total}g`);
            break;
        }

        // ===== 1~2학년 영재교육: 수 상자 =====
        case 'number_box': {
            const a = Math.floor(Math.random() * 5) + 1;
            const b = Math.floor(Math.random() * 5) + 1;
            const c = Math.floor(Math.random() * 5) + 1;
            const sum = a + b + c;
            question = `📦 상자 안에 세 수가 들어있어요.\n${a}, ${b}, ?\n세 수의 합이 ${sum}이면, ?는 얼마일까요?`;
            answer = String(c);
            explanation = `${a} + ${b} + ? = ${sum}, ? = ${sum} - ${a} - ${b} = ${c}`;
            wrongs.add(String(c + 1)); wrongs.add(String(c - 1 > 0 ? c - 1 : c + 2)); wrongs.add(String(sum));
            break;
        }

        // ===== 1~2학년 영재교육: 숨은 수 찾기 =====
        case 'hidden_number': {
            const a = Math.floor(Math.random() * 8) + 2;
            const b = Math.floor(Math.random() * 8) + 2;
            const templates = [
                { q: `🔍 ? + ${b} = ${a + b}일 때, ?는 얼마일까요?`, ans: a, e: `${a + b} - ${b} = ${a}` },
                { q: `🔍 ${a} + ? = ${a + b}일 때, ?는 얼마일까요?`, ans: b, e: `${a + b} - ${a} = ${b}` },
                { q: `🔍 ? - ${b} = ${a}일 때, ?는 얼마일까요?`, ans: a + b, e: `${a} + ${b} = ${a + b}` }
            ];
            const t = templates[Math.floor(Math.random() * templates.length)];
            question = t.q;
            answer = String(t.ans);
            explanation = t.e;
            wrongs.add(String(t.ans + 1)); wrongs.add(String(t.ans - 1)); wrongs.add(String(a + b + 1));
            break;
        }

        // ===== 1~2학년 영재교육: 비교 논리 =====
        case 'compare_logic': {
            const quizzes = [
                { q: `🏃 ${name1}이 ${name2}보다 빨라요.\n${name2}가 ${name3}보다 빨라요.\n가장 빠른 사람은 누구일까요?`, a: name1, wrong: [name2, name3, '두 사람이 같음'], e: `${name1} > ${name2} > ${name3}이므로 ${name1}이 가장 빨라요!` },
                { q: `📏 ${name1}이 ${name2}보다 키가 커요.\n${name3}이 ${name1}보다 키가 커요.\n가장 키가 큰 사람은?`, a: name3, wrong: [name1, name2, '두 사람이 같음'], e: `${name3} > ${name1} > ${name2}이므로 ${name3}이 가장 커요!` },
                { q: `🎂 ${name1}이 ${name2}보다 나이가 많아요.\n${name2}가 ${name3}보다 나이가 많아요.\n가장 어린 사람은?`, a: name3, wrong: [name1, name2, '두 사람이 같음'], e: `${name1} > ${name2} > ${name3}이므로 ${name3}이 가장 어려요!` }
            ];
            const q = quizzes[Math.floor(Math.random() * quizzes.length)];
            question = q.q;
            answer = q.a;
            explanation = q.e;
            q.wrong.forEach(w => wrongs.add(w));
            break;
        }

        // ===== 1~2학년 영재교육: 간단한 수열 =====
        case 'simple_sequence': {
            const patterns = [
                { seq: [1, 2, 3, 4, '?'], a: 5, rule: '1씩 커지는' },
                { seq: [2, 4, 6, 8, '?'], a: 10, rule: '2씩 커지는' },
                { seq: [5, 10, 15, 20, '?'], a: 25, rule: '5씩 커지는' },
                { seq: [10, 9, 8, 7, '?'], a: 6, rule: '1씩 작아지는' },
                { seq: [1, 3, 5, 7, '?'], a: 9, rule: '2씩 커지는 홀수' },
                { seq: [2, 4, 6, 8, '?'], a: 10, rule: '2씩 커지는 짝수' }
            ];
            const p = patterns[Math.floor(Math.random() * patterns.length)];
            question = `🔢 ${name1}이(가) 규칙을 찾고 있어요!\n${p.seq.join(', ')}\n?에 알맞은 수는?`;
            answer = String(p.a);
            explanation = `${p.rule} 규칙이에요. ?는 ${p.a}!`;
            wrongs.add(String(p.a + 1)); wrongs.add(String(p.a - 1)); wrongs.add(String(p.a + 2));
            break;
        }

        // ===== 난이도 6-10: 고급 블록 쌓기 =====
        case 'blocks_advanced': {
            const quizzes = [
                { q: `🧱 ${name1}이(가) 쌓기나무로 정육면체를 만들었어요.\n한 변에 나무가 2개씩 있으면, 나무는 모두 몇 개?`, a: '8개', wrong: ['6개', '4개', '12개'], e: `2×2×2 = 8개` },
                { q: `🧱 1층에 4개, 2층에 3개, 3층에 2개, 4층에 1개!\n피라미드 모양의 블록은 모두 몇 개?`, a: '10개', wrong: ['9개', '11개', '4개'], e: `4+3+2+1 = 10개` },
                { q: `🧱 정육면체에서 꼭짓점에 있는 작은 정육면체는 몇 개?`, a: '8개', wrong: ['4개', '6개', '12개'], e: `정육면체의 꼭짓점은 8개!` }
            ];
            const q = quizzes[Math.floor(Math.random() * quizzes.length)];
            question = q.q;
            answer = q.a;
            explanation = q.e;
            q.wrong.forEach(w => wrongs.add(w));
            break;
        }

        // ===== 난이도 6-10: 수의 관계 =====
        case 'number_relation': {
            const a = Math.floor(Math.random() * 10) + 5;
            const b = Math.floor(Math.random() * 10) + 5;
            const quizzes = [
                { q: `🔢 ${name1}과 ${name2}의 나이를 더하면 ${a + b}살이에요.\n${name1}이 ${a}살이면, ${name2}은 몇 살?`, ans: b, e: `${a + b} - ${a} = ${b}살` },
                { q: `🔢 두 수의 차가 ${Math.abs(a - b)}이고, 큰 수가 ${Math.max(a, b)}예요.\n작은 수는 얼마일까요?`, ans: Math.min(a, b), e: `${Math.max(a, b)} - ${Math.abs(a - b)} = ${Math.min(a, b)}` }
            ];
            const q = quizzes[Math.floor(Math.random() * quizzes.length)];
            question = q.q;
            answer = String(q.ans);
            explanation = q.e;
            wrongs.add(String(q.ans + 1)); wrongs.add(String(q.ans - 1)); wrongs.add(String(a + b));
            break;
        }

        // ===== 난이도 6-10: 마법 상자 =====
        case 'magic_box': {
            const input = Math.floor(Math.random() * 5) + 1;
            const rule = Math.floor(Math.random() * 3);
            let output, ruleDesc;
            if (rule === 0) { output = input * 2; ruleDesc = '2배'; }
            else if (rule === 1) { output = input + 3; ruleDesc = '+3'; }
            else { output = input * 2 + 1; ruleDesc = '×2 + 1'; }
            question = `📦 마법 상자에 숫자를 넣으면 규칙에 따라 바뀌어요!\n1 → ${rule === 0 ? 2 : rule === 1 ? 4 : 3}\n2 → ${rule === 0 ? 4 : rule === 1 ? 5 : 5}\n3 → ${rule === 0 ? 6 : rule === 1 ? 6 : 7}\n4를 넣으면 얼마가 나올까요?`;
            const answer4 = rule === 0 ? 8 : rule === 1 ? 7 : 9;
            answer = String(answer4);
            explanation = `규칙은 '${ruleDesc}'이에요. 4를 넣으면 ${answer4}!`;
            wrongs.add(String(answer4 + 1)); wrongs.add(String(answer4 - 1)); wrongs.add(String(answer4 + 2));
            break;
        }

        // ===== 난이도 6-10: 경로 세기 =====
        case 'path_counting': {
            const quizzes = [
                { q: `🏠 ${name1}이(가) 집에서 학교까지 가는 길이에요.\n오른쪽 또는 위쪽으로만 갈 수 있어요.\n2칸 오른쪽, 1칸 위로 가는 길은 몇 가지?`, a: '3가지', wrong: ['2가지', '4가지', '6가지'], e: `→→↑, →↑→, ↑→→ = 3가지` },
                { q: `🎯 A에서 B까지 오른쪽(→)과 아래쪽(↓)으로만 가요.\n→ 2번, ↓ 1번 가는 길은 몇 가지?`, a: '3가지', wrong: ['2가지', '4가지', '5가지'], e: `→→↓, →↓→, ↓→→ = 3가지` }
            ];
            const q = quizzes[Math.floor(Math.random() * quizzes.length)];
            question = q.q;
            answer = q.a;
            explanation = q.e;
            q.wrong.forEach(w => wrongs.add(w));
            break;
        }

        // ===== 난이도 11-15: 공간 회전 =====
        case 'spatial_rotation': {
            const quizzes = [
                { q: `🔄 숫자 6을 거꾸로 뒤집으면 어떤 숫자처럼 보일까요?`, a: '9', wrong: ['6', '8', '0'], e: `6을 180° 돌리면 9처럼 보여요!` },
                { q: `🔄 알파벳 'b'를 거울에 비추면 어떤 글자처럼 보일까요?`, a: 'd', wrong: ['b', 'p', 'q'], e: `거울에 비추면 좌우가 바뀌어 'd'가 돼요!` },
                { q: `🔄 시계 방향으로 90° 돌리면 '⬆️'는 어떻게 될까요?`, a: '➡️', wrong: ['⬆️', '⬇️', '⬅️'], e: `시계 방향 90° = 위→오른쪽` }
            ];
            const q = quizzes[Math.floor(Math.random() * quizzes.length)];
            question = q.q;
            answer = q.a;
            explanation = q.e;
            q.wrong.forEach(w => wrongs.add(w));
            break;
        }

        // ===== 난이도 11-15: 수 퍼즐 =====
        case 'number_puzzle': {
            const target = Math.floor(Math.random() * 10) + 10;
            const a = Math.floor(Math.random() * 5) + 1;
            const b = Math.floor(Math.random() * 5) + 1;
            const c = target - a - b;
            question = `🧩 1부터 9까지 수 중 서로 다른 세 수를 골라 합이 ${target}이 되게 해요.\n${a}와 ${b}를 골랐다면, 나머지 수는?`;
            answer = String(c);
            explanation = `${a} + ${b} + ? = ${target}, ? = ${c}`;
            wrongs.add(String(c + 1)); wrongs.add(String(c - 1)); wrongs.add(String(target));
            break;
        }

        default: {
            // 기본 문제
            const val = Math.floor(Math.random() * 8) + 2;
            question = `🧩 ${name1}이(가) 생각한 수에 2를 곱하면 ${val * 2}이 돼요.\n생각한 수는 무엇일까요?`;
            answer = String(val);
            explanation = `${val * 2} ÷ 2 = ${val}`;
            wrongs.add(String(val + 1)); wrongs.add(String(val - 1)); wrongs.add(String(val * 2));
        }
    }

    const wrongsArray = Array.from(wrongs).filter(w => w !== answer).slice(0, 3);
    const options = shuffleArray([answer, ...wrongsArray]);

    return {
        question,
        options,
        answer,
        explanation,
        problemKey: `creative-${problemType}-${Math.random()}`
    };
}

// 들이(용량) 문제 - 새로 추가
function genCapacityProblem(diff) {
    const names = ['하츄핑', '바로핑', '아자핑', '차차핑', '라라핑'];
    const name1 = names[Math.floor(Math.random() * names.length)];

    const type = Math.floor(Math.random() * 3);
    let question, answer, explanation;
    const wrongs = new Set();

    if (type === 0) {
        // L와 mL 변환
        const liters = Math.floor(Math.random() * 5) + 1;
        const ml = liters * 1000;
        const templates = [
            { q: `🧴 ${name1}이(가) 물 ${liters}L를 가지고 있어요. 이것은 몇 mL일까요?`, a: `${ml}mL`, e: `1L = 1000mL이므로, ${liters}L = ${liters} × 1000 = ${ml}mL입니다.` },
            { q: `🥛 우유팩에 ${liters}L가 들어 있어요. 이것은 몇 mL일까요?`, a: `${ml}mL`, e: `1L = 1000mL이므로, ${liters}L = ${ml}mL입니다.` }
        ];
        const t = templates[Math.floor(Math.random() * templates.length)];
        question = t.q;
        answer = t.a;
        explanation = t.e;
        wrongs.add(`${ml / 10}mL`); wrongs.add(`${ml * 10}mL`); wrongs.add(`${ml + 100}mL`);
    } else if (type === 1) {
        // 들이 비교
        const a = Math.floor(Math.random() * 500) + 200;
        const b = a + Math.floor(Math.random() * 200) + 50;
        question = `🧃 ${name1}의 컵에는 물이 ${a}mL, 태희의 컵에는 ${b}mL가 있어요. 누구의 컵에 물이 더 많을까요?`;
        answer = '태희';
        explanation = `${b}mL > ${a}mL이므로, 태희의 컵에 물이 더 많습니다.`;
        wrongs.add(name1); wrongs.add('두 컵의 물이 같음'); wrongs.add('두 컵 모두 아님');
    } else {
        // 들이 덧셈
        const a = Math.floor(Math.random() * 300) + 100;
        const b = Math.floor(Math.random() * 300) + 100;
        const total = a + b;
        question = `🥤 ${name1}이(가) 주스 ${a}mL를 마시고, 또 ${b}mL를 더 마셨어요. 모두 몇 mL를 마셨을까요?`;
        answer = `${total}mL`;
        explanation = `${a}mL + ${b}mL = ${total}mL입니다.`;
        wrongs.add(`${total + 50}mL`); wrongs.add(`${total - 50}mL`); wrongs.add(`${a}mL`);
    }

    return {
        question,
        options: shuffleArray([answer, ...Array.from(wrongs)].slice(0, 4)),
        answer,
        explanation,
        problemKey: `capacity-${type}-${Math.random()}`
    };
}

// 무게 문제 - 새로 추가
function genWeightProblem(diff) {
    const names = ['하츄핑', '바로핑', '아자핑', '차차핑', '라라핑'];
    const name1 = names[Math.floor(Math.random() * names.length)];

    const type = Math.floor(Math.random() * 3);
    let question, answer, explanation;
    const wrongs = new Set();

    if (type === 0) {
        // kg와 g 변환
        const kg = Math.floor(Math.random() * 5) + 1;
        const g = kg * 1000;
        const templates = [
            { q: `⚖️ ${name1}의 강아지 몸무게가 ${kg}kg이에요. 이것은 몇 g일까요?`, a: `${g}g`, e: `1kg = 1000g이므로, ${kg}kg = ${kg} × 1000 = ${g}g입니다.` },
            { q: `🎒 태희의 가방 무게가 ${kg}kg이에요. 이것은 몇 g일까요?`, a: `${g}g`, e: `1kg = 1000g이므로, ${kg}kg = ${g}g입니다.` }
        ];
        const t = templates[Math.floor(Math.random() * templates.length)];
        question = t.q;
        answer = t.a;
        explanation = t.e;
        wrongs.add(`${g / 10}g`); wrongs.add(`${g * 10}g`); wrongs.add(`${g + 100}g`);
    } else if (type === 1) {
        // 무게 비교
        const a = Math.floor(Math.random() * 500) + 200;
        const b = a + Math.floor(Math.random() * 200) + 50;
        const items = [['🍎 사과', '🍊 귤'], ['📚 책', '📓 공책'], ['🧸 곰인형', '🪆 인형']];
        const pair = items[Math.floor(Math.random() * items.length)];
        question = `⚖️ ${pair[0]}의 무게는 ${a}g, ${pair[1]}의 무게는 ${b}g이에요. 어느 것이 더 무거울까요?`;
        answer = pair[1];
        explanation = `${b}g > ${a}g이므로, ${pair[1]}이 더 무겁습니다.`;
        wrongs.add(pair[0]); wrongs.add('두 물건의 무게가 같음'); wrongs.add('두 물건 모두 아님');
    } else {
        // 무게 덧셈
        const a = Math.floor(Math.random() * 300) + 100;
        const b = Math.floor(Math.random() * 300) + 100;
        const total = a + b;
        question = `⚖️ ${name1}이(가) 사과 ${a}g과 바나나 ${b}g을 샀어요. 과일의 무게는 모두 몇 g일까요?`;
        answer = `${total}g`;
        explanation = `${a}g + ${b}g = ${total}g입니다.`;
        wrongs.add(`${total + 50}g`); wrongs.add(`${total - 50}g`); wrongs.add(`${a}g`);
    }

    return {
        question,
        options: shuffleArray([answer, ...Array.from(wrongs)].slice(0, 4)),
        answer,
        explanation,
        problemKey: `weight-${type}-${Math.random()}`
    };
}

// 부피 문제 - 새로 추가
function genVolumeProblem(diff) {
    const names = ['하츄핑', '바로핑', '아자핑', '차차핑', '라라핑'];
    const name1 = names[Math.floor(Math.random() * names.length)];

    const type = Math.floor(Math.random() * 2);
    let question, answer, explanation;
    const wrongs = new Set();

    if (type === 0) {
        // 쌓기나무 세기
        const base = Math.floor(Math.random() * 3) + 2;
        const height = Math.floor(Math.random() * 2) + 1;
        const total = base * base * height;
        question = `🧊 ${name1}이(가) 쌓기나무로 탑을 쌓았어요. 가로 ${base}개, 세로 ${base}개, 높이 ${height}층이면 쌓기나무는 모두 몇 개일까요?`;
        answer = `${total}개`;
        explanation = `${base} × ${base} × ${height} = ${total}개입니다.`;
        wrongs.add(`${total + 2}개`); wrongs.add(`${total - 2}개`); wrongs.add(`${base * base}개`);
    } else {
        // 상자 비교
        const a = Math.floor(Math.random() * 10) + 5;
        const b = a + Math.floor(Math.random() * 5) + 2;
        question = `📦 ${name1}의 상자에는 공 ${a}개가 들어가고, 태희의 상자에는 ${b}개가 들어가요. 누구의 상자가 더 클까요?`;
        answer = '태희의 상자';
        explanation = `${b}개 > ${a}개가 들어가므로, 태희의 상자가 더 큽니다.`;
        wrongs.add(`${name1}의 상자`); wrongs.add('두 상자가 같음'); wrongs.add('두 상자 모두 아님');
    }

    return {
        question,
        options: shuffleArray([answer, ...Array.from(wrongs)].slice(0, 4)),
        answer,
        explanation,
        problemKey: `volume-${type}-${Math.random()}`
    };
}

function clear() {
    const W = CANVAS.width / DPR;
    const H = CANVAS.height / DPR;
    // Emotion Castle Theme Gradient
    const g = CTX.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, '#FFF0F5'); // Lavender Blush
    g.addColorStop(0.5, '#FFFBEB'); // Cosmic Latte (Soft Yellow)
    g.addColorStop(1, '#E0E7FF'); // Periwinkle
    CTX.fillStyle = g;
    CTX.fillRect(0, 0, W, H);
    STATE.hitboxes = [];
    return { W, H };
}

function drawHeader(W, H) {
    const learnerName = getActiveLearnerName('나');
    const adaptiveHeader = window.IrtProgressView?.buildLearnerHeaderStatus?.({
        learnerName,
        problem: STATE.problem,
        irtState: STATE.irt,
        fallbackTitle: STATE.currentCurriculum === 'division' ? `${learnerName}의 도전! 수학꾸러기` : `${learnerName}의 ${STATE.currentCurriculum} 도전!`,
        fallbackBadge: `${STATE.difficulty}단`
    });
    CTX.save();
    // Soft White Card Background
    roundRect(CTX, 16, 12, W - 32, 80, 24);
    CTX.fillStyle = 'rgba(255, 255, 255, 0.9)';
    CTX.shadowColor = 'rgba(236, 72, 153, 0.15)'; // Pink shadow
    CTX.shadowBlur = 15;
    CTX.shadowOffsetY = 5;
    CTX.fill();
    CTX.restore();

    // Title
    CTX.fillStyle = '#EC4899'; // Accent Pink
    const title = adaptiveHeader?.title || (STATE.currentCurriculum === 'division' ? `${learnerName}의 도전! 수학꾸러기` : `${learnerName}의 ${STATE.currentCurriculum} 도전!`);
    drawFittedCanvasText(title, W / 2, 44, W - 190, {
        initialSize: 33,
        minSize: 22,
        weight: 'bold'
    });
    CTX.textAlign = 'left';

    // Subtitle / Info
    CTX.fillStyle = '#6B7280'; // Soft Dark Grey
    CTX.font = 'bold 22px Jua, sans-serif';
    CTX.fillText(`문제 ${STATE.totalQuestions + 1}/100`, 36, 76);

    const scoreTxt = `💎 ${STATE.score}`;
    const diffTxt = adaptiveHeader?.badge || `${STATE.difficulty}단`;
    CTX.textAlign = 'right';
    
    // Difficulty Badge
    CTX.fillStyle = '#A78BFA'; // Soft Purple
    CTX.font = 'bold 22px Jua, sans-serif';
    CTX.fillText(diffTxt, W - 36, 48);
    
    // Score
    CTX.fillStyle = '#F59E0B'; // Amber
    CTX.fillText(scoreTxt, W - 36, 76);
    
    CTX.textAlign = 'left';
}

function getIrtSyncSummaryText() {
    const status = window.IrtSync?.getStatus?.();
    if (!status) return '서버 동기화 준비 중';
    const pending = Number(status.pending || 0);
    if (status.state === 'running') return `서버 동기화 중 · 대기 ${pending}개`;
    if (status.lastResult?.ok && pending === 0) return '서버 동기화 완료';
    if (status.state === 'blocked') return `서버 저장 대기 중 · 기록 ${pending}개`;
    if (status.state === 'error') return `서버 저장 재시도 예정 · 기록 ${pending}개`;
    return pending ? `서버 저장 대기 중 · 기록 ${pending}개` : '서버 동기화 준비됨';
}

function drawCollectionButton(W, H) {
    const bw = 140, bh = 50;
    const bx = W - bw - 20;
    const by = H - bh - 20;

    CTX.save();
    roundRect(CTX, bx, by, bw, bh, 12);
    CTX.fillStyle = '#a855f7';
    CTX.shadowColor = 'rgba(168, 85, 247, 0.4)';
    CTX.shadowBlur = 12;
    CTX.fill();
    CTX.restore();

    CTX.fillStyle = '#ffffff';
    CTX.font = 'bold 21px Jua, sans-serif';
    CTX.textAlign = 'center';
    CTX.textBaseline = 'middle';
    CTX.fillText('📊 리포트', bx + bw / 2, by + bh / 2);
    CTX.textBaseline = 'alphabetic';
    CTX.textAlign = 'left';

    STATE.hitboxes.push({ id: 'btn_collection', x: bx, y: by, w: bw, h: bh });
}

function getTinipingVisualMeta(tp = {}) {
    if (tp.placeholder) return tp.placeholder;
    if (window.TinipingAssetPolicy?.getPlaceholderMeta) {
        return window.TinipingAssetPolicy.getPlaceholderMeta(tp);
    }
    return {
        label: tp.name || '???',
        glyph: String(tp.name || '?').slice(0, 2),
        colors: ['#fce7f3', '#f9a8d4', '#9f1239'],
        accent: '#ec4899',
        season: tp.season || null,
        domain: tp.domain || '',
        type: tp.type || '일반'
    };
}

function drawTinipingPlaceholder(tp, cx, cy, imageSize, options = {}) {
    const meta = getTinipingVisualMeta(tp);
    const radius = imageSize / 2;
    const colors = meta.colors || ['#f8fafc', '#cbd5e1', '#334155'];

    CTX.save();
    CTX.beginPath();
    CTX.arc(cx, cy, radius, 0, Math.PI * 2);
    const g = CTX.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius);
    g.addColorStop(0, colors[0]);
    g.addColorStop(1, colors[1] || colors[0]);
    CTX.fillStyle = g;
    CTX.shadowColor = options.shadow === false ? 'transparent' : 'rgba(15, 23, 42, 0.12)';
    CTX.shadowBlur = options.compact ? Math.round(4 * SCALE) : Math.round(10 * SCALE);
    CTX.fill();
    CTX.lineWidth = Math.max(2, Math.round((options.compact ? 2 : 4) * SCALE));
    CTX.strokeStyle = meta.accent || colors[2] || '#64748b';
    CTX.stroke();
    CTX.restore();

    CTX.save();
    CTX.fillStyle = colors[2] || '#334155';
    CTX.textAlign = 'center';
    CTX.textBaseline = 'middle';
    const glyphSize = Math.max(12, imageSize * (options.compact ? 0.28 : 0.22));
    if (window.CanvasText?.drawFittedText) {
        window.CanvasText.drawFittedText(CTX, meta.glyph || '?', cx, cy - imageSize * 0.04, imageSize * 0.72, {
            initialSize: glyphSize,
            minSize: Math.max(10, glyphSize * 0.68),
            weight: 'bold'
        });
    } else {
        CTX.font = `bold ${Math.round(glyphSize)}px Jua, sans-serif`;
        CTX.fillText(meta.glyph || '?', cx, cy - imageSize * 0.04);
    }

    if (!options.compact && meta.season) {
        CTX.fillStyle = meta.accent || colors[2] || '#64748b';
        CTX.font = `bold ${Math.max(10, Math.round(13 * SCALE))}px Jua, sans-serif`;
        CTX.fillText(`S${meta.season}`, cx, cy + imageSize * 0.24);
    }
    CTX.textBaseline = 'alphabetic';
    CTX.restore();
}

function drawTinipingPortrait(tp, cx, cy, imageSize, options = {}) {
    if (tp?.imageObj && tp.imageStatus !== 'placeholder') {
        try {
            CTX.drawImage(tp.imageObj, cx - imageSize / 2, cy - imageSize / 2, imageSize, imageSize);
            return true;
        } catch (e) {
            console.warn('이미지 그리기 실패:', tp.name, e);
        }
    }

    drawTinipingPlaceholder(tp, cx, cy, imageSize, options);
    return false;
}

function drawFittedCanvasText(text, x, y, maxWidth, options = {}) {
    if (window.CanvasText?.drawFittedText) {
        return window.CanvasText.drawFittedText(CTX, text, x, y, maxWidth, options);
    }
    CTX.textAlign = options.align || 'center';
    CTX.textBaseline = options.baseline || 'middle';
    CTX.font = `${options.weight || 'bold'} ${Math.round(options.initialSize || 16)}px Jua, sans-serif`;
    CTX.fillText(String(text || ''), x, y);
    CTX.textBaseline = 'alphabetic';
    return options.initialSize || 16;
}

function drawBackgroundTiles(W, H, opacity = 0.15) {
    if (!TINIPINGS || TINIPINGS.length === 0) return;
    const tileSize = 60;
    const gap = 10;
    const cols = Math.floor(W / (tileSize + gap)) + 1;
    const rows = Math.floor(H / (tileSize + gap)) + 1;

    CTX.globalAlpha = opacity;

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const idx = (row * cols + col) % TINIPINGS.length;
            const tp = TINIPINGS[idx];
            const x = col * (tileSize + gap);
            const y = row * (tileSize + gap);

            CTX.save();
            roundRect(CTX, x, y, tileSize, tileSize, 10);
            const g = CTX.createLinearGradient(x, y, x + tileSize, y + tileSize);
            if (tp.type === '로열') { g.addColorStop(0, '#fce7f3'); g.addColorStop(1, '#fbcfe8'); }
            else if (tp.type === '전설') { g.addColorStop(0, '#fef3c7'); g.addColorStop(1, '#fde68a'); }
            else if (tp.type === '서포팅') { g.addColorStop(0, '#ddd6fe'); g.addColorStop(1, '#c4b5fd'); }
            else { g.addColorStop(0, '#e0f2fe'); g.addColorStop(1, '#bae6fd'); }
            CTX.fillStyle = g;
            CTX.fill();
            CTX.restore();

            const imgSize = tileSize * 0.68;
            drawTinipingPortrait(tp, x + tileSize / 2, y + tileSize / 2, imgSize, { compact: true, shadow: false });
        }
    }
    CTX.globalAlpha = 1.0;
}

function drawLearnerSelect() {
    const { W, H } = clear();
    drawBackgroundTiles(W, H, 0.08);

    CTX.fillStyle = '#111827';
    drawFittedCanvasText('누가 풀까요?', W / 2, Math.round(88 * SCALE), W - Math.round(48 * SCALE), {
        initialSize: Math.round(44 * SCALE),
        minSize: Math.round(28 * SCALE),
        weight: 'bold'
    });

    CTX.fillStyle = '#64748b';
    drawFittedCanvasText('이름을 고르면 오늘의 맞춤 문제가 시작돼요', W / 2, Math.round(128 * SCALE), W - Math.round(56 * SCALE), {
        initialSize: Math.round(21 * SCALE),
        minSize: Math.round(15 * SCALE),
        weight: 'bold'
    });

    const profiles = window.LearnerProfiles?.list?.() || [];
    const gap = Math.round(16 * SCALE);
    const columns = W < 430 ? 1 : 2;
    const cardW = columns === 1
        ? W - Math.round(48 * SCALE)
        : (W - Math.round(64 * SCALE) - gap) / 2;
    const cardH = Math.round((columns === 1 ? 118 : 150) * SCALE);
    const startX = columns === 1 ? Math.round(24 * SCALE) : Math.round(32 * SCALE);
    const startY = Math.round(184 * SCALE);

    profiles.forEach((profile, index) => {
        const col = index % columns;
        const row = Math.floor(index / columns);
        const x = startX + col * (cardW + gap);
        const y = startY + row * (cardH + gap);
        const colors = profile.colors || ['#f8fafc', '#e2e8f0', '#334155'];
        const stateKey = window.LearnerProfiles?.getStateKey?.(profile.id);
        let progressText = '첫 문제부터 시작';

        try {
            const saved = stateKey ? JSON.parse(localStorage.getItem(stateKey) || 'null') : null;
            const attempts = saved?.irt?.attemptCount || 0;
            const theta = Number(saved?.irt?.theta);
            progressText = attempts
                ? `풀이 ${attempts}문항 · 수준 ${Number.isFinite(theta) ? theta.toFixed(2) : '갱신중'}`
                : progressText;
        } catch (_) {
            progressText = '첫 문제부터 시작';
        }

        CTX.save();
        roundRect(CTX, x, y, cardW, cardH, Math.round(20 * SCALE));
        const cardG = CTX.createLinearGradient(x, y, x + cardW, y + cardH);
        cardG.addColorStop(0, colors[0]);
        cardG.addColorStop(1, '#ffffff');
        CTX.fillStyle = cardG;
        CTX.shadowColor = 'rgba(15, 23, 42, 0.10)';
        CTX.shadowBlur = Math.round(14 * SCALE);
        CTX.fill();
        CTX.strokeStyle = colors[1];
        CTX.lineWidth = Math.max(1, Math.round(1.5 * SCALE));
        CTX.stroke();
        CTX.restore();

        const badgeR = Math.round((columns === 1 ? 29 : 34) * SCALE);
        const badgeX = x + Math.round(44 * SCALE);
        const badgeY = y + cardH / 2;
        CTX.save();
        CTX.beginPath();
        CTX.arc(badgeX, badgeY, badgeR, 0, Math.PI * 2);
        CTX.fillStyle = colors[1];
        CTX.fill();
        CTX.restore();

        CTX.fillStyle = colors[2];
        CTX.textAlign = 'center';
        CTX.textBaseline = 'middle';
        CTX.font = `bold ${Math.round((columns === 1 ? 28 : 32) * SCALE)}px Jua, sans-serif`;
        CTX.fillText(profile.badge || profile.name.slice(0, 1), badgeX, badgeY + Math.round(1 * SCALE));

        const textX = columns === 1 ? x + Math.round(92 * SCALE) : x + cardW / 2;
        const textW = columns === 1 ? cardW - Math.round(116 * SCALE) : cardW - Math.round(36 * SCALE);
        const nameY = columns === 1 ? y + Math.round(43 * SCALE) : y + Math.round(88 * SCALE);
        const progressY = columns === 1 ? y + Math.round(75 * SCALE) : y + Math.round(116 * SCALE);

        CTX.fillStyle = '#111827';
        drawFittedCanvasText(profile.name, textX, nameY, textW, {
            initialSize: Math.round(30 * SCALE),
            minSize: Math.round(20 * SCALE),
            weight: 'bold',
            align: columns === 1 ? 'left' : 'center'
        });

        CTX.fillStyle = '#64748b';
        drawFittedCanvasText(progressText, textX, progressY, textW, {
            initialSize: Math.round(17 * SCALE),
            minSize: Math.round(12 * SCALE),
            weight: 'bold',
            align: columns === 1 ? 'left' : 'center'
        });

        STATE.hitboxes.push({ id: `learner_${profile.id}`, x, y, w: cardW, h: cardH });
    });

    CTX.textAlign = 'left';
    CTX.textBaseline = 'alphabetic';
}

function drawMap() {
    const { W, H } = clear();
    drawBackgroundTiles(W, H, 0.1);
    const learnerName = getActiveLearnerName('오늘');

    // 상단 헤더 (홈 버튼 포함)
    CTX.save();
    roundRect(CTX, 16, 12, W - 32, 70, 16);
    CTX.fillStyle = '#ffffff';
    CTX.fill();
    CTX.shadowColor = 'rgba(0,0,0,0.06)';
    CTX.shadowBlur = 10;
    CTX.restore();

    CTX.fillStyle = '#ec4899';
    CTX.font = 'bold 32px Jua, sans-serif';
    CTX.textAlign = 'center';
    CTX.textBaseline = 'middle';
    CTX.fillText(`${learnerName}의 맞춤 수학`, W / 2, 47);

    CTX.textAlign = 'left';
    CTX.textBaseline = 'alphabetic';

    const contentY = 112;
    const cardX = Math.round(24 * SCALE);
    const cardW = W - Math.round(48 * SCALE);
    const summaryH = Math.round(148 * SCALE);
    const summaryY = contentY;
    const irtSummary = window.IrtEngine?.summarize ? window.IrtEngine.summarize(STATE.irt) : null;
    const logSummary = window.IrtLog?.summarize ? window.IrtLog.summarize() : null;
    const attempts = irtSummary?.attemptCount || 0;
    const routineSummary = window.IrtProgressView?.buildLearnerRoutineSummary?.({
        learnerName,
        irtState: STATE.irt,
        logSummary,
        syncText: getIrtSyncSummaryText()
    }) || {
        title: '매일 풀수록 더 맞춰지는 수학 루틴',
        progressText: attempts > 0 ? `지금까지 ${attempts}문항을 풀었어요` : '첫 문제부터 시작해요',
        syncText: getIrtSyncSummaryText(),
        startSubtitle: '내 수준에 맞춰 출제돼요'
    };

    CTX.save();
    roundRect(CTX, cardX, summaryY, cardW, summaryH, Math.round(22 * SCALE));
    const summaryG = CTX.createLinearGradient(cardX, summaryY, cardX + cardW, summaryY + summaryH);
    summaryG.addColorStop(0, '#fff7ed');
    summaryG.addColorStop(1, '#eef2ff');
    CTX.fillStyle = summaryG;
    CTX.shadowColor = 'rgba(15, 23, 42, 0.08)';
    CTX.shadowBlur = Math.round(18 * SCALE);
    CTX.fill();
    CTX.restore();

    CTX.fillStyle = '#111827';
    drawFittedCanvasText(routineSummary.title, W / 2, summaryY + Math.round(36 * SCALE), cardW - Math.round(36 * SCALE), {
        initialSize: Math.round(27 * SCALE),
        minSize: Math.round(18 * SCALE),
        weight: 'bold'
    });
    CTX.fillStyle = '#4b5563';
    drawFittedCanvasText(routineSummary.progressText, W / 2, summaryY + Math.round(72 * SCALE), cardW - Math.round(36 * SCALE), {
        initialSize: Math.round(20 * SCALE),
        minSize: Math.round(14 * SCALE),
        weight: 'bold'
    });
    CTX.fillStyle = '#6b7280';
    drawFittedCanvasText(routineSummary.syncText, W / 2, summaryY + Math.round(108 * SCALE), cardW - Math.round(36 * SCALE), {
        initialSize: Math.round(18 * SCALE),
        minSize: Math.round(13 * SCALE),
        weight: 'bold'
    });

    const adaptiveBtnW = Math.min(460, W - 60);
    const adaptiveBtnH = Math.round(104 * SCALE);
    const adaptiveBtnX = (W - adaptiveBtnW) / 2;
    const adaptiveBtnY = summaryY + summaryH + Math.round(28 * SCALE);

    CTX.save();
    roundRect(CTX, adaptiveBtnX, adaptiveBtnY, adaptiveBtnW, adaptiveBtnH, Math.round(24 * SCALE));
    const startG = CTX.createLinearGradient(adaptiveBtnX, adaptiveBtnY, adaptiveBtnX + adaptiveBtnW, adaptiveBtnY + adaptiveBtnH);
    startG.addColorStop(0, '#0f766e');
    startG.addColorStop(1, '#2563eb');
    CTX.fillStyle = startG;
    CTX.shadowColor = 'rgba(37, 99, 235, 0.24)';
    CTX.shadowBlur = Math.round(18 * SCALE);
    CTX.fill();
    CTX.restore();

    CTX.fillStyle = '#ffffff';
    CTX.font = `bold ${Math.round(33 * SCALE)}px Jua, sans-serif`;
    CTX.textAlign = 'center';
    CTX.textBaseline = 'middle';
    CTX.fillText('오늘의 문제 시작', adaptiveBtnX + adaptiveBtnW / 2, adaptiveBtnY + adaptiveBtnH * 0.38);
    CTX.font = `${Math.round(20 * SCALE)}px Jua, sans-serif`;
    CTX.fillText(routineSummary.startSubtitle, adaptiveBtnX + adaptiveBtnW / 2, adaptiveBtnY + adaptiveBtnH * 0.72);
    STATE.hitboxes.push({ id: 'btn_adaptive_start', x: adaptiveBtnX, y: adaptiveBtnY, w: adaptiveBtnW, h: adaptiveBtnH });

    const secondaryY = adaptiveBtnY + adaptiveBtnH + Math.round(28 * SCALE);
    const gap = Math.round(14 * SCALE);
    const secondaryW = (cardW - gap) / 2;
    const secondaryH = Math.round(76 * SCALE);
    const secondaryButtons = [
        { id: 'btn_collection', label: '리포트 보기', sub: '부모 리포트 · 티니핑', x: cardX },
        { id: 'btn_switch_learner', label: '사용자 변경', sub: '다른 이름으로 풀기', x: cardX + secondaryW + gap }
    ];

    secondaryButtons.forEach(button => {
        CTX.save();
        roundRect(CTX, button.x, secondaryY, secondaryW, secondaryH, Math.round(18 * SCALE));
        CTX.fillStyle = button.id === 'btn_collection' ? '#fdf2f8' : '#f8fafc';
        CTX.fill();
        CTX.strokeStyle = button.id === 'btn_collection' ? '#f9a8d4' : '#cbd5e1';
        CTX.lineWidth = 1.5;
        CTX.stroke();
        CTX.restore();

        CTX.fillStyle = button.id === 'btn_collection' ? '#be185d' : '#475569';
        drawFittedCanvasText(button.label, button.x + secondaryW / 2, secondaryY + Math.round(28 * SCALE), secondaryW - Math.round(18 * SCALE), {
            initialSize: Math.round(21 * SCALE),
            minSize: Math.round(14 * SCALE),
            weight: 'bold'
        });
        CTX.fillStyle = '#64748b';
        drawFittedCanvasText(button.sub, button.x + secondaryW / 2, secondaryY + Math.round(54 * SCALE), secondaryW - Math.round(18 * SCALE), {
            initialSize: Math.round(15 * SCALE),
            minSize: Math.round(11 * SCALE),
            weight: 'bold'
        });
        STATE.hitboxes.push({ id: button.id, x: button.x, y: secondaryY, w: secondaryW, h: secondaryH });
    });

    CTX.textAlign = 'left';
    CTX.textBaseline = 'alphabetic';
}

function drawHome() {
    const { W } = clear();
    const layout = getHomeLayout(W);
    const learnerName = getActiveLearnerName('나');

    CTX.fillStyle = '#ec4899';
    drawFittedCanvasText(`${learnerName}의 도전! 수학꾸러기`, W / 2, layout.titleY, W - Math.round(44 * SCALE), {
        initialSize: Math.round(42 * SCALE),
        minSize: Math.round(26 * SCALE),
        weight: 'bold'
    });
    CTX.textAlign = 'left';

    CTX.fillStyle = '#6b7280';
    drawFittedCanvasText('문제를 풀고 귀여운 티니핑들을 모아보세요!', W / 2, layout.subtitleY, W - Math.round(44 * SCALE), {
        initialSize: Math.round(24 * SCALE),
        minSize: Math.round(16 * SCALE),
        weight: 'bold'
    });
    CTX.textAlign = 'left';

    const cardRadius = Math.round(24 * SCALE);
    const cardShadow = Math.round(15 * SCALE);
    CTX.save();
    CTX.shadowColor = 'rgba(0,0,0,0.08)';
    CTX.shadowBlur = cardShadow;
    roundRect(CTX, layout.cardX, layout.startY - Math.round(10 * SCALE), layout.gridWidth, layout.gridHeight + Math.round(20 * SCALE), cardRadius);
    CTX.fillStyle = '#ffffff';
    CTX.fill();
    CTX.restore();

    const tileStartX = layout.cardX + layout.cardPadding;
    const tileStartY = layout.startY;

    for (let i = 0; i < TINIPINGS.length; i++) {
        const row = Math.floor(i / layout.cols);
        const col = i % layout.cols;
        const x = tileStartX + col * (layout.tileSize + layout.gap);
        const y = tileStartY + row * (layout.tileSize + layout.gap);
        const tp = TINIPINGS[i];

        CTX.save();
        roundRect(CTX, x, y, layout.tileSize, layout.tileSize, Math.round(14 * SCALE));
        const g = CTX.createLinearGradient(x, y, x + layout.tileSize, y + layout.tileSize);
        if (tp.type === '로열') { g.addColorStop(0, '#fce7f3'); g.addColorStop(1, '#fbcfe8'); }
        else if (tp.type === '전설') { g.addColorStop(0, '#fef3c7'); g.addColorStop(1, '#fde68a'); }
        else if (tp.type === '서포팅') { g.addColorStop(0, '#ddd6fe'); g.addColorStop(1, '#c4b5fd'); }
        else { g.addColorStop(0, '#e0f2fe'); g.addColorStop(1, '#bae6fd'); }
        CTX.fillStyle = g;
        CTX.fill();
        CTX.strokeStyle = '#e5e7eb';
        CTX.lineWidth = Math.max(1.5, Math.round(2.5 * SCALE));
        CTX.stroke();
        CTX.restore();

        const imgSize = layout.tileSize * 0.66;
        drawTinipingPortrait(
            tp,
            x + layout.tileSize / 2,
            y + Math.round(8 * SCALE) + imgSize / 2,
            imgSize,
            { compact: true }
        );

        CTX.fillStyle = '#111827';
        drawFittedCanvasText(tp.name, x + layout.tileSize / 2, y + layout.tileSize - Math.round(10 * SCALE), layout.tileSize - Math.round(8 * SCALE), {
            initialSize: Math.max(12, Math.round(14 * SCALE)),
            minSize: 10,
            weight: 'bold'
        });
        CTX.textAlign = 'left';
    }

    const btnX = (W - layout.btnW) / 2;
    CTX.save();
    CTX.shadowColor = 'rgba(236, 72, 153, 0.4)';
    CTX.shadowBlur = 20;
    CTX.shadowOffsetY = 8;
    roundRect(CTX, btnX, layout.btnY, layout.btnW, layout.btnH, 30); // Pill shape
    
    // Emotion Castle Gradient
    const btnG = CTX.createLinearGradient(btnX, layout.btnY, btnX + layout.btnW, layout.btnY + layout.btnH);
    btnG.addColorStop(0, '#F472B6'); // Pink
    btnG.addColorStop(1, '#8B5CF6'); // Purple
    CTX.fillStyle = btnG;
    CTX.fill();
    CTX.restore();

    CTX.fillStyle = '#ffffff';
    CTX.font = `bold ${Math.round(28 * SCALE)}px Jua, sans-serif`;
    CTX.textAlign = 'center';
    CTX.textBaseline = 'middle';
    CTX.fillText('게임 시작하기', btnX + layout.btnW / 2, layout.btnY + layout.btnH / 2);
    CTX.textAlign = 'left';

    STATE.hitboxes.push({ id: 'btn_start_game', x: btnX, y: layout.btnY, w: layout.btnW, h: layout.btnH });
}

/* =========================================================================
   미지수 문제 전용 렌더링 - Symbol Equation Quiz
   □(네모), ○(동그라미), △(세모) 세 미지수를 추론하는 문제
   ========================================================================= */
function drawSymbolEquationQuiz(W, H, cardX, cardY, cardW, cardH) {
    const problem = STATE.problem;
    const answers = problem.answers;

    // 타이틀
    CTX.fillStyle = '#7c3aed';
    CTX.font = `bold ${Math.round(32 * SCALE)}px Jua, sans-serif`;
    CTX.textAlign = 'center';
    CTX.fillText('🧩 미지수 탐정 도전!', cardX + cardW / 2, cardY + 45);

    // 방정식 표시 영역
    const eqStartY = cardY + 85;
    const eqHeight = Math.round(42 * SCALE);
    const eqGap = Math.round(12 * SCALE);

    CTX.fillStyle = '#1f2937';
    CTX.font = `bold ${Math.round(28 * SCALE)}px Jua, sans-serif`;
    CTX.textAlign = 'center';

    problem.equations.forEach((eq, idx) => {
        const y = eqStartY + idx * (eqHeight + eqGap);
        // 방정식 배경
        roundRect(CTX, cardX + 20, y - 8, cardW - 40, eqHeight + 8, 12);
        CTX.fillStyle = idx % 2 === 0 ? '#fef3c7' : '#e0e7ff';
        CTX.fill();

        // 방정식 텍스트
        CTX.fillStyle = '#1f2937';
        CTX.font = `bold ${Math.round(26 * SCALE)}px Jua, sans-serif`;
        CTX.fillText(`(${idx + 1}) ${eq.left} = ${eq.result}`, cardX + cardW / 2, y + eqHeight / 2 + 4);
    });

    // 미지수 선택 영역
    const selectStartY = eqStartY + 3 * (eqHeight + eqGap) + 30;
    const symbolKeys = ['square', 'circle', 'triangle'];
    const symbolLabels = ['□', '○', '△'];

    const selectRowH = Math.round(85 * SCALE);
    const btnSize = Math.round(58 * SCALE);
    const btnGap = Math.round(10 * SCALE);

    symbolKeys.forEach((key, idx) => {
        const rowY = selectStartY + idx * selectRowH;
        const symbolData = answers[key];

        // 미지수 라벨
        CTX.fillStyle = '#6b21a8';
        CTX.font = `bold ${Math.round(32 * SCALE)}px Jua, sans-serif`;
        CTX.textAlign = 'left';
        CTX.fillText(symbolLabels[idx] + ' =', cardX + 25, rowY + 25);

        // 선택지 버튼들
        const optionsStartX = cardX + 100;
        const options = symbolData.options;

        options.forEach((opt, optIdx) => {
            const ox = optionsStartX + optIdx * (btnSize + btnGap);
            const oy = rowY;

            roundRect(CTX, ox, oy, btnSize, btnSize, 12);

            const isSelected = STATE.symbolAnswers[key] === opt;
            if (isSelected) {
                const g = CTX.createLinearGradient(ox, oy, ox + btnSize, oy + btnSize);
                g.addColorStop(0, '#a855f7');
                g.addColorStop(1, '#6366f1');
                CTX.fillStyle = g;
                CTX.fill();
                CTX.fillStyle = '#ffffff';
            } else {
                CTX.fillStyle = '#f3e8ff';
                CTX.fill();
                CTX.strokeStyle = '#c084fc';
                CTX.lineWidth = 2;
                CTX.stroke();
                CTX.fillStyle = '#1f2937';
            }

            CTX.font = `bold ${Math.round(26 * SCALE)}px Jua, sans-serif`;
            CTX.textAlign = 'center';
            CTX.textBaseline = 'middle';
            CTX.fillText(opt, ox + btnSize / 2, oy + btnSize / 2);
            CTX.textBaseline = 'alphabetic';

            STATE.hitboxes.push({
                id: `symbol_${key}_${optIdx}`,
                x: ox, y: oy, w: btnSize, h: btnSize,
                symbolKey: key, value: opt
            });
        });

        // 선택된 값 표시
        if (STATE.symbolAnswers[key] !== null) {
            CTX.fillStyle = '#059669';
            CTX.font = `bold ${Math.round(28 * SCALE)}px Jua, sans-serif`;
            CTX.textAlign = 'left';
            CTX.fillText(`✓ ${STATE.symbolAnswers[key]}`, optionsStartX + 4 * (btnSize + btnGap) + 10, rowY + 35);
        }
    });

    // 정답 확인 버튼
    const allSelected = STATE.symbolAnswers.square !== null &&
        STATE.symbolAnswers.circle !== null &&
        STATE.symbolAnswers.triangle !== null;

    const btnW = Math.max(240, cardW * 0.7);
    const btnH = Math.round(64 * SCALE);
    const btnX = cardX + (cardW - btnW) / 2;
    const btnY = selectStartY + 3 * selectRowH + 20;

    CTX.save();
    roundRect(CTX, btnX, btnY, btnW, btnH, 18);
    if (allSelected) {
        const grad = CTX.createLinearGradient(btnX, btnY, btnX + btnW, btnY + btnH);
        grad.addColorStop(0, '#f472b6');
        grad.addColorStop(1, '#8b5cf6');
        CTX.fillStyle = grad;
        CTX.shadowColor = 'rgba(139, 92, 246, 0.4)';
        CTX.shadowBlur = 10;
    } else {
        CTX.fillStyle = '#d1d5db';
    }
    CTX.fill();
    CTX.restore();

    CTX.fillStyle = '#ffffff';
    CTX.font = `bold ${Math.round(28 * SCALE)}px Jua, sans-serif`;
    CTX.textAlign = 'center';
    CTX.textBaseline = 'middle';
    CTX.fillText('🔍 정답 확인하기', btnX + btnW / 2, btnY + btnH / 2);
    CTX.textBaseline = 'alphabetic';

    STATE.hitboxes.push({
        id: 'btn_check_symbol',
        x: btnX, y: btnY, w: btnW, h: btnH,
        disabled: !allSelected
    });

    // 힌트 텍스트
    CTX.fillStyle = '#9ca3af';
    CTX.font = `${Math.round(18 * SCALE)}px Jua, sans-serif`;
    CTX.textAlign = 'center';
    CTX.fillText('💡 첫 번째 식부터 차근차근 풀어보세요!', cardX + cardW / 2, btnY + btnH + 35);
}

// 힌트 버튼 그리기
function drawHintButton(x, y, size) {
    CTX.save();
    CTX.beginPath();
    CTX.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
    CTX.fillStyle = '#fef08a'; // 노란색 배경
    CTX.shadowColor = 'rgba(0,0,0,0.1)';
    CTX.shadowBlur = 5;
    CTX.fill();
    CTX.strokeStyle = '#eab308';
    CTX.lineWidth = 2;
    CTX.stroke();

    CTX.fillStyle = '#854d0e';
    CTX.font = `${Math.round(size * 0.6)}px sans-serif`;
    CTX.textAlign = 'center';
    CTX.textBaseline = 'middle';
    CTX.fillText('💡', x + size / 2, y + size / 2);
    CTX.restore();
    CTX.textBaseline = 'alphabetic'; // Reset

    STATE.hitboxes.push({ id: 'btn_hint', x, y, w: size, h: size });
}

// 힌트 팝업 그리기
function drawHintPopup(x, y, w, text) {
    if (!text) return;
    const padding = 15;
    CTX.save();
    CTX.font = `bold ${Math.round(20 * SCALE)}px Jua, sans-serif`;
    const lines = getLines(CTX, text, w - padding * 2);
    const h = lines.length * 30 + padding * 2;

    roundRect(CTX, x, y, w, h, 10);
    CTX.fillStyle = '#ffffff';
    CTX.shadowColor = 'rgba(0,0,0,0.2)';
    CTX.shadowBlur = 10;
    CTX.fill();
    CTX.strokeStyle = '#facc15';
    CTX.lineWidth = 2;
    CTX.stroke();

    CTX.fillStyle = '#854d0e';
    CTX.textAlign = 'left';
    CTX.textBaseline = 'top';
    lines.forEach((line, i) => {
        CTX.fillText(line, x + padding, y + padding + i * 30);
    });
    CTX.restore();
}

// 숫자 키패드 그리기
function drawKeypad(x, y, w, h) {
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '확인'];
    const gap = 10;
    const keyW = (w - gap * 2) / 3;
    const keyH = (h - gap * 3) / 4;

    keys.forEach((key, i) => {
        const row = Math.floor(i / 3);
        const col = i % 3;
        const kx = x + col * (keyW + gap);
        const ky = y + row * (keyH + gap);

        CTX.save();
        roundRect(CTX, kx, ky, keyW, keyH, 10);
        
        if (key === '확인') {
             CTX.fillStyle = '#10b981'; // 녹색
        } else if (key === 'C') {
             CTX.fillStyle = '#ef4444'; // 빨간색
        } else {
             CTX.fillStyle = '#ffffff';
        }
        
        CTX.shadowColor = 'rgba(0,0,0,0.1)';
        CTX.shadowBlur = 2;
        CTX.fill();
        CTX.strokeStyle = '#e5e7eb';
        CTX.stroke();

        CTX.fillStyle = (key === '확인' || key === 'C') ? '#ffffff' : '#374151';
        CTX.font = `bold ${Math.round(24 * SCALE)}px Jua, sans-serif`;
        CTX.textAlign = 'center';
        CTX.textBaseline = 'middle';
        CTX.fillText(key, kx + keyW / 2, ky + keyH / 2);
        CTX.restore();

        STATE.hitboxes.push({ id: `key_${key}`, x: kx, y: ky, w: keyW, h: keyH, value: key });
    });
}

function ensureRelationCoachState() {
    if (!STATE.problem || STATE.problem.type !== 'relationshipCoach') return;
    if (!STATE.relationCoach || STATE.relationCoach.problemId !== STATE.problem.problem_id) {
        STATE.relationCoach = window.RelationCoach?.createState(STATE.problem) || null;
    }
}

function coachOptionValue(option) {
    if (option && typeof option === 'object' && typeof option.value !== 'undefined') return String(option.value);
    return String(option);
}

function coachOptionLabel(option) {
    if (option && typeof option === 'object' && typeof option.label !== 'undefined') return String(option.label);
    return String(option);
}

function drawRelationVisualization(problem, x, y, w, h) {
    if (!problem?.entities?.length) return y;

    CTX.save();
    roundRect(CTX, x, y, w, h, 14);
    CTX.fillStyle = '#f8fafc';
    CTX.fill();
    CTX.strokeStyle = '#bfdbfe';
    CTX.lineWidth = 2;
    CTX.stroke();

    CTX.fillStyle = '#1e3a8a';
    CTX.font = `bold ${Math.round(17 * SCALE)}px Jua, sans-serif`;
    CTX.textAlign = 'left';
    CTX.fillText(`기준: ${problem.base_unit}`, x + 14, y + 28);

    const values = problem.entities.map(entity => Math.max(0.1, Number(entity.relative_value || entity.count || 1)));
    const maxValue = Math.max(...values, 1);
    const rowH = Math.max(28, Math.floor((h - 44) / problem.entities.length));

    problem.entities.forEach((entity, idx) => {
        const rowY = y + 44 + idx * rowH;
        const barW = Math.max(28, (w - 150) * (Math.max(0.1, Number(entity.relative_value || entity.count || 1)) / maxValue));

        CTX.fillStyle = '#334155';
        CTX.font = `bold ${Math.round(15 * SCALE)}px Jua, sans-serif`;
        CTX.textAlign = 'left';
        CTX.fillText(entity.label, x + 14, rowY + 18);

        roundRect(CTX, x + 105, rowY + 3, barW, rowH - 8, 8);
        CTX.fillStyle = entity.relative_value >= 1 ? '#60a5fa' : '#93c5fd';
        CTX.fill();

        CTX.fillStyle = '#0f172a';
        CTX.font = `${Math.round(13 * SCALE)}px Jua, sans-serif`;
        const label = entity.relative_value ? `${Math.round(entity.relative_value * 100) / 100}배` : `${entity.count}`;
        CTX.fillText(label, x + 112 + barW, rowY + 18);
    });

    CTX.restore();
    return y + h + 12;
}

function drawCoachOptionButtons(options, selectedValue, x, y, w, buttonH, prefix) {
    const gap = Math.round(10 * SCALE);
    const cols = options.length > 3 ? 2 : 1;
    const buttonW = (w - (cols - 1) * gap) / cols;
    let lastBottom = y;

    options.forEach((option, idx) => {
        const col = idx % cols;
        const row = Math.floor(idx / cols);
        const bx = x + col * (buttonW + gap);
        const by = y + row * (buttonH + gap);
        const value = coachOptionValue(option);
        const selected = selectedValue === value;

        CTX.save();
        roundRect(CTX, bx, by, buttonW, buttonH, 12);
        CTX.fillStyle = selected ? '#2563eb' : '#eff6ff';
        CTX.fill();
        CTX.strokeStyle = selected ? '#1d4ed8' : '#bfdbfe';
        CTX.lineWidth = 2;
        CTX.stroke();
        CTX.restore();

        CTX.fillStyle = selected ? '#ffffff' : '#1e3a8a';
        CTX.textAlign = 'center';
        CTX.textBaseline = 'middle';
        const label = coachOptionLabel(option);
        const display = label.length > 22 ? label.slice(0, 21) + '..' : label;
        drawFittedCanvasText(display, bx + buttonW / 2, by + buttonH / 2, buttonW - Math.round(18 * SCALE), {
            initialSize: Math.round(20 * SCALE),
            minSize: Math.round(13 * SCALE),
            weight: 'bold'
        });
        CTX.textBaseline = 'alphabetic';

        STATE.hitboxes.push({ id: `${prefix}_${idx}`, x: bx, y: by, w: buttonW, h: buttonH, value });
        lastBottom = Math.max(lastBottom, by + buttonH);
    });

    return lastBottom;
}

function drawRelationshipCoachQuiz(W, H, cardX, cardY, cardW, cardH) {
    ensureRelationCoachState();
    const problem = STATE.problem;
    const coachState = STATE.relationCoach;
    const steps = window.RelationCoach?.getSteps(problem) || [];
    const step = window.RelationCoach?.getCurrentStep(problem, coachState);
    const guideActive = coachState?.guideActive === true;

    CTX.fillStyle = '#0f766e';
    CTX.font = `bold ${Math.round(27 * SCALE)}px Jua, sans-serif`;
    CTX.textAlign = 'center';
    CTX.fillText(guideActive ? '풀이 도움' : '문제 풀이', cardX + cardW / 2, cardY + Math.round(38 * SCALE));

    CTX.fillStyle = '#111827';
    CTX.font = `bold ${Math.round(24 * SCALE)}px Jua, sans-serif`;
    const questionLines = getLines(CTX, problem.question, cardW - 42);
    let currentY = cardY + Math.round(72 * SCALE);
    questionLines.slice(0, 5).forEach(line => {
        CTX.fillText(line, cardX + cardW / 2, currentY);
        currentY += Math.round(31 * SCALE);
    });

    currentY += Math.round(10 * SCALE);

    if (!guideActive) {
        const optionsBottom = drawCoachOptionButtons(
            problem.options,
            STATE.selected || '',
            cardX + 25,
            currentY,
            cardW - 50,
            Math.round(62 * SCALE),
            'opt'
        );

        const gap = Math.round(10 * SCALE);
        const buttonAreaW = cardW - 50;
        const helpW = Math.max(120, Math.min(Math.round(170 * SCALE), buttonAreaW * 0.38));
        const checkW = buttonAreaW - helpW - gap;
        const btnH = Math.max(56, Math.round(62 * SCALE));
        const btnY = optionsBottom + Math.round(22 * SCALE);
        const helpX = cardX + 25;
        const checkX = helpX + helpW + gap;

        roundRect(CTX, helpX, btnY, helpW, btnH, 16);
        CTX.fillStyle = '#fef3c7';
        CTX.fill();
        CTX.strokeStyle = '#f59e0b';
        CTX.lineWidth = 2;
        CTX.stroke();
        CTX.fillStyle = '#92400e';
        CTX.font = `bold ${Math.round(21 * SCALE)}px Jua, sans-serif`;
        CTX.textAlign = 'center';
        CTX.textBaseline = 'middle';
        CTX.fillText('풀이 도움', helpX + helpW / 2, btnY + btnH / 2);
        STATE.hitboxes.push({ id: 'btn_open_coach', x: helpX, y: btnY, w: helpW, h: btnH });

        roundRect(CTX, checkX, btnY, checkW, btnH, 16);
        CTX.fillStyle = STATE.selected == null ? '#d1d5db' : '#14b8a6';
        CTX.fill();
        CTX.fillStyle = '#ffffff';
        CTX.font = `bold ${Math.round(23 * SCALE)}px Jua, sans-serif`;
        CTX.fillText('정답 확인', checkX + checkW / 2, btnY + btnH / 2);
        CTX.textBaseline = 'alphabetic';
        STATE.hitboxes.push({ id: 'btn_check', x: checkX, y: btnY, w: checkW, h: btnH, disabled: STATE.selected == null });
        return;
    }

    if (step) {
        const panelX = cardX + 18;
        const panelW = cardW - 36;
        const stepNumber = (coachState?.stepIndex || 0) + 1;

        CTX.save();
        roundRect(CTX, panelX, currentY, panelW, Math.round(54 * SCALE), 14);
        CTX.fillStyle = '#ecfeff';
        CTX.fill();
        CTX.strokeStyle = '#99f6e4';
        CTX.stroke();
        CTX.restore();

        CTX.fillStyle = '#0f766e';
        CTX.font = `bold ${Math.round(23 * SCALE)}px Jua, sans-serif`;
        CTX.textAlign = 'left';
        CTX.textBaseline = 'middle';
        CTX.fillText(`${stepNumber}/${steps.length} ${step.label}`, panelX + 16, currentY + Math.round(27 * SCALE));

        const hintW = Math.round(78 * SCALE);
        const hintH = Math.round(34 * SCALE);
        const hintX = panelX + panelW - hintW - 12;
        const hintY = currentY + Math.round(10 * SCALE);
        roundRect(CTX, hintX, hintY, hintW, hintH, 10);
        CTX.fillStyle = '#fef3c7';
        CTX.fill();
        CTX.fillStyle = '#92400e';
        CTX.textAlign = 'center';
        CTX.fillText('힌트', hintX + hintW / 2, hintY + hintH / 2);
        CTX.textBaseline = 'alphabetic';
        STATE.hitboxes.push({ id: 'btn_coach_hint', x: hintX, y: hintY, w: hintW, h: hintH });

        currentY += Math.round(76 * SCALE);

        CTX.fillStyle = '#111827';
        CTX.font = `bold ${Math.round(25 * SCALE)}px Jua, sans-serif`;
        CTX.textAlign = 'center';
        getLines(CTX, step.prompt, panelW).forEach(line => {
            CTX.fillText(line, cardX + cardW / 2, currentY);
            currentY += Math.round(30 * SCALE);
        });

        if ((coachState?.hintLevel || 0) > 0) {
            CTX.fillStyle = '#92400e';
            CTX.font = `${Math.round(20 * SCALE)}px Jua, sans-serif`;
            getLines(CTX, step.hint, panelW).forEach(line => {
                CTX.fillText(line, cardX + cardW / 2, currentY);
                currentY += Math.round(24 * SCALE);
            });
        }

        if (step.id === 'visualization') {
            currentY = drawRelationVisualization(problem, panelX, currentY + 6, panelW, Math.round(150 * SCALE));
        }

        const selectedValue = coachState?.selections?.[step.id] || '';
        const optionsBottom = drawCoachOptionButtons(
            step.options,
            selectedValue,
            panelX,
            currentY + Math.round(10 * SCALE),
            panelW,
            Math.round(58 * SCALE),
            'coach_opt'
        );

        currentY = optionsBottom + Math.round(18 * SCALE);

        if (coachState?.feedback) {
            CTX.fillStyle = coachState.feedback.includes('좋아요') ? '#047857' : '#dc2626';
            CTX.font = `${Math.round(20 * SCALE)}px Jua, sans-serif`;
            CTX.textAlign = 'center';
            CTX.fillText(coachState.feedback, cardX + cardW / 2, currentY);
            currentY += Math.round(26 * SCALE);
        }

        const nextW = Math.max(220, Math.min(panelW * 0.75, Math.round(300 * SCALE)));
        const nextH = Math.round(58 * SCALE);
        const nextX = cardX + (cardW - nextW) / 2;
        const nextY = currentY;
        const disabled = !selectedValue;

        roundRect(CTX, nextX, nextY, nextW, nextH, 16);
        CTX.fillStyle = disabled ? '#d1d5db' : '#14b8a6';
        CTX.fill();
        CTX.fillStyle = '#ffffff';
        CTX.font = `bold ${Math.round(23 * SCALE)}px Jua, sans-serif`;
        CTX.textAlign = 'center';
        CTX.textBaseline = 'middle';
        CTX.fillText('다음', nextX + nextW / 2, nextY + nextH / 2);
        CTX.textBaseline = 'alphabetic';
        STATE.hitboxes.push({ id: 'btn_coach_next', x: nextX, y: nextY, w: nextW, h: nextH, disabled });
        return;
    }

    CTX.fillStyle = '#0f766e';
    CTX.font = `bold ${Math.round(25 * SCALE)}px Jua, sans-serif`;
    CTX.textAlign = 'center';
    CTX.fillText('이제 답을 골라볼까요?', cardX + cardW / 2, currentY);
    currentY += Math.round(32 * SCALE);

    const optionsBottom = drawCoachOptionButtons(
        problem.options,
        STATE.selected || '',
        cardX + 25,
        currentY,
        cardW - 50,
        Math.round(62 * SCALE),
        'opt'
    );

    const btnW = Math.max(240, Math.min(Math.round(280 * SCALE), (cardW - 40) * 0.8));
    const btnH = Math.max(58, Math.round(64 * SCALE));
    const btnX = cardX + (cardW - btnW) / 2;
    const btnY = optionsBottom + Math.round(24 * SCALE);

    roundRect(CTX, btnX, btnY, btnW, btnH, 18);
    CTX.fillStyle = STATE.selected == null ? '#d1d5db' : '#14b8a6';
    CTX.fill();
    CTX.fillStyle = '#ffffff';
    CTX.font = `bold ${Math.round(25 * SCALE)}px Jua, sans-serif`;
    CTX.textAlign = 'center';
    CTX.textBaseline = 'middle';
    CTX.fillText('정답 확인', btnX + btnW / 2, btnY + btnH / 2);
    CTX.textBaseline = 'alphabetic';
    STATE.hitboxes.push({ id: 'btn_check', x: btnX, y: btnY, w: btnW, h: btnH, disabled: STATE.selected == null });
}

function drawQuiz() {
    const { W, H } = clear();
    drawBackgroundTiles(W, H, 0.15);
    drawHeader(W, H);
    drawCollectionButton(W, H);

    const cardX = 20, cardY = 100, cardW = W - 40, cardH = H - 140;
    CTX.save();
    roundRect(CTX, cardX, cardY, cardW, cardH, 24);
    CTX.fillStyle = '#ffffff';
    CTX.fill();
    CTX.shadowColor = 'rgba(0,0,0,0.06)';
    CTX.shadowBlur = 10;
    CTX.restore();

    if (!STATE.problem) return;

    // 미지수 문제인 경우 별도 렌더링
    if (STATE.problem.type === 'symbolEquation') {
        drawSymbolEquationQuiz(W, H, cardX, cardY, cardW, cardH);
        return;
    }

    if (STATE.problem.type === 'relationshipCoach') {
        drawRelationshipCoachQuiz(W, H, cardX, cardY, cardW, cardH);
        return;
    }

    const problem = STATE.problem;
    const { question, options } = problem;

    // 힌트 버튼 (문제 텍스트 우측 상단)
    if (problem.hint || problem.explanation) {
        drawHintButton(cardX + cardW - 60, cardY + 20, 40);
        if (STATE.showHint) {
            drawHintPopup(cardX + cardW - 220, cardY + 70, 200, problem.hint || '힌트가 없어요.');
        }
    }

    // 문제 텍스트
    CTX.fillStyle = '#111827';
    CTX.font = `bold ${Math.round(34 * SCALE)}px Jua, sans-serif`;
    CTX.textAlign = 'center';

    // 긴 텍스트 줄바꿈 처리
    const textX = cardX + cardW / 2;
    const textY = cardY + Math.round(60 * SCALE);
    const maxWidth = cardW - 40;
    const lineHeight = Math.round(46 * SCALE);

    const lines = getLines(CTX, question, maxWidth);
    let currentY = textY;
    lines.forEach(line => {
        CTX.fillText(line, textX, currentY);
        currentY += lineHeight;
    });

    // 시각화 요소 (도형, 시계, 자, 그래프 등)
    let nextY = currentY + 30;
    if (STATE.problem.shapeType) {
        drawGeometryShape(CTX, STATE.problem.shapeType, cardX + cardW / 2, nextY + 70, 110);
        nextY += 160;
    } else if (STATE.problem.clockTime) {
        drawClock(CTX, cardX + cardW / 2, nextY + 90, 80, STATE.problem.clockTime.h, STATE.problem.clockTime.m);
        nextY += 200;
    } else if (STATE.problem.rulerData) {
        drawRuler(CTX, cardX + cardW / 2, nextY + 70, STATE.problem.rulerData);
        nextY += 160;
    } else if (STATE.problem.graphData) {
        drawBarGraph(CTX, cardX + cardW / 2, nextY + 100, STATE.problem.graphData);
        nextY += 220;
    }

    // 옵션 버튼 영역 계산
    const optionsAreaY = nextY + 30;
    const optionsAreaH = cardY + cardH - optionsAreaY - 100; // 하단 여백 확보
    const optionsAreaW = cardW - 40;
    const optionsAreaX = cardX + 20;

    const numOptions = options.length;
    const buttonGap = Math.round(15 * SCALE);
    let cols = numOptions;
    let rows = 1;
    let buttonW = Math.floor((optionsAreaW - (cols - 1) * buttonGap) / cols);

    // 버튼이 너무 작으면 2줄로 배치
    if (buttonW < 120 && numOptions > 2) {
        cols = Math.ceil(numOptions / 2);
        rows = Math.ceil(numOptions / cols);
        buttonW = Math.floor((optionsAreaW - (cols - 1) * buttonGap) / cols);
    }

    const buttonH = Math.max(64, Math.round(72 * SCALE));
    let lastOptionY = optionsAreaY;

    for (let i = 0; i < options.length; i++) {
        const row = Math.floor(i / cols);
        const col = i % cols;

        // 마지막 줄 중앙 정렬
        const itemsInRow = (row === rows - 1) ? (numOptions - row * cols) : cols;
        const rowWidth = itemsInRow * buttonW + (itemsInRow - 1) * buttonGap;
        const rowStartX = optionsAreaX + (optionsAreaW - rowWidth) / 2;

        const ox = rowStartX + col * (buttonW + buttonGap);
        const oy = optionsAreaY + row * (buttonH + buttonGap);
        lastOptionY = oy + buttonH;

        roundRect(CTX, ox, oy, buttonW, buttonH, Math.round(15 * SCALE));
        const selected = STATE.selected === options[i];

        if (selected) {
            const g = CTX.createLinearGradient(ox, oy, ox + buttonW, oy + buttonH);
            g.addColorStop(0, '#f472b6');
            g.addColorStop(1, '#60a5fa');
            CTX.fillStyle = g;
            CTX.fill();
            CTX.fillStyle = '#ffffff';
            CTX.font = `bold ${Math.round(30 * SCALE)}px Jua, sans-serif`;
        } else {
            CTX.fillStyle = '#fdf2f8';
            CTX.fill();
            CTX.strokeStyle = '#f5c2e7';
            CTX.lineWidth = Math.max(2, Math.round(3 * SCALE));
            CTX.stroke();
            CTX.fillStyle = '#111827';
            CTX.font = `bold ${Math.round(30 * SCALE)}px Jua, sans-serif`;
        }

        CTX.textAlign = 'center';
        CTX.textBaseline = 'middle';
        const circleNums = ['①', '②', '③', '④', '⑤'];
        const displayText = buttonW < 90 ? `${options[i]}` : `${circleNums[i] || (i + 1) + '.'} ${options[i]}`;
        CTX.fillText(displayText, ox + buttonW / 2, oy + buttonH / 2);
        CTX.textBaseline = 'alphabetic';

        STATE.hitboxes.push({ id: `opt_${i}`, x: ox, y: oy, w: buttonW, h: buttonH, value: options[i] });
    }

    const btnW = Math.max(240, Math.min(Math.round(280 * SCALE), optionsAreaW * 0.8));
    const btnH = Math.max(60, Math.round(68 * SCALE));
    const btnX = cardX + (cardW - btnW) / 2;
    const btnY = Math.min(lastOptionY + Math.round(30 * SCALE), cardY + cardH - btnH - Math.round(20 * SCALE));

    CTX.save();
    roundRect(CTX, btnX, btnY, btnW, btnH, Math.round(18 * SCALE));
    if (STATE.selected == null) {
        CTX.fillStyle = '#d1d5db';
    } else {
        const gg = CTX.createLinearGradient(btnX, btnY, btnX + btnW, btnY + btnH);
        gg.addColorStop(0, '#fb7185');
        gg.addColorStop(1, '#60a5fa');
        CTX.fillStyle = gg;
        CTX.shadowColor = 'rgba(251, 113, 133, 0.3)';
        CTX.shadowBlur = Math.round(10 * SCALE);
    }
    CTX.fill();
    CTX.restore();

    CTX.fillStyle = '#ffffff';
    CTX.textAlign = 'center';
    CTX.textBaseline = 'middle';
    CTX.font = `bold ${Math.round(28 * SCALE)}px Jua, sans-serif`;
    CTX.fillText('정답 확인', btnX + btnW / 2, btnY + btnH / 2);
    CTX.textBaseline = 'alphabetic';

    STATE.hitboxes.push({ id: 'btn_check', x: btnX, y: btnY, w: btnW, h: btnH, disabled: STATE.selected == null });
}

function drawExplain() {
    const { W, H } = clear();
    drawBackgroundTiles(W, H, 0.12);
    drawHeader(W, H);
    drawCollectionButton(W, H);
    const learnerName = getActiveLearnerName('친구');

    const cardX = 20, cardY = 100, cardW = W - 40, cardH = H - 140;
    CTX.save();
    roundRect(CTX, cardX, cardY, cardW, cardH, 24);
    CTX.fillStyle = '#ffffff';
    CTX.fill();
    CTX.restore();

    CTX.textAlign = 'left';
    CTX.fillStyle = STATE.isCorrect ? '#065f46' : '#7f1d1d';
    CTX.font = `bold ${Math.round(34 * SCALE)}px Jua, sans-serif`;
    CTX.fillText(STATE.isCorrect ? `${learnerName}야, 정답이야!` : `${learnerName}야, 다시 생각해봐!`, cardX + 24, cardY + 50);

    CTX.fillStyle = '#111827';
    CTX.font = `bold ${Math.round(28 * SCALE)}px Jua, sans-serif`;
    CTX.fillText(`정답: ${STATE.problem.answer}`, cardX + 24, cardY + 90);

    const progressStatus = window.IrtProgressView?.buildUpdateStatus?.(STATE.lastIrtUpdate);
    if (progressStatus) {
        const progressX = cardX + 24;
        const progressY = cardY + 108;
        const progressW = cardW - 48;
        const progressH = Math.max(46, Math.round(52 * SCALE));
        CTX.save();
        roundRect(CTX, progressX, progressY, progressW, progressH, Math.round(16 * SCALE));
        CTX.fillStyle = '#eef2ff';
        CTX.fill();
        CTX.strokeStyle = '#c7d2fe';
        CTX.lineWidth = Math.max(1, Math.round(2 * SCALE));
        CTX.stroke();
        CTX.restore();

        CTX.fillStyle = '#3730a3';
        drawFittedCanvasText(progressStatus.summary, progressX + progressW / 2, progressY + Math.round(18 * SCALE), progressW - Math.round(28 * SCALE), {
            initialSize: Math.round(19 * SCALE),
            minSize: Math.round(12 * SCALE),
            weight: 'bold'
        });
        CTX.fillStyle = '#4f46e5';
        drawFittedCanvasText(progressStatus.detail, progressX + progressW / 2, progressY + Math.round(38 * SCALE), progressW - Math.round(28 * SCALE), {
            initialSize: Math.round(16 * SCALE),
            minSize: Math.round(11 * SCALE),
            weight: 'bold'
        });
    }

    const exX = cardX + 24, exY = cardY + (progressStatus ? Math.max(168, Math.round(174 * SCALE)) : 115);
    const exW = cardW - 48;
    const exH = Math.max(150, Math.round((progressStatus ? 165 : 180) * SCALE));
    roundRect(CTX, exX, exY, exW, exH, Math.round(18 * SCALE));
    CTX.fillStyle = '#eff6ff';
    CTX.fill();

    CTX.fillStyle = '#1f2937';
    CTX.font = `${Math.round(24 * SCALE)}px Jua, sans-serif`;
    CTX.textAlign = 'left';
    fillTextWrap(CTX, STATE.problem.explanation, exX + 20, exY + 40, exW - 40, Math.round(34 * SCALE));

    const confirmY = exY + exH + Math.round(45 * SCALE);
    CTX.fillStyle = '#92400e';
    CTX.font = `bold ${Math.round(28 * SCALE)}px Jua, sans-serif`;
    CTX.fillText('해설대로 풀었나요?', exX, confirmY);

    const btnGap = Math.round(20 * SCALE);
    const ynW = Math.max(120, Math.round((exW - btnGap) / 2));
    const ynH = Math.max(56, Math.round(64 * SCALE));
    const ynY = confirmY + Math.round(20 * SCALE);

    const yes = { x: exX, y: ynY, w: ynW, h: ynH, id: 'confirm_yes' };
    const no = { x: exX + ynW + btnGap, y: ynY, w: ynW, h: ynH, id: 'confirm_no' };

    CTX.save();
    roundRect(CTX, yes.x, yes.y, yes.w, yes.h, Math.round(15 * SCALE));
    CTX.fillStyle = STATE.confirmed === true ? '#10b981' : '#ffffff';
    CTX.fill();
    CTX.strokeStyle = '#10b981';
    CTX.lineWidth = Math.max(2, Math.round(3 * SCALE));
    CTX.stroke();
    CTX.restore();

    CTX.fillStyle = STATE.confirmed === true ? '#ffffff' : '#065f46';
    CTX.font = `bold ${Math.round(26 * SCALE)}px Jua, sans-serif`;
    CTX.textAlign = 'center';
    CTX.textBaseline = 'middle';
    CTX.fillText('예', yes.x + yes.w / 2, yes.y + yes.h / 2);
    STATE.hitboxes.push(yes);

    CTX.save();
    roundRect(CTX, no.x, no.y, no.w, no.h, Math.round(15 * SCALE));
    CTX.fillStyle = STATE.confirmed === false ? '#fb923c' : '#ffffff';
    CTX.fill();
    CTX.strokeStyle = '#fb923c';
    CTX.lineWidth = Math.max(2, Math.round(3 * SCALE));
    CTX.stroke();
    CTX.restore();

    CTX.fillStyle = STATE.confirmed === false ? '#ffffff' : '#7c2d12';
    CTX.fillText('아니요', no.x + no.w / 2, no.y + no.h / 2);
    CTX.textBaseline = 'alphabetic';
    STATE.hitboxes.push(no);

    const nxW = Math.max(240, Math.min(Math.round(300 * SCALE), cardW * 0.8));
    const nxH = Math.max(60, Math.round(68 * SCALE));
    const nxX = cardX + (cardW - nxW) / 2;
    const nxY = cardY + cardH - nxH - Math.round(20 * SCALE);

    CTX.save();
    roundRect(CTX, nxX, nxY, nxW, nxH, Math.round(18 * SCALE));
    const canNext = (STATE.confirmed !== null);
    if (canNext) {
        CTX.fillStyle = '#8b5cf6';
        CTX.shadowColor = 'rgba(139, 92, 246, 0.3)';
        CTX.shadowBlur = Math.round(10 * SCALE);
    } else {
        CTX.fillStyle = '#d1d5db';
    }
    CTX.fill();
    CTX.restore();

    CTX.fillStyle = '#ffffff';
    CTX.font = `bold ${Math.round(28 * SCALE)}px Jua, sans-serif`;
    CTX.textAlign = 'center';
    CTX.textBaseline = 'middle';
    CTX.fillText(`${learnerName}야, 다음 문제로!`, nxX + nxW / 2, nxY + nxH / 2);
    CTX.textBaseline = 'alphabetic';

    STATE.hitboxes.push({ id: 'btn_next', x: nxX, y: nxY, w: nxW, h: nxH, disabled: !canNext });
}

function drawEncyclopediaCard(cx, startY, tiniping, canvasHeight) {
    // 이름으로 매칭 (baseTinipings와 encyclopedia의 ID가 다르기 때문)
    const encyclopedia = ENCYCLOPEDIA.find(e => e.name === tiniping.name);

    // 도감 데이터가 없어도 기본 카드를 표시
    const typeColors = {
        '로열': { bg: '#fce7f3', border: '#ec4899', text: '#9f1239' },
        '전설': { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
        '서포팅': { bg: '#ddd6fe', border: '#8b5cf6', text: '#5b21b6' },
        '일반': { bg: '#e0f2fe', border: '#0ea5e9', text: '#075985' }
    };

    // 유형 결정: encyclopedia > tiniping > 기본값
    const displayType = encyclopedia?.type || tiniping.type || '일반';
    const colors = typeColors[displayType] || typeColors['일반'];

    // canvasHeight 파라미터를 사용하여 H 참조 오류 해결
    const H = canvasHeight || (CANVAS.height / DPR);
    const cardW = Math.min(400, Math.round(440 * SCALE), Math.max(240, cx * 2 - Math.round(36 * SCALE)));
    const cardH = Math.max(
        Math.round(190 * SCALE),
        Math.min(Math.round(320 * SCALE), H - (startY + Math.round(100 * SCALE)))
    );
    const cardX = cx - cardW / 2;
    const cardY = startY;
    const padding = Math.round(20 * SCALE);

    CTX.save();
    roundRect(CTX, cardX, cardY, cardW, cardH, Math.round(16 * SCALE));
    CTX.fillStyle = colors.bg;
    CTX.fill();
    CTX.strokeStyle = colors.border;
    CTX.lineWidth = Math.round(4 * SCALE);
    CTX.stroke();
    CTX.restore();

    CTX.fillStyle = colors.text;
    CTX.textAlign = 'left';
    let textY = cardY + padding + 10;

    // 이름 표시
    const displayName = encyclopedia?.name || tiniping.name || '???';
    CTX.fillStyle = colors.text;
    drawFittedCanvasText(`${displayName}`, cardX + padding, textY, cardW - padding * 2 - Math.round(92 * SCALE), {
        initialSize: Math.round(28 * SCALE),
        minSize: Math.round(18 * SCALE),
        align: 'left',
        baseline: 'alphabetic',
        weight: 'bold'
    });

    // 유형 배지
    const typeBadgeX = cardX + cardW - padding - Math.round(80 * SCALE);
    CTX.save();
    roundRect(CTX, typeBadgeX, textY - Math.round(22 * SCALE), Math.round(80 * SCALE), Math.round(32 * SCALE), Math.round(16 * SCALE));
    CTX.fillStyle = colors.border;
    CTX.fill();
    CTX.restore();
    CTX.fillStyle = '#ffffff';
    drawFittedCanvasText(displayType, typeBadgeX + Math.round(40 * SCALE), textY - Math.round(4 * SCALE), Math.round(68 * SCALE), {
        initialSize: Math.round(18 * SCALE),
        minSize: Math.round(12 * SCALE),
        weight: 'bold'
    });

    textY += Math.round(45 * SCALE);
    CTX.textAlign = 'left';

    CTX.fillStyle = colors.text;
    CTX.font = `bold ${Math.round(22 * SCALE)}px Jua, sans-serif`;
    const subtitle = encyclopedia?.subtitle || tiniping.desc || '';
    if (subtitle) {
        const lines = window.CanvasText?.wrapText
            ? window.CanvasText.wrapText(CTX, `✨ ${subtitle}`, cardW - padding * 2, { maxLines: 2 })
            : [`✨ ${subtitle}`];
        lines.forEach(line => {
            CTX.fillText(line, cardX + padding, textY);
            textY += Math.round(28 * SCALE);
        });
        textY += Math.round(7 * SCALE);
    }

    CTX.strokeStyle = colors.border;
    CTX.lineWidth = Math.round(1.5 * SCALE);
    CTX.beginPath();
    CTX.moveTo(cardX + padding, textY);
    CTX.lineTo(cardX + cardW - padding, textY);
    CTX.stroke();
    textY += Math.round(25 * SCALE);

    CTX.font = `${Math.round(20 * SCALE)}px Jua, sans-serif`;
    const personality = encyclopedia?.personality || '';
    if (personality) {
        const personalityShort = personality.substring(0, 30) + (personality.length > 30 ? '...' : '');
        CTX.fillText(`🎭 ${personalityShort}`, cardX + padding, textY);
        textY += Math.round(30 * SCALE);
    }

    if (encyclopedia?.magic) {
        const magicShort = encyclopedia.magic.substring(0, 35) + (encyclopedia.magic.length > 35 ? '...' : '');
        CTX.fillText(`🪄 ${magicShort}`, cardX + padding, textY);
        textY += Math.round(30 * SCALE);
    }

    if (encyclopedia?.item) {
        CTX.fillText(`🔮 아이템: ${encyclopedia.item}`, cardX + padding, textY);
        textY += Math.round(30 * SCALE);
    }

    // 시즌 및 ID 정보 (하단 고정)
    const season = encyclopedia?.season || tiniping.season;
    const displayId = encyclopedia?.id || tiniping.id;

    CTX.fillStyle = colors.border;
    CTX.font = `bold ${Math.round(16 * SCALE)}px Jua, sans-serif`;
    if (season) {
        CTX.textAlign = 'left';
        CTX.fillText(`시즌 ${season}`, cardX + padding, cardY + cardH - Math.round(15 * SCALE));
    }
    if (displayId) {
        CTX.textAlign = 'right';
        CTX.fillText(`No. ${String(displayId).padStart(3, '0')}`, cardX + cardW - padding, cardY + cardH - Math.round(15 * SCALE));
    }

    CTX.textAlign = 'left';
    return { x: cardX, y: cardY, w: cardW, h: cardH };
}

function drawGeometryShape(ctx, shapeType, cx, cy, size) {
    ctx.save();
    ctx.strokeStyle = '#ec4899';
    ctx.fillStyle = '#fdf2f8';
    ctx.lineWidth = 3;

    switch (shapeType) {
        case 'triangle':
            ctx.beginPath();
            ctx.moveTo(cx, cy - size / 2);
            ctx.lineTo(cx - size / 2, cy + size / 2);
            ctx.lineTo(cx + size / 2, cy + size / 2);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            break;
        case 'rectangle':
        case 'square':
            ctx.beginPath();
            ctx.rect(cx - size / 2, cy - size / 3, size, size * 0.66);
            ctx.fill();
            ctx.stroke();
            break;
        case 'circle':
            ctx.beginPath();
            ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            break;
        case 'pentagon':
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                const angle = (i * 2 * Math.PI / 5) - Math.PI / 2;
                const x = cx + (size / 2) * Math.cos(angle);
                const y = cy + (size / 2) * Math.sin(angle);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            break;
        case 'hexagon':
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (i * 2 * Math.PI / 6) - Math.PI / 2;
                const x = cx + (size / 2) * Math.cos(angle);
                const y = cy + (size / 2) * Math.sin(angle);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            break;
        case 'rhombus':
            ctx.beginPath();
            ctx.moveTo(cx, cy - size / 2);
            ctx.lineTo(cx + size / 2, cy);
            ctx.lineTo(cx, cy + size / 2);
            ctx.lineTo(cx - size / 2, cy);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            break;
        default:
            ctx.beginPath();
            ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
    }
    ctx.restore();
}

function drawRuler(ctx, cx, cy, data) {
    const { length, start } = data;
    const rulerW = 280;
    const rulerH = 50;
    const scale = rulerW / 12; // 12cm 자

    ctx.save();
    ctx.translate(cx - rulerW / 2, cy);

    // 자 본체
    ctx.fillStyle = '#fef3c7';
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 2;
    ctx.fillRect(0, 0, rulerW, rulerH);
    ctx.strokeRect(0, 0, rulerW, rulerH);

    // 눈금
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.font = '12px sans-serif';

    for (let i = 0; i <= 12; i++) {
        const x = i * scale;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 15);
        ctx.stroke();
        ctx.fillText(i, x, 28);
    }

    // 물체 (연필)
    const objStart = start * scale;
    const objW = length * scale;
    const objY = -20;

    ctx.fillStyle = '#ef4444';
    roundRect(ctx, objStart, objY, objW, 10, 4);
    ctx.fill();

    ctx.restore();
}

function drawBarGraph(ctx, cx, cy, data) {
    const { items, counts } = data;
    const maxVal = 10;
    const w = 260;
    const h = 140;
    const barW = 30;
    const gap = (w - (items.length * barW)) / (items.length + 1);

    ctx.save();
    ctx.translate(cx - w / 2, cy - h / 2);

    // 축
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, h);
    ctx.lineTo(w, h);
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 눈금선
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    for (let i = 1; i <= maxVal; i++) {
        const y = h - (i / maxVal) * h;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
    }

    // 막대
    items.forEach((item, i) => {
        const val = counts[i];
        const barH = (val / maxVal) * h;
        const x = gap + i * (barW + gap);
        const y = h - barH;

        ctx.fillStyle = ['#fca5a5', '#fdba74', '#86efac', '#93c5fd'][i % 4];
        ctx.fillRect(x, y, barW, barH);

        // 항목 이름
        ctx.fillStyle = '#374151';
        ctx.textAlign = 'center';
        ctx.font = '14px Jua, sans-serif';
        ctx.fillText(item, x + barW / 2, h + 20);

        // 값 표시
        ctx.fillText(val, x + barW / 2, y - 5);
    });

    ctx.restore();
}

function drawClock(ctx, cx, cy, radius, h, m) {
    ctx.save();
    ctx.translate(cx, cy);

    // 시계 판
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 4;
    ctx.stroke();

    // 눈금 및 숫자
    ctx.fillStyle = '#1f2937';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `bold ${Math.round(radius * 0.15)}px Jua, sans-serif`;

    for (let num = 1; num <= 12; num++) {
        const ang = num * Math.PI / 6;
        ctx.rotate(ang);
        ctx.translate(0, -radius * 0.85);
        ctx.rotate(-ang);
        ctx.fillText(num.toString(), 0, 0);
        ctx.rotate(ang);
        ctx.translate(0, radius * 0.85);
        ctx.rotate(-ang);
    }

    // 시침 (hour hand)
    const hourAngle = (h % 12 + m / 60) * Math.PI / 6;
    ctx.save();
    ctx.rotate(hourAngle);
    ctx.beginPath();
    ctx.moveTo(0, 10);
    ctx.lineTo(0, -radius * 0.5);
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#ef4444'; // 빨간색
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.restore();

    // 분침 (minute hand)
    const minuteAngle = (m * Math.PI / 30);
    ctx.save();
    ctx.rotate(minuteAngle);
    ctx.beginPath();
    ctx.moveTo(0, 10);
    ctx.lineTo(0, -radius * 0.75);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#3b82f6'; // 파란색
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.restore();

    // 중심점
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#374151';
    ctx.fill();

    ctx.restore();
}

function drawTinipingImage(tgt, cx, cy, imageSize) {
    return drawTinipingPortrait(tgt, cx, cy, imageSize, { compact: false });
}

function drawCatch(ts) {
    const { W, H } = clear();
    drawBackgroundTiles(W, H, 0.1);
    const learnerName = getActiveLearnerName('친구');
    const t0 = STATE.catchStart || (STATE.catchStart = ts);
    const totalElapsed = ts - t0;

    const tgt = STATE.newTiniping;
    if (!tgt) return;

    // 3단계 애니메이션
    const stage1Duration = 1200;
    const stage2Duration = 800;
    const stage2Start = stage1Duration;
    const stage3Start = stage1Duration + stage2Duration;

    let stage = 1;
    let stageProgress = 0;

    if (totalElapsed < stage1Duration) {
        stage = 1;
        stageProgress = totalElapsed / stage1Duration;
    } else if (totalElapsed < stage3Start) {
        stage = 2;
        stageProgress = (totalElapsed - stage2Start) / stage2Duration;
    } else {
        stage = 3;
        stageProgress = 1;
    }

    const cx = W / 2;
    const baseR = Math.min(Math.round(120 * SCALE), Math.max(64, Math.round(W * 0.22)));
    let cy, imageSize;

    if (stage === 1) {
        cy = H / 2 - 20;
        const scale = 0.6 + 0.4 * stageProgress;
        imageSize = Math.min(Math.round(200 * scale * SCALE), Math.round(baseR * 1.7));

        CTX.save();
        CTX.translate(cx, cy);
        CTX.beginPath();
        CTX.arc(0, 0, baseR * scale + 10 * Math.sin(stageProgress * 8), 0, Math.PI * 2);
        CTX.fillStyle = '#ffffff';
        CTX.shadowColor = 'rgba(255,120,200,0.6)';
        CTX.shadowBlur = 30;
        CTX.fill();
        CTX.restore();

        drawTinipingImage(tgt, cx, cy, imageSize);

        CTX.fillStyle = '#9333ea';
        CTX.font = `bold ${Math.round(36 * SCALE)}px Jua, sans-serif`;
        CTX.textAlign = 'center';
        CTX.globalAlpha = stageProgress;
        CTX.fillText(`${learnerName}가 캐치 성공!`, cx, H - Math.round(120 * SCALE));
        CTX.globalAlpha = 1;

    } else if (stage === 2) {
        const startY = H / 2 - 20;
        const endY = Math.max(Math.round(120 * SCALE), Math.min(Math.round(180 * SCALE), Math.round(H * 0.22)));
        const easeProgress = 1 - Math.pow(1 - stageProgress, 3);
        cy = startY + (endY - startY) * easeProgress;
        imageSize = Math.min(Math.round(220 * SCALE), Math.round(baseR * 1.75));

        CTX.save();
        CTX.translate(cx, cy);
        CTX.beginPath();
        CTX.arc(0, 0, baseR, 0, Math.PI * 2);
        CTX.fillStyle = '#ffffff';
        CTX.shadowColor = 'rgba(255,120,200,0.6)';
        CTX.shadowBlur = 30;
        CTX.fill();
        CTX.restore();

        drawTinipingImage(tgt, cx, cy, imageSize);

    } else {
        cy = Math.max(Math.round(120 * SCALE), Math.min(Math.round(180 * SCALE), Math.round(H * 0.22)));
        imageSize = Math.min(Math.round(220 * SCALE), Math.round(baseR * 1.75));

        CTX.save();
        CTX.translate(cx, cy);
        CTX.beginPath();
        CTX.arc(0, 0, baseR, 0, Math.PI * 2);
        CTX.fillStyle = '#ffffff';
        CTX.shadowColor = 'rgba(255,120,200,0.4)';
        CTX.shadowBlur = 20;
        CTX.fill();
        CTX.restore();

        drawTinipingImage(tgt, cx, cy, imageSize);

        const card = drawEncyclopediaCard(cx, cy + baseR + Math.round(18 * SCALE), tgt, H);

        const bw = Math.max(240, Math.round(280 * SCALE));
        const bh = Math.max(56, Math.round(64 * SCALE));
        const bx = cx - bw / 2;
        const preferredButtonY = (card?.y || cy + baseR) + (card?.h || Math.round(300 * SCALE)) + Math.round(18 * SCALE);
        const by = Math.min(H - bh - Math.round(24 * SCALE), Math.max(preferredButtonY, cy + baseR + Math.round(220 * SCALE)));

        CTX.save();
        roundRect(CTX, bx, by, bw, bh, Math.round(16 * SCALE));
        const gr = CTX.createLinearGradient(bx, by, bx + bw, by + bh);
        gr.addColorStop(0, '#f472b6');
        gr.addColorStop(1, '#8b5cf6');
        CTX.fillStyle = gr;
        CTX.shadowColor = 'rgba(244, 114, 182, 0.3)';
        CTX.shadowBlur = Math.round(12 * SCALE);
        CTX.fill();
        CTX.restore();

        CTX.fillStyle = '#ffffff';
        CTX.font = `bold ${Math.round(28 * SCALE)}px Jua, sans-serif`;
        CTX.textAlign = 'center';
        CTX.textBaseline = 'middle';
        CTX.fillText('확인', bx + bw / 2, by + bh / 2);
        CTX.textBaseline = 'alphabetic';
        STATE.hitboxes.push({ id: 'btn_catch_ok', x: bx, y: by, w: bw, h: bh });
    }
}

function drawCollection() {
    const { W, H } = clear();
    drawBackgroundTiles(W, H, 0.1);
    const learnerName = getActiveLearnerName('나');

    if (!TINIPINGS || TINIPINGS.length === 0) {
        CTX.fillStyle = '#111827';
        CTX.font = `bold ${Math.round(24 * SCALE)}px Jua, sans-serif`;
        CTX.textAlign = 'center';
        CTX.fillText('티니핑 데이터를 불러오는 중이에요...', W / 2, H / 2);
        return;
    }

    const caughtCount = (STATE.caughtIds || []).length;

    const isParentReport = STATE.collectionTab === '부모 리포트';

    CTX.fillStyle = isParentReport ? '#0f766e' : '#ec4899';
    CTX.font = `bold ${Math.round(34 * SCALE)}px Jua, sans-serif`;
    CTX.textAlign = 'left';
    CTX.fillText(isParentReport ? `${learnerName}의 수리능력 리포트` : `${learnerName}의 티니핑 컬렉션`, Math.round(24 * SCALE), Math.round(50 * SCALE));

    CTX.fillStyle = '#6b7280';
    CTX.font = `bold ${Math.round(24 * SCALE)}px Jua, sans-serif`;
    CTX.fillText(isParentReport ? '어디가 잘 되고, 무엇을 다음에 할지 쉽게 보여줘요' : `수집: ${caughtCount} / ${TINIPINGS.length}`, Math.round(24 * SCALE), Math.round(80 * SCALE));

    // 닫기 버튼
    const bw = Math.max(100, Math.round(120 * SCALE));
    const bh = Math.max(46, Math.round(54 * SCALE));
    const bx = W - bw - Math.round(24 * SCALE);
    const by = Math.round(24 * SCALE);

    CTX.save();
    roundRect(CTX, bx, by, bw, bh, Math.round(12 * SCALE));
    CTX.fillStyle = '#e5e7eb';
    CTX.fill();
    CTX.restore();

    CTX.fillStyle = '#111827';
    CTX.font = `bold ${Math.round(24 * SCALE)}px Jua, sans-serif`;
    CTX.textAlign = 'center';
    CTX.textBaseline = 'middle';
    CTX.fillText('닫기', bx + bw / 2, by + bh / 2);
    CTX.textBaseline = 'alphabetic';

    STATE.hitboxes.push({ id: 'btn_close_collection', x: bx, y: by, w: bw, h: bh });

    // 탭 버튼 영역
    const tabLayout = getCollectionTabLayout(W);

    tabLayout.tabs.forEach(tabBox => {
        const tab = tabBox.label;
        const isSelected = (STATE.collectionTab || '전체') === tab;

        CTX.save();
        roundRect(CTX, tabBox.x, tabBox.y, tabBox.w, tabBox.h, Math.round(12 * SCALE));
        CTX.fillStyle = isSelected ? '#ec4899' : '#f3f4f6';
        CTX.fill();
        if (!isSelected) {
            CTX.strokeStyle = '#e5e7eb';
            CTX.lineWidth = 1.5;
            CTX.stroke();
        }
        CTX.restore();

        CTX.fillStyle = isSelected ? '#ffffff' : '#4b5563';
        drawFittedCanvasText(tab, tabBox.x + tabBox.w / 2, tabBox.y + tabBox.h / 2, tabBox.w - Math.round(10 * SCALE), {
            initialSize: Math.round(18 * SCALE),
            minSize: Math.round(12 * SCALE),
            weight: 'bold'
        });
        CTX.textBaseline = 'alphabetic';

        STATE.hitboxes.push({ id: `tab_${tab}`, x: tabBox.x, y: tabBox.y, w: tabBox.w, h: tabBox.h });
    });

    if (isParentReport) {
        drawParentReportPanel(W, H, tabLayout.y + tabLayout.height + Math.round(25 * SCALE));
        return;
    }

    // 그리드 영역
    const gridY = tabLayout.y + tabLayout.height + Math.round(25 * SCALE);
    const { gridX, cols, cellW, cellH, pad } = getCollectionGridMetrics(W, gridY);

    // 필터링된 티니핑 목록
    const targetTab = STATE.collectionTab || '전체';
    const filteredTinipings = targetTab === '전체'
        ? TINIPINGS
        : TINIPINGS.filter(t => t.domain === targetTab);

    CTX.textAlign = 'center';

    filteredTinipings.forEach((tp, i) => {
        const row = Math.floor(i / cols);
        const col = i % cols;
        const cx = gridX + col * cellW;
        const cy = gridY + row * cellH;

        const isCaught = STATE.caughtIds.includes(tp.id);

        CTX.save();
        roundRect(CTX, cx + pad, cy + pad, cellW - pad * 2, cellH - pad * 2, Math.round(12 * SCALE));
        if (isCaught) {
            CTX.fillStyle = '#ffffff';
            CTX.shadowColor = 'rgba(0,0,0,0.05)';
            CTX.shadowBlur = 5;
        } else {
            CTX.fillStyle = '#f3f4f6';
        }
        CTX.fill();
        CTX.restore();

        const imgSize = Math.min(cellW, cellH) * 0.54;
        const imgY = cy + pad * 2;

        if (isCaught && tp.imageObj) {
            drawTinipingPortrait(tp, cx + cellW / 2, imgY + imgSize / 2, imgSize, { compact: true });
        } else if (isCaught) {
            drawTinipingPortrait(tp, cx + cellW / 2, imgY + imgSize / 2, imgSize, { compact: true });
        } else {
            // 미획득 시 실루엣 또는 물음표
            CTX.fillStyle = '#d1d5db';
            CTX.beginPath();
            CTX.arc(cx + cellW / 2, imgY + imgSize / 2, imgSize / 2, 0, Math.PI * 2);
            CTX.fill();
            CTX.fillStyle = '#9ca3af';
            CTX.font = `bold ${Math.round(28 * SCALE)}px sans-serif`;
            CTX.fillText('?', cx + cellW / 2, imgY + imgSize / 2 + Math.round(10 * SCALE));
        }

        CTX.fillStyle = isCaught ? '#1f2937' : '#9ca3af';
        drawFittedCanvasText(tp.name, cx + cellW / 2, cy + cellH - pad * 2.5, cellW - pad * 2, {
            initialSize: Math.round(16 * SCALE),
            minSize: Math.round(11 * SCALE),
            weight: 'bold'
        });
    });
}

function drawParentReportPanel(W, H, startY) {
    const report = window.MathAbilityReport?.buildParentReport
        ? window.MathAbilityReport.buildParentReport({ irtState: STATE.irt })
        : null;
    const cardX = Math.round(24 * SCALE);
    const cardW = W - Math.round(48 * SCALE);
    const cardY = startY;
    const cardH = H - cardY - Math.round(28 * SCALE);

    CTX.save();
    roundRect(CTX, cardX, cardY, cardW, cardH, Math.round(18 * SCALE));
    CTX.fillStyle = '#ffffff';
    CTX.shadowColor = 'rgba(15, 118, 110, 0.12)';
    CTX.shadowBlur = Math.round(14 * SCALE);
    CTX.fill();
    CTX.restore();

    if (!report || report.summary.totalAttempts === 0) {
        CTX.fillStyle = '#111827';
        CTX.font = `bold ${Math.round(25 * SCALE)}px Jua, sans-serif`;
        CTX.textAlign = 'center';
        CTX.fillText('아직 측정할 풀이 기록이 없어요', W / 2, cardY + Math.round(80 * SCALE));
        CTX.fillStyle = '#6b7280';
        CTX.font = `${Math.round(18 * SCALE)}px Jua, sans-serif`;
        CTX.fillText('관계 사고가 필요한 문장제를 몇 문제 풀면 리포트가 만들어져요.', W / 2, cardY + Math.round(118 * SCALE));
        return;
    }

    const plain = report.parentSummary;
    const innerX = cardX + Math.round(22 * SCALE);
    const innerW = cardW - Math.round(44 * SCALE);
    let y = cardY + Math.round(24 * SCALE);

    y = drawReportOverviewGauge(innerX, y, innerW, plain.overview);
    y += Math.round(14 * SCALE);
    y = drawReportNormPosition(innerX, y, innerW, plain.normPosition);
    y += Math.round(12 * SCALE);
    drawReportScrollHint(innerX, y, innerW);
    y += Math.round(42 * SCALE);
    y = drawReportStatusCards(innerX, y, innerW, plain.statusCards || []);
    y += Math.round(16 * SCALE);

    const twoColumn = innerW >= Math.round(610 * SCALE);
    const panelGap = Math.round(14 * SCALE);
    const panelW = twoColumn ? (innerW - panelGap) / 2 : innerW;
    const panelH = twoColumn ? Math.round(286 * SCALE) : Math.round(236 * SCALE);
    const strengthH = twoColumn ? panelH : Math.round(236 * SCALE);
    const weaknessH = twoColumn ? panelH : Math.round(292 * SCALE);

    if (twoColumn) {
        drawReportSkillPanel(innerX, y, panelW, panelH, '강점', plain.strengthRows || [], '#0f766e', '아직 뚜렷한 강점 기록이 부족합니다.');
        drawReportSkillPanel(innerX + panelW + panelGap, y, panelW, panelH, '약점', plain.weaknessRows || [], '#e11d48', '아직 반복되는 약점은 뚜렷하지 않습니다.');
        y += panelH + Math.round(18 * SCALE);
    } else {
        drawReportSkillPanel(innerX, y, panelW, strengthH, '강점', plain.strengthRows || [], '#0f766e', '아직 뚜렷한 강점 기록이 부족합니다.');
        y += strengthH + Math.round(14 * SCALE);
        drawReportSkillPanel(innerX, y, panelW, weaknessH, '약점', plain.weaknessRows || [], '#e11d48', '아직 반복되는 약점은 뚜렷하지 않습니다.');
        y += weaknessH + Math.round(18 * SCALE);
    }

    y = drawReportCommentSection(innerX, y, innerW, '부모 코멘트', plain.parentComments || [report.parentNarrative]);
    y += Math.round(16 * SCALE);
    y = drawReportListSection(innerX, y, innerW, '해석할 때 주의할 점', plain.cautionItems || []);
    y += Math.round(14 * SCALE);
    drawReportListSection(innerX, y, innerW, '다음 추천 학습', report.recommendations.map(item => (
        item.replace(/^측정 품질:\s*/, '').replace(/^기록 해석:\s*/, '')
    )));
}

function drawReportNormPosition(x, y, w, norm = {}) {
    const h = Math.round(76 * SCALE);
    CTX.save();
    roundRect(CTX, x, y, w, h, Math.round(16 * SCALE));
    CTX.fillStyle = '#f8fafc';
    CTX.fill();
    CTX.strokeStyle = '#e2e8f0';
    CTX.stroke();
    CTX.restore();

    CTX.fillStyle = '#475569';
    drawFittedCanvasText(norm.title || '앱 내부 위치', x + Math.round(18 * SCALE), y + Math.round(23 * SCALE), w * 0.34, {
        initialSize: Math.round(18 * SCALE),
        minSize: Math.round(12 * SCALE),
        weight: 'bold',
        align: 'left',
        baseline: 'middle'
    });
    CTX.fillStyle = '#7c3aed';
    drawFittedCanvasText(norm.value || '참고 위치', x + Math.round(18 * SCALE), y + Math.round(51 * SCALE), w * 0.34, {
        initialSize: Math.round(24 * SCALE),
        minSize: Math.round(15 * SCALE),
        weight: 'bold',
        align: 'left',
        baseline: 'middle'
    });

    const barX = x + Math.round(w * 0.42);
    const barY = y + Math.round(23 * SCALE);
    const barW = w - Math.round(w * 0.42) - Math.round(18 * SCALE);
    const barH = Math.round(13 * SCALE);
    const percentile = Math.max(1, Math.min(99, Number(norm.percentile || 50)));
    roundRect(CTX, barX, barY, barW, barH, Math.round(7 * SCALE));
    CTX.fillStyle = '#e9d5ff';
    CTX.fill();
    roundRect(CTX, barX, barY, barW * percentile / 100, barH, Math.round(7 * SCALE));
    CTX.fillStyle = '#8b5cf6';
    CTX.fill();

    CTX.fillStyle = '#475569';
    drawFittedCanvasText(`${norm.referenceText || '앱 내부 기준'} · ${norm.band || '위치 확인 중'}`, barX, y + Math.round(54 * SCALE), barW, {
        initialSize: Math.round(16 * SCALE),
        minSize: Math.round(10 * SCALE),
        weight: 'bold',
        align: 'left',
        baseline: 'middle'
    });

    return y + h;
}

function drawReportScrollHint(x, y, w) {
    CTX.save();
    roundRect(CTX, x, y, w, Math.round(30 * SCALE), Math.round(12 * SCALE));
    CTX.fillStyle = '#fefce8';
    CTX.fill();
    CTX.strokeStyle = '#fde68a';
    CTX.stroke();
    CTX.restore();

    CTX.fillStyle = '#854d0e';
    drawFittedCanvasText('아래로 스크롤하면 부모 코멘트와 다음 추천 학습을 볼 수 있어요', x + Math.round(14 * SCALE), y + Math.round(15 * SCALE), w - Math.round(28 * SCALE), {
        initialSize: Math.round(16 * SCALE),
        minSize: Math.round(10 * SCALE),
        weight: 'bold',
        align: 'left',
        baseline: 'middle'
    });
}

function drawReportOverviewGauge(x, y, w, overview = {}) {
    const h = Math.round(150 * SCALE);
    CTX.save();
    roundRect(CTX, x, y, w, h, Math.round(18 * SCALE));
    const g = CTX.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, '#ecfeff');
    g.addColorStop(1, '#f8fafc');
    CTX.fillStyle = g;
    CTX.fill();
    CTX.strokeStyle = '#ccfbf1';
    CTX.lineWidth = 2;
    CTX.stroke();
    CTX.restore();

    const gaugeX = x + Math.round(20 * SCALE);
    const gaugeY = y + Math.round(88 * SCALE);
    const gaugeW = w - Math.round(40 * SCALE);
    const gaugeH = Math.round(18 * SCALE);
    const score = Math.max(1, Math.min(99, Number(overview.scorePercent || 1)));

    CTX.fillStyle = '#0f766e';
    CTX.font = `bold ${Math.round(20 * SCALE)}px Jua, sans-serif`;
    CTX.textAlign = 'left';
    CTX.fillText(overview.title || '전체 수준', x + Math.round(20 * SCALE), y + Math.round(32 * SCALE));

    CTX.fillStyle = '#111827';
    drawFittedCanvasText(overview.value || '관찰 중', x + Math.round(20 * SCALE), y + Math.round(64 * SCALE), w * 0.42, {
        initialSize: Math.round(31 * SCALE),
        minSize: Math.round(20 * SCALE),
        weight: 'bold',
        align: 'left',
        baseline: 'middle'
    });

    CTX.fillStyle = '#475569';
    drawFittedCanvasText(overview.confidenceText || '기록을 모으는 중', x + w - Math.round(20 * SCALE), y + Math.round(35 * SCALE), w * 0.44, {
        initialSize: Math.round(18 * SCALE),
        minSize: Math.round(12 * SCALE),
        weight: 'bold',
        align: 'right',
        baseline: 'middle'
    });

    roundRect(CTX, gaugeX, gaugeY, gaugeW, gaugeH, Math.round(9 * SCALE));
    CTX.fillStyle = '#dbeafe';
    CTX.fill();
    roundRect(CTX, gaugeX, gaugeY, gaugeW * (score / 100), gaugeH, Math.round(9 * SCALE));
    const fillG = CTX.createLinearGradient(gaugeX, gaugeY, gaugeX + gaugeW, gaugeY);
    fillG.addColorStop(0, '#14b8a6');
    fillG.addColorStop(1, '#2563eb');
    CTX.fillStyle = fillG;
    CTX.fill();

    CTX.fillStyle = '#334155';
    CTX.font = `${Math.round(18 * SCALE)}px Jua, sans-serif`;
    CTX.textAlign = 'left';
    CTX.textBaseline = 'alphabetic';
    getLines(CTX, overview.comment || '', w - Math.round(40 * SCALE)).slice(0, 2).forEach((line, index) => {
        CTX.fillText(line, x + Math.round(20 * SCALE), y + Math.round(128 * SCALE) + index * Math.round(24 * SCALE));
    });

    return y + h;
}

function drawReportStatusCards(x, y, w, cards) {
    const gap = Math.round(10 * SCALE);
    const cols = w >= Math.round(600 * SCALE) ? 4 : 2;
    const cardW = (w - gap * (cols - 1)) / cols;
    const cardH = Math.round(82 * SCALE);
    const rows = Math.ceil((cards.length || 1) / cols);

    cards.slice(0, 4).forEach((card, index) => {
        const col = index % cols;
        const row = Math.floor(index / cols);
        const cx = x + col * (cardW + gap);
        const cy = y + row * (cardH + gap);

        CTX.save();
        roundRect(CTX, cx, cy, cardW, cardH, Math.round(14 * SCALE));
        CTX.fillStyle = '#f8fafc';
        CTX.fill();
        CTX.strokeStyle = '#e2e8f0';
        CTX.stroke();
        CTX.restore();

        CTX.fillStyle = '#64748b';
        drawFittedCanvasText(card.title, cx + Math.round(14 * SCALE), cy + Math.round(21 * SCALE), cardW - Math.round(28 * SCALE), {
            initialSize: Math.round(17 * SCALE),
            minSize: Math.round(12 * SCALE),
            weight: 'bold',
            align: 'left',
            baseline: 'middle'
        });
        CTX.fillStyle = '#2563eb';
        drawFittedCanvasText(card.value, cx + Math.round(14 * SCALE), cy + Math.round(48 * SCALE), cardW - Math.round(28 * SCALE), {
            initialSize: Math.round(24 * SCALE),
            minSize: Math.round(15 * SCALE),
            weight: 'bold',
            align: 'left',
            baseline: 'middle'
        });
        CTX.fillStyle = '#475569';
        drawFittedCanvasText(card.subtitle, cx + Math.round(14 * SCALE), cy + Math.round(69 * SCALE), cardW - Math.round(28 * SCALE), {
            initialSize: Math.round(14 * SCALE),
            minSize: Math.round(10 * SCALE),
            weight: 'bold',
            align: 'left',
            baseline: 'middle'
        });
    });

    return y + rows * cardH + (rows - 1) * gap;
}

function drawReportSkillPanel(x, y, w, h, title, rows, color, emptyText) {
    CTX.save();
    roundRect(CTX, x, y, w, h, Math.round(16 * SCALE));
    CTX.fillStyle = '#ffffff';
    CTX.fill();
    CTX.strokeStyle = '#e5e7eb';
    CTX.lineWidth = 1.5;
    CTX.stroke();
    CTX.restore();

    CTX.fillStyle = color;
    CTX.font = `bold ${Math.round(24 * SCALE)}px Jua, sans-serif`;
    CTX.textAlign = 'left';
    CTX.fillText(title, x + Math.round(16 * SCALE), y + Math.round(32 * SCALE));

    const list = rows && rows.length ? rows : [];
    if (!list.length) {
        CTX.fillStyle = '#64748b';
        CTX.font = `${Math.round(18 * SCALE)}px Jua, sans-serif`;
        CTX.fillText(emptyText, x + Math.round(16 * SCALE), y + Math.round(70 * SCALE));
        return;
    }

    const maxRows = Math.min(list.length, title === '약점' ? 4 : 3);
    const rowTop = y + Math.round(50 * SCALE);
    const rowGap = Math.round(8 * SCALE);
    const rowH = Math.floor((h - Math.round(62 * SCALE) - rowGap * (maxRows - 1)) / maxRows);
    list.slice(0, maxRows).forEach((row, index) => {
        drawReportSkillBarRow(
            x + Math.round(16 * SCALE),
            rowTop + index * (rowH + rowGap),
            w - Math.round(32 * SCALE),
            rowH,
            row,
            color
        );
    });
}

function drawReportSkillBarRow(x, y, w, h, row, color) {
    CTX.fillStyle = '#111827';
    drawFittedCanvasText(row.label, x, y + Math.round(15 * SCALE), w * 0.62, {
        initialSize: Math.round(18 * SCALE),
        minSize: Math.round(12 * SCALE),
        weight: 'bold',
        align: 'left',
        baseline: 'middle'
    });

    CTX.fillStyle = '#64748b';
    drawFittedCanvasText(`정답 ${row.correctRate}% · 힌트 ${row.averageHintLevel}`, x + w, y + Math.round(15 * SCALE), w * 0.38, {
        initialSize: Math.round(13 * SCALE),
        minSize: Math.round(9 * SCALE),
        weight: 'bold',
        align: 'right',
        baseline: 'middle'
    });

    const barY = y + Math.round(30 * SCALE);
    const barH = Math.max(8, Math.round(10 * SCALE));
    roundRect(CTX, x, barY, w, barH, Math.round(5 * SCALE));
    CTX.fillStyle = '#e5e7eb';
    CTX.fill();
    roundRect(CTX, x, barY, w * Math.max(0.03, Math.min(1, (row.scorePercent || 0) / 100)), barH, Math.round(5 * SCALE));
    CTX.fillStyle = color;
    CTX.fill();

    CTX.fillStyle = '#475569';
    drawFittedCanvasText(`시도 ${row.attempts}문항 · 이해도 ${row.scorePercent}%`, x, barY + Math.round(25 * SCALE), w, {
        initialSize: Math.round(13 * SCALE),
        minSize: Math.round(9 * SCALE),
        weight: 'bold',
        align: 'left',
        baseline: 'middle'
    });
}

function drawReportCommentSection(x, y, w, title, comments) {
    const usable = (comments || []).slice(0, 4);
    const lineH = Math.round(25 * SCALE);
    CTX.font = `${Math.round(19 * SCALE)}px Jua, sans-serif`;
    let totalLines = 0;
    usable.forEach(comment => {
        totalLines += getLines(CTX, comment, w - Math.round(36 * SCALE)).slice(0, 2).length;
    });
    const h = Math.max(Math.round(120 * SCALE), Math.round(58 * SCALE) + totalLines * lineH);

    CTX.save();
    roundRect(CTX, x, y, w, h, Math.round(16 * SCALE));
    CTX.fillStyle = '#fffbeb';
    CTX.fill();
    CTX.strokeStyle = '#fde68a';
    CTX.stroke();
    CTX.restore();

    CTX.fillStyle = '#92400e';
    CTX.font = `bold ${Math.round(23 * SCALE)}px Jua, sans-serif`;
    CTX.textAlign = 'left';
    CTX.fillText(title, x + Math.round(18 * SCALE), y + Math.round(32 * SCALE));

    let cy = y + Math.round(62 * SCALE);
    CTX.fillStyle = '#374151';
    CTX.font = `${Math.round(19 * SCALE)}px Jua, sans-serif`;
    usable.forEach(comment => {
        getLines(CTX, `- ${comment}`, w - Math.round(36 * SCALE)).slice(0, 2).forEach(line => {
            CTX.fillText(line, x + Math.round(18 * SCALE), cy);
            cy += lineH;
        });
    });

    return y + h;
}

function drawReportMetricTile(x, y, w, h, title, value, subtitle, color) {
    CTX.save();
    roundRect(CTX, x, y, w, h, Math.round(14 * SCALE));
    CTX.fillStyle = '#f8fafc';
    CTX.fill();
    CTX.strokeStyle = '#e5e7eb';
    CTX.lineWidth = 1;
    CTX.stroke();
    CTX.restore();

    CTX.fillStyle = '#6b7280';
    drawFittedCanvasText(title, x + Math.round(16 * SCALE), y + Math.round(24 * SCALE), w - Math.round(32 * SCALE), {
        initialSize: Math.round(19 * SCALE),
        minSize: Math.round(14 * SCALE),
        weight: 'bold',
        align: 'left',
        baseline: 'middle'
    });
    CTX.fillStyle = color;
    drawFittedCanvasText(value, x + Math.round(16 * SCALE), y + Math.round(57 * SCALE), w - Math.round(32 * SCALE), {
        initialSize: Math.round(28 * SCALE),
        minSize: Math.round(19 * SCALE),
        weight: 'bold',
        align: 'left',
        baseline: 'middle'
    });
    CTX.fillStyle = '#4b5563';
    drawFittedCanvasText(subtitle, x + Math.round(16 * SCALE), y + h - Math.round(22 * SCALE), w - Math.round(32 * SCALE), {
        initialSize: Math.round(17 * SCALE),
        minSize: Math.round(12 * SCALE),
        weight: 'bold',
        align: 'left',
        baseline: 'middle'
    });
}

function drawReportListSection(x, y, w, title, items) {
    CTX.fillStyle = '#111827';
    CTX.font = `bold ${Math.round(24 * SCALE)}px Jua, sans-serif`;
    CTX.textAlign = 'left';
    CTX.fillText(title, x, y);
    y += Math.round(31 * SCALE);

    CTX.fillStyle = '#374151';
    CTX.font = `${Math.round(20 * SCALE)}px Jua, sans-serif`;
    const list = items && items.length ? items : ['아직 충분한 기록이 없어 더 관찰이 필요합니다.'];
    list.slice(0, 4).forEach(item => {
        getLines(CTX, `- ${item}`, w).forEach(line => {
            CTX.fillText(line, x, y);
            y += Math.round(27 * SCALE);
        });
    });
    return y;
}

function drawComplete() {
    const { W, H } = clear();
    drawBackgroundTiles(W, H, 0.1);
    const learnerName = getActiveLearnerName('친구');

    const cw = Math.min(Math.round(600 * SCALE), W - Math.round(48 * SCALE));
    const ch = Math.max(280, Math.round(320 * SCALE));
    const cx = (W - cw) / 2;
    const cy = (H - ch) / 2;

    CTX.save();
    roundRect(CTX, cx, cy, cw, ch, Math.round(24 * SCALE));
    CTX.fillStyle = '#ffffff';
    CTX.shadowColor = 'rgba(0, 0, 0, 0.1)';
    CTX.shadowBlur = Math.round(20 * SCALE);
    CTX.fill();
    CTX.restore();

    CTX.fillStyle = '#10b981';
    CTX.font = `bold ${Math.round(32 * SCALE)}px Jua, sans-serif`;
    CTX.textAlign = 'center';
    CTX.fillText(`축하해 ${learnerName}야! 100문제 완료!`, cx + cw / 2, cy + Math.round(60 * SCALE));

    CTX.fillStyle = '#111827';
    CTX.font = `${Math.round(20 * SCALE)}px Jua, sans-serif`;
    CTX.fillText(`${learnerName}의 최종 점수: ${STATE.score}점`, cx + cw / 2, cy + Math.round(110 * SCALE));
    CTX.fillText(`${learnerName}가 획득한 티니핑: ${STATE.caughtIds.length}개`, cx + cw / 2, cy + Math.round(146 * SCALE));

    const bw = Math.max(200, Math.min(Math.round(280 * SCALE), cw * 0.8));
    const bh = Math.max(50, Math.round(56 * SCALE));
    const bx = cx + (cw - bw) / 2;
    const by = cy + ch - Math.round(84 * SCALE);

    CTX.save();
    roundRect(CTX, bx, by, bw, bh, Math.round(14 * SCALE));
    CTX.fillStyle = '#ef4444';
    CTX.shadowColor = 'rgba(239, 68, 68, 0.3)';
    CTX.shadowBlur = Math.round(10 * SCALE);
    CTX.fill();
    CTX.restore();

    CTX.fillStyle = '#ffffff';
    CTX.font = `bold ${Math.round(22 * SCALE)}px Jua, sans-serif`;
    CTX.textBaseline = 'middle';
    CTX.fillText(`${learnerName}야, 처음부터 다시 도전!`, bx + bw / 2, by + bh / 2);
    CTX.textBaseline = 'alphabetic';

    STATE.hitboxes.push({ id: 'btn_reset', x: bx, y: by, w: bw, h: bh });
}

/* =========================================================================
   상태 천이 & 로직
   ========================================================================= */
function ensureProblem() {
    if (!STATE.problem) {
        STATE.problem = genProblem(STATE.difficulty);
        STATE.relationCoach = null;
    }
    ensureRelationCoachState();
}

function startAdaptiveLearning() {
    if (!getActiveLearnerId()) {
        STATE.mode = 'learnerSelect';
        return;
    }
    ensureIrtState();
    const patch = window.AdaptiveLearningFlow?.createStartPatch
        ? window.AdaptiveLearningFlow.createStartPatch(STATE)
        : {
            mode: 'quiz',
            currentCurriculum: '자연수의 곱셈과 나눗셈',
            mapSelection: { grade: null, subGrade: null, domain: null },
            problem: null,
            selected: null,
            isCorrect: null,
            confirmed: null,
            relationCoach: null,
            symbolAnswers: { square: null, circle: null, triangle: null },
            learningEntry: 'adaptive',
            lastIrtUpdate: null
        };

    Object.assign(STATE, patch);
    ensureIrtState();
    refreshItemCalibration();
    ensureProblem();
    saveState();
}

function checkAnswer() {
    if (STATE.selected == null) return;
    
    // 정답 비교 로직 개선 (공백 제거 및 숫자/단위 처리)
    const normalize = (val) => String(val).replace(/\s+/g, '').trim();
    const correct = normalize(STATE.selected) === normalize(STATE.problem.answer);

    if (STATE.problem?.type === 'relationshipCoach' && window.RelationCoach) {
        window.RelationCoach.appendAttempt(STATE.problem, STATE.relationCoach, STATE.selected, correct);
    }
    updateIrtAfterAnswer(correct);
    
    STATE.isCorrect = correct;
    STATE.mode = 'explain';
    if (correct) {
        STATE.score += 1;
        STATE.consecutiveCorrect += 1;
        const threshold = Math.floor((STATE.caughtIds.length + 1) * 3.5);
        const canCatchMore = STATE.caughtIds.length < TINIPINGS.length;

        if (STATE.score >= threshold && canCatchMore) {
            // 현재 문제의 영역에 맞는 티니핑 필터링
            let targetDomain = '수와 연산'; // 기본값
            const topic = STATE.currentCurriculum || '';

            if (topic.includes('도형') || topic.includes('측정') || topic.includes('시계') || topic.includes('길이')) targetDomain = '도형과 측정';
            else if (topic.includes('규칙') || topic.includes('수열')) targetDomain = '규칙성';
            else if (topic.includes('자료') || topic.includes('그래프') || topic.includes('표')) targetDomain = '자료와 가능성';

            // 해당 영역의 미획득 티니핑 찾기
            let avail = TINIPINGS.filter(t => !STATE.caughtIds.includes(t.id) && t.domain === targetDomain);

            // 만약 해당 영역 티니핑을 다 모았으면 다른 영역에서 찾기
            if (avail.length === 0) {
                avail = TINIPINGS.filter(t => !STATE.caughtIds.includes(t.id));
            }

            if (avail.length > 0) {
                // 랜덤 선택
                STATE.newTiniping = avail[Math.floor(Math.random() * avail.length)];
            }
        } else {
            STATE.newTiniping = null;
        }
    } else {
        STATE.consecutiveCorrect = 0;
        STATE.newTiniping = null;
    }
    saveState();
}

// 미지수 문제 정답 확인
function checkSymbolAnswer() {
    if (!STATE.problem || STATE.problem.type !== 'symbolEquation') return;

    const answers = STATE.problem.answers;
    const userAnswers = STATE.symbolAnswers;

    // 각 미지수별 정답 확인
    const squareCorrect = String(userAnswers.square) === String(answers.square.value);
    const circleCorrect = String(userAnswers.circle) === String(answers.circle.value);
    const triangleCorrect = String(userAnswers.triangle) === String(answers.triangle.value);

    const allCorrect = squareCorrect && circleCorrect && triangleCorrect;
    const correctCount = [squareCorrect, circleCorrect, triangleCorrect].filter(Boolean).length;

    // 정답 문자열 생성 (기존 시스템과 호환)
    STATE.problem.answer = `□=${answers.square.value}, ○=${answers.circle.value}, △=${answers.triangle.value}`;
    STATE.selected = `□=${userAnswers.square}, ○=${userAnswers.circle}, △=${userAnswers.triangle}`;

    STATE.isCorrect = allCorrect;
    STATE.mode = 'explain';

    if (allCorrect) {
        STATE.score += 1;
        STATE.consecutiveCorrect += 1;

        // Confetti 효과
        if (typeof confetti === 'function') {
            confetti({
                particleCount: 150,
                spread: 80,
                origin: { y: 0.6 }
            });
        }

        const threshold = Math.floor((STATE.caughtIds.length + 1) * 3.5);
        const canCatchMore = STATE.caughtIds.length < TINIPINGS.length;

        if (STATE.score >= threshold && canCatchMore) {
            let targetDomain = '수와 연산';
            let avail = TINIPINGS.filter(t => !STATE.caughtIds.includes(t.id) && t.domain === targetDomain);
            if (avail.length === 0) {
                avail = TINIPINGS.filter(t => !STATE.caughtIds.includes(t.id));
            }
            if (avail.length > 0) {
                STATE.newTiniping = avail[Math.floor(Math.random() * avail.length)];
            }
        } else {
            STATE.newTiniping = null;
        }
    } else {
        STATE.consecutiveCorrect = 0;
        STATE.newTiniping = null;

        // 부분 정답 피드백을 해설에 추가
        let feedback = `\n\n📊 결과: ${correctCount}/3 정답\n`;
        feedback += squareCorrect ? '✅ □ 정답!' : `❌ □ 오답 (정답: ${answers.square.value})`;
        feedback += '\n';
        feedback += circleCorrect ? '✅ ○ 정답!' : `❌ ○ 오답 (정답: ${answers.circle.value})`;
        feedback += '\n';
        feedback += triangleCorrect ? '✅ △ 정답!' : `❌ △ 오답 (정답: ${answers.triangle.value})`;

        STATE.problem.explanation += feedback;
    }

    saveState();
}

function afterExplainNext() {
    if (STATE.confirmed === false) {
        STATE.selected = null;
        STATE.isCorrect = null;
        STATE.confirmed = null;
        STATE.lastIrtUpdate = null;
        STATE.mode = 'quiz';
        saveState();
        return;
    }

    if (STATE.isCorrect) {
        if (STATE.difficulty < 19) STATE.difficulty += 1;
    } else {
        if (STATE.difficulty > 2) STATE.difficulty -= 1;
    }

    if (STATE.newTiniping) {
        STATE.mode = 'catch';
        STATE.catchStart = 0;
    } else {
        gotoNextQuestion();
    }
    saveState();
}

function gotoNextQuestion() {
    STATE.totalQuestions += 1;
    if (STATE.totalQuestions >= 100) {
        STATE.mode = 'complete';
        saveState();
        return;
    }
    STATE.questionIndex += 1;
    STATE.problem = genProblem(STATE.difficulty);
    STATE.selected = null;
    STATE.isCorrect = null;
    STATE.confirmed = null;
    STATE.lastIrtUpdate = null;
    // 미지수 상태 초기화
    STATE.symbolAnswers = { square: null, circle: null, triangle: null };
    STATE.relationCoach = null;
    ensureRelationCoachState();
    STATE.mode = 'quiz';
    saveState();
}

function confirmSolve(val) {
    STATE.confirmed = val;
}

function catchConfirm() {
    if (STATE.newTiniping) {
        STATE.caughtIds.push(STATE.newTiniping.id);
        saveTinipingToDB(STATE.newTiniping.id, STATE.newTiniping.name);
    }
    STATE.newTiniping = null;
    gotoNextQuestion();
}

// 힌트 버튼 그리기
function drawHintButton(x, y, size) {
    CTX.save();
    CTX.beginPath();
    CTX.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
    CTX.fillStyle = '#fef08a'; // 노란색 배경
    CTX.shadowColor = 'rgba(0,0,0,0.1)';
    CTX.shadowBlur = 5;
    CTX.fill();
    CTX.strokeStyle = '#eab308';
    CTX.lineWidth = 2;
    CTX.stroke();

    CTX.fillStyle = '#854d0e';
    CTX.font = `${Math.round(size * 0.6)}px sans-serif`;
    CTX.textAlign = 'center';
    CTX.textBaseline = 'middle';
    CTX.fillText('💡', x + size / 2, y + size / 2);
    CTX.restore();
    CTX.textBaseline = 'alphabetic'; // Reset

    STATE.hitboxes.push({ id: 'btn_hint', x, y, w: size, h: size });
}

// 힌트 팝업 그리기
function drawHintPopup(x, y, w, text) {
    if (!text) return;
    const padding = 15;
    CTX.save();
    CTX.font = `bold ${Math.round(20 * SCALE)}px Jua, sans-serif`;
    const lines = getLines(CTX, text, w - padding * 2);
    const h = lines.length * 30 + padding * 2;

    roundRect(CTX, x, y, w, h, 10);
    CTX.fillStyle = '#ffffff';
    CTX.shadowColor = 'rgba(0,0,0,0.2)';
    CTX.shadowBlur = 10;
    CTX.fill();
    CTX.strokeStyle = '#facc15';
    CTX.lineWidth = 2;
    CTX.stroke();

    CTX.fillStyle = '#854d0e';
    CTX.textAlign = 'left';
    CTX.textBaseline = 'top';
    lines.forEach((line, i) => {
        CTX.fillText(line, x + padding, y + padding + i * 30);
    });
    CTX.restore();
}

// 숫자 키패드 그리기
function drawKeypad(x, y, w, h) {
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '확인'];
    const gap = 10;
    const keyW = (w - gap * 2) / 3;
    const keyH = (h - gap * 3) / 4;

    keys.forEach((key, i) => {
        const row = Math.floor(i / 3);
        const col = i % 3;
        const kx = x + col * (keyW + gap);
        const ky = y + row * (keyH + gap);

        CTX.save();
        roundRect(CTX, kx, ky, keyW, keyH, 10);
        
        if (key === '확인') {
             CTX.fillStyle = '#10b981'; // 녹색
        } else if (key === 'C') {
             CTX.fillStyle = '#ef4444'; // 빨간색
        } else {
             CTX.fillStyle = '#ffffff';
        }
        
        CTX.shadowColor = 'rgba(0,0,0,0.1)';
        CTX.shadowBlur = 2;
        CTX.fill();
        CTX.strokeStyle = '#e5e7eb';
        CTX.stroke();

        CTX.fillStyle = (key === '확인' || key === 'C') ? '#ffffff' : '#374151';
        CTX.font = `bold ${Math.round(24 * SCALE)}px Jua, sans-serif`;
        CTX.textAlign = 'center';
        CTX.textBaseline = 'middle';
        CTX.fillText(key, kx + keyW / 2, ky + keyH / 2);
        CTX.restore();

        STATE.hitboxes.push({ id: `key_${key}`, x: kx, y: ky, w: keyW, h: keyH, value: key });
    });
}

function resetAll() {
    const profile = getActiveLearnerProfileFromState();
    if (!profile) {
        switchToLearnerSelect();
        return;
    }

    const stateKey = getLearnerStateStorageKey(profile.id);
    if (stateKey) localStorage.removeItem(stateKey);
    const attemptKey = window.LearnerProfiles?.getAttemptLogKey?.(profile.id);
    if (attemptKey) localStorage.removeItem(attemptKey);
    const relationKey = window.LearnerProfiles?.getRelationLogKey?.(profile.id);
    if (relationKey) localStorage.removeItem(relationKey);

    STATE = createBaseStateForLearner(profile);
    saveState();
}

/* =========================================================================
   입력 처리(클릭/터치)
   ========================================================================= */
function getCanvasPos(evt) {
    const rect = CANVAS.getBoundingClientRect();
    const x = (evt.clientX - rect.left);
    const y = (evt.clientY - rect.top);
    const scaleX = CANVAS.width / rect.width / DPR;
    const scaleY = CANVAS.height / rect.height / DPR;
    return { x: x * scaleX, y: y * scaleY };
}

function hit(x, y, box) {
    return x >= box.x && y >= box.y && x <= box.x + box.w && y <= box.y + box.h;
}

function onPointer(evt) {
    const { x, y } = getCanvasPos(evt);
    for (const b of STATE.hitboxes) {
        if (hit(x, y, b)) {
            if (b.disabled) return;
            switch (b.id) {
                case 'btn_map_home':
                    STATE.mapSelection = { grade: null, subGrade: null, domain: null };
                    break;
                case 'btn_start_game':
                    startAdaptiveLearning();
                    break;
                case 'btn_adaptive_start':
                    startAdaptiveLearning();
                    break;
                case 'btn_switch_learner':
                    switchToLearnerSelect();
                    break;
                case 'btn_collection':
                    STATE.mode = 'collection';
                    break;
                case 'btn_close_collection':
                    STATE.mode = STATE.problem ? 'quiz' : 'map';
                    break;
                case 'btn_check':
                    checkAnswer();
                    break;
                case 'btn_next':
                    afterExplainNext();
                    break;
                case 'confirm_yes':
                    confirmSolve(true);
                    break;
                case 'confirm_no':
                    confirmSolve(false);
                    break;
                case 'btn_catch_ok':
                    catchConfirm();
                    break;
                case 'btn_reset':
                    resetAll();
                    break;
                case 'btn_hint':
                    STATE.showHint = !STATE.showHint;
                    break;
                case 'btn_coach_hint':
                    ensureRelationCoachState();
                    if (STATE.relationCoach) {
                        STATE.relationCoach.guideActive = true;
                        STATE.relationCoach.hintLevel = Math.min(7, (STATE.relationCoach.hintLevel || 0) + 1);
                    }
                    saveState();
                    break;
                case 'btn_open_coach':
                    ensureRelationCoachState();
                    if (STATE.relationCoach) {
                        STATE.relationCoach.guideActive = true;
                        STATE.selected = null;
                    }
                    saveState();
                    break;
                case 'btn_coach_next':
                    ensureRelationCoachState();
                    if (STATE.problem?.type === 'relationshipCoach' && STATE.relationCoach && window.RelationCoach) {
                        const step = window.RelationCoach.getCurrentStep(STATE.problem, STATE.relationCoach);
                        const selected = STATE.relationCoach.selections?.[step?.id];
                        const result = window.RelationCoach.evaluateStep(STATE.problem, step, selected);
                        STATE.relationCoach.feedback = result.feedback;
                        if (result.correct) {
                            STATE.relationCoach.stepIndex += 1;
                        } else if (result.errorType) {
                            STATE.relationCoach.errors.push(result.errorType);
                            STATE.relationCoach.hintLevel = Math.min(7, Math.max(STATE.relationCoach.hintLevel || 0, 2));
                        }
                    }
                    saveState();
                    break;
                default:
                    if (b.id.startsWith('learner_')) {
                        selectLearner(b.id.replace('learner_', ''));
                    } else if (b.id.startsWith('key_')) {
                        const val = b.value;
                        if (val === 'C') {
                            STATE.quizInput = '';
                        } else if (val === '확인') {
                            STATE.selected = STATE.quizInput;
                            checkAnswer();
                        } else {
                            if (!STATE.quizInput) STATE.quizInput = '';
                            if (STATE.quizInput.length < 10) {
                                STATE.quizInput += val;
                            }
                        }
                    } else if (b.id.startsWith('grade_')) {
                        STATE.mapSelection.grade = b.id.replace('grade_', '');
                    } else if (b.id.startsWith('subgrade_')) {
                        STATE.mapSelection.subGrade = b.id.replace('subgrade_', '');
                    } else if (b.id.startsWith('topic_')) {
                        const topic = b.id.replace('topic_', '');
                        console.log('선택된 토픽:', topic);
                        STATE.currentCurriculum = topic;
                        STATE.mode = 'quiz';
                        STATE.questionIndex = 0;
                        STATE.score = 0;
                        STATE.caughtIds = [];
                        // 미지수 상태 초기화
                        STATE.symbolAnswers = { square: null, circle: null, triangle: null };
                        STATE.problem = null;
                        STATE.selected = null;
                        STATE.relationCoach = null;
                        if (shouldUseRelationThinkingProblem(topic)) ensureIrtState();
                        ensureProblem();
                    } else if (b.id.startsWith('coach_opt_')) {
                        ensureRelationCoachState();
                        const step = window.RelationCoach?.getCurrentStep(STATE.problem, STATE.relationCoach);
                        if (STATE.relationCoach && step) {
                            STATE.relationCoach.selections[step.id] = b.value;
                            STATE.relationCoach.feedback = '';
                            saveState();
                        }
                    } else if (b.id.startsWith('opt_')) {
                        STATE.selected = b.value;
                    } else if (b.id.startsWith('symbol_')) {
                        // 미지수 문제 선택지 클릭
                        if (b.symbolKey && b.value !== undefined) {
                            STATE.symbolAnswers[b.symbolKey] = b.value;
                        }
                    } else if (b.id === 'btn_check_symbol') {
                        // 미지수 문제 정답 확인
                        checkSymbolAnswer();
                    } else if (b.id.startsWith('tab_')) {
                        STATE.collectionTab = b.id.replace('tab_', '');
                    }
            }
            break;
        }
    }
}

function onTouch(evt) {
    evt.preventDefault();
    if (evt.type === 'touchend' && evt.changedTouches.length > 0) {
        const touch = evt.changedTouches[0];
        const fakeEvt = { clientX: touch.clientX, clientY: touch.clientY };
        onPointer(fakeEvt);
    }
}

CANVAS.addEventListener('click', onPointer);
CANVAS.addEventListener('touchend', onTouch);

/* =========================================================================
   게임 루프
   ========================================================================= */
let lastMode = null;

function frame(ts) {
    setHiDPI();

    if (lastMode !== STATE.mode) {
        window.scrollTo(0, 0);
        lastMode = STATE.mode;
    }

    if (!STATE.problem && STATE.mode === 'quiz') ensureProblem();

    if (STATE.mode === 'learnerSelect') drawLearnerSelect();
    else if (STATE.mode === 'home') drawHome();
    else if (STATE.mode === 'map') drawMap();
    else if (STATE.mode === 'quiz') drawQuiz();
    else if (STATE.mode === 'explain') drawExplain();
    else if (STATE.mode === 'catch') drawCatch(ts);
    else if (STATE.mode === 'collection') drawCollection();
    else if (STATE.mode === 'complete') drawComplete();

    requestAnimationFrame(frame);
}

/* =========================================================================
   초기화
   ========================================================================= */
window.selectLearner = selectLearner;
window.switchToLearnerSelect = switchToLearnerSelect;
globalThis.selectLearner = selectLearner;
globalThis.switchToLearnerSelect = switchToLearnerSelect;

loadState();

Promise.all([
    document.fonts.ready,
    loadTinipingImages(),
    loadCurriculumData(),
    window.ExpandedWordProblemBank?.load?.() || Promise.resolve({ ok: false, reason: 'expanded_bank_unavailable' })
]).then(() => {
    console.log('모든 리소스 로드 완료');
    refreshItemCalibration();
    loadEncyclopedia();
    window.scrollTo(0, 0);
    requestAnimationFrame(frame);
}).catch(err => {
    console.error('초기화 실패:', err);
    window.scrollTo(0, 0);
    requestAnimationFrame(frame);
});
