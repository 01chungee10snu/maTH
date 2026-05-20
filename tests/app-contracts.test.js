const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');

function runScript(context, relativePath) {
  const source = fs.readFileSync(path.join(root, relativePath), 'utf8');
  vm.runInNewContext(source, context, { filename: relativePath });
}

function createContext() {
  const context = {
    console,
    window: {},
    Math,
    Date,
  };
  context.globalThis = context;
  return context;
}

function createStorageContext() {
  const context = createContext();
  const store = {};
  const localStorage = {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
    },
    setItem(key, value) {
      store[key] = String(value);
    },
    removeItem(key) {
      delete store[key];
    }
  };
  context.localStorage = localStorage;
  context.window.localStorage = localStorage;
  return context;
}

function createConfigContext() {
  const context = createContext();
  context.window.devicePixelRatio = 1;
  context.performance = { now: () => 0 };
  context.document = {
    getElementById(id) {
      if (id === 'app') {
        return {
          getContext: () => ({})
        };
      }
      if (id === 'err') {
        return {
          setAttribute() {}
        };
      }
      return null;
    }
  };
  return context;
}

function testSupabasePublicConfigContract() {
  const context = createConfigContext();

  assert.ok(
    fs.existsSync(path.join(root, 'js/supabasePublicConfig.js')),
    'js/supabasePublicConfig.js must hold the public Supabase project config'
  );

  runScript(context, 'js/supabasePublicConfig.js');
  runScript(context, 'js/config.js');
  vm.runInNewContext(
    'globalThis.__supabaseConfigForTest = { url: SUPABASE_URL, key: SUPABASE_KEY, enabled: SUPABASE_CONFIG.enabled };',
    context
  );

  assert.strictEqual(context.window.MATH_APP_SUPABASE.url, 'https://gegwjdcxcarmopiaknwj.supabase.co');
  assert.strictEqual(context.window.MATH_APP_SUPABASE.publishableKey, 'sb_publishable_jRV8luDjS0JB46ZSDT3-6g_HXM-SUtM');
  assert.strictEqual(context.__supabaseConfigForTest.url, context.window.MATH_APP_SUPABASE.url);
  assert.strictEqual(context.__supabaseConfigForTest.key, context.window.MATH_APP_SUPABASE.publishableKey);
  assert.strictEqual(context.__supabaseConfigForTest.enabled, true);
}

function testSupabaseClientUsesPublicConfig() {
  const context = createConfigContext();
  context.window.supabase = {
    createClient(url, key, options) {
      return { url, key, options };
    }
  };

  runScript(context, 'js/supabasePublicConfig.js');
  runScript(context, 'js/config.js');
  runScript(context, 'js/supabase.js');
  vm.runInNewContext(
    'globalThis.__supabaseClientForTest = getSupabaseClient(); globalThis.__supabaseEnabledForTest = isSupabaseConfigured();',
    context
  );

  assert.strictEqual(context.__supabaseEnabledForTest, true);
  assert.strictEqual(context.__supabaseClientForTest.url, 'https://gegwjdcxcarmopiaknwj.supabase.co');
  assert.strictEqual(context.__supabaseClientForTest.key, 'sb_publishable_jRV8luDjS0JB46ZSDT3-6g_HXM-SUtM');
  assert.strictEqual(context.__supabaseClientForTest.options.auth.persistSession, true);
}

function testCurriculumTopicSections() {
  const context = createContext();
  runScript(context, 'js/curriculum.js');

  assert.strictEqual(typeof context.getCurriculumTopicSections, 'function');

  const curriculum = JSON.parse(fs.readFileSync(path.join(root, 'js/curriculum_standard_2022.json'), 'utf8'));
  const sections = context.getCurriculumTopicSections(curriculum.high_school['공통과목']);

  assert.strictEqual(sections.map(section => section.title).join('|'), '공통수학1|공통수학2');
  assert.ok(sections[0].topics.includes('다항식의 연산'));
  assert.ok(sections[1].topics.includes('도형의 이동'));
}

