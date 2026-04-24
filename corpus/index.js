const fs = require('fs');
const path = require('path');

const DEFAULT_CORPUS_PATH = path.join(__dirname, 'divine-liturgy.json');
const ARMENIAN_PUNCTUATION_RE = /[՛՜՝՞։]/g;
const COMMON_PUNCTUATION_RE = /[.,:;!?()[\]"/-]/g;

function normalizeWhitespace(text) {
  return String(text || '')
    .replace(/\r\n/g, '\n')
    .replace(/\s+/g, ' ')
    .trim();
}

function loadCorpus(corpusPath = DEFAULT_CORPUS_PATH) {
  return JSON.parse(fs.readFileSync(corpusPath, 'utf8'));
}

function getParallelParts(corpus = loadCorpus()) {
  return corpus.parts
    .filter((part) => part.grabar && part.translit)
    .map((part) => ({
      ...part,
      grabar: normalizeWhitespace(part.grabar),
      translit: normalizeWhitespace(part.translit),
      en: normalizeWhitespace(part.en),
    }));
}

function stripWordPunctuation(word) {
  return normalizeWhitespace(word)
    .replace(ARMENIAN_PUNCTUATION_RE, '')
    .replace(COMMON_PUNCTUATION_RE, '');
}

function tokenizeWords(text) {
  return normalizeWhitespace(text)
    .split(/\s+/)
    .map(stripWordPunctuation)
    .filter(Boolean);
}

function normalizeForComparison(text) {
  return normalizeWhitespace(text)
    .toLowerCase()
    .replace(ARMENIAN_PUNCTUATION_RE, '')
    .replace(COMMON_PUNCTUATION_RE, '');
}

function extractWordPairs(corpus = loadCorpus()) {
  const pairs = [];

  getParallelParts(corpus).forEach(({ grabar, translit }) => {
    const armWords = tokenizeWords(grabar);
    const translitWords = tokenizeWords(translit);
    const limit = Math.min(armWords.length, translitWords.length);

    for (let index = 0; index < limit; index += 1) {
      const arm = armWords[index];
      const latin = translitWords[index];

      if (arm && latin) {
        pairs.push({ arm, translit: latin });
      }
    }
  });

  return pairs;
}

module.exports = {
  DEFAULT_CORPUS_PATH,
  extractWordPairs,
  getParallelParts,
  loadCorpus,
  normalizeForComparison,
  normalizeWhitespace,
  stripWordPunctuation,
  tokenizeWords,
};
