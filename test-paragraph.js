const fs = require('fs');
const { transliterate } = require('./src/translit.js');

const html = fs.readFileSync('/Users/oshii/.openclaw/media/inbound/divine-liturgy-grabar-translit---e5a4fe1a-2422-416f-8dbf-66003aac7a55.html', 'utf-8');

// Extract paragraph-level pairs
const regex = /\u003cdiv class="lang-content"\u003e\s*\u003cp\u003e([\s\S]*?)\u003c\/p\u003e\s*\u003c\/div\u003e\s*\u003c\/div\u003e\s*\u003cdiv class="lang"\u003e\s*\u003cdiv class="lang-content"\u003e\s*\u003cp\u003e([\s\S]*?)\u003c\/p\u003e/g;

let totalPara = 0, exactPara = 0, nearPara = 0, badPara = [];
let totalWords = 0, exactWords = 0;

let m;
while ((m = regex.exec(html)) !== null) {
  const armPara = m[1].replace(/\s+/g, ' ').trim();
  const engPara = m[2].replace(/\s+/g, ' ').trim();
  if (!armPara || !engPara) continue;

  totalPara++;
  const generated = transliterate(armPara);

  // Normalize both for comparison
  const normGen = generated.toLowerCase().replace(/[.,:;!?]/g, '');
  const normExp = engPara.toLowerCase().replace(/[.,:;!?]/g, '');

  if (normGen === normExp) {
    exactPara++;
  } else {
    const dist = levenshtein(normGen, normExp);
    if (dist / Math.max(normGen.length, normExp.length) < 0.15) {
      nearPara++;
    } else {
      if (badPara.length < 15) {
        badPara.push({
          arm: armPara.slice(0, 80),
          exp: engPara.slice(0, 80),
          got: generated.slice(0, 80),
        });
      }
    }
  }

  // Word-level comparison inside paragraphs
  const genWords = generated.split(/\s+/).map(w => w.replace(/[.,:;!?]/g, ''));
  const expWords = engPara.split(/\s+/).map(w => w.replace(/[.,:;!?]/g, ''));
  const minLen = Math.min(genWords.length, expWords.length);
  for (let i = 0; i < minLen; i++) {
    if (genWords[i] && expWords[i]) totalWords++;
    if (genWords[i].toLowerCase() === expWords[i].toLowerCase()) exactWords++;
  }
}

function levenshtein(a, b) {
  const m = [];
  for (let i = 0; i <= b.length; i++) m[i] = [i];
  for (let j = 0; j <= a.length; j++) m[0][j] = j;
  for (let i = 1; i <= b.length; i++)
    for (let j = 1; j <= a.length; j++)
      m[i][j] = b[i-1] === a[j-1] ? m[i-1][j-1] : Math.min(m[i-1][j-1]+1, m[i][j-1]+1, m[i-1][j]+1);
  return m[b.length][a.length];
}

console.log('\n=== PARAGRAPH-LEVEL ACCURACY ===');
console.log(`Total paragraphs: ${totalPara}`);
console.log(`Exact matches:    ${exactPara} (${(exactPara/totalPara*100).toFixed(1)}%)`);
console.log(`Near matches:     ${nearPara} (${(nearPara/totalPara*100).toFixed(1)}%)`);
console.log(`Off by >15%:     ${totalPara - exactPara - nearPara}`);

console.log('\n=== WORD-LEVEL ACCURACY (aligned by paragraph) ===');
console.log(`Words compared: ${totalWords}`);
console.log(`Exact matches:  ${exactWords} (${(exactWords/totalWords*100).toFixed(1)}%)`);

console.log('\n=== BAD PARAGRAPHS (first 15) ===');
badPara.forEach(({ arm, exp, got }) => {
  console.log(`\n[ARM] ${arm}`);
  console.log(`[EXP] ${exp}`);
  console.log(`[GOT] ${got}`);
});
