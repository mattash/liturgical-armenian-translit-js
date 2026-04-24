const test = require('node:test');
const assert = require('node:assert/strict');

const {
  loadDictionary,
  transliterate,
  transliterateByRules,
  transliterateWord,
} = require('../src/translit');

test('transliterateWord uses dictionary matches for common liturgical words', () => {
  assert.equal(transliterateWord('Աստուած'), 'Asdvadz');
  assert.equal(transliterateWord('կեցո'), 'getzo');
  assert.equal(transliterateWord('սուրբ'), 'soorp');
});

test('curated overrides supersede poisoned mined dictionary entries', () => {
  assert.equal(transliterateWord('զփառս'), 'uzparus');
  assert.equal(transliterateWord('Նովաւ'), 'Novav');
  assert.equal(transliterateWord('մարդկան'), 'martgan');
});

test('transliterate preserves surrounding Latin text and punctuation boundaries', () => {
  assert.equal(
    transliterate('Psalm 50: Ողորմեա՛ զիս, Աստուա՛ծ։'),
    'Psalm 50: Voghormia zis, Asdvadz'
  );
});

test('transliterateByRules remains available for deterministic fallback behavior', () => {
  assert.equal(transliterateByRules('խաղաղութիւն'), 'khaghaghootyun');
});

test('loadDictionary merges custom entries into live lookups', () => {
  loadDictionary({
    Մահր: 'Mahr',
    գետ: 'get',
  });

  assert.equal(transliterateWord('Մահր'), 'Mahr');
  assert.equal(transliterateWord('գետ'), 'get');
});

test('loadDictionary validates input shape', () => {
  assert.throws(() => loadDictionary(null), /expects an object map/);
  assert.throws(() => loadDictionary({ foo: '' }), /must not be empty/);
});
