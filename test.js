const fs = require('fs');
const { transliterate } = require('./src/translit.js');

const html = fs.readFileSync('/Users/oshii/.openclaw/media/inbound/divine-liturgy-grabar-translit---e5a4fe1a-2422-416f-8dbf-66003aac7a55.html', 'utf-8');

const regex = /\u003cdiv class="lang-content"\u003e\s*\u003cp\u003e([\s\S]*?)\u003c\/p\u003e\s*\u003c\/div\u003e\s*\u003c\/div\u003e\s*\u003cdiv class="lang"\u003e\s*\u003cdiv class="lang-content"\u003e\s*\u003cp\u003e([\s\S]*?)\u003c\/p\u003e/g;

let total = 0, exact = 0, near = 0, miss = 0;
const bad = [];

let m;
while ((m = regex.exec(html)) !== null) {
  const arm = m[1].replace(/\s+/g, ' ').trim();
  const eng = m[2].replace(/\s+/g, ' ').trim();
  if (!arm || !eng) continue;
  
  const armWords = arm.split(/\s+/).filter(w => w.length > 0);
  const engWords = eng.split(/\s+/).filter(w => w.length > 0);
  const minLen = Math.min(armWords.length, engWords.length);
  
  for (let i = 0; i < minLen; i++) {
    const a = armWords[i].replace(/[.,:;!?()]/g, '');
    const e = engWords[i].replace(/[.,:;!?()]/g, '');
    if (!a || !e || a.length < 2) continue;
    
    total++;
    const got = transliterate(a);
    
    if (got.toLowerCase() === e.toLowerCase()) exact++;
    else if (levenshtein(got.toLowerCase(), e.toLowerCase()) <= 2) near++;
    else { miss++; if (bad.length < 30) bad.push({ a, e, got }); }
  }
}

function levenshtein(a, b) {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      matrix[i][j] = b[i-1] === a[j-1] ? matrix[i-1][j-1] : Math.min(
        matrix[i-1][j-1]+1, matrix[i][j-1]+1, matrix[i-1][j]+1
      );
    }
  }
  return matrix[b.length][a.length];
}

console.log('\n=== TRANSLITERATION TEST RESULTS ===');
console.log(`Total word pairs tested: ${total}`);
console.log(`Exact matches:         ${exact} (${(exact/total*100).toFixed(1)}%)`);
console.log(`Near matches (≤2LD): ${near}  (${(near/total*100).toFixed(1)}%)`);
console.log(`Mismatches:            ${miss} (${(miss/total*100).toFixed(1)}%)`);
console.log(`Combined accurate:     ${exact+near} (${((exact+near)/total*100).toFixed(1)}%)`);

console.log('\n=== SAMPLE MISMATCHES (first 20) ===');
bad.forEach(({ a, e, got }) => {
  console.log(`  ${a.padEnd(25)} expected: ${e.padEnd(20)} got: ${got}`);
});
