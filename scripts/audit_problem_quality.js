const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');

const MODULE_FILES = [
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
];

const MODULE_TOPICS = [
  '덧셈', '뺄셈', '곱셈', '나눗셈', '분수', '도형', '시각', '규칙',
  '길이', '자료', '수', '창의 사고력', '들이', '무게', '부피', '미지수'
];

const TEXT_BAD_PATTERNS = [
  { id: 'unresolved_template', pattern: /\$\{[^}]+}/ },
  { id: 'undefined_text', pattern: /undefined|null|null값/i },
  { id: 'nan_text', pattern: /\bNaN\b/ },
  { id: 'infinite_text', pattern: /\bInfinity\b/ }
];

const ADVANCED_G1G2_PATTERNS = [
  /DIVISION/,
  /FRACTION/,
  /UNIT_RATE/,
  /\d+\/\d+/,
  /분수/,
  /나눗셈/,
  /비율/,
  /비례/
];

const ERROR_TAGS = new Set([
  'NUMBER_SIZE_BIAS',
  'DIRECTION_CONFUSION',
  'BASE_UNIT_CONFUSION',
  'FRACTION_SIZE_CONFUSION',
  'OPERATION_SELECTION_ERROR',
  'RANKING_MISREAD',
  'EXPLANATION_GAP',
  'TRANSFER_FAILURE'
]);

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

function normalizeText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function loadProblemContext() {
  const context = createContext();
  MODULE_FILES.forEach(file => runScript(context, file));
  return context;
}

function collectProblemTexts(problem) {
  const texts = [
    problem?.problem_id,
    problem?.problemKey,
    problem?.question,
    problem?.problem,
    problem?.answer,
    problem?.explanation,
    problem?.solution,
    ...(Array.isArray(problem?.options) ? problem.options : [])
  ];

  if (problem?.answers) {
    Object.values(problem.answers).forEach(symbol => {
      texts.push(symbol?.value, ...(Array.isArray(symbol?.options) ? symbol.options : []));
    });
  }

  return texts.map(normalizeText).filter(Boolean);
}

function collectProblemContentTexts(problem) {
  const texts = [
    problem?.question,
    problem?.problem,
    problem?.answer,
    problem?.explanation,
    problem?.solution,
    ...(Array.isArray(problem?.options) ? problem.options : [])
  ];

  if (problem?.answers) {
    Object.values(problem.answers).forEach(symbol => {
      texts.push(symbol?.value, ...(Array.isArray(symbol?.options) ? symbol.options : []));
    });
  }

  return texts.map(normalizeText).filter(Boolean);
}

function getProblemQuestion(problem) {
  return normalizeText(problem?.question || problem?.problem || '');
}

function getProblemAnswer(problem) {
  return normalizeText(problem?.answer);
}

function getOptions(problem) {
  return Array.isArray(problem?.options) ? problem.options.map(normalizeText) : [];
}

function isNumericLike(value) {
  return /^-?\d+(?:\.\d+)?(?:\/\d+)?/.test(normalizeText(value));
}

function hasNegativeElementaryCount(text) {
  return /-\d+(?:개|명|장|권|쪽|번|살|cm|mm|mL|L|g|kg|시간|분|원|가지|칸|층|등|번째)/.test(text);
}

const PARTICLE_TERMS = (() => {
  const names = ['태희', '민지', '하준', '서아', '지우', '도윤', '수빈', '연우', '지민', '유나'];
  const objects = ['스티커', '구슬', '색종이', '연필', '딱지', '쿠키', '사탕', '공책', '책', '카드'];
  const containers = ['상자', '바구니', '봉지', '접시', '컵', '통', '주머니', '서랍', '가방'];
  const colors = ['빨간', '파란', '노란', '초록', '보라', '하얀', '검은', '분홍', '주황', '남색'];
  const compounds = colors.flatMap(color => [
    ...objects.map(object => `${color} ${object}`),
    ...containers.map(container => `${color} ${container}`)
  ]);
  return Array.from(new Set([...names, ...objects, ...containers, ...compounds]))
    .sort((a, b) => b.length - a.length);
})();

