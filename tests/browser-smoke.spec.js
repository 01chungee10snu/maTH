const { test, expect } = require('@playwright/test');

test('map and relationship coach smoke test', async ({ page }) => {
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
      && TINIPINGS.length > 0;
  });

  const supabaseConfig = await page.evaluate(() => ({
    configured: window.MathAppSupabase?.isConfigured(),
    url: window.MathAppSupabase?.getConfig().url,
    keyPrefix: window.MathAppSupabase?.getConfig().publishableKey.slice(0, 15)
  }));

  expect(supabaseConfig.configured).toBe(true);
  expect(supabaseConfig.url).toBe('https://gegwjdcxcarmopiaknwj.supabase.co');
  expect(supabaseConfig.keyPrefix).toBe('sb_publishable_');

  const highSchoolMap = await page.evaluate(() => {
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
        disabledTopics: STATE.hitboxes.filter(box => box.disabled).length
      };
    } catch (error) {
      return { ok: false, message: error.message };
    }
  });

  expect(highSchoolMap.ok).toBe(true);
  expect(highSchoolMap.hitboxes).toBeGreaterThan(0);
  expect(highSchoolMap.disabledTopics).toBeGreaterThan(0);

  const relationCoach = await page.evaluate(() => {
    startRelationCoachMode();
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
      answerOptions: STATE.problem.options.length,
      optionHitboxes: STATE.hitboxes.filter(box => box.id.startsWith('opt_')).length,
      thetaBefore,
      thetaAfter: STATE.irt.theta,
      irtAttempts: STATE.irt.attemptCount
    };
  });

  expect(relationCoach.ok).toBe(true);
  expect(relationCoach.type).toBe('relationshipCoach');
  expect(relationCoach.answerOptions).toBe(4);
  expect(relationCoach.optionHitboxes).toBe(4);
  expect(relationCoach.irtAttempts).toBeGreaterThan(0);
  expect(relationCoach.thetaAfter).toBeGreaterThan(relationCoach.thetaBefore);

  const visibleError = await page.locator('#err').evaluate(el => ({
    text: el.textContent,
    display: getComputedStyle(el).display
  }));
  expect(visibleError.display).toBe('none');
  expect(consoleErrors.filter(text => !text.includes('Failed to load resource')).join('\n')).toBe('');
});
