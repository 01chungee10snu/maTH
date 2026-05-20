const { test, expect } = require('@playwright/test');

test('map and elementary relation thinking smoke test', async ({ page }) => {
  test.setTimeout(60000);
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  await page.goto(process.env.APP_URL || 'http://127.0.0.1:8791/', {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  });
  await page.waitForFunction(() => {
    return typeof STATE !== 'undefined'
      && typeof CURRICULUM_DATA !== 'undefined'
      && !!CURRICULUM_DATA
      && typeof TINIPINGS !== 'undefined'
      && TINIPINGS.length > 0
      && typeof RelationshipCoachProblems !== 'undefined'
      && RelationshipCoachProblems.bank.length >= 1000;
  });

  const supabaseConfig = await page.evaluate(() => ({
    configured: window.MathAppSupabase?.isConfigured(),
    url: window.MathAppSupabase?.getConfig().url,
    keyPrefix: window.MathAppSupabase?.getConfig().publishableKey.slice(0, 15),
    hasIrtSync: typeof window.IrtSync?.syncPendingAttempts === 'function',
    hasLearningPolicy: typeof window.IrtLearningPolicy?.selectNextItem === 'function'
  }));

  expect(supabaseConfig.configured).toBe(true);
  expect(supabaseConfig.url).toBe('https://gegwjdcxcarmopiaknwj.supabase.co');
  expect(supabaseConfig.keyPrefix).toBe('sb_publishable_');
  expect(supabaseConfig.hasIrtSync).toBe(true);
  expect(supabaseConfig.hasLearningPolicy).toBe(true);

  const runtimeBank = await page.evaluate(() => ({
    itemCount: RelationshipCoachProblems.bank.length,
    expandedCount: RelationshipCoachProblems.bank.filter(item => item.source === 'elementary_seed_bank').length,
    hasExpandedLoader: typeof ExpandedWordProblemBank?.load === 'function',
    loadedTinipingImages: TINIPINGS.filter(item => item.imageStatus === 'loaded' && item.imageObj).length,
    placeholderTinipingImages: TINIPINGS.filter(item => item.imageStatus === 'placeholder').length
  }));

  expect(runtimeBank.itemCount).toBeGreaterThanOrEqual(1050);
  expect(runtimeBank.expandedCount).toBeGreaterThanOrEqual(1000);
  expect(runtimeBank.hasExpandedLoader).toBe(true);
  expect(runtimeBank.loadedTinipingImages).toBeGreaterThanOrEqual(140);
  expect(runtimeBank.placeholderTinipingImages).toBeLessThanOrEqual(8);

  const topLevelMap = await page.evaluate(() => {
    STATE.mode = 'map';
    STATE.mapSelection = { grade: null, subGrade: null, domain: null };
    lastCssW = null;
    lastCssH = null;
    setHiDPI();
    drawMap();
    return {
      gradeButtons: STATE.hitboxes.filter(box => box.id.startsWith('grade_')).length,
      hasAdaptiveStartButton: STATE.hitboxes.some(box => box.id === 'btn_adaptive_start'),
      hasCollectionButton: STATE.hitboxes.some(box => box.id === 'btn_collection'),
      hasMapHomeButton: STATE.hitboxes.some(box => box.id === 'btn_map_home'),
      hasSeparateRelationCoachButton: STATE.hitboxes.some(box => box.id === 'btn_relation_coach')
    };
  });

  expect(topLevelMap.gradeButtons).toBe(0);
  expect(topLevelMap.hasAdaptiveStartButton).toBe(true);
  expect(topLevelMap.hasCollectionButton).toBe(true);
  expect(topLevelMap.hasMapHomeButton).toBe(false);
  expect(topLevelMap.hasSeparateRelationCoachButton).toBe(false);

  const adaptiveStart = await page.evaluate(() => {
    localStorage.removeItem('taehee-irt-attempt-log');
    STATE.mode = 'map';
    STATE.mapSelection = { grade: null, subGrade: null, domain: null };
    STATE.currentCurriculum = 'division';
    STATE.problem = null;
    STATE.selected = null;
    STATE.relationCoach = null;
    startAdaptiveLearning();
    return {
      mode: STATE.mode,
      learningEntry: STATE.learningEntry,
      topic: STATE.currentCurriculum,
      type: STATE.problem?.type,
      learningPhase: STATE.problem?.selection_policy?.phase,
      hasIrtState: Boolean(STATE.irt),
      mapGrade: STATE.mapSelection.grade
    };
  });

  expect(adaptiveStart.mode).toBe('quiz');
  expect(adaptiveStart.learningEntry).toBe('adaptive');
  expect(adaptiveStart.topic).toBe('자연수의 곱셈과 나눗셈');
  expect(adaptiveStart.type).toBe('relationshipCoach');
  expect(adaptiveStart.learningPhase).toBe('diagnostic');
  expect(adaptiveStart.hasIrtState).toBe(true);
  expect(adaptiveStart.mapGrade).toBe(null);

  const repeatedStartup = await page.evaluate(() => {
    localStorage.removeItem('taehee-irt-attempt-log');
    STATE.irt = IrtEngine.createInitialState('relationship_math', {
      learnerSeed: 'browser-repeat-seed',
      dailySeed: '2026-05-21'
    });
    STATE.learningEntry = null;
    STATE.problem = null;
    STATE.selected = null;
    STATE.relationCoach = null;
    startAdaptiveLearning();
    const firstId = STATE.problem?.problem_id;
    const attemptsAfterFirstPresentation = STATE.irt?.attemptCount;
    startAdaptiveLearning();
    const secondId = STATE.problem?.problem_id;
    return {
      firstId,
      secondId,
      attemptsAfterFirstPresentation,
      presented: STATE.irt?.presentedItemIds || []
    };
  });

  expect(repeatedStartup.firstId).toBeTruthy();
  expect(repeatedStartup.secondId).toBeTruthy();
  expect(repeatedStartup.secondId).not.toBe(repeatedStartup.firstId);
  expect(repeatedStartup.attemptsAfterFirstPresentation).toBe(0);
  expect(repeatedStartup.presented).toContain(repeatedStartup.firstId);

  const staleSchoolSelectionMap = await page.evaluate(() => {
    STATE.mode = 'map';
    STATE.mapSelection = { grade: 'high_school', subGrade: '공통과목', domain: null };
    lastCssW = null;
    lastCssH = null;
    setHiDPI();
    try {
      drawMap();
      return {
        ok: true,
        hitboxes: STATE.hitboxes.length,
        gradeButtons: STATE.hitboxes.filter(box => box.id.startsWith('grade_')).length,
        topicButtons: STATE.hitboxes.filter(box => box.id.startsWith('topic_')).length,
        hasAdaptiveStartButton: STATE.hitboxes.some(box => box.id === 'btn_adaptive_start')
      };
    } catch (error) {
      return { ok: false, message: error.message };
    }
  });

  expect(staleSchoolSelectionMap.ok).toBe(true);
  expect(staleSchoolSelectionMap.hitboxes).toBeGreaterThan(0);
  expect(staleSchoolSelectionMap.gradeButtons).toBe(0);
  expect(staleSchoolSelectionMap.topicButtons).toBe(0);
  expect(staleSchoolSelectionMap.hasAdaptiveStartButton).toBe(true);

  const relationCoach = await page.evaluate(() => {
    localStorage.removeItem('taehee-irt-attempt-log');
    STATE.currentCurriculum = '자연수의 곱셈과 나눗셈';
    STATE.mode = 'quiz';
    STATE.questionIndex = 0;
    STATE.problem = null;
    STATE.selected = null;
    STATE.relationCoach = null;
    ensureProblem();
    const thetaBefore = STATE.irt?.theta ?? 0;

    while (RelationCoach.getCurrentStep(STATE.problem, STATE.relationCoach)) {
      const step = RelationCoach.getCurrentStep(STATE.problem, STATE.relationCoach);
      STATE.relationCoach.selections[step.id] = step.answer;
      const result = RelationCoach.evaluateStep(STATE.problem, step, step.answer);
      if (!result.correct) return { ok: false, message: `step failed: ${step.id}` };
      STATE.relationCoach.stepIndex += 1;
    }

    drawQuiz();
    STATE.selected = STATE.problem.answer;
    checkAnswer();

    return {
      ok: true,
      type: STATE.problem.type,
      topic: STATE.currentCurriculum,
      problemId: STATE.problem.problem_id,
      answerOptions: STATE.problem.options.length,
      optionHitboxes: STATE.hitboxes.filter(box => box.id.startsWith('opt_')).length,
      thetaBefore,
      thetaAfter: STATE.irt.theta,
      irtAttempts: STATE.irt.attemptCount,
      pendingLogs: IrtLog.getPendingAttempts().length,
      latestLog: IrtLog.getPendingAttempts().slice(-1)[0]
    };
  });

  expect(relationCoach.ok).toBe(true);
  expect(relationCoach.type).toBe('relationshipCoach');
  expect(relationCoach.topic).toBe('자연수의 곱셈과 나눗셈');
  expect(relationCoach.answerOptions).toBe(4);
  expect(relationCoach.optionHitboxes).toBe(4);
  expect(relationCoach.irtAttempts).toBeGreaterThan(0);
  expect(relationCoach.thetaAfter).toBeGreaterThan(relationCoach.thetaBefore);
  expect(relationCoach.pendingLogs).toBe(1);
  expect(relationCoach.latestLog.item_id).toBe(relationCoach.problemId);
  expect(relationCoach.latestLog.sync_status).toBe('pending');
  expect(relationCoach.latestLog.correct).toBe(true);
  expect(relationCoach.latestLog.learning_phase).toBeTruthy();

  const parentReport = await page.evaluate(() => {
    STATE.mode = 'collection';
    STATE.collectionTab = '부모 리포트';
    lastCssW = null;
    lastCssH = null;
    setHiDPI();
    drawCollection();
    const report = MathAbilityReport.buildParentReport({ irtState: STATE.irt });
    return {
      hasParentReportTab: STATE.hitboxes.some(box => box.id === 'tab_부모 리포트'),
      totalAttempts: report.summary.totalAttempts,
      confidenceLabel: report.measurement.confidenceLabel,
      reliabilityLevel: report.quality.reliability.level,
      validityGaps: report.quality.validity.gaps.length,
      recommendations: report.recommendations.length
    };
  });

  expect(parentReport.hasParentReportTab).toBe(true);
  expect(parentReport.totalAttempts).toBe(1);
  expect(parentReport.confidenceLabel).toBe('데이터 부족');
  expect(parentReport.reliabilityLevel).toBe('관찰 단계');
  expect(parentReport.validityGaps).toBeGreaterThan(0);
  expect(parentReport.recommendations).toBeGreaterThan(0);

  await page.setViewportSize({ width: 390, height: 844 });
  const mobileCollection = await page.evaluate(() => {
    STATE.mode = 'collection';
    STATE.collectionTab = '전체';
    STATE.caughtIds = TINIPINGS.slice(0, 18).map(item => item.id);
    lastCssW = null;
    lastCssH = null;
    setHiDPI();
    drawCollection();
    const tabs = STATE.hitboxes.filter(box => box.id.startsWith('tab_'));
    return {
      canvasWidth: CANVAS.width / DPR,
      canvasHeight: CANVAS.height / DPR,
      tabRows: new Set(tabs.map(box => Math.round(box.y))).size,
      minTabWidth: Math.min(...tabs.map(box => box.w)),
      loadedImages: TINIPINGS.filter(item => item.imageStatus === 'loaded' && item.imageObj).length
    };
  });

  expect(mobileCollection.canvasWidth).toBeLessThanOrEqual(390);
  expect(mobileCollection.canvasHeight).toBeGreaterThan(844);
  expect(mobileCollection.tabRows).toBeGreaterThanOrEqual(2);
  expect(mobileCollection.minTabWidth).toBeGreaterThanOrEqual(80);
  expect(mobileCollection.loadedImages).toBeGreaterThanOrEqual(140);

  const visibleError = await page.locator('#err').evaluate(el => ({
    text: el.textContent,
    display: getComputedStyle(el).display
  }));
  expect(visibleError.display).toBe('none');
  expect(consoleErrors.filter(text => !text.includes('Failed to load resource')).join('\n')).toBe('');
});
