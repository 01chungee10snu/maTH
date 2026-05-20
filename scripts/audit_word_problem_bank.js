const fs = require('fs');
const path = require('path');

const bankPath = path.resolve(__dirname, '..', 'data', 'elementary_word_problem_seed_bank.json');
const bank = JSON.parse(fs.readFileSync(bankPath, 'utf8'));
const items = bank.items || [];

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

const report = {
  metadata: bank.metadata,
  totalItems: items.length,
  complexItems: items.filter(isComplex).length,
  complexPct: Math.round((items.filter(isComplex).length / Math.max(1, items.length)) * 1000) / 10,
  g1g2AdvancedLeakCount: items.filter(isG1G2AdvancedLeak).length,
  byDifficulty: summarize(item => item.difficulty),
  byGradeBand: summarize(item => item.grade_band),
  byDomain: summarize(item => item.curriculum_domain)
};

console.log(JSON.stringify(report, null, 2));
