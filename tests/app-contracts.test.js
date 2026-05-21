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

const COMPLEX_WORD_PROBLEM_TAGS = new Set([
  'BASE_UNIT_IDENTIFICATION',
  'COMPARE_RELATION',
  'COMPOSITE_RELATION',
  'FRACTION_RELATION',
  'INVERSE_RELATION',
  'MULTI_STEP_RELATION',
  'MULTIPLICATIVE_COMPARE',
  'PROPORTION',
  'RANKING',
  'TRANSFER',
  'UNIT_COMPARE'
]);

function getProblemText(item) {
  return String(item.problem || item.question || '');
}

function isComplexWordProblemItem(item) {
  const tags = new Set([
    ...(item.skill_tags || []),
    ...(item.reasoning_tags || []),
    ...(item.problem_types || [])
  ]);
  const sentenceCount = (getProblemText(item).match(/[.?!?]/g) || []).length;
  return item.requires_multi_step_reasoning === true
    && Number(item.reasoning_depth || 0) >= 2
    && getProblemText(item).length >= 40
    && sentenceCount >= 2
    && Array.from(COMPLEX_WORD_PROBLEM_TAGS).some(tag => tags.has(tag));
}

function assertComplexRatio(label, items, minimumRatio) {
  const complex = items.filter(isComplexWordProblemItem).length;
  const ratio = items.length ? complex / items.length : 0;
  assert.ok(
    ratio >= minimumRatio,
    `${label} complex word problem ratio ${(ratio * 100).toFixed(1)}% is below ${(minimumRatio * 100).toFixed(0)}%`
  );
}

function getAnswerOptionShape(value) {
  const text = String(value || '').trim();
  const commaParts = text.split(',').map(part => part.trim());
  if (commaParts.length >= 2) {
    const numericParts = commaParts.map(part => /-?\d/.test(part));
    if (!numericParts[0] && numericParts.slice(1).some(Boolean)) return 'label_comma_number';
    if (numericParts.every(Boolean)) return 'comma_numeric';
    return 'comma_mixed';
  }
  if (/^\d+\/\d+$/.test(text) || /^-?\d/.test(text)) return 'numeric';
  return 'text';
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
    'globalThis.__supabaseConfigForTest = { url: SUPABASE_URL, key: SUPABASE_KEY, enabled: SUPABASE_CONFIG.enabled, syncLearningAttempts: SUPABASE_CONFIG.syncLearningAttempts, autoAnonymousAuth: SUPABASE_CONFIG.autoAnonymousAuth };',
    context
  );

  assert.strictEqual(context.window.MATH_APP_SUPABASE.url, 'https://gegwjdcxcarmopiaknwj.supabase.co');
  assert.strictEqual(context.window.MATH_APP_SUPABASE.publishableKey, 'sb_publishable_jRV8luDjS0JB46ZSDT3-6g_HXM-SUtM');
  assert.strictEqual(context.window.MATH_APP_SUPABASE.syncLearningAttempts, true);
  assert.strictEqual(context.window.MATH_APP_SUPABASE.autoAnonymousAuth, true);
  assert.strictEqual(context.__supabaseConfigForTest.url, context.window.MATH_APP_SUPABASE.url);
  assert.strictEqual(context.__supabaseConfigForTest.key, context.window.MATH_APP_SUPABASE.publishableKey);
  assert.strictEqual(context.__supabaseConfigForTest.enabled, true);
  assert.strictEqual(context.__supabaseConfigForTest.syncLearningAttempts, true);
  assert.strictEqual(context.__supabaseConfigForTest.autoAnonymousAuth, true);
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
  assert.strictEqual(state.guideActive, false);
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

function testAdaptiveLearningFlowStartsWithoutManualSchoolSelection() {
  const context = createContext();
  runScript(context, 'js/relationCurriculum.js');
  runScript(context, 'js/adaptiveLearningFlow.js');

  assert.strictEqual(typeof context.window.AdaptiveLearningFlow.chooseStartTopic, 'function');

  const initialTopic = context.window.AdaptiveLearningFlow.chooseStartTopic({
    currentTopic: 'division',
    irtState: null
  });
  assert.strictEqual(initialTopic, '자연수의 곱셈과 나눗셈');

  const fractionTopic = context.window.AdaptiveLearningFlow.chooseStartTopic({
    currentTopic: '자연수의 곱셈과 나눗셈',
    irtState: {
      skillStates: {
        EQUAL_SHARING: { attempts: 4, mastery: 0.85 },
        FRACTION_RELATION: { attempts: 3, mastery: 0.32 }
      }
    }
  });
  assert.strictEqual(fractionTopic, '분수와 소수의 이해');

  const patch = context.window.AdaptiveLearningFlow.createStartPatch({
    currentCurriculum: 'division',
    mapSelection: { grade: 'elementary_school', subGrade: '3-4학년', domain: '수와 연산' },
    problem: { question: 'old' },
    selected: 'old-answer',
    relationCoach: { stepIndex: 2 },
    symbolAnswers: { square: 1, circle: 2, triangle: 3 },
    irt: null
  });

  assert.strictEqual(patch.mode, 'quiz');
  assert.strictEqual(patch.currentCurriculum, '자연수의 곱셈과 나눗셈');
  assert.strictEqual(patch.mapSelection.grade, null);
  assert.strictEqual(patch.mapSelection.subGrade, null);
  assert.strictEqual(patch.mapSelection.domain, null);
  assert.strictEqual(patch.problem, null);
  assert.strictEqual(patch.selected, null);
  assert.strictEqual(patch.relationCoach, null);
  assert.strictEqual(patch.symbolAnswers.square, null);
  assert.strictEqual(patch.symbolAnswers.circle, null);
  assert.strictEqual(patch.symbolAnswers.triangle, null);
  assert.strictEqual(patch.learningEntry, 'adaptive');
}

