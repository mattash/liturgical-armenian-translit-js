const { transliterate, transliterateWord } = require('./src/translit');
const {
  alignTokenSequences,
  getParallelParts,
  loadCorpus,
  normalizedEditDistance,
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
let mismatchedWords = 0;
let generatedOnlyWords = 0;
let expectedOnlyWords = 0;
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

console.log(`Corpus: ${corpus.name} (${totalParts} segments)`);
console.log('\n=== Paragraph-Level Accuracy ===');
console.log(`Exact matches: ${exactParts} (${percentage(exactParts, totalParts)}%)`);
console.log(`Near matches:  ${nearParts} (${percentage(nearParts, totalParts)}%)`);
console.log(`Combined:      ${exactParts + nearParts} (${percentage(exactParts + nearParts, totalParts)}%)`);

console.log('\n=== Word-Level Accuracy ===');
console.log(`Aligned word comparisons: ${totalWords}`);
console.log(`Exact matches:  ${exactWords} (${percentage(exactWords, totalWords)}%)`);
console.log(`Word mismatches: ${mismatchedWords}`);
console.log(`Alignment noise (generated-only): ${generatedOnlyWords}`);
console.log(`Alignment noise (expected-only): ${expectedOnlyWords}`);

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
  return normalizedEditDistance(left, right) * Math.max(left.length, right.length);
}
