const { transliterateWord } = require('./src/translit.js');

const tests = [
  'Աստուած',
  'կեցո',
  'անմատոյց',
  'զվերին',
  'սուրբ',
  'խորհուրդ',
  'հոգւոյն',
  'անսկիզբն',
];

tests.forEach(w => {
  const result = transliterateWord(w);
  console.log(`${w} (${[...w].map(c => 'U+'+c.codePointAt(0).toString(16).toUpperCase()).join(' ')}) => ${result}`);
});