function testProblemOptionsStayUniqueAndComplete() {
  const context = createContext();
  runScript(context, 'js/problems/problemBase.js');

  const shortResult = context.window.ProblemBase.createProblemResult(
    '곱셈 문제',
    6,
    '2 x 3 = 6',
    [4, 2],
    'multiplication',
    2
  );

  assert.strictEqual(shortResult.options.length, 4);
  assert.strictEqual(new Set(shortResult.options).size, 4);
  assert.ok(shortResult.options.includes('6'));

  const duplicateUnitResult = context.window.ProblemBase.createProblemResult(
    '시간 문제',
    '13시',
    '12시에 1시간을 더하면 13시입니다.',
    ['12시', '12시', '14시'],
    'measurement',
    10
  );

  assert.strictEqual(duplicateUnitResult.options.length, 4);
  assert.strictEqual(new Set(duplicateUnitResult.options).size, 4);
  assert.ok(duplicateUnitResult.options.includes('13시'));
}

function testRelationshipCoachProblemContract() {
  const context = createContext();
  runScript(context, 'js/problems/problemBase.js');
  runScript(context, 'js/problems/relationshipCoachProblems.js');
  runScript(context, 'js/relationCoach.js');

  assert.strictEqual(typeof context.window.RelationshipCoachProblems.generate, 'function');

  const problem = context.window.RelationshipCoachProblems.generate(4);
  assert.strictEqual(problem.type, 'relationshipCoach');
  assert.ok(problem.relationCoach);
  assert.ok(Array.isArray(problem.problem_types));
  assert.ok(problem.problem_types.length > 0);
  assert.ok(Array.isArray(problem.coachSteps));
  assert.ok(problem.coachSteps.some(step => step.id === 'base'));
  assert.ok(problem.coachSteps.some(step => step.id === 'direction'));
  assert.ok(problem.options.includes(problem.answer));

  const state = context.window.RelationCoach.createState(problem);
  const firstStep = context.window.RelationCoach.getCurrentStep(problem, state);
  const result = context.window.RelationCoach.evaluateStep(problem, firstStep, firstStep.answer);

  assert.strictEqual(result.correct, true);
}

function testRelationThinkingTopicsAreElementaryIntegrated() {
  const context = createContext();
  runScript(context, 'js/relationCurriculum.js');

  assert.strictEqual(typeof context.window.RelationCurriculum.isRelationThinkingTopic, 'function');
  assert.strictEqual(context.window.RelationCurriculum.isRelationThinkingTopic('자연수의 곱셈과 나눗셈'), true);
  assert.strictEqual(context.window.RelationCurriculum.isRelationThinkingTopic('분수의 곱셈과 나눗셈'), true);
  assert.strictEqual(context.window.RelationCurriculum.isRelationThinkingTopic('들이와 무게'), true);
  assert.strictEqual(context.window.RelationCurriculum.isRelationThinkingTopic('비와 비율'), true);
  assert.strictEqual(context.window.RelationCurriculum.isRelationThinkingTopic('네 자리 이하의 수'), false);
  assert.strictEqual(context.window.RelationCurriculum.isRelationThinkingTopic('평면도형의 모양'), false);

  const filtered = context.window.RelationCurriculum.filterItemsForTopic([
    { problem_id: 'division', skill_tags: ['EQUAL_SHARING'] },
    { problem_id: 'fraction', skill_tags: ['FRACTION_RELATION'] },
    { problem_id: 'rank', skill_tags: ['RANKING'] }
  ], '분수의 곱셈과 나눗셈');

  assert.strictEqual(filtered.map(item => item.problem_id).join('|'), 'fraction');
}

