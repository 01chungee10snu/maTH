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

testCurriculumTopicSections();
testProblemOptionsStayUniqueAndComplete();
testRelationshipCoachProblemContract();

console.log('app contract tests passed');
