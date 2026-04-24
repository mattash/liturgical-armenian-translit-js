const test = require('node:test');
const assert = require('node:assert/strict');

const { transliterate, transliterateWord } = require('../src/translit');

test('phase 1 dictionary cleanup remains intact', () => {
  assert.equal(transliterateWord('զփառս'), 'uzparus');
  assert.equal(transliterateWord('Նովաւ'), 'Novav');
  assert.equal(transliterateWord('մարդկան'), 'martgan');
  assert.equal(transliterateWord('զեկեղեցի'), 'zegeghetzi');
});

test('phase 2 fallback regressions stay fixed for uncovered words', () => {
  assert.equal(transliterateWord('նազելի'), 'nazeli');
  assert.equal(transliterateWord('Մտէք'), 'Mudek');
  assert.equal(transliterateWord('փրկեսցէ'), 'purgestseh');
  assert.equal(transliterateWord('ողորմութեան'), 'oghormutyan');
  assert.equal(transliterateWord('զգեստաւորեցեր'), 'zkesdavoretser');
});

test('stable liturgical API examples remain unchanged', () => {
  assert.equal(
    transliterate('Տէր Աստուած մեր, կեցո՛ զմեզ եւ ողորմեա՛։'),
    'Der Asdvadz mer, getzo uzmez yev voghormia'
  );
  assert.equal(
    transliterate('Ամէն: Եւ ընդ հոգւոյդ քում:'),
    'Amen: Yev unt hokvooyt koom:'
  );
});

test('known corpus-variant forms stay on the current canonical side', () => {
  assert.equal(transliterateWord('ողորմեա'), 'voghormia');
  assert.equal(transliterateWord('զմեզ'), 'uzmez');
  assert.equal(transliterateWord('Տեառն'), 'Diarn');
  assert.equal(transliterateWord('քաւութիւն'), 'kavootyun');
});