function testElementaryWordProblemSeedBankContract() {
  const bankPath = path.join(root, 'data/elementary_word_problem_seed_bank.json');
  assert.ok(fs.existsSync(bankPath), 'elementary word problem seed bank must exist');

  const bank = JSON.parse(fs.readFileSync(bankPath, 'utf8'));
  assert.strictEqual(bank.metadata.scope, 'elementary_school_only');
  assert.strictEqual(bank.metadata.item_count, bank.items.length);
  assert.ok(bank.items.length >= 1000);
  assert.ok(bank.metadata.family_count >= 50);
  assert.strictEqual(bank.metadata.difficulty_scale, '1-12');

  const validGradeBands = new Set(['G1_G2', 'G3_G4', 'G5_G6']);
  const ids = new Set();
  const counts = new Map();
  const familySet = new Set();
  const difficultySet = new Set();

  for (const item of bank.items) {
    assert.ok(item.id);
    assert.ok(!ids.has(item.id), `duplicate seed id: ${item.id}`);
    ids.add(item.id);
    assert.ok(validGradeBands.has(item.grade_band), `${item.id} must stay elementary-only`);
    assert.ok(item.topic);
    assert.ok(item.type);
    assert.ok(item.type_family);
    assert.ok(Array.isArray(item.skill_tags) && item.skill_tags.length > 0);
    assert.ok(Number.isInteger(item.difficulty));
    assert.ok(item.difficulty >= 1 && item.difficulty <= 12);
    assert.ok(item.level_label);
    assert.ok(item.problem.length >= 20);
    assert.ok(item.answer);
    assert.ok(item.solution);
    counts.set(item.grade_band, (counts.get(item.grade_band) || 0) + 1);
    familySet.add(item.type_family);
    difficultySet.add(item.difficulty);
  }

  for (const gradeBand of validGradeBands) {
    assert.ok((counts.get(gradeBand) || 0) >= 200, `${gradeBand} needs at least 200 seed items`);
  }

  assert.ok(familySet.size >= 50);
  for (let difficulty = 1; difficulty <= 12; difficulty += 1) {
    assert.ok(difficultySet.has(difficulty), `difficulty ${difficulty} needs seed items`);
  }
}

function testIrtEngineUpdatesLearnerStateAndSelectsItems() {
  const context = createContext();
  runScript(context, 'js/irtEngine.js');

  assert.strictEqual(typeof context.window.IrtEngine.createInitialState, 'function');

  const initial = context.window.IrtEngine.createInitialState('relationship_math');
  const easy = {
    problem_id: 'easy',
    irt: { b: -1.1 },
    skill_tags: ['UNIT_COMPARE'],
    problem_types: ['UNIT_COMPARE']
  };
  const target = {
    problem_id: 'target',
    irt: { b: 0.05 },
    skill_tags: ['INVERSE_RELATION'],
    problem_types: ['INVERSE_RELATION']
  };
  const hard = {
    problem_id: 'hard',
    irt: { b: 1.8 },
    skill_tags: ['PROPORTION'],
    problem_types: ['PROPORTION']
  };

  const selected = context.window.IrtEngine.selectNextItem([easy, target, hard], initial);
  assert.strictEqual(selected.problem_id, 'target');

  const updatedCorrect = context.window.IrtEngine.updateState(initial, target, {
    correct: true,
    hintLevel: 0,
    stepSuccessRate: 1
  });
  assert.ok(updatedCorrect.theta > initial.theta);
  assert.strictEqual(updatedCorrect.attemptCount, 1);
  assert.strictEqual(updatedCorrect.skillStates.INVERSE_RELATION.attempts, 1);
  assert.ok(updatedCorrect.standardError < initial.standardError);

  const updatedWithHints = context.window.IrtEngine.updateState(initial, target, {
    correct: true,
    hintLevel: 6,
    stepSuccessRate: 1
  });
  assert.ok(updatedWithHints.theta > initial.theta);
  assert.ok(updatedWithHints.theta < updatedCorrect.theta);

  const updatedWrong = context.window.IrtEngine.updateState(initial, hard, {
    correct: false,
    hintLevel: 2,
    stepSuccessRate: 0.25
  });
  assert.ok(updatedWrong.theta < initial.theta);
}

function testIrtSelectionAvoidsImmediateItemRepeatWhenAlternativesExist() {
  const context = createContext();
  runScript(context, 'js/problems/problemBase.js');
  runScript(context, 'js/problems/relationshipCoachProblems.js');
  runScript(context, 'js/irtEngine.js');

  const items = context.window.RelationshipCoachProblems.bank;
  const state = {
    ...context.window.IrtEngine.createInitialState('relationship_math'),
    theta: 0.63,
    lastItemIds: ['REL_MATH_004', 'REL_MATH_004', 'REL_MATH_001']
  };

  const selected = context.window.IrtEngine.selectNextItem(items, state);
  assert.notStrictEqual(selected.problem_id, 'REL_MATH_004');
}