function testLearnerProfilesSeparateStateAndAttemptLogs() {
  const context = createStorageContext();
  runScript(context, 'js/learnerProfiles.js');
  runScript(context, 'js/irtEngine.js');
  runScript(context, 'js/irtLog.js');

  assert.strictEqual(typeof context.window.LearnerProfiles.select, 'function');
  assert.deepStrictEqual(
    Array.from(context.window.LearnerProfiles.list().map(profile => profile.name)),
    ['태희', '세희', '보미', '충석']
  );

  const taehee = context.window.LearnerProfiles.select('taehee');
  assert.strictEqual(taehee.name, '태희');
  assert.strictEqual(context.window.LearnerProfiles.getStateKey(), 'math-learner-state:taehee');
  assert.strictEqual(context.window.LearnerProfiles.getAttemptLogKey(), 'math-irt-attempt-log:taehee');

  const taeheeState = context.window.IrtEngine.createInitialState('relationship_math');
  assert.strictEqual(taeheeState.learnerSeed, 'learner-taehee');
  context.window.IrtLog.appendAttempt(context.window.IrtLog.createAttemptRecord({
    learnerId: context.window.LearnerProfiles.getActiveId(),
    problem: { problem_id: 'TAEHEE_ITEM', skill_tags: ['ADDITION'] },
    result: { correct: true, hintLevel: 0, stepSuccessRate: 1 },
    stateBefore: { theta: 0, standardError: 1 },
    stateAfter: { theta: 0.2, standardError: 0.8 }
  }));

  context.window.LearnerProfiles.select('bomi');
  const bomiState = context.window.IrtEngine.createInitialState('relationship_math');
  assert.strictEqual(bomiState.learnerSeed, 'learner-bomi');
  assert.strictEqual(context.window.IrtLog.loadAttempts().length, 0);
  context.window.IrtLog.appendAttempt(context.window.IrtLog.createAttemptRecord({
    learnerId: context.window.LearnerProfiles.getActiveId(),
    problem: { problem_id: 'BOMI_ITEM', skill_tags: ['FRACTION_RELATION'] },
    result: { correct: false, hintLevel: 2, stepSuccessRate: 0.4 },
    stateBefore: { theta: 0, standardError: 1 },
    stateAfter: { theta: -0.1, standardError: 0.9 }
  }));
  assert.strictEqual(context.window.IrtLog.loadAttempts()[0].learner_id, 'bomi');

  context.window.LearnerProfiles.select('taehee');
  const taeheeLogs = context.window.IrtLog.loadAttempts();
  assert.strictEqual(taeheeLogs.length, 1);
  assert.strictEqual(taeheeLogs[0].learner_id, 'taehee');
  assert.strictEqual(taeheeLogs[0].item_id, 'TAEHEE_ITEM');
}

function testElementaryWordProblemSeedBankContract() {
  const bankPath = path.join(root, 'data/elementary_word_problem_seed_bank.json');
  assert.ok(fs.existsSync(bankPath), 'elementary word problem seed bank must exist');

  const bank = JSON.parse(fs.readFileSync(bankPath, 'utf8'));
  assert.strictEqual(bank.metadata.scope, 'elementary_school_only');
  assert.strictEqual(bank.metadata.item_count, bank.items.length);
  assert.ok(bank.items.length >= 6000);
  assert.ok(bank.metadata.family_count >= 100);
  assert.strictEqual(bank.metadata.difficulty_scale, '1-12');
  assert.strictEqual(bank.metadata.schema_version, 3);
  assert.ok(bank.metadata.target_complex_word_problem_ratio >= 0.85);

  const validGradeBands = new Set(['G1_G2', 'G3_G4', 'G5_G6']);
  const ids = new Set();
  const counts = new Map();
  const gradeItems = new Map();
  const difficultyItems = new Map();
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
    assert.ok(Number.isInteger(item.reasoning_depth));
    assert.ok(item.reasoning_depth >= 1 && item.reasoning_depth <= 4);
    assert.ok(Array.isArray(item.reasoning_tags));
    assert.strictEqual(typeof item.requires_multi_step_reasoning, 'boolean');
    assert.ok(item.representation_hint);
    assert.ok(item.answer);
    assert.ok(item.solution);
    if (item.grade_band === 'G1_G2') {
      assert.ok(
        !/DIVISION|FRACTION|UNIT_RATE/.test(item.type_family),
        `${item.id} assigns premature advanced relation family to G1_G2`
      );
      assert.ok(!/\d+\/\d+/.test(item.problem), `${item.id} should not use fraction notation in G1_G2`);
    }
    counts.set(item.grade_band, (counts.get(item.grade_band) || 0) + 1);
    gradeItems.set(item.grade_band, [...(gradeItems.get(item.grade_band) || []), item]);
    difficultyItems.set(item.difficulty, [...(difficultyItems.get(item.difficulty) || []), item]);
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

  assertComplexRatio('overall bank', bank.items, 0.88);
  for (const gradeBand of validGradeBands) {
    assertComplexRatio(`${gradeBand} bank`, gradeItems.get(gradeBand), 0.8);
  }
  for (let difficulty = 1; difficulty <= 12; difficulty += 1) {
    assertComplexRatio(`difficulty ${difficulty}`, difficultyItems.get(difficulty), 0.8);
  }
  [8, 9, 10, 11, 12].forEach(difficulty => {
    assertComplexRatio(`upper difficulty ${difficulty}`, difficultyItems.get(difficulty), 0.85);
  });
}

