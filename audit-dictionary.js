const fs = require('fs');
const path = require('path');

const {
  extractWordPairs,
  loadCorpus,
  normalizedEditDistance,
} = require('./corpus');

const baseDictionary = require('./src/dictionary.json');
const overrideDictionary = require('./src/dictionary-overrides.json');
const activeDictionary = { ...baseDictionary, ...overrideDictionary };

const corpus = loadCorpus();
const alignedPairs = extractWordPairs(corpus, { maxDistance: 0.55 });

const variantsByWord = new Map();

alignedPairs.forEach(({ arm, translit, distance }) => {
  const key = arm.toLowerCase();

  if (!variantsByWord.has(key)) {
    variantsByWord.set(key, {
      arm,
      total: 0,
      distances: [],
      variants: new Map(),
    });
  }

  const entry = variantsByWord.get(key);
  entry.total += 1;
  entry.distances.push(distance);
  entry.variants.set(translit, (entry.variants.get(translit) || 0) + 1);
});

const report = {
  corpus: corpus.name,
  aligned_pairs: alignedPairs.length,
  summary: {
    poisoned_entries: 0,
    override_candidates: 0,
    variant_conflicts: 0,
    low_confidence_entries: 0,
    missing_dictionary_entries: 0,
  },
  poisoned_entries: [],
  override_candidates: [],
  variant_conflicts: [],
  low_confidence_entries: [],
  missing_dictionary_entries: [],
};

for (const [word, stats] of variantsByWord.entries()) {
  const variants = Array.from(stats.variants.entries()).sort((left, right) => right[1] - left[1]);
  const [topVariant, topCount] = variants[0];
  const secondCount = variants[1] ? variants[1][1] : 0;
  const topShare = topCount / stats.total;
  const averageDistance = stats.distances.reduce((sum, value) => sum + value, 0) / stats.distances.length;
  const dictionaryValue = activeDictionary[word];
  const dictionaryDistance = dictionaryValue === undefined
    ? null
    : normalizedEditDistance(dictionaryValue, topVariant);

  const item = {
    word,
    surface: stats.arm,
    total: stats.total,
    top_variant: topVariant,
    top_count: topCount,
    top_share: Number(topShare.toFixed(3)),
    average_alignment_distance: Number(averageDistance.toFixed(3)),
    dictionary_value: dictionaryValue || null,
    dictionary_distance: dictionaryDistance === null ? null : Number(dictionaryDistance.toFixed(3)),
    variants: variants.slice(0, 6).map(([variant, count]) => ({ variant, count })),
  };

  if (!dictionaryValue) {
    if (topShare >= 0.7 && topCount >= 2) {
      report.summary.missing_dictionary_entries += 1;
      report.missing_dictionary_entries.push(item);
    }
    continue;
  }

  if (topShare < 0.6 || stats.total < 3) {
    report.summary.low_confidence_entries += 1;
    report.low_confidence_entries.push(item);
    continue;
  }

  if (secondCount >= 2 && topShare < 0.75) {
    report.summary.variant_conflicts += 1;
    report.variant_conflicts.push(item);
    continue;
  }

  if (dictionaryDistance !== null && dictionaryDistance >= 0.55 && topCount >= 2) {
    report.summary.poisoned_entries += 1;
    report.poisoned_entries.push(item);
    continue;
  }

  if (dictionaryDistance !== null && dictionaryDistance >= 0.2 && topShare >= 0.7 && topCount >= 3) {
    report.summary.override_candidates += 1;
    report.override_candidates.push(item);
  }
}

report.poisoned_entries.sort((left, right) => right.total - left.total);
report.override_candidates.sort((left, right) => right.total - left.total);
report.variant_conflicts.sort((left, right) => right.total - left.total);
report.low_confidence_entries.sort((left, right) => right.total - left.total);
report.missing_dictionary_entries.sort((left, right) => right.total - left.total);

const outputDir = path.join(__dirname, 'corpus', 'analysis');
fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(path.join(outputDir, 'dictionary-audit.json'), JSON.stringify(report, null, 2) + '\n');

console.log(`Aligned word pairs audited: ${alignedPairs.length}`);
console.log('\n=== Dictionary Audit Summary ===');
Object.entries(report.summary).forEach(([key, value]) => {
  console.log(`${key}: ${value}`);
});

printSection('Likely poisoned entries', report.poisoned_entries);
printSection('Stable override candidates', report.override_candidates);
printSection('Variant conflicts', report.variant_conflicts);
printSection('Missing dictionary entries', report.missing_dictionary_entries);

function printSection(title, entries) {
  console.log(`\n=== ${title} ===`);
  entries.slice(0, 12).forEach((entry) => {
    const variants = entry.variants.map(({ variant, count }) => `${variant}(${count})`).join(', ');
    console.log(
      `${entry.word}: dict=${entry.dictionary_value || 'none'} top=${entry.top_variant} ` +
      `share=${entry.top_share} variants=[${variants}]`
    );
  });
}