function testRelationshipCoachBankHasIrtMetadata() {
  const context = createContext();
  runScript(context, 'js/problems/problemBase.js');
  runScript(context, 'js/problems/relationshipCoachProblems.js');

  const bank = context.window.RelationshipCoachProblems.bank;
  assert.ok(bank.length >= 50);
  const difficulties = bank.map(item => item.irt?.b).filter(value => typeof value === 'number');
  assert.ok(Math.min(...difficulties) <= -1.3);
  assert.ok(Math.max(...difficulties) >= 1.7);
  assert.ok(difficulties.filter(value => value < -0.75).length >= 10);
  assert.ok(difficulties.filter(value => value >= -0.75 && value <= 0.75).length >= 20);
  assert.ok(difficulties.filter(value => value > 0.75).length >= 10);
  const skillCounts = new Map();
  for (const item of bank) {
    assert.ok(item.problem_id);
    assert.ok(item.irt);
    assert.strictEqual(item.irt.model, 'rasch');
    assert.strictEqual(typeof item.irt.b, 'number');
    assert.ok(Array.isArray(item.skill_tags));
    assert.ok(item.skill_tags.length > 0);
    item.skill_tags.forEach(skill => skillCounts.set(skill, (skillCounts.get(skill) || 0) + 1));
  }
  [
    'DIRECT_COMPARE',
    'EQUAL_SHARING',
    'QUOTATIVE_DIVISION',
    'UNIT_COMPARE',
    'MULTIPLICATIVE_COMPARE',
    'FRACTION_RELATION',
    'INVERSE_RELATION',
    'PROPORTION',
    'RANKING',
    'COMPOSITE_RELATION',
    'DIRECTION_CONFUSION'
  ].forEach(skill => assert.ok((skillCounts.get(skill) || 0) >= 3, `${skill} needs at least 3 seed items`));

  const problem = context.window.RelationshipCoachProblems.generateForItem(bank[0]);
  assert.strictEqual(problem.problem_id, bank[0].problem_id);
  assert.strictEqual(problem.irt.b, bank[0].irt.b);
  assert.deepStrictEqual(problem.skill_tags, bank[0].skill_tags);
}

function testIrtAttemptLogCreatesSupabaseReadyPendingRecords() {
  const context = createStorageContext();
  runScript(context, 'js/irtEngine.js');
  runScript(context, 'js/irtLog.js');

  assert.strictEqual(typeof context.window.IrtLog.createAttemptRecord, 'function');

  const problem = {
    problem_id: 'REL_MATH_TEST',
    problem_types: ['UNIT_COMPARE', 'INVERSE_RELATION'],
    skill_tags: ['UNIT_COMPARE', 'INVERSE_RELATION'],
    answer: 'C'
  };
  const stateBefore = context.window.IrtEngine.createInitialState('relationship_math');
  const result = { correct: false, hintLevel: 4, stepSuccessRate: 0.4 };
  const stateAfter = context.window.IrtEngine.updateState(stateBefore, problem, result);

  const record = context.window.IrtLog.createAttemptRecord({
    learnerId: 'local-child',
    problem,
    result,
    stateBefore,
    stateAfter,
    selectedAnswer: 'A',
    errorType: 'DIRECTION_CONFUSION',
    elapsedSeconds: 42
  });

  assert.strictEqual(record.item_id, 'REL_MATH_TEST');
  assert.strictEqual(record.topic, 'relationship_math');
  assert.strictEqual(record.selected_answer, 'A');
  assert.strictEqual(record.correct, false);
  assert.strictEqual(record.hint_level, 4);
  assert.strictEqual(record.step_success_rate, 0.4);
  assert.strictEqual(record.response_score, context.window.IrtEngine.responseScore(result));
  assert.strictEqual(record.theta_before, stateBefore.theta);
  assert.strictEqual(record.theta_after, stateAfter.theta);
  assert.strictEqual(record.skill_tags.join('|'), 'UNIT_COMPARE|INVERSE_RELATION');
  assert.strictEqual(record.sync_status, 'pending');
  assert.strictEqual(record.error_type, 'DIRECTION_CONFUSION');

  context.window.IrtLog.appendAttempt(record);
  assert.strictEqual(context.window.IrtLog.loadAttempts().length, 1);
  assert.strictEqual(context.window.IrtLog.getPendingAttempts()[0].local_id, record.local_id);

  context.window.IrtLog.markAttemptsSynced([record.local_id]);
  const synced = context.window.IrtLog.loadAttempts()[0];
  assert.strictEqual(synced.sync_status, 'synced');
  assert.ok(synced.synced_at);
}

