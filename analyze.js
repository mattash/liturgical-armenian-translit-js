const { transliterate } = require('./src/translit');
const {
  extractWordPairs,
  getParallelParts,
  loadCorpus,
  normalizeForComparison,
} = require('./corpus');

const corpus = loadCorpus();
const parts = getParallelParts(corpus);
const wordPairs = extractWordPairs(corpus);

const characterFrequency = {};
const firstLetterMap = {};
const misses = new Map();

wordPairs.forEach(({ arm, translit }) => {
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

  const generated = transliterate(arm);
  if (normalizeForComparison(generated) !== normalizeForComparison(translit)) {
    const key = `${arm} => ${translit}`;
    misses.set(key, (misses.get(key) || 0) + 1);
  }
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