function testExpandedSeedBankConvertsIntoIrtRuntimeItems() {
  const context = createContext();
  runScript(context, 'js/relationCurriculum.js');
  runScript(context, 'js/problems/problemBase.js');
  runScript(context, 'js/problems/relationshipCoachProblems.js');
  runScript(context, 'js/expandedWordProblemBank.js');

  const rawBank = JSON.parse(fs.readFileSync(path.join(root, 'data/elementary_word_problem_seed_bank.json'), 'utf8'));
  const converted = context.window.ExpandedWordProblemBank.convert(rawBank);

  assert.ok(converted.length >= 6000);
  assert.ok(converted.every(item => item.problem_id && item.problem_id.startsWith('EWP_')));
  assert.ok(converted.every(item => item.source === 'elementary_seed_bank'));
  assert.ok(converted.every(item => item.irt?.model === 'rasch' && typeof item.irt.b === 'number'));
  assert.ok(converted.some(item => item.irt.b <= -1.8));
  assert.ok(converted.some(item => item.irt.b >= 1.8));
  assert.ok(converted.every(item => Array.isArray(item.entities) && item.entities.length >= 4));
  assert.ok(converted.every(item => Number.isInteger(item.reasoning_depth) && item.reasoning_depth >= 1));
  assertComplexRatio('converted runtime bank', converted, 0.88);
  [
    '자연수의 곱셈과 나눗셈',
    '분수의 곱셈과 나눗셈',
    '들이와 무게',
    '비와 비율',
    '평균'
  ].forEach(topic => {
    const topicItems = context.window.RelationCurriculum.filterItemsForTopic(converted, topic);
    assert.ok(topicItems.length >= 400, `${topic} needs a broad adaptive candidate pool`);
    assertComplexRatio(`${topic} adaptive pool`, topicItems, 0.9);
  });

  const merged = context.window.ExpandedWordProblemBank.merge(rawBank);
  assert.ok(merged.added >= 6000);
  assert.ok(context.window.RelationshipCoachProblems.bank.length >= 6050);

  const seedProblem = context.window.RelationshipCoachProblems.generateForItem(converted[0]);
  assert.strictEqual(seedProblem.type, 'relationshipCoach');
  assert.ok(seedProblem.options.includes(seedProblem.answer));
  assert.strictEqual(seedProblem.irt.model, 'rasch');
  assert.ok(seedProblem.coachSteps.some(step => step.id === 'operation'));
  const seedBaseStep = seedProblem.coachSteps.find(step => step.id === 'base');
  assert.strictEqual(seedBaseStep.answer, '문제에서 묻는 값');
  assert.ok(!seedBaseStep.options.some(option => option.value === seedProblem.topic));

  converted.forEach(item => {
    const problem = context.window.RelationshipCoachProblems.generateForItem(item);
    const optionShapes = new Set(problem.options.map(getAnswerOptionShape));
    assert.strictEqual(
      optionShapes.size,
      1,
      `${problem.problem_id} has answer-option shape bias: ${problem.options.join(' | ')}`
    );
    if (/누가 몇 .*더 많/.test(problem.question)) {
      assert.ok(!/,\s*0/.test(String(problem.answer)), `${problem.problem_id} should not ask who is greater for a tie`);
    }
  });
}

function testTinipingAssetPolicyDoesNotUseWrongCharacterFallbacks() {
  const context = createContext();
  runScript(context, 'js/data.js');

  assert.strictEqual(typeof context.window.TinipingAssetPolicy.createAssetRecord, 'function');
  assert.strictEqual(typeof context.window.TinipingAssetPolicy.getLocalImageCandidates, 'function');

  const placeholder = context.window.TinipingAssetPolicy.createAssetRecord(
    { name: '키키핑', type: '일반', season: 1, domain: '도형과 측정' },
    null,
    null
  );

  assert.strictEqual(placeholder.imageObj, null);
  assert.strictEqual(placeholder.image, null);
  assert.strictEqual(placeholder.imageStatus, 'placeholder');
  assert.strictEqual(placeholder.placeholder.label, '키키핑');
  assert.ok(Array.isArray(placeholder.placeholder.colors));
  assert.ok(placeholder.placeholder.colors.length >= 2);

  const characterCandidates = context.window.TinipingAssetPolicy.getLocalImageCandidates('사뿐핑');
  assert.ok(
    characterCandidates.some(candidate => candidate.path === './images/characters/사뿐핑.png'),
    'character directory images should be preferred when available'
  );
}

