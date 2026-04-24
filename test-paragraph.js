const { transliterate } = require('./src/translit');
const {
  getParallelParts,
  loadCorpus,
  normalizeForComparison,
  tokenizeWords,
} = require('./corpus');

const corpus = loadCorpus();
const parts = getParallelParts(corpus);

let totalParts = 0;
let exactParts = 0;
let nearParts = 0;
let totalWords = 0;
let exactWords = 0;
const badParts = [];

parts.forEach(({ grabar, translit: expected }) => {
  totalParts += 1;

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
    } else if (badParts.length < 15) {
      badParts.push({
        arm: grabar.slice(0, 100),
        expected: expected.slice(0, 100),
        got: generated.slice(0, 100),
      });
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

console.log(`Corpus: ${corpus.name} (${totalParts} segments)`);
console.log('\n=== Paragraph-Level Accuracy ===');
console.log(`Exact matches: ${exactParts} (${percentage(exactParts, totalParts)}%)`);
console.log(`Near matches:  ${nearParts} (${percentage(nearParts, totalParts)}%)`);
console.log(`Combined:      ${exactParts + nearParts} (${percentage(exactParts + nearParts, totalParts)}%)`);

console.log('\n=== Word-Level Accuracy ===');
console.log(`Words compared: ${totalWords}`);
console.log(`Exact matches:  ${exactWords} (${percentage(exactWords, totalWords)}%)`);

console.log('\n=== Sample Mismatches ===');
badParts.forEach(({ arm, expected, got }) => {
  console.log(`\n[ARM] ${arm}`);
  console.log(`[EXP] ${expected}`);
  console.log(`[GOT] ${got}`);
});

function percentage(value, total) {
  return ((value / total) * 100).toFixed(1);
}

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
