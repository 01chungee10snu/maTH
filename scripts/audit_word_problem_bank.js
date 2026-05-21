const fs = require('fs');
const path = require('path');

const bankPath = path.resolve(__dirname, '..', 'data', 'elementary_word_problem_seed_bank.json');
const bank = JSON.parse(fs.readFileSync(bankPath, 'utf8'));
const items = bank.items || [];

const QUALITY_THRESHOLDS = {
  minItems: 6050,
  minComplexPct: 75,
  maxG1G2AdvancedLeakCount: 0,
  exactDuplicateGroups: 0,
  minNormalizedTemplates: 420,
  maxNormalizedTemplateReuse: 120,
  minStructureSignatures: 60,
  maxMissingStructureSignatureCount: 0,
  minTemplateSignatures: 300,
  maxTemplateSignatureReuse: 120,
  maxMissingTemplateSignatureCount: 0
};

const complexTags = new Set([
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

function isComplex(item) {
  const tags = new Set([
    ...(item.skill_tags || []),
    ...(item.reasoning_tags || []),
    ...(item.problem_types || [])
  ]);
  const sentenceCount = (String(item.problem || '').match(/[.?!?]/g) || []).length;
  return item.requires_multi_step_reasoning === true
    && Number(item.reasoning_depth || 0) >= 2
    && String(item.problem || '').length >= 40
    && sentenceCount >= 2
    && Array.from(complexTags).some(tag => tags.has(tag));
}

function isG1G2AdvancedLeak(item) {
  if (item.grade_band !== 'G1_G2') return false;
  return /DIVISION|FRACTION|UNIT_RATE/.test(String(item.type_family || ''))
    || /\d+\/\d+/.test(String(item.problem || ''));
}

function normalizeProblemTemplate(text) {
  return String(text || '')
    .replace(/[0-9]+(?:\.[0-9]+)?\/[0-9]+(?:\.[0-9]+)?/g, 'F')
    .replace(/[0-9]+(?:\.[0-9]+)?/g, 'N')
    .replace(/[A-D]/g, 'X')
    .replace(/[㉮㉯㉰㉱]/g, 'X')
    .replace(/태희|민지|하준|서아|지우|도윤|수빈|연우|지민|유나/g, 'NAME')
    .replace(/스티커|구슬|색종이|연필|사탕|공책|리본|물병|상자|기차|막대|컵|그릇|공|끈|바구니|삽|책|카드|초콜릿|쿠키|딱지/g, 'OBJ')
    .replace(/월요일|화요일|수요일|목요일|금요일|토요일|일요일/g, 'DAY')
    .replace(/\s+/g, ' ')
    .trim();
}

function getDuplicateGroups(sourceItems, keyFn) {
  const groups = new Map();
  sourceItems.forEach(item => {
    const key = keyFn(item);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  });
  return Array.from(groups.values()).filter(group => group.length > 1);
}

function summarize(keyFn) {
  const rows = new Map();
  items.forEach(item => {
    const key = keyFn(item);
    const row = rows.get(key) || { count: 0, complex: 0, depthTotal: 0 };
    row.count += 1;
    row.complex += isComplex(item) ? 1 : 0;
    row.depthTotal += Number(item.reasoning_depth || 0);
    rows.set(key, row);
  });

  return Array.from(rows.entries())
    .sort((a, b) => String(a[0]).localeCompare(String(b[0]), 'en', { numeric: true }))
    .map(([key, row]) => ({
      key,
      count: row.count,
      complex: row.complex,
      complexPct: Math.round((row.complex / row.count) * 1000) / 10,
      avgReasoningDepth: Math.round((row.depthTotal / row.count) * 100) / 100
    }));
}

function summarizeDuplicateGroups(groups) {
  return groups
    .map(group => ({
      count: group.length,
      firstId: group[0]?.id,
      firstProblem: group[0]?.problem
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

function buildQualityFailures(metrics) {
  const failures = [];
  const checks = [
    ['totalItems', metrics.totalItems >= QUALITY_THRESHOLDS.minItems, `totalItems ${metrics.totalItems} < ${QUALITY_THRESHOLDS.minItems}`],
    ['complexPct', metrics.complexPct >= QUALITY_THRESHOLDS.minComplexPct, `complexPct ${metrics.complexPct} < ${QUALITY_THRESHOLDS.minComplexPct}`],
    ['g1g2AdvancedLeakCount', metrics.g1g2AdvancedLeakCount <= QUALITY_THRESHOLDS.maxG1G2AdvancedLeakCount, `g1g2AdvancedLeakCount ${metrics.g1g2AdvancedLeakCount} > ${QUALITY_THRESHOLDS.maxG1G2AdvancedLeakCount}`],
    ['exactDuplicateGroups', metrics.exactDuplicateGroups === QUALITY_THRESHOLDS.exactDuplicateGroups, `exactDuplicateGroups ${metrics.exactDuplicateGroups} !== ${QUALITY_THRESHOLDS.exactDuplicateGroups}`],
    ['normalizedTemplateCount', metrics.normalizedTemplateCount >= QUALITY_THRESHOLDS.minNormalizedTemplates, `normalizedTemplateCount ${metrics.normalizedTemplateCount} < ${QUALITY_THRESHOLDS.minNormalizedTemplates}`],
    ['maxNormalizedTemplateReuse', metrics.maxNormalizedTemplateReuse <= QUALITY_THRESHOLDS.maxNormalizedTemplateReuse, `maxNormalizedTemplateReuse ${metrics.maxNormalizedTemplateReuse} > ${QUALITY_THRESHOLDS.maxNormalizedTemplateReuse}`],
    ['structureSignatureCount', metrics.structureSignatureCount >= QUALITY_THRESHOLDS.minStructureSignatures, `structureSignatureCount ${metrics.structureSignatureCount} < ${QUALITY_THRESHOLDS.minStructureSignatures}`],
    ['missingStructureSignatureCount', metrics.missingStructureSignatureCount <= QUALITY_THRESHOLDS.maxMissingStructureSignatureCount, `missingStructureSignatureCount ${metrics.missingStructureSignatureCount} > ${QUALITY_THRESHOLDS.maxMissingStructureSignatureCount}`],
    ['templateSignatureCount', metrics.templateSignatureCount >= QUALITY_THRESHOLDS.minTemplateSignatures, `templateSignatureCount ${metrics.templateSignatureCount} < ${QUALITY_THRESHOLDS.minTemplateSignatures}`],
    ['maxTemplateSignatureReuse', metrics.maxTemplateSignatureReuse <= QUALITY_THRESHOLDS.maxTemplateSignatureReuse, `maxTemplateSignatureReuse ${metrics.maxTemplateSignatureReuse} > ${QUALITY_THRESHOLDS.maxTemplateSignatureReuse}`],
    ['missingTemplateSignatureCount', metrics.missingTemplateSignatureCount <= QUALITY_THRESHOLDS.maxMissingTemplateSignatureCount, `missingTemplateSignatureCount ${metrics.missingTemplateSignatureCount} > ${QUALITY_THRESHOLDS.maxMissingTemplateSignatureCount}`]
  ];

  checks.forEach(([id, passed, message]) => {
    if (!passed) failures.push({ id, message });
  });
  return failures;
}

const complexItems = items.filter(isComplex);
const exactDuplicateGroups = getDuplicateGroups(items, item => item.problem || '');
const normalizedTemplateGroups = getDuplicateGroups(items, item => normalizeProblemTemplate(item.problem || ''));
const normalizedTemplateCount = new Set(items.map(item => normalizeProblemTemplate(item.problem || ''))).size;
const maxNormalizedTemplateReuse = Math.max(...normalizedTemplateGroups.map(group => group.length), 0);
const structureGroups = getDuplicateGroups(items, item => item.structure_signature || '');
const structureSignatureCount = new Set(items.map(item => item.structure_signature).filter(Boolean)).size;
const maxStructureSignatureReuse = Math.max(...structureGroups.map(group => group.length), 0);
const missingStructureSignatureCount = items.filter(item => !item.structure_signature).length;
const signatureGroups = getDuplicateGroups(items, item => item.template_signature || '');
const templateSignatureCount = new Set(items.map(item => item.template_signature).filter(Boolean)).size;
const maxTemplateSignatureReuse = Math.max(...signatureGroups.map(group => group.length), 0);
const missingTemplateSignatureCount = items.filter(item => !item.template_signature).length;

const report = {
  metadata: bank.metadata,
  totalItems: items.length,
  complexItems: complexItems.length,
  complexPct: Math.round((complexItems.length / Math.max(1, items.length)) * 1000) / 10,
  g1g2AdvancedLeakCount: items.filter(isG1G2AdvancedLeak).length,
  exactDuplicateGroups: exactDuplicateGroups.length,
  duplicateItems: exactDuplicateGroups.reduce((total, group) => total + group.length, 0),
  normalizedTemplateCount,
  maxNormalizedTemplateReuse,
  structureSignatureCount,
  maxStructureSignatureReuse,
  missingStructureSignatureCount,
  templateSignatureCount,
  maxTemplateSignatureReuse,
  missingTemplateSignatureCount,
  qualityThresholds: QUALITY_THRESHOLDS,
  qualityFailures: [],
  exactDuplicateExamples: summarizeDuplicateGroups(exactDuplicateGroups),
  normalizedTemplateReuseExamples: summarizeDuplicateGroups(normalizedTemplateGroups),
  byDifficulty: summarize(item => item.difficulty),
  byGradeBand: summarize(item => item.grade_band),
  byDomain: summarize(item => item.curriculum_domain)
};

report.qualityFailures = buildQualityFailures(report);

console.log(JSON.stringify(report, null, 2));
if (report.qualityFailures.length) process.exit(1);