async function testIrtSyncUploadsPendingAttemptsOnlyForAuthenticatedLearners() {
  const context = createStorageContext();
  const inserted = [];
  context.window.MathAppSupabase = {
    getClient() {
      return {
        auth: {
          getUser: async () => ({ data: { user: { id: '00000000-0000-4000-8000-000000000001' } }, error: null })
        },
        from(table) {
          return {
            insert: async rows => {
              inserted.push({ table, rows });
              return { data: rows, error: null };
            }
          };
        }
      };
    }
  };

  runScript(context, 'js/irtEngine.js');
  runScript(context, 'js/irtLog.js');
  runScript(context, 'js/irtSync.js');

  const record = context.window.IrtLog.createAttemptRecord({
    problem: {
      problem_id: 'REL_MATH_SYNC',
      problem_types: ['UNIT_COMPARE'],
      skill_tags: ['UNIT_COMPARE', 'DIRECTION_CONFUSION']
    },
    result: { correct: true, hintLevel: 1, stepSuccessRate: 1 },
    stateBefore: { topic: 'relationship_math', theta: 0, standardError: 1 },
    stateAfter: { topic: 'relationship_math', theta: 0.2, standardError: 0.9 },
    selectedAnswer: 'B',
    elapsedSeconds: 28
  });
  context.window.IrtLog.appendAttempt(record);

  const result = await context.window.IrtSync.syncPendingAttempts();

  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.synced, 1);
  assert.strictEqual(inserted.length, 1);
  assert.strictEqual(inserted[0].table, 'learning_attempts');
  assert.strictEqual(inserted[0].rows[0].learner_id, '00000000-0000-4000-8000-000000000001');
  assert.strictEqual(inserted[0].rows[0].local_attempt_id, record.local_id);
  assert.strictEqual(inserted[0].rows[0].item_id, 'REL_MATH_SYNC');
  assert.strictEqual(inserted[0].rows[0].skill_tags.join('|'), 'UNIT_COMPARE|DIRECTION_CONFUSION');
  assert.strictEqual(inserted[0].rows[0].standard_error_after, 0.9);
  assert.strictEqual(context.window.IrtLog.getPendingAttempts().length, 0);
}

function testMeasurementQualityRatesReliabilityAndValidityConservatively() {
  const context = createContext();
  runScript(context, 'js/measurementQuality.js');

  const skills = [
    'DIRECT_COMPARE',
    'EQUAL_SHARING',
    'QUOTATIVE_DIVISION',
    'UNIT_COMPARE',
    'MULTIPLICATIVE_COMPARE',
    'FRACTION_RELATION',
    'INVERSE_RELATION',
    'PROPORTION',
    'RANKING',
    'COMPOSITE_RELATION',
    'DIRECTION_CONFUSION'
  ];
  const itemBank = skills.flatMap((skill, index) => [0, 1, 2].map(offset => ({
    problem_id: `ITEM_${index}_${offset}`,
    grade_band: index < 4 ? 'G1_G2' : index < 8 ? 'G3_G4' : 'G5_G6',
    problem_types: [skill],
    skill_tags: [skill],
    irt: { model: 'rasch', b: -1 + index * 0.2 + offset * 0.05 }
  })));
  const attempts = Array.from({ length: 36 }, (_, index) => {
    const skill = skills[index % 9];
    return {
      item_id: `ITEM_${index % 9}_${index % 3}`,
      skill_tags: [skill],
      correct: index % 5 !== 0,
      hint_level: index % 4,
      response_score: index % 5 === 0 ? 0.25 : 0.84,
      step_success_rate: index % 5 === 0 ? 0.4 : 1
    };
  });

  const quality = context.window.MeasurementQuality.evaluate({
    attempts,
    irtState: { theta: 0.42, standardError: 0.34, attemptCount: 36 },
    itemBank
  });

  assert.ok(quality.reliability.score >= 70);
  assert.strictEqual(quality.reliability.level, '안정적');
  assert.ok(quality.validity.score >= 75);
  assert.strictEqual(quality.validity.level, '운영 타당도 축적');
  assert.ok(quality.interpretation.canUseFor.some(text => text.includes('개인화')));
  assert.ok(quality.interpretation.cannotUseFor.some(text => text.includes('표준화')));

  const earlyQuality = context.window.MeasurementQuality.evaluate({
    attempts: attempts.slice(0, 2),
    irtState: { theta: 0.1, standardError: 0.9, attemptCount: 2 },
    itemBank
  });

  assert.strictEqual(earlyQuality.reliability.level, '관찰 단계');
  assert.ok(earlyQuality.reliability.warnings.length > 0);
  assert.ok(earlyQuality.validity.gaps.length > 0);
  assert.ok(earlyQuality.interpretation.cannotUseFor.some(text => text.includes('능력 비교')));
}

