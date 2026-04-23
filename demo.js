const { transliterate, transliterateWord } = require('./src/translit.js');

const SAMPLES = [
  // From the Divine Liturgy
  'Տէր Աստուած մեր, կեցո՛ զմեզ եւ ողորմեա՛։',
  'Խորհուրդ խորին, անհաս անսկիզբն',
  'Սուրբ Աստուած, սուրբ եւ հզօր, սուրբ եւ անմահ',
  'Հաւատամք ի մի Աստուած, ի Հայրն ամենակալ',
  'Մարմին դերունական եւ արիւն փրկչական',
  'Ամէն։ Եւ ընդ հոգւոյդ քում',
  'Զի Քո է կարողութիւն եւ զօրութիւն',
  // Hymn
  'Սուրբ Աստուած, սուրբ եւ հզօր, սուրբ եւ անմահ',
];

console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║   LITURGICAL ARMENIAN TRANSLITERATION — DEMO               ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

SAMPLES.forEach((arm) => {
  const eng = transliterate(arm);
  console.log('─'.repeat(64));
  console.log('ARM:', arm);
  console.log('ENG:', eng);
  console.log();
});

console.log('─'.repeat(64));
console.log('WORD-BY-WORD EXAMPLES:');
const WORDS = ['Աստուած', 'կեցո', 'սուրբ', 'խաղաղութիւն', 'Միածին', 'փառք', 'ամեն', 'բարեխօսութեամբ'];
WORDS.forEach(w => {
  console.log(`  ${w.padEnd(18)} → ${transliterateWord(w)}`);
});
