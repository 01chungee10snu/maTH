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
    setTimeout,
    clearTimeout
  };
  context.globalThis = context;
  return context;
}

function normalizeOption(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function optionParts(value) {
  return normalizeOption(value).split(',').map(part => part.trim());
}

function partSignature(part) {
  const normalized = normalizeOption(part);
  if (!normalized) return 'EMPTY';
  if (/-?\d|^\d+\/\d+/.test(normalized)) {
    return normalized
      .replace(/\d+\/\d+/g, '#/#')
      .replace(/-?\d+(?:\.\d+)?/g, '#')
      .replace(/\s+/g, ' ')
      .trim();
  }
  return 'LABEL';
}

function optionSignature(value) {
  return optionParts(value).map(partSignature).join(',');
}

function isGenericFallbackOption(value) {
  return /다시 계산|문제 조건 부족|알 수 없음|알 수 없다|모른다|보다 \d+만큼 다름/.test(normalizeOption(value));
}

function hasQuestionAskingLabelAndQuantity(question) {
  const text = String(question || '');
  return /누가 몇/.test(text)
    || /언제이고.*몇/.test(text)
    || /어느 쪽이 몇/.test(text)
    || /어느 .*에 .*몇 .*더/.test(text)
    || /어느 .*이 .*몇 .*더/.test(text)
    || /어느 .*가 .*몇 .*더/.test(text);
}

function auditOptionSet(problem, options, answer, label) {
  const normalizedOptions = (options || []).map(normalizeOption);
  const normalizedAnswer = normalizeOption(answer);
  const issues = [];

  if (normalizedOptions.length !== 4) {
    issues.push(`option_count_${normalizedOptions.length}`);
  }
  if (new Set(normalizedOptions).size !== normalizedOptions.length) {
    issues.push('duplicate_options');
  }
  if (!normalizedOptions.includes(normalizedAnswer)) {
    issues.push('missing_answer');
  }
  if (normalizedOptions.some(isGenericFallbackOption)) {
    issues.push('generic_fallback_option');
  }

  const signatures = new Set(normalizedOptions.map(optionSignature));
  if (signatures.size !== 1) {
    issues.push(`mixed_option_signature:${Array.from(signatures).join('|')}`);
  }

  if (hasQuestionAskingLabelAndQuantity(problem?.question || problem?.problem)) {
    const answerParts = optionParts(normalizedAnswer);
    const answerIsLabelQuantity = answerParts.length >= 2
      && !/-?\d/.test(answerParts[0])
      && answerParts.slice(1).some(part => /-?\d/.test(part));
    if (!answerIsLabelQuantity) {
      issues.push('question_asks_label_quantity_but_answer_shape_differs');
    }
    const labelCount = new Set(normalizedOptions.map(option => optionParts(option)[0])).size;
    const quantityCount = new Set(normalizedOptions.map(option => optionParts(option).slice(1).join(','))).size;
    if (labelCount < 2) issues.push('label_quantity_options_need_multiple_labels');
    if (quantityCount < 2) issues.push('label_quantity_options_need_multiple_quantities');
  }

  return issues.length
    ? {
        label,
        id: problem?.problem_id || problem?.problemKey || label,
        question: problem?.question || problem?.problem || '',
        answer: normalizedAnswer,
        options: normalizedOptions,
        issues
      }
    : null;
}

function loadProblemContext() {
  const context = createContext();
  [
    'js/problems/problemBase.js',
    'js/problems/additionProblems.js',
    'js/problems/subtractionProblems.js',
    'js/problems/multiplicationProblems.js',
    'js/problems/divisionProblems.js',
    'js/problems/fractionProblems.js',
    'js/problems/geometryProblems.js',
    'js/problems/measurementProblems.js',
    'js/problems/patternProblems.js',
    'js/problems/lengthProblems.js',
    'js/problems/graphProblems.js',
    'js/problems/numberProblems.js',
    'js/problems/creativeProblems.js',
    'js/problems/capacityWeightVolumeProblems.js',
    'js/problems/symbolEquationProblems.js',
    'js/problems/relationshipCoachProblems.js',
    'js/expandedWordProblemBank.js',
    'js/problems/index.js'
  ].forEach(file => runScript(context, file));
  return context;
}

function auditSymbolProblem(problem, label) {
  const failures = [];
  Object.entries(problem.answers || {}).forEach(([symbolKey, symbol]) => {
    const issue = auditOptionSet(
      { ...problem, problem_id: `${problem.problemKey || 'symbol'}:${symbolKey}` },
      symbol.options,
      symbol.value,
      `${label}:${symbolKey}`
    );
    if (issue) failures.push(issue);
  });
  return failures;
}

function auditProblem(problem, label) {
  if (!problem) return [];
  if (problem.type === 'symbolEquation' && problem.answers) {
    return auditSymbolProblem(problem, label);
  }
  const issue = auditOptionSet(problem, problem.options, problem.answer, label);
  return issue ? [issue] : [];
}

function runAudit() {
  const context = loadProblemContext();
  const failures = [];

  const rawBank = JSON.parse(fs.readFileSync(path.join(root, 'data', 'elementary_word_problem_seed_bank.json'), 'utf8'));
  const converted = context.window.ExpandedWordProblemBank.convert(rawBank);
  converted.forEach(item => {
    const problem = context.window.RelationshipCoachProblems.generateForItem(item);
    failures.push(...auditProblem(problem, `expanded:${item.problem_id}`));
  });

  let convertedK12 = [];
  const k12Path = path.join(root, 'data', 'k12_math_problem_seed_bank.json');
  if (fs.existsSync(k12Path)) {
    const rawK12Bank = JSON.parse(fs.readFileSync(k12Path, 'utf8'));
    convertedK12 = context.window.ExpandedWordProblemBank.convert(rawK12Bank);
    convertedK12.forEach(item => {
      const problem = context.window.RelationshipCoachProblems.generateForItem(item);
      failures.push(...auditProblem(problem, `k12-expanded:${item.problem_id}`));
    });
  }

  const topics = [
    '덧셈', '뺄셈', '곱셈', '나눗셈', '분수', '도형', '시각', '규칙', '길이',
    '자료', '수', '창의 사고력', '들이', '무게', '부피', '미지수'
  ];
  topics.forEach(topic => {
    for (let difficulty = 1; difficulty <= 12; difficulty += 1) {
      for (let sample = 0; sample < 20; sample += 1) {
        const problem = context.window.ProblemLoader.generate(topic, difficulty);
        failures.push(...auditProblem(problem, `module:${topic}:d${difficulty}:s${sample}`));
      }
    }
  });

  const report = {
    checkedExpandedItems: converted.length,
    checkedK12ExpandedItems: convertedK12.length,
    checkedModuleSamples: topics.length * 12 * 20,
    failureCount: failures.length,
    issueCounts: failures.reduce((counts, failure) => {
      failure.issues.forEach(issue => {
        const key = issue.replace(/:.*/, '');
        counts[key] = (counts[key] || 0) + 1;
      });
      return counts;
    }, {}),
    failures: failures.slice(0, 50)
  };

  console.log(JSON.stringify(report, null, 2));
  if (failures.length) process.exit(1);
}

runAudit();
