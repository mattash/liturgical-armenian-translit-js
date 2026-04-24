const { transliterate, transliterateWord } = require('../src/translit');
const {
  alignTokenSequences,
  getParallelParts,
  loadCorpus,
  normalizedEditDistance,
  normalizeForComparison,
  tokenizeWords,
} = require('./index');

function calculateCorpusMetrics(corpus = loadCorpus(), options = {}) {
  const { mismatchSampleLimit = 15 } = options;
  const parts = getParallelParts(corpus);

  let totalParts = 0;
  let exactParts = 0;
  let nearParts = 0;
  let totalWords = 0;
  let exactWords = 0;
  let mismatchedWords = 0;
  let generatedOnlyWords = 0;
  let expectedOnlyWords = 0;
  const mismatchSamples = [];

  parts.forEach(({ grabar, translit: expected }) => {
    totalParts += 1;

    const generated = transliterate(grabar);
    const normalizedGenerated = normalizeForComparison(generated);
    const normalizedExpected = normalizeForComparison(expected);

    if (normalizedGenerated === normalizedExpected) {
      exactParts += 1;
    } else {
      const distance = normalizedEditDistance(generated, expected);

      if (distance < 0.15) {
        nearParts += 1;
      } else if (mismatchSamples.length < mismatchSampleLimit) {
        mismatchSamples.push({
          arm: grabar.slice(0, 100),
          expected: expected.slice(0, 100),
          got: generated.slice(0, 100),
        });
      }
    }

    const generatedWords = tokenizeWords(grabar).map((word) => transliterateWord(word));
    const expectedWords = tokenizeWords(expected);

    alignTokenSequences(generatedWords, expectedWords).operations.forEach((operation) => {
      if (operation.type === 'match') {
        totalWords += 1;
        exactWords += 1;
        return;
      }

      if (operation.type === 'replace') {
        totalWords += 1;
        mismatchedWords += 1;
        return;
      }

      if (operation.type === 'delete') {
        generatedOnlyWords += 1;
        return;
      }

      expectedOnlyWords += 1;
    });
  });

  return {
    corpusName: corpus.name,
    totalParts,
    exactParts,
    nearParts,
    combinedParts: exactParts + nearParts,
    totalWords,
    exactWords,
    mismatchedWords,
    generatedOnlyWords,
    expectedOnlyWords,
    exactPartRate: totalParts ? exactParts / totalParts : 0,
    combinedPartRate: totalParts ? (exactParts + nearParts) / totalParts : 0,
    exactWordRate: totalWords ? exactWords / totalWords : 0,
    mismatchSamples,
  };
}

function formatMetricsReport(metrics) {
  return [
    `Corpus: ${metrics.corpusName} (${metrics.totalParts} segments)`,
    '',
    '=== Paragraph-Level Accuracy ===',
    `Exact matches: ${metrics.exactParts} (${percentage(metrics.exactParts, metrics.totalParts)}%)`,
    `Near matches:  ${metrics.nearParts} (${percentage(metrics.nearParts, metrics.totalParts)}%)`,
    `Combined:      ${metrics.combinedParts} (${percentage(metrics.combinedParts, metrics.totalParts)}%)`,
    '',
    '=== Word-Level Accuracy ===',
    `Aligned word comparisons: ${metrics.totalWords}`,
    `Exact matches:  ${metrics.exactWords} (${percentage(metrics.exactWords, metrics.totalWords)}%)`,
    `Word mismatches: ${metrics.mismatchedWords}`,
    `Alignment noise (generated-only): ${metrics.generatedOnlyWords}`,
    `Alignment noise (expected-only): ${metrics.expectedOnlyWords}`,
  ].join('\n');
}

function percentage(value, total) {
  return total ? ((value / total) * 100).toFixed(1) : '0.0';
}

module.exports = {
  calculateCorpusMetrics,
  formatMetricsReport,
};
