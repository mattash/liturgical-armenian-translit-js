const fs = require('fs');
const path = require('path');

const { extractWordPairs, loadCorpus } = require('./corpus');

const corpus = loadCorpus();
const wordPairs = extractWordPairs(corpus);

const characterFrequency = {};
const firstLetterMap = {};

wordPairs.forEach(({ arm, translit }) => {
  const firstCh = arm[0];
  const firstLatin = translit.slice(0, Math.min(3, translit.length));

  if (!firstLetterMap[firstCh]) {
    firstLetterMap[firstCh] = {};
  }

  firstLetterMap[firstCh][firstLatin] = (firstLetterMap[firstCh][firstLatin] || 0) + 1;

  for (const ch of arm) {
    const codePoint = ch.codePointAt(0);
    if (codePoint >= 0x0530 && codePoint <= 0x058F) {
      characterFrequency[ch] = (characterFrequency[ch] || 0) + 1;
    }
  }
});

const analysisDir = path.join(__dirname, 'corpus', 'analysis');
fs.mkdirSync(analysisDir, { recursive: true });

const goodPairs = wordPairs
  .filter(({ arm, translit }) => {
    const ratio = arm.length / translit.length;
    return ratio >= 0.6 && ratio <= 1.5 && arm.length > 2;
  })
  .slice(0, 200);

fs.writeFileSync(path.join(analysisDir, 'word-pairs.json'), JSON.stringify(wordPairs.slice(0, 1000), null, 2) + '\n');
fs.writeFileSync(path.join(analysisDir, 'good-pairs.json'), JSON.stringify(goodPairs, null, 2) + '\n');

console.log(`Saved ${Math.min(wordPairs.length, 1000)} word pairs to corpus/analysis/word-pairs.json`);
console.log(`Saved ${goodPairs.length} aligned pairs to corpus/analysis/good-pairs.json`);

console.log('\n=== Armenian Characters By Frequency ===');
Object.entries(characterFrequency)
  .sort((left, right) => right[1] - left[1])
  .forEach(([ch, count]) => {
    const code = ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0');
    console.log(`U+${code} ${ch} : ${count}`);
  });

console.log('\n=== First-Letter Mappings ===');
Object.entries(firstLetterMap)
  .sort((left, right) => {
    const leftTotal = Object.values(left[1]).reduce((sum, value) => sum + value, 0);
    const rightTotal = Object.values(right[1]).reduce((sum, value) => sum + value, 0);
    return rightTotal - leftTotal;
  })
  .forEach(([ch, mappings]) => {
    const summary = Object.entries(mappings)
      .sort((left, right) => right[1] - left[1])
      .slice(0, 3)
      .map(([latin, count]) => `${latin}(${count})`)
      .join(', ');

    console.log(`${ch} -> ${summary}`);
  });
