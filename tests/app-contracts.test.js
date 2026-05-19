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

function testRelationshipCoachBankHasIrtMetadata() {
  const context = createContext();
  runScript(context, 'js/problems/problemBase.js');
  runScript(context, 'js/problems/relationshipCoachProblems.js');

  const bank = context.window.RelationshipCoachProblems.bank;
  assert.ok(bank.length >= 5);
  for (const item of bank) {
    assert.ok(item.problem_id);
    assert.ok(item.irt);
    assert.strictEqual(item.irt.model, 'rasch');
    assert.strictEqual(typeof item.irt.b, 'number');
    assert.ok(Array.isArray(item.skill_tags));
    assert.ok(item.skill_tags.length > 0);
  }

  const problem = context.window.RelationshipCoachProblems.generateForItem(bank[0]);
  assert.strictEqual(problem.problem_id, bank[0].problem_id);
  assert.strictEqual(problem.irt.b, bank[0].irt.b);
  assert.deepStrictEqual(problem.skill_tags, bank[0].skill_tags);
}

testCurriculumTopicSections();
testProblemOptionsStayUniqueAndComplete();
testRelationshipCoachProblemContract();
testSupabasePublicConfigContract();
testSupabaseClientUsesPublicConfig();
testIrtEngineUpdatesLearnerStateAndSelectsItems();
testRelationshipCoachBankHasIrtMetadata();

console.log('app contract tests passed');
