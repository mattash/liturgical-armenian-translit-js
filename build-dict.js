const fs = require('fs');
const path = require('path');

const { extractWordPairs, loadCorpus } = require('./corpus');

const corpus = loadCorpus();
const wordPairs = extractWordPairs(corpus);

const aggregated = {};

wordPairs.forEach(({ arm, translit }) => {
  const key = arm.toLowerCase();

  if (!aggregated[key]) {
    aggregated[key] = { arm, frequency: 0, transliterations: {} };
  }

  aggregated[key].frequency += 1;
  aggregated[key].transliterations[translit] = (aggregated[key].transliterations[translit] || 0) + 1;
});

function pickBestTransliteration(transliterations) {
  return Object.entries(transliterations)
    .sort((left, right) => right[1] - left[1])[0][0];
}

const bestMappings = {};
const exactMappings = {};

Object.entries(aggregated).forEach(([key, entry]) => {
  const bestTransliteration = pickBestTransliteration(entry.transliterations);
  bestMappings[key] = bestTransliteration;
  exactMappings[entry.arm] = bestTransliteration;
});

const compactMappings = {};

Object.entries(bestMappings).forEach(([key, translit]) => {
  if (key.length >= 3 || aggregated[key].frequency > 1) {
    compactMappings[key] = translit;
  }
});

const outputDir = path.join(__dirname, 'corpus', 'derived');
fs.mkdirSync(outputDir, { recursive: true });

fs.writeFileSync(path.join(outputDir, 'dictionary.json'), JSON.stringify(bestMappings, null, 2) + '\n');
fs.writeFileSync(path.join(outputDir, 'exact-dictionary.json'), JSON.stringify(exactMappings, null, 2) + '\n');
fs.writeFileSync(path.join(outputDir, 'compact-dictionary.json'), JSON.stringify(compactMappings, null, 2) + '\n');

console.log(`Built dictionaries from ${corpus.parts.length} corpus segments.`);
console.log(`Unique words: ${Object.keys(bestMappings).length}`);
console.log(`Compact dictionary entries: ${Object.keys(compactMappings).length}`);
console.log('Wrote derived artifacts to corpus/derived/.');