function hasFinalConsonant(word) {
  const char = String(word).trim().slice(-1);
  const code = char.charCodeAt(0);
  return code >= 0xac00 && code <= 0xd7a3 && ((code - 0xac00) % 28) !== 0;
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hasBadGeneratedParticle(text) {
  return PARTICLE_TERMS.some(term => {
    const escaped = escapeRegExp(term);
    const badParticles = hasFinalConsonant(term)
      ? ['가', '는', '를']
      : ['이', '은', '을'];
    return badParticles.some(particle => new RegExp(`${escaped}${particle}(?=[^가-힣]|$)`).test(text));
  });
}

function auditCommonProblem(problem, label) {
  const issues = [];
  const question = getProblemQuestion(problem);
  const answer = getProblemAnswer(problem);
  const options = getOptions(problem);
  const texts = collectProblemContentTexts(problem);

  if (!question) issues.push('missing_question');
  if (!answer && problem?.type !== 'symbolEquation') issues.push('missing_answer');
  if ((problem?.explanation !== undefined || problem?.solution !== undefined) && !normalizeText(problem.explanation || problem.solution)) {
    issues.push('missing_explanation');
  }

  texts.forEach(text => {
    TEXT_BAD_PATTERNS.forEach(({ id, pattern }) => {
      if (pattern.test(text)) issues.push(id);
    });
    if (hasNegativeElementaryCount(text)) issues.push('negative_elementary_count');
    if (hasBadGeneratedParticle(text)) issues.push('bad_korean_particle');
  });

  if (problem?.type !== 'symbolEquation') {
    if (options.length !== 4) issues.push(`option_count_${options.length}`);
    if (new Set(options).size !== options.length) issues.push('duplicate_options');
    if (answer && !options.includes(answer)) issues.push('answer_not_in_options');
  }

  if (isNumericLike(answer) && /[가-힣]이 아님 \d+$/.test(options.join(' '))) {
    issues.push('synthetic_fallback_option');
  }

  return issues.length
    ? {
        label,
        id: problem?.problem_id || problem?.problemKey || label,
        question,
        answer,
        options,
        issues: Array.from(new Set(issues))
      }
    : null;
}

function auditSymbolProblem(problem, label) {
  const failures = [];
  const common = auditCommonProblem(problem, label);
  if (common) failures.push(common);

  Object.entries(problem.answers || {}).forEach(([symbolKey, symbol]) => {
    const options = Array.isArray(symbol.options) ? symbol.options.map(normalizeText) : [];
    const value = normalizeText(symbol.value);
    const issues = [];
    if (options.length !== 4) issues.push(`symbol_option_count_${options.length}`);
    if (new Set(options).size !== options.length) issues.push('symbol_duplicate_options');
    if (!options.includes(value)) issues.push('symbol_answer_not_in_options');
    collectProblemTexts({ options, answer: value }).forEach(text => {
      TEXT_BAD_PATTERNS.forEach(({ id, pattern }) => {
        if (pattern.test(text)) issues.push(id);
      });
      if (hasNegativeElementaryCount(text)) issues.push('negative_elementary_count');
    });
    if (issues.length) {
      failures.push({
        label: `${label}:${symbolKey}`,
        id: `${problem.problemKey || label}:${symbolKey}`,
        question: getProblemQuestion(problem),
        answer: value,
        options,
        issues: Array.from(new Set(issues))
      });
    }
  });

  return failures;
}

function auditProblem(problem, label) {
  if (problem?.type === 'symbolEquation') return auditSymbolProblem(problem, label);
  const issue = auditCommonProblem(problem, label);
  return issue ? [issue] : [];
}

function answerAppearsInSolution(answer, solution) {
  const normalizedAnswer = normalizeText(answer);
  const normalizedSolution = normalizeText(solution);
  const numericParts = normalizedAnswer.match(/-?\d+(?:\.\d+)?(?:\/\d+)?/g) || [];

  if (numericParts.length) return numericParts.some(part => normalizedSolution.includes(part));
  return normalizedSolution.replace(/\s/g, '').includes(normalizedAnswer.replace(/\s/g, ''));
}

function auditSeedItem(item) {
  const issues = [];
  const text = normalizeText(item.problem);
  const answer = normalizeText(item.answer);
  const solution = normalizeText(item.solution);
  const combined = [
    item.id,
    item.grade_band,
    item.curriculum_domain,
    item.topic,
    item.type_family,
    text,
    answer,
    solution,
    ...(item.skill_tags || []),
    ...(item.reasoning_tags || [])
  ].map(normalizeText).join(' ');

  if (!item.id) issues.push('seed_missing_id');
  if (!text) issues.push('seed_missing_problem');
  if (!answer) issues.push('seed_missing_answer');
  if (!solution) issues.push('seed_missing_solution');
  if (answer && solution && !answerAppearsInSolution(answer, solution)) issues.push('seed_answer_not_reflected_in_solution');
  if (!Number.isFinite(Number(item.difficulty)) || Number(item.difficulty) < 1 || Number(item.difficulty) > 12) {
    issues.push('seed_invalid_difficulty');
  }
  if (!['G1_G2', 'G3_G4', 'G5_G6'].includes(item.grade_band)) issues.push('seed_invalid_grade_band');
  if (!Array.isArray(item.skill_tags) || item.skill_tags.length === 0) issues.push('seed_missing_skill_tags');
  if (!Array.isArray(item.reasoning_tags) || item.reasoning_tags.length === 0) issues.push('seed_missing_reasoning_tags');
  if ([...(item.skill_tags || []), ...(item.reasoning_tags || []), ...(item.problem_types || [])].some(tag => ERROR_TAGS.has(tag))) {
    issues.push('seed_error_tag_used_as_skill');
  }

  TEXT_BAD_PATTERNS.forEach(({ id, pattern }) => {
    if (pattern.test(combined)) issues.push(`seed_${id}`);
  });
  if (hasNegativeElementaryCount(combined)) issues.push('seed_negative_elementary_count');
  if (hasBadGeneratedParticle(combined)) issues.push('seed_bad_korean_particle');

  if (item.grade_band === 'G1_G2' && ADVANCED_G1G2_PATTERNS.some(pattern => pattern.test(combined))) {
    issues.push('seed_g1g2_advanced_leak');
  }

  return issues.length
    ? {
        label: `seed:${item.id || 'missing_id'}`,
        id: item.id,
        question: text,
        answer,
        issues: Array.from(new Set(issues))
      }
    : null;
}

function auditBankItemMetadata(item, labelPrefix) {
  const issues = [];
  const isK12Item = item?.source === 'k12_math_seed_bank';
  const combined = [
    item?.grade_band,
    item?.operation,
    item?.question,
    item?.problem,
    ...(item?.skill_tags || []),
    ...(item?.reasoning_tags || []),
    ...(item?.problem_types || [])
  ].map(normalizeText).join(' ');

  const validGradeBands = isK12Item
    ? ['G1_G2', 'G3_G4', 'G5_G6', 'M1', 'M2', 'M3', 'M2_M3', 'H1', 'H2', 'CSAT']
    : ['G1_G2', 'G3_G4', 'G5_G6'];

  if (!validGradeBands.includes(item?.grade_band)) issues.push('bank_invalid_grade_band');
  if (!isK12Item && item?.grade_band === 'G1_G2' && ADVANCED_G1G2_PATTERNS.some(pattern => pattern.test(combined))) {
    issues.push('bank_g1g2_advanced_leak');
  }
  if ([...(item?.skill_tags || []), ...(item?.reasoning_tags || []), ...(item?.problem_types || [])].some(tag => ERROR_TAGS.has(tag))) {
    issues.push('bank_error_tag_used_as_skill');
  }

  return issues.length
    ? {
        label: `${labelPrefix}:${item?.problem_id || item?.id || 'missing_id'}`,
        id: item?.problem_id || item?.id,
        question: normalizeText(item?.question || item?.problem),
        answer: normalizeText(item?.answer),
        issues: Array.from(new Set(issues))
      }
    : null;
}

function getRankedEntityLabels(item) {
  return [...(item?.entities || [])]
    .filter(entity => Number.isFinite(Number(entity.relative_value)))
    .sort((a, b) => Number(b.relative_value) - Number(a.relative_value))
    .map(entity => normalizeText(entity.label));
}

function auditStaticRelationAnswer(item) {
  const labels = getRankedEntityLabels(item);
  const answer = normalizeText(item?.answer);
  let expected = null;

  if (item?.question_type === 'LARGEST') expected = labels[0];
  if (item?.question_type === 'SMALLEST') expected = labels[labels.length - 1];
  if (item?.question_type === 'SECOND_LARGEST') expected = labels[1];
  if (item?.question_type === 'RANK_ORDER') expected = labels.join(', ');

  if (!expected || expected === answer) return null;
  return {
    label: `static-answer:${item?.problem_id || 'missing_id'}`,
    id: item?.problem_id,
    question: normalizeText(item?.question),
    answer,
    options: labels,
    issues: ['static_relation_answer_mismatch']
  };
}

function summarizeCounts(failures) {
  return failures.reduce((counts, failure) => {
    failure.issues.forEach(issue => {
      counts[issue] = (counts[issue] || 0) + 1;
    });
    return counts;
  }, {});
}

function summarizeExamples(failures) {
  return failures.reduce((examples, failure) => {
    failure.issues.forEach(issue => {
      if (!examples[issue]) examples[issue] = [];
      if (examples[issue].length < 5) {
        examples[issue].push({
          label: failure.label,
          id: failure.id,
          question: failure.question,
          answer: failure.answer,
          options: failure.options
        });
      }
    });
    return examples;
  }, {});
}

function normalizeK12Template(text) {
  return normalizeText(text)
    .replace(/[0-9]+(?:\.[0-9]+)?\/[0-9]+(?:\.[0-9]+)?/g, 'F')
    .replace(/[0-9]+(?:\.[0-9]+)?/g, 'N')
    .replace(/[A-D]/g, 'X')
    .replace(/[㉮㉯㉰㉱]/g, 'X');
}

function auditK12Diversity(seedItems) {
  const failures = [];
  const questionGroups = new Map();
  const levelItems = new Map();

  seedItems.forEach(item => {
    const question = normalizeText(item.problem);
    if (!questionGroups.has(question)) questionGroups.set(question, []);
    questionGroups.get(question).push(item);
    if (!levelItems.has(item.difficulty)) levelItems.set(item.difficulty, []);
    levelItems.get(item.difficulty).push(item);
  });

  Array.from(questionGroups.values())
    .filter(group => group.length > 1)
    .slice(0, 20)
    .forEach(group => {
      failures.push({
        label: `k12-duplicate:${group[0]?.id || 'unknown'}`,
        id: group[0]?.id,
        question: normalizeText(group[0]?.problem),
        answer: normalizeText(group[0]?.answer),
        issues: ['k12_exact_duplicate_question']
      });
    });

  Array.from(levelItems.entries()).forEach(([level, items]) => {
    const uniqueQuestions = new Set(items.map(item => normalizeText(item.problem))).size;
    const templateCount = new Set(items.map(item => normalizeK12Template(item.problem))).size;
    if (uniqueQuestions < 30 || templateCount < 6) {
      failures.push({
        label: `k12-level-diversity:${level}`,
        id: `level-${level}`,
        question: `level ${level}`,
        answer: '',
        issues: [
          uniqueQuestions < 30 ? 'k12_level_unique_question_low' : null,
          templateCount < 6 ? 'k12_level_template_diversity_low' : null
        ].filter(Boolean)
      });
    }
  });

  return failures;
}

function runAudit() {
  const failures = [];
  const context = loadProblemContext();
  const rawBank = JSON.parse(fs.readFileSync(path.join(root, 'data', 'elementary_word_problem_seed_bank.json'), 'utf8'));
  const seedItems = Array.isArray(rawBank.items) ? rawBank.items : [];

  (context.window.RelationshipCoachProblems?.bank || []).forEach(item => {
    const metadataFailure = auditBankItemMetadata(item, 'static');
    if (metadataFailure) failures.push(metadataFailure);
    const answerFailure = auditStaticRelationAnswer(item);
    if (answerFailure) failures.push(answerFailure);
  });

  const seedIds = new Set();
  const seedQuestions = new Map();
  seedItems.forEach(item => {
    const itemFailure = auditSeedItem(item);
    if (itemFailure) failures.push(itemFailure);

    const id = normalizeText(item.id);
    if (id) {
      if (seedIds.has(id)) failures.push({ label: `seed:${id}`, id, question: normalizeText(item.problem), answer: normalizeText(item.answer), issues: ['seed_duplicate_id'] });
      seedIds.add(id);
    }

    const question = normalizeText(item.problem);
    if (question) {
      const existing = seedQuestions.get(question);
      if (existing && existing.answer !== normalizeText(item.answer)) {
        failures.push({
          label: `seed:${item.id}`,
          id: item.id,
          question,
          answer: normalizeText(item.answer),
          issues: ['seed_duplicate_question_conflicting_answer']
        });
      }
      seedQuestions.set(question, { id: item.id, answer: normalizeText(item.answer) });
    }
  });

  const converted = context.window.ExpandedWordProblemBank.convert(rawBank);
  converted.forEach(item => {
    const metadataFailure = auditBankItemMetadata(item, 'expanded-metadata');
    if (metadataFailure) failures.push(metadataFailure);
    const problem = context.window.RelationshipCoachProblems.generateForItem(item);
    failures.push(...auditProblem(problem, `expanded:${item.problem_id}`));
  });

  let k12SeedItems = [];
  let convertedK12 = [];
  const k12Path = path.join(root, 'data', 'k12_math_problem_seed_bank.json');
  if (fs.existsSync(k12Path)) {
    const rawK12Bank = JSON.parse(fs.readFileSync(k12Path, 'utf8'));
    k12SeedItems = Array.isArray(rawK12Bank.items) ? rawK12Bank.items : [];
    failures.push(...auditK12Diversity(k12SeedItems));
    convertedK12 = context.window.ExpandedWordProblemBank.convert(rawK12Bank);
    convertedK12.forEach(item => {
      const metadataFailure = auditBankItemMetadata(item, 'k12-expanded-metadata');
      if (metadataFailure) failures.push(metadataFailure);
      const problem = context.window.RelationshipCoachProblems.generateForItem(item);
      failures.push(...auditProblem(problem, `k12-expanded:${item.problem_id}`));
    });
  }

  MODULE_TOPICS.forEach(topic => {
    for (let difficulty = 1; difficulty <= 12; difficulty += 1) {
      for (let sample = 0; sample < 30; sample += 1) {
        const problem = context.window.ProblemLoader.generate(topic, difficulty);
        failures.push(...auditProblem(problem, `module:${topic}:d${difficulty}:s${sample}`));
      }
    }
  });

  const report = {
    checkedSeedItems: seedItems.length,
    checkedExpandedItems: converted.length,
    checkedK12SeedItems: k12SeedItems.length,
    checkedK12ExpandedItems: convertedK12.length,
    checkedModuleSamples: MODULE_TOPICS.length * 12 * 30,
    failureCount: failures.length,
    issueCounts: summarizeCounts(failures),
    issueExamples: summarizeExamples(failures),
    failures: failures.slice(0, 80)
  };

  console.log(JSON.stringify(report, null, 2));
  if (failures.length) process.exit(1);
}

runAudit();
