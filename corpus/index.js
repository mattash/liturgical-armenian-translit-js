const fs = require('fs');
const path = require('path');

const DEFAULT_CORPUS_PATH = path.join(__dirname, 'divine-liturgy.json');
const ARMENIAN_PUNCTUATION_RE = /[՛՜՝՞։]/g;
const COMMON_PUNCTUATION_RE = /[.,:;!?()[\]"/-]/g;
const DEFAULT_GAP_COST = 0.95;

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

function normalizedEditDistance(left, right) {
  const a = normalizeForComparison(left);
  const b = normalizeForComparison(right);

  if (a === b) {
    return 0;
  }

  if (!a.length || !b.length) {
    return 1;
  }

  const matrix = Array.from({ length: b.length + 1 }, () => Array(a.length + 1).fill(0));

  for (let row = 0; row <= b.length; row += 1) {
    matrix[row][0] = row;
  }

  for (let column = 0; column <= a.length; column += 1) {
    matrix[0][column] = column;
  }

  for (let row = 1; row <= b.length; row += 1) {
    for (let column = 1; column <= a.length; column += 1) {
      matrix[row][column] = b[row - 1] === a[column - 1]
        ? matrix[row - 1][column - 1]
        : Math.min(
            matrix[row - 1][column - 1] + 1,
            matrix[row][column - 1] + 1,
            matrix[row - 1][column] + 1
          );
    }
  }

  return matrix[b.length][a.length] / Math.max(a.length, b.length);
}

function alignTokenSequences(sourceTokens, targetTokens, options = {}) {
  const {
    gapCost = DEFAULT_GAP_COST,
    getSubstitutionCost = (source, target) => normalizedEditDistance(source, target) * 2,
    isMatch = (source, target) => normalizeForComparison(source) === normalizeForComparison(target),
  } = options;

  const matrix = Array.from(
    { length: sourceTokens.length + 1 },
    () => Array(targetTokens.length + 1).fill(null)
  );

  matrix[0][0] = { cost: 0, previous: null, operation: null };

  for (let row = 1; row <= sourceTokens.length; row += 1) {
    matrix[row][0] = {
      cost: matrix[row - 1][0].cost + gapCost,
      previous: [row - 1, 0],
      operation: { type: 'delete', source: sourceTokens[row - 1], target: null, cost: gapCost },
    };
  }

  for (let column = 1; column <= targetTokens.length; column += 1) {
    matrix[0][column] = {
      cost: matrix[0][column - 1].cost + gapCost,
      previous: [0, column - 1],
      operation: { type: 'insert', source: null, target: targetTokens[column - 1], cost: gapCost },
    };
  }

  for (let row = 1; row <= sourceTokens.length; row += 1) {
    for (let column = 1; column <= targetTokens.length; column += 1) {
      const source = sourceTokens[row - 1];
      const target = targetTokens[column - 1];
      const substitutionCost = getSubstitutionCost(source, target);

      const candidates = [
        {
          cost: matrix[row - 1][column - 1].cost + substitutionCost,
          previous: [row - 1, column - 1],
          operation: {
            type: isMatch(source, target) ? 'match' : 'replace',
            source,
            target,
            cost: substitutionCost,
          },
        },
        {
          cost: matrix[row - 1][column].cost + gapCost,
          previous: [row - 1, column],
          operation: { type: 'delete', source, target: null, cost: gapCost },
        },
        {
          cost: matrix[row][column - 1].cost + gapCost,
          previous: [row, column - 1],
          operation: { type: 'insert', source: null, target, cost: gapCost },
        },
      ];

      matrix[row][column] = candidates.reduce((best, candidate) => (
        !best || candidate.cost < best.cost ? candidate : best
      ), null);
    }
  }

  const operations = [];
  let row = sourceTokens.length;
  let column = targetTokens.length;

  while (row > 0 || column > 0) {
    const cell = matrix[row][column];
    operations.push(cell.operation);
    [row, column] = cell.previous;
  }

  return {
    cost: matrix[sourceTokens.length][targetTokens.length].cost,
    operations: operations.reverse(),
  };
}

function getArmenianWordAlignmentCost(armWord, translitWord) {
  const { transliterateByRules, transliterateWord } = require('../src/translit');
  return Math.min(
    normalizedEditDistance(transliterateWord(armWord), translitWord),
    normalizedEditDistance(transliterateByRules(armWord), translitWord)
  ) * 2;
}

function alignArmenianToTranslitWords(grabarText, translitText) {
  const armWords = tokenizeWords(grabarText);
  const translitWords = tokenizeWords(translitText);

  return alignTokenSequences(armWords, translitWords, {
    getSubstitutionCost: (armWord, translitWord) => getArmenianWordAlignmentCost(armWord, translitWord),
  });
}

function extractWordPairs(corpus = loadCorpus(), options = {}) {
  const { maxDistance = 0.6 } = options;
  const pairs = [];

  getParallelParts(corpus).forEach(({ grabar, translit }) => {
    alignArmenianToTranslitWords(grabar, translit).operations.forEach((operation) => {
      if (operation.type === 'insert' || operation.type === 'delete') {
        return;
      }

      const distance = operation.cost / 2;
      if (distance <= maxDistance) {
        pairs.push({
          arm: operation.source,
          translit: operation.target,
          distance,
        });
      }
    });
  });

  return pairs;
}

module.exports = {
  DEFAULT_CORPUS_PATH,
  alignArmenianToTranslitWords,
  alignTokenSequences,
  extractWordPairs,
  getParallelParts,
  loadCorpus,
  normalizedEditDistance,
  normalizeForComparison,
  normalizeWhitespace,
  stripWordPunctuation,
  tokenizeWords,
};
