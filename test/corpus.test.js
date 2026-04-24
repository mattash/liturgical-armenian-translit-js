const test = require('node:test');
const assert = require('node:assert/strict');

const baseline = require('./fixtures/corpus-metrics-baseline.json');
const { getParallelParts, loadCorpus } = require('../corpus');
const { calculateCorpusMetrics } = require('../corpus/metrics');

test('checked-in Divine Liturgy corpus stays available and populated', () => {
  const corpus = loadCorpus();
  const parts = getParallelParts(corpus);

  assert.equal(corpus.name, 'Divine Liturgy');
  assert.equal(parts.length, 220);
});

test('current transliteration quality stays within the documented corpus thresholds', () => {
  const metrics = calculateCorpusMetrics();
  const exactPartRate = metrics.exactPartRate;
  const combinedPartRate = metrics.combinedPartRate;
  const exactWordRate = metrics.exactWordRate;

  assert.ok(exactPartRate >= 0.5, `expected paragraph exact rate >= 0.5, got ${exactPartRate}`);
  assert.ok(combinedPartRate >= 0.9, `expected paragraph combined rate >= 0.9, got ${combinedPartRate}`);
  assert.ok(exactWordRate >= 0.87, `expected aligned word exact rate >= 0.87, got ${exactWordRate}`);
});

test('current corpus metrics do not regress from the checked-in baseline', () => {
  const metrics = calculateCorpusMetrics();

  assert.equal(metrics.totalParts, baseline.totalParts, 'corpus size changed unexpectedly');
  assert.ok(
    metrics.exactParts >= baseline.exactParts,
    `expected exact paragraph matches >= ${baseline.exactParts}, got ${metrics.exactParts}`
  );
  assert.ok(
    metrics.combinedParts >= baseline.combinedParts,
    `expected combined paragraph matches >= ${baseline.combinedParts}, got ${metrics.combinedParts}`
  );
  assert.ok(
    metrics.exactWords >= baseline.exactWords,
    `expected exact aligned words >= ${baseline.exactWords}, got ${metrics.exactWords}`
  );
  assert.ok(
    metrics.mismatchedWords <= baseline.mismatchedWords,
    `expected mismatched aligned words <= ${baseline.mismatchedWords}, got ${metrics.mismatchedWords}`
  );
  assert.ok(
    metrics.generatedOnlyWords <= baseline.generatedOnlyWords,
    `expected generated-only tokens <= ${baseline.generatedOnlyWords}, got ${metrics.generatedOnlyWords}`
  );
  assert.ok(
    metrics.expectedOnlyWords <= baseline.expectedOnlyWords,
    `expected expected-only tokens <= ${baseline.expectedOnlyWords}, got ${metrics.expectedOnlyWords}`
  );
});
