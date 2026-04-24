const { calculateCorpusMetrics, formatMetricsReport } = require('./corpus/metrics');

const metrics = calculateCorpusMetrics();

console.log(formatMetricsReport(metrics));

console.log('\n=== Sample Mismatches ===');
metrics.mismatchSamples.forEach(({ arm, expected, got }) => {
  console.log(`\n[ARM] ${arm}`);
  console.log(`[EXP] ${expected}`);
  console.log(`[GOT] ${got}`);
});
