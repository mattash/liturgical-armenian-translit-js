const { transliterateWord } = require('./src/translit');
const {
  alignTokenSequences,
  extractWordPairs,
  getParallelParts,
  loadCorpus,
  tokenizeWords,
} = require('./corpus');

const dictionary = {
  ...require('./src/dictionary.json'),
  ...require('./src/dictionary-overrides.json'),
};

const corpus = loadCorpus();
const parts = getParallelParts(corpus);
const wordPairs = extractWordPairs(corpus);
const variantStatsByWord = new Map();

const characterFrequency = {};
const firstLetterMap = {};
const mismatchBuckets = {
  corpus_variant_conflict: 0,
  dictionary_mismatch: 0,
  rule_gap: 0,
  generated_only: 0,
  expected_only: 0,
};
const misses = new Map();

wordPairs.forEach(({ arm, translit }) => {
  const armKey = arm.toLowerCase();

  for (const ch of arm) {
    const codePoint = ch.codePointAt(0);
    if (codePoint >= 0x0530 && codePoint <= 0x058F) {
      characterFrequency[ch] = (characterFrequency[ch] || 0) + 1;
    }
  }

  const firstCh = arm[0];
  const firstLatin = translit.slice(0, Math.min(4, translit.length));

  if (!firstLetterMap[firstCh]) {
    firstLetterMap[firstCh] = {};
  }

  firstLetterMap[firstCh][firstLatin] = (firstLetterMap[firstCh][firstLatin] || 0) + 1;

  if (!variantStatsByWord.has(armKey)) {
    variantStatsByWord.set(armKey, new Map());
  }

  const variants = variantStatsByWord.get(armKey);
  variants.set(translit, (variants.get(translit) || 0) + 1);
});

const variantConflictWords = new Set();

variantStatsByWord.forEach((variants, word) => {
  const sortedVariants = Array.from(variants.values()).sort((left, right) => right - left);
  const total = sortedVariants.reduce((sum, value) => sum + value, 0);
  const topShare = sortedVariants[0] / total;
  const secondCount = sortedVariants[1] || 0;

  if (total >= 3 && secondCount >= 2 && topShare < 0.75) {
    variantConflictWords.add(word);
  }
});

parts.forEach(({ grabar, translit }) => {
  const armWords = tokenizeWords(grabar);
  const generatedWords = armWords.map((word) => transliterateWord(word));
  const expectedWords = tokenizeWords(translit);
  let armIndex = 0;

  alignTokenSequences(generatedWords, expectedWords).operations.forEach((operation) => {
    if (operation.type === 'match') {
      armIndex += 1;
      return;
    }

    if (operation.type === 'delete') {
      mismatchBuckets.generated_only += 1;
      armIndex += 1;
      return;
    }

    if (operation.type === 'insert') {
      mismatchBuckets.expected_only += 1;
      return;
    }

    const armWord = armWords[armIndex] || '';
    let bucket = 'rule_gap';

    if (variantConflictWords.has(armWord.toLowerCase())) {
      bucket = 'corpus_variant_conflict';
    } else if (dictionary[armWord] || dictionary[armWord.toLowerCase()]) {
      bucket = 'dictionary_mismatch';
    }

    mismatchBuckets[bucket] += 1;
    const key = `${armWord} => ${operation.target} (got ${operation.source})`;
    misses.set(key, (misses.get(key) || 0) + 1);
    armIndex += 1;
  });
});

console.log(`Corpus segments: ${parts.length}`);
console.log(`Aligned word pairs: ${wordPairs.length}`);

console.log('\n=== Armenian Character Frequencies ===');
Object.entries(characterFrequency)
  .sort((left, right) => right[1] - left[1])
  .forEach(([ch, count]) => {
    console.log(`${ch} : ${count}`);
  });

console.log('\n=== First Letter Mappings ===');
Object.entries(firstLetterMap)
  .sort((left, right) => {
    const leftTotal = Object.values(left[1]).reduce((sum, value) => sum + value, 0);
    const rightTotal = Object.values(right[1]).reduce((sum, value) => sum + value, 0);
    return rightTotal - leftTotal;
  })
  .forEach(([ch, mappings]) => {
    const topMappings = Object.entries(mappings)
      .sort((left, right) => right[1] - left[1])
      .slice(0, 5)
      .map(([latin, count]) => `${latin}(${count})`)
      .join(', ');

    console.log(`${ch} -> ${topMappings}`);
  });

console.log('\n=== Most Frequent Word-Level Misses ===');
Array.from(misses.entries())
  .sort((left, right) => right[1] - left[1])
  .slice(0, 20)
  .forEach(([pair, count]) => {
    console.log(`${count}x ${pair}`);
  });

console.log('\n=== Mismatch Buckets ===');
Object.entries(mismatchBuckets).forEach(([bucket, count]) => {
  console.log(`${bucket}: ${count}`);
});
