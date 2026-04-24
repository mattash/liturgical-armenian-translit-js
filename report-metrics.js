const { calculateCorpusMetrics } = require('./corpus/metrics');

const metrics = calculateCorpusMetrics();

console.log(JSON.stringify({
  totalParts: metrics.totalParts,
  exactParts: metrics.exactParts,
  nearParts: metrics.nearParts,
  combinedParts: metrics.combinedParts,
  totalWords: metrics.totalWords,
  exactWords: metrics.exactWords,
  mismatchedWords: metrics.mismatchedWords,
  generatedOnlyWords: metrics.generatedOnlyWords,
  expectedOnlyWords: metrics.expectedOnlyWords,
}, null, 2));
