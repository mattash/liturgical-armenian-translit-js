const test = require('node:test');
const assert = require('node:assert/strict');

const { transliterate, transliterateWord } = require('../src/translit');
const {
  alignTokenSequences,
  getParallelParts,
  loadCorpus,
  normalizedEditDistance,
  normalizeForComparison,
  tokenizeWords,
} = require('../corpus');

function levenshtein(left, right) {
  return normalizedEditDistance(left, right) * Math.max(left.length, right.length);
}

test('checked-in Divine Liturgy corpus stays available and populated', () => {
  const corpus = loadCorpus();
  const parts = getParallelParts(corpus);

  assert.equal(corpus.name, 'Divine Liturgy');
  assert.equal(parts.length, 220);
});

test('current transliteration quality stays within the documented corpus thresholds', () => {
  const parts = getParallelParts();
  let exactParts = 0;
  let nearParts = 0;
  let exactWords = 0;
  let totalWords = 0;

  parts.forEach(({ grabar, translit: expected }) => {
    const generated = transliterate(grabar);
    const normalizedGenerated = normalizeForComparison(generated);
    const normalizedExpected = normalizeForComparison(expected);

    if (normalizedGenerated === normalizedExpected) {
      exactParts += 1;
    } else {
      const distance = levenshtein(normalizedGenerated, normalizedExpected);
      const ratio = distance / Math.max(normalizedGenerated.length, normalizedExpected.length);

      if (ratio < 0.15) {
        nearParts += 1;
      }
    }

    const generatedWords = tokenizeWords(grabar).map((word) => transliterateWord(word));
    const expectedWords = tokenizeWords(expected);

    alignTokenSequences(generatedWords, expectedWords).operations.forEach((operation) => {
      if (operation.type === 'match') {
        totalWords += 1;
        exactWords += 1;
      } else if (operation.type === 'replace') {
        totalWords += 1;
      }
    });
  });

  const exactPartRate = exactParts / parts.length;
  const combinedPartRate = (exactParts + nearParts) / parts.length;
  const exactWordRate = exactWords / totalWords;

  assert.ok(exactPartRate >= 0.5, `expected paragraph exact rate >= 0.5, got ${exactPartRate}`);
  assert.ok(combinedPartRate >= 0.9, `expected paragraph combined rate >= 0.9, got ${combinedPartRate}`);
  assert.ok(exactWordRate >= 0.87, `expected aligned word exact rate >= 0.87, got ${exactWordRate}`);
});
