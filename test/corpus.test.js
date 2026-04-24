const test = require('node:test');
const assert = require('node:assert/strict');

const { transliterate } = require('../src/translit');
const {
  getParallelParts,
  loadCorpus,
  normalizeForComparison,
  tokenizeWords,
} = require('../corpus');

function levenshtein(left, right) {
  const matrix = [];

  for (let row = 0; row <= right.length; row += 1) {
    matrix[row] = [row];
  }

  for (let column = 0; column <= left.length; column += 1) {
    matrix[0][column] = column;
  }

  for (let row = 1; row <= right.length; row += 1) {
    for (let column = 1; column <= left.length; column += 1) {
      matrix[row][column] = right[row - 1] === left[column - 1]
        ? matrix[row - 1][column - 1]
        : Math.min(
            matrix[row - 1][column - 1] + 1,
            matrix[row][column - 1] + 1,
            matrix[row - 1][column] + 1
          );
    }
  }

  return matrix[right.length][left.length];
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

    const generatedWords = tokenizeWords(generated.toLowerCase());
    const expectedWords = tokenizeWords(expected.toLowerCase());
    const limit = Math.min(generatedWords.length, expectedWords.length);

    for (let index = 0; index < limit; index += 1) {
      totalWords += 1;
      if (generatedWords[index] === expectedWords[index]) {
        exactWords += 1;
      }
    }
  });

  const exactPartRate = exactParts / parts.length;
  const combinedPartRate = (exactParts + nearParts) / parts.length;
  const exactWordRate = exactWords / totalWords;

  assert.ok(exactPartRate >= 0.5, `expected paragraph exact rate >= 0.5, got ${exactPartRate}`);
  assert.ok(combinedPartRate >= 0.9, `expected paragraph combined rate >= 0.9, got ${combinedPartRate}`);
  assert.ok(exactWordRate >= 0.8, `expected word exact rate >= 0.8, got ${exactWordRate}`);
});