function testMathAbilityReportSummarizesIrtEvidenceForParents() {
  const context = createStorageContext();
  runScript(context, 'js/irtLog.js');
  runScript(context, 'js/measurementQuality.js');
  runScript(context, 'js/mathAbilityReport.js');

  context.window.IrtLog.saveAttempts([
    {
      local_id: 'a1',
      item_id: 'REL_MATH_A',
      topic: 'relationship_math',
      skill_tags: ['EQUAL_SHARING'],
      correct: true,
      hint_level: 0,
      response_score: 1,
      theta_before: 0,
      theta_after: 0.2,
      standard_error_after: 0.8,
      created_at: '2026-05-20T00:00:00.000Z'
    },
    {
      local_id: 'a2',
      item_id: 'REL_MATH_B',
      topic: 'relationship_math',
      skill_tags: ['DIRECTION_CONFUSION'],
      correct: false,
      hint_level: 4,
      response_score: 0.15,
      theta_before: 0.2,
      theta_after: 0.05,
      standard_error_after: 0.7,
      error_type: 'DIRECTION_CONFUSION',
      created_at: '2026-05-20T00:01:00.000Z'
    },
    {
      local_id: 'a3',
      item_id: 'REL_MATH_C',
      topic: 'relationship_math',
      skill_tags: ['FRACTION_RELATION'],
      correct: true,
      hint_level: 2,
      response_score: 0.84,
      theta_before: 0.05,
      theta_after: 0.18,
      standard_error_after: 0.65,
      created_at: '2026-05-20T00:02:00.000Z'
    }
  ]);

  const report = context.window.MathAbilityReport.buildParentReport({
    irtState: {
      theta: 0.18,
      standardError: 0.65,
      attemptCount: 3,
      skillStates: {
        EQUAL_SHARING: { attempts: 1, mastery: 1 },
        DIRECTION_CONFUSION: { attempts: 1, mastery: 0.15 },
        FRACTION_RELATION: { attempts: 1, mastery: 0.84 }
      }
    }
  });

  assert.strictEqual(report.summary.totalAttempts, 3);
  assert.strictEqual(report.summary.correctRate, 67);
  assert.strictEqual(report.summary.independentSolveRate, 33);
  assert.strictEqual(report.measurement.theta, 0.18);
  assert.strictEqual(report.measurement.standardError, 0.65);
  assert.ok(report.measurement.abilityIndex > 50);
  assert.strictEqual(report.measurement.confidenceLabel, '관찰 중');
  assert.strictEqual(report.weakSkills[0].skill, 'DIRECTION_CONFUSION');
  assert.ok(report.parentNarrative.includes('추정'));
  assert.ok(report.recommendations.length >= 2);
  assert.strictEqual(report.quality.reliability.level, '관찰 단계');
  assert.ok(report.quality.validity.gaps.length > 0);
}

async function runTests() {
  testCurriculumTopicSections();
  testProblemOptionsStayUniqueAndComplete();
  testRelationshipCoachProblemContract();
  testRelationThinkingTopicsAreElementaryIntegrated();
  testElementaryWordProblemSeedBankContract();
  testSupabasePublicConfigContract();
  testSupabaseClientUsesPublicConfig();
  testIrtEngineUpdatesLearnerStateAndSelectsItems();
  testIrtSelectionAvoidsImmediateItemRepeatWhenAlternativesExist();
  testRelationshipCoachBankHasIrtMetadata();
  testIrtAttemptLogCreatesSupabaseReadyPendingRecords();
  await testIrtSyncUploadsPendingAttemptsOnlyForAuthenticatedLearners();
  testMeasurementQualityRatesReliabilityAndValidityConservatively();
  testMathAbilityReportSummarizesIrtEvidenceForParents();
}

runTests()
  .then(() => console.log('app contract tests passed'))
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