function testTinipingImageManifestCoversMostCharactersWithLocalFiles() {
  const manifestPath = path.join(root, 'data/tiniping_image_manifest.json');
  assert.ok(fs.existsSync(manifestPath), 'tiniping image manifest must exist');

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  assert.ok(Array.isArray(manifest.items));
  assert.strictEqual(manifest.itemCount, 148);
  assert.strictEqual(manifest.missingCount, 0);
  assert.strictEqual(manifest.items.length, 148);

  const names = new Set();
  for (const item of manifest.items) {
    assert.ok(item.name);
    assert.ok(!names.has(item.name), `duplicate manifest item: ${item.name}`);
    names.add(item.name);
    assert.ok(item.path && item.path.startsWith('./images/tinipings/'));
    assert.ok(/\.(png|jpe?g|webp)$/i.test(item.path), `manifest must reference image files only: ${item.path}`);
    assert.ok(/Render/i.test(item.sourceFile || ''), `manifest source must be a character render: ${item.name}`);
    assert.ok(item.sourceUrl && /^https:\/\//.test(item.sourceUrl));
    assert.ok(fs.existsSync(path.join(root, item.path.replace(/^\.\//, ''))), `missing image file: ${item.path}`);
  }
}

function testCanvasTextHelpersFitKoreanLabelsAndWrapTabs() {
  const context = createContext();
  runScript(context, 'js/canvasText.js');

  assert.strictEqual(typeof context.window.CanvasText.wrapText, 'function');
  assert.strictEqual(typeof context.window.CanvasText.getWrappedTabLayout, 'function');

  const measureContext = {
    font: '',
    measureText(text) {
      return { width: String(text).length * 10 };
    }
  };
  const lines = context.window.CanvasText.wrapText(
    measureContext,
    '관계사고가필요한긴문장제문제',
    70,
    { maxLines: 3 }
  );

  assert.ok(lines.length > 1);
  assert.ok(lines.every(line => measureContext.measureText(line).width <= 70));

  const tabs = ['전체', '수와 연산', '도형과 측정', '규칙성', '자료와 가능성', '부모 리포트'];
  const tabLayout = context.window.CanvasText.getWrappedTabLayout(tabs, {
    x: 16,
    y: 90,
    width: 280,
    minTabWidth: 86,
    tabHeight: 42,
    gap: 8
  });

  assert.ok(tabLayout.rows >= 2);
  assert.ok(tabLayout.tabs.every(tab => tab.w >= 86));
  assert.ok(tabLayout.height > 42);
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

function testIrtExposurePreventsUnansweredStartupRepeat() {
  const context = createContext();
  runScript(context, 'js/irtEngine.js');
  runScript(context, 'js/irtLearningPolicy.js');

  assert.strictEqual(typeof context.window.IrtEngine.registerExposure, 'function');

  const items = [
    {
      problem_id: 'diagnostic_first',
      type_family: 'ADD_JOIN_CHANGE',
      skill_tags: ['ADDITION'],
      problem_types: ['ADDITION'],
      irt: { model: 'rasch', b: 0 }
    },
    {
      problem_id: 'diagnostic_second',
      type_family: 'ADD_COMPARE',
      skill_tags: ['ADDITION'],
      problem_types: ['ADDITION'],
      irt: { model: 'rasch', b: 0 }
    },
    {
      problem_id: 'diagnostic_third',
      type_family: 'ADD_PART_PART_WHOLE',
      skill_tags: ['ADDITION'],
      problem_types: ['ADDITION'],
      irt: { model: 'rasch', b: 0 }
    }
  ];

  let state = context.window.IrtEngine.createInitialState('relationship_math', {
    learnerSeed: 'repeat-contract-seed',
    dailySeed: '2026-05-21'
  });
  const first = context.window.IrtLearningPolicy.selectNextItem(items, state);
  state = context.window.IrtEngine.registerExposure(state, first.item);
  const second = context.window.IrtLearningPolicy.selectNextItem(items, state);

  assert.notStrictEqual(second.item.problem_id, first.item.problem_id);
  assert.strictEqual(state.attemptCount, 0, 'presenting a question should not count as an answered attempt');
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

function testIrtSelectionMaintainsItemDiversityAcrossAdaptiveRun() {
  const context = createContext();
  runScript(context, 'js/relationCurriculum.js');
  runScript(context, 'js/problems/problemBase.js');
  runScript(context, 'js/problems/relationshipCoachProblems.js');
  runScript(context, 'js/irtEngine.js');

  const items = context.window.RelationCurriculum.filterItemsForTopic(
    context.window.RelationshipCoachProblems.bank,
    '자연수의 곱셈과 나눗셈'
  );
  let state = context.window.IrtEngine.createInitialState('relationship_math');
  const selectedIds = [];

  for (let index = 0; index < 12; index += 1) {
    const item = context.window.IrtEngine.selectNextItem(items, state);
    selectedIds.push(item.problem_id);
    state = context.window.IrtEngine.updateState(state, item, {
      correct: true,
      hintLevel: index % 3,
      stepSuccessRate: 1
    });
  }

  const counts = selectedIds.reduce((acc, id) => {
    acc[id] = (acc[id] || 0) + 1;
    return acc;
  }, {});
  const maxRepeat = Math.max(...Object.values(counts));

  assert.ok(new Set(selectedIds).size >= 9, `selected too few unique items: ${selectedIds.join(',')}`);
  assert.ok(maxRepeat <= 2, `item repeated too often: ${JSON.stringify(counts)}`);
}

function testIrtLearningPolicyPromotesDiagnosisPracticeAndMastery() {
  const context = createContext();
  runScript(context, 'js/irtEngine.js');
  runScript(context, 'js/irtLearningPolicy.js');

  assert.strictEqual(typeof context.window.IrtLearningPolicy.selectNextItem, 'function');

  const diagnosticState = {
    ...context.window.IrtEngine.createInitialState('relationship_math'),
    theta: 0,
    standardError: 0.9,
    attemptCount: 4,
    lastItemIds: [],
    skillStates: {
      ADDITION: { attempts: 4, mastery: 0.8 },
      CHANGE_RELATION: { attempts: 4, mastery: 0.8 }
    }
  };
  const diagnosticPool = [
    { problem_id: 'exact_overdone', skill_tags: ['ADDITION'], problem_types: ['ADDITION'], irt: { model: 'rasch', b: 0 } },
    { problem_id: 'under_measured', skill_tags: ['FRACTION_RELATION'], problem_types: ['FRACTION_RELATION'], irt: { model: 'rasch', b: 0.25 } },
    { problem_id: 'hard_unrelated', skill_tags: ['GEOMETRY'], problem_types: ['GEOMETRY'], irt: { model: 'rasch', b: 1.8 } }
  ];
  const diagnosticSelection = context.window.IrtLearningPolicy.selectNextItem(diagnosticPool, diagnosticState);
  assert.strictEqual(diagnosticSelection.item.problem_id, 'under_measured');
  assert.strictEqual(diagnosticSelection.phase, 'diagnostic');
  assert.strictEqual(diagnosticSelection.targetSkill, 'FRACTION_RELATION');

  const weakState = {
    ...context.window.IrtEngine.createInitialState('relationship_math'),
    theta: 0.2,
    standardError: 0.42,
    attemptCount: 18,
    lastItemIds: [],
    skillStates: {
      FRACTION_RELATION: { attempts: 4, mastery: 0.31 },
      ADDITION: { attempts: 8, mastery: 0.92 }
    }
  };
  const weakPool = [
    { problem_id: 'info_only', skill_tags: ['ADDITION'], problem_types: ['ADDITION'], irt: { model: 'rasch', b: 0.2 } },
    { problem_id: 'weak_manageable', skill_tags: ['FRACTION_RELATION'], problem_types: ['FRACTION_RELATION'], irt: { model: 'rasch', b: -0.35 } },
    { problem_id: 'weak_too_hard', skill_tags: ['FRACTION_RELATION'], problem_types: ['FRACTION_RELATION'], irt: { model: 'rasch', b: 1.9 } }
  ];
  const weakSelection = context.window.IrtLearningPolicy.selectNextItem(weakPool, weakState);
  assert.strictEqual(weakSelection.item.problem_id, 'weak_manageable');
  assert.strictEqual(weakSelection.phase, 'targeted_practice');
  assert.strictEqual(weakSelection.targetSkill, 'FRACTION_RELATION');
  assert.ok(weakSelection.utility > 0);

  const stableState = {
    ...context.window.IrtEngine.createInitialState('relationship_math'),
    theta: 0.75,
    standardError: 0.32,
    attemptCount: 36,
    lastItemIds: [],
    skillStates: {
      ADDITION: { attempts: 8, mastery: 0.9 },
      FRACTION_RELATION: { attempts: 8, mastery: 0.86 },
      PROPORTION: { attempts: 6, mastery: 0.82 }
    }
  };
  const stableSelection = context.window.IrtLearningPolicy.selectNextItem([
    { problem_id: 'too_easy', skill_tags: ['ADDITION'], problem_types: ['ADDITION'], irt: { model: 'rasch', b: -1.4 } },
    { problem_id: 'mastery_check', skill_tags: ['PROPORTION'], problem_types: ['PROPORTION'], irt: { model: 'rasch', b: 0.9 } }
  ], stableState);
  assert.strictEqual(stableSelection.phase, 'mastery_check');
  assert.strictEqual(stableSelection.item.problem_id, 'mastery_check');
}

function testIrtLearningPolicyPrefersComplexReasoningWhenFitIsComparable() {
  const context = createContext();
  runScript(context, 'js/irtEngine.js');
  runScript(context, 'js/irtLearningPolicy.js');

  const state = {
    ...context.window.IrtEngine.createInitialState('relationship_math'),
    theta: 0,
    standardError: 0.9,
    attemptCount: 2,
    lastItemIds: [],
    skillStates: {}
  };
  const selection = context.window.IrtLearningPolicy.selectNextItem([
    {
      problem_id: 'simple_one_step',
      skill_tags: ['UNIT_COMPARE'],
      problem_types: ['UNIT_COMPARE'],
      reasoning_depth: 1,
      requires_multi_step_reasoning: false,
      irt: { model: 'rasch', b: 0 }
    },
    {
      problem_id: 'complex_word_problem',
      skill_tags: ['UNIT_COMPARE', 'COMPOSITE_RELATION'],
      problem_types: ['UNIT_COMPARE', 'COMPOSITE_RELATION', 'MULTI_STEP_RELATION'],
      reasoning_tags: ['MULTI_STEP_RELATION', 'COMPOSITE_RELATION'],
      reasoning_depth: 3,
      requires_multi_step_reasoning: true,
      irt: { model: 'rasch', b: 0 }
    }
  ], state);

  assert.strictEqual(selection.item.problem_id, 'complex_word_problem');
  assert.ok(context.window.IrtLearningPolicy.getReasoningDepth(selection.item) >= 3);
}

function testIrtDiagnosticUsesBroadSkillsInsteadOfRepeatingGranularTypes() {
  const context = createContext();
  runScript(context, 'js/irtEngine.js');
  runScript(context, 'js/irtLearningPolicy.js');

  let state = {
    ...context.window.IrtEngine.createInitialState('relationship_math'),
    theta: -1.2,
    standardError: 0.9,
    attemptCount: 3,
    lastItemIds: [],
    skillStates: {}
  };
  const pool = [
    {
      problem_id: 'add_change_1',
      skill_tags: ['ADDITION', 'UNKNOWN_CHANGE'],
      problem_types: ['ADD_JOIN_CHANGE_UNKNOWN', 'ADD_JOIN_CHANGE_UNKNOWN_V1', 'ADDITION', 'UNKNOWN_CHANGE'],
      irt: { model: 'rasch', b: -1.55 }
    },
    {
      problem_id: 'add_change_2',
      skill_tags: ['ADDITION', 'UNKNOWN_CHANGE'],
      problem_types: ['ADD_JOIN_CHANGE_UNKNOWN', 'ADD_JOIN_CHANGE_UNKNOWN_V2', 'ADDITION', 'UNKNOWN_CHANGE'],
      irt: { model: 'rasch', b: -1.55 }
    },
    {
      problem_id: 'fraction_1',
      skill_tags: ['FRACTION_RELATION'],
      problem_types: ['FRAC_EQUIVALENCE', 'FRAC_EQUIVALENCE_V1', 'FRACTION_RELATION'],
      irt: { model: 'rasch', b: -1.5 }
    }
  ];

  const first = context.window.IrtLearningPolicy.selectNextItem(pool, state);
  assert.strictEqual(first.item.problem_id, 'add_change_1');

  state = context.window.IrtEngine.updateState(state, first.item, {
    correct: true,
    hintLevel: 0,
    stepSuccessRate: 1
  });

  const second = context.window.IrtLearningPolicy.selectNextItem(pool, state);
  assert.strictEqual(second.phase, 'diagnostic');
  assert.strictEqual(second.targetSkill, 'FRACTION_RELATION');
  assert.strictEqual(second.item.problem_id, 'fraction_1');
}

function testIrtPolicyDiversifiesFamiliesWithinTargetSkill() {
  const context = createContext();
  runScript(context, 'js/irtEngine.js');
  runScript(context, 'js/irtLearningPolicy.js');

  let state = {
    ...context.window.IrtEngine.createInitialState('relationship_math'),
    theta: 0.2,
    standardError: 0.42,
    attemptCount: 18,
    lastItemIds: [],
    skillStates: {
      FRACTION_RELATION: { attempts: 4, mastery: 0.32 }
    }
  };
  const pool = [
    {
      problem_id: 'fraction_equiv_1',
      type_family: 'FRAC_EQUIVALENCE',
      skill_tags: ['FRACTION_RELATION'],
      problem_types: ['FRAC_EQUIVALENCE', 'FRAC_EQUIVALENCE_V1', 'FRACTION_RELATION'],
      irt: { model: 'rasch', b: -0.45 }
    },
    {
      problem_id: 'fraction_equiv_2',
      type_family: 'FRAC_EQUIVALENCE',
      skill_tags: ['FRACTION_RELATION'],
      problem_types: ['FRAC_EQUIVALENCE', 'FRAC_EQUIVALENCE_V2', 'FRACTION_RELATION'],
      irt: { model: 'rasch', b: -0.45 }
    },
    {
      problem_id: 'fraction_compare_1',
      type_family: 'FRAC_COMPARE_SAME_NUMERATOR',
      skill_tags: ['FRACTION_RELATION'],
      problem_types: ['FRAC_COMPARE_SAME_NUMERATOR', 'FRAC_COMPARE_SAME_NUMERATOR_V1', 'FRACTION_RELATION'],
      irt: { model: 'rasch', b: -0.55 }
    }
  ];

  const first = context.window.IrtLearningPolicy.selectNextItem(pool, state);
  assert.strictEqual(first.item.problem_id, 'fraction_equiv_1');

  state = context.window.IrtEngine.updateState(state, first.item, {
    correct: true,
    hintLevel: 1,
    stepSuccessRate: 1
  });

  const second = context.window.IrtLearningPolicy.selectNextItem(pool, state);
  assert.strictEqual(second.phase, 'targeted_practice');
  assert.strictEqual(second.targetSkill, 'FRACTION_RELATION');
  assert.strictEqual(second.item.problem_id, 'fraction_compare_1');
}

function testExpandedIrtPolicyKeepsLongRunVarietyAndPhaseProgression() {
  const context = createContext();
  runScript(context, 'js/irtEngine.js');
  runScript(context, 'js/irtLearningPolicy.js');
  runScript(context, 'js/problems/problemBase.js');
  runScript(context, 'js/problems/relationshipCoachProblems.js');
  runScript(context, 'js/expandedWordProblemBank.js');

  const rawBank = JSON.parse(fs.readFileSync(path.join(root, 'data/elementary_word_problem_seed_bank.json'), 'utf8'));
  context.window.ExpandedWordProblemBank.merge(rawBank);
  const bank = context.window.RelationshipCoachProblems.bank;
  let state = context.window.IrtEngine.createInitialState('relationship_math');
  const selectedIds = [];
  const selectedItems = [];
  const phases = new Set();

  for (let index = 0; index < 40; index += 1) {
    const selection = context.window.IrtLearningPolicy.selectNextItem(bank, state);
    selectedIds.push(selection.item.problem_id);
    selectedItems.push(selection.item);
    phases.add(selection.phase);
    state = context.window.IrtEngine.updateState(state, selection.item, {
      correct: index % 5 !== 0,
      hintLevel: index % 4,
      stepSuccessRate: index % 5 === 0 ? 0.35 : 1
    });
  }

  assert.ok(bank.length >= 6050);
  assert.ok(new Set(selectedIds).size >= 36, `large-bank policy repeated too much: ${selectedIds.join(',')}`);
  assertComplexRatio('selected adaptive run', selectedItems, 0.8);
  assert.ok(phases.has('diagnostic'));
  assert.ok(phases.has('targeted_practice') || phases.has('adaptive_practice'));
}

function testAdaptiveIrtProgressIsVisibleAndLocallyAccumulated() {
  const context = createStorageContext();
  runScript(context, 'js/irtEngine.js');
  runScript(context, 'js/irtLearningPolicy.js');
  runScript(context, 'js/irtLog.js');
  runScript(context, 'js/irtProgressView.js');
  runScript(context, 'js/relationCurriculum.js');
  runScript(context, 'js/problems/problemBase.js');
  runScript(context, 'js/problems/relationshipCoachProblems.js');
  runScript(context, 'js/expandedWordProblemBank.js');
  runScript(context, 'js/adaptiveLearningFlow.js');

  const rawBank = JSON.parse(fs.readFileSync(path.join(root, 'data/elementary_word_problem_seed_bank.json'), 'utf8'));
  context.window.ExpandedWordProblemBank.merge(rawBank);

  let state = context.window.IrtEngine.createInitialState('relationship_math', {
    learnerSeed: 'adaptive-visible-contract',
    dailySeed: 'adaptive-visible-contract:2026-05-21'
  });
  const selectedDifficulties = [];
  let currentItem = null;

  for (let index = 0; index < 20; index += 1) {
    const pool = context.window.AdaptiveLearningFlow.getCandidateItems(
      context.window.RelationshipCoachProblems.bank,
      { learningEntry: 'adaptive' }
    );
    const selection = context.window.IrtLearningPolicy.selectNextItem(pool, state);
    currentItem = {
      ...selection.item,
      selection_policy: {
        phase: selection.phase,
        targetSkill: selection.targetSkill,
        utility: selection.utility,
        probability: selection.probability
      }
    };
    selectedDifficulties.push(context.window.IrtEngine.getDifficulty(currentItem));
    state = context.window.IrtEngine.registerExposure(state, currentItem);
    const stateBefore = { ...state };
    const result = { correct: true, hintLevel: 0, stepSuccessRate: 1 };
    state = context.window.IrtEngine.updateState(state, currentItem, result);
    context.window.IrtLog.appendAttempt(context.window.IrtLog.createAttemptRecord({
      problem: currentItem,
      result,
      stateBefore,
      stateAfter: state,
      selectedAnswer: currentItem.answer,
      elapsedSeconds: 30
    }));
  }

  const firstFiveMax = Math.max(...selectedDifficulties.slice(0, 5));
  const lastFiveMax = Math.max(...selectedDifficulties.slice(-5));
  assert.strictEqual(state.attemptCount, 20);
  assert.ok(state.theta > 1.5, `theta did not increase enough: ${state.theta}`);
  assert.ok(lastFiveMax > firstFiveMax, `difficulty did not ramp: ${selectedDifficulties.join(',')}`);
  assert.strictEqual(context.window.IrtLog.loadAttempts().length, 20);
  assert.strictEqual(context.window.IrtLog.getPendingAttempts().length, 20);

  const header = context.window.IrtProgressView.buildHeaderStatus({
    problem: currentItem,
    irtState: state,
    fallbackDifficulty: 2
  });
  assert.ok(header);
  assert.notStrictEqual(header.badge, '2단');
  assert.ok(header.badge.includes('L'));
  assert.ok(header.detail.includes('IRT 20문항'));
  assert.ok(header.detail.includes('θ'));
}

function testLearnerHeaderHidesIrtTechnicalDetails() {
  const context = createContext();
  runScript(context, 'js/irtEngine.js');
  runScript(context, 'js/irtProgressView.js');

  const status = context.window.IrtProgressView.buildLearnerHeaderStatus({
    learnerName: '태희',
    problem: {
      level: 10,
      irt: { model: 'rasch', b: 1.27 },
      selection_policy: { phase: 'adaptive_practice' }
    },
    irtState: {
      theta: 1.81,
      standardError: 0.25,
      attemptCount: 20
    },
    fallbackTitle: '수학꾸러기'
  });

  const visibleText = [status.title, status.badge, status.detail].filter(Boolean).join(' ');
  assert.ok(status.title.includes('맞춤 문제'));
  assert.ok(!/theta|IRT|θ|b\s*1\.27|20문항/.test(visibleText), visibleText);

  const routine = context.window.IrtProgressView.buildLearnerRoutineSummary({
    learnerName: '태희',
    irtState: {
      theta: 1.81,
      standardError: 0.25,
      attemptCount: 20
    },
    logSummary: { total: 24 },
    syncText: '서버 동기화 준비됨'
  });
  const routineText = [routine.title, routine.progressText, routine.syncText, routine.startSubtitle].filter(Boolean).join(' ');
  assert.ok(routine.title.includes('수학 루틴'));
  assert.ok(routine.progressText.includes('20문항'));
  assert.ok(!/theta|IRT|θ|오차|수준 추정|로컬기록/.test(routineText), routineText);
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
    'BASE_UNIT_IDENTIFICATION',
    'DIRECTION_REASONING',
    'TRANSFER'
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
  assert.strictEqual(record.local_profile_id, 'local-child');
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
    localProfileId: 'taehee',
    problem: {
      problem_id: 'REL_MATH_SYNC',
      problem_types: ['UNIT_COMPARE'],
      skill_tags: ['UNIT_COMPARE', 'DIRECTION_REASONING']
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
  assert.strictEqual(inserted[0].rows[0].local_profile_id, 'taehee');
  assert.strictEqual(inserted[0].rows[0].local_attempt_id, record.local_id);
  assert.strictEqual(inserted[0].rows[0].item_id, 'REL_MATH_SYNC');
  assert.strictEqual(inserted[0].rows[0].skill_tags.join('|'), 'UNIT_COMPARE|DIRECTION_REASONING');
  assert.strictEqual(inserted[0].rows[0].standard_error_after, 0.9);
  assert.strictEqual(context.window.IrtLog.getPendingAttempts().length, 0);
}

async function testIrtSyncUsesAnonymousAuthWhenNoSessionExists() {
  const context = createStorageContext();
  const inserted = [];
  let anonymousSignInCount = 0;
  context.window.MathAppSupabase = {
    getConfig: () => ({ autoAnonymousAuth: true, syncLearningAttempts: true }),
    getClient() {
      return {
        auth: {
          getUser: async () => ({ data: { user: null }, error: null }),
          signInAnonymously: async () => {
            anonymousSignInCount += 1;
            return { data: { user: { id: '00000000-0000-4000-8000-000000000099' } }, error: null };
          }
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
    localProfileId: 'bomi',
    problem: {
      problem_id: 'REL_MATH_ANON',
      problem_types: ['UNIT_COMPARE'],
      skill_tags: ['UNIT_COMPARE']
    },
    result: { correct: true, hintLevel: 0, stepSuccessRate: 1 },
    stateBefore: { topic: 'relationship_math', theta: 0, standardError: 1 },
    stateAfter: { topic: 'relationship_math', theta: 0.25, standardError: 0.72 },
    selectedAnswer: 'C',
    elapsedSeconds: 19
  });
  context.window.IrtLog.appendAttempt(record);

  const result = await context.window.IrtSync.syncPendingAttempts();
  const status = context.window.IrtSync.getStatus();

  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.synced, 1);
  assert.strictEqual(anonymousSignInCount, 1);
  assert.strictEqual(inserted[0].rows[0].learner_id, '00000000-0000-4000-8000-000000000099');
  assert.strictEqual(inserted[0].rows[0].local_profile_id, 'bomi');
  assert.strictEqual(context.window.IrtLog.getPendingAttempts().length, 0);
  assert.strictEqual(status.lastResult.ok, true);
  assert.strictEqual(status.pending, 0);
}

async function testIrtSyncKeepsPendingWhenAnonymousAuthIsUnavailable() {
  const context = createStorageContext();
  let insertCalled = false;
  context.window.MathAppSupabase = {
    getConfig: () => ({ autoAnonymousAuth: true, syncLearningAttempts: true }),
    getClient() {
      return {
        auth: {
          getUser: async () => ({ data: { user: null }, error: null }),
          signInAnonymously: async () => ({ data: { user: null }, error: { status: 422, message: 'Anonymous sign-ins are disabled' } })
        },
        from() {
          return {
            insert: async () => {
              insertCalled = true;
              return { data: [], error: null };
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
    localProfileId: 'sehee',
    problem: {
      problem_id: 'REL_MATH_ANON_BLOCKED',
      problem_types: ['UNIT_COMPARE'],
      skill_tags: ['UNIT_COMPARE']
    },
    result: { correct: true, hintLevel: 0, stepSuccessRate: 1 },
    stateBefore: { topic: 'relationship_math', theta: 0, standardError: 1 },
    stateAfter: { topic: 'relationship_math', theta: 0.2, standardError: 0.8 },
    selectedAnswer: 'A',
    elapsedSeconds: 21
  });
  context.window.IrtLog.appendAttempt(record);

  const result = await context.window.IrtSync.syncPendingAttempts();
  const status = context.window.IrtSync.getStatus();

  assert.strictEqual(result.ok, false);
  assert.strictEqual(result.reason, 'anonymous_auth_unavailable');
  assert.strictEqual(insertCalled, false);
  assert.strictEqual(context.window.IrtLog.getPendingAttempts().length, 1);
  assert.strictEqual(status.lastResult.reason, 'anonymous_auth_unavailable');
  assert.strictEqual(status.pending, 1);
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
    'BASE_UNIT_IDENTIFICATION',
    'DIRECTION_REASONING',
    'TRANSFER'
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
  runScript(context, 'js/irtLearningPolicy.js');
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
      skill_tags: ['DIRECTION_REASONING'],
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
        DIRECTION_REASONING: { attempts: 1, mastery: 0.15 },
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
  assert.strictEqual(report.weakSkills[0].skill, 'DIRECTION_REASONING');
  assert.ok(report.parentNarrative.includes('추정'));
  assert.ok(report.recommendations.length >= 2);
  assert.ok(report.parentSummary.headline.includes('성장') || report.parentSummary.headline.includes('단계'));
  assert.ok(report.parentSummary.coreMessage.includes('관찰'));
  assert.ok(report.parentSummary.nextAction);
  assert.ok(!/theta|표준오차|IRT/.test(report.parentSummary.coreMessage));
  assert.ok(report.parentSummary.cautionItems.length > 0);
  assert.ok(!/theta|표준오차|IRT|Rasch|skill| b /.test(report.parentSummary.cautionItems.join(' ')));
  assert.strictEqual(report.quality.reliability.level, '관찰 단계');
  assert.ok(report.quality.validity.gaps.length > 0);
  assert.strictEqual(report.learningPolicy.phase, 'diagnostic');
  assert.ok(report.learningPolicy.description.includes('진단'));
}

async function runTests() {
  testCurriculumTopicSections();
  testProblemOptionsStayUniqueAndComplete();
  testRelationshipCoachProblemContract();
  testRelationThinkingTopicsAreElementaryIntegrated();
  testAdaptiveLearningFlowStartsWithoutManualSchoolSelection();
  testLearnerProfilesSeparateStateAndAttemptLogs();
  testElementaryWordProblemSeedBankContract();
  testExpandedSeedBankConvertsIntoIrtRuntimeItems();
  testTinipingAssetPolicyDoesNotUseWrongCharacterFallbacks();
  testTinipingImageManifestCoversMostCharactersWithLocalFiles();
  testCanvasTextHelpersFitKoreanLabelsAndWrapTabs();
  testSupabasePublicConfigContract();
  testSupabaseClientUsesPublicConfig();
  testIrtEngineUpdatesLearnerStateAndSelectsItems();
  testIrtExposurePreventsUnansweredStartupRepeat();
  testIrtSelectionAvoidsImmediateItemRepeatWhenAlternativesExist();
  testIrtSelectionMaintainsItemDiversityAcrossAdaptiveRun();
  testIrtLearningPolicyPromotesDiagnosisPracticeAndMastery();
  testIrtLearningPolicyPrefersComplexReasoningWhenFitIsComparable();
  testIrtDiagnosticUsesBroadSkillsInsteadOfRepeatingGranularTypes();
  testIrtPolicyDiversifiesFamiliesWithinTargetSkill();
  testExpandedIrtPolicyKeepsLongRunVarietyAndPhaseProgression();
  testAdaptiveIrtProgressIsVisibleAndLocallyAccumulated();
  testLearnerHeaderHidesIrtTechnicalDetails();
  testRelationshipCoachBankHasIrtMetadata();
  testIrtAttemptLogCreatesSupabaseReadyPendingRecords();
  await testIrtSyncUploadsPendingAttemptsOnlyForAuthenticatedLearners();
  await testIrtSyncUsesAnonymousAuthWhenNoSessionExists();
  await testIrtSyncKeepsPendingWhenAnonymousAuthIsUnavailable();
  testMeasurementQualityRatesReliabilityAndValidityConservatively();
  testMathAbilityReportSummarizesIrtEvidenceForParents();
}

runTests()
  .then(() => console.log('app contract tests passed'))
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
