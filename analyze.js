const fs = require('fs');

const html = fs.readFileSync('/Users/oshii/.openclaw/media/inbound/divine-liturgy-grabar-translit---e5a4fe1a-2422-416f-8dbf-66003aac7a55.html', 'utf-8');

// Simple regex extraction - find all Armenian/English parallel paragraphs
const regex = /<div class="lang-content">\s*<p>([\s\S]*?)<\/p>\s*<\/div>\s*<\/div>\s*<div class="lang">\s*<div class="lang-content">\s*<p>([\s\S]*?)<\/p>/g;

const pairs = [];
let match;
while ((match = regex.exec(html)) !== null) {
  const arm = match[1].replace(/\s+/g, ' ').trim();
  const eng = match[2].replace(/\s+/g, ' ').trim();
  if (arm && eng) pairs.push({ arm, eng });
}

console.log(`Found ${pairs.length} parallel blocks`);

// Extract word pairs
const pairsList = [];
pairs.forEach(({ arm, eng }) => {
  const aWords = arm.split(/\s+/).filter(w => w.length > 0);
  const eWords = eng.split(/\s+/).filter(w => w.length > 0);
  const minLen = Math.min(aWords.length, eWords.length);
  for (let i = 0; i < minLen; i++) {
    const a = aWords[i].replace(/[.,:;!?()]/g, '');
    const e = eWords[i].replace(/[.,:;!?()]/g, '');
    if (a && e && a.length > 1 && e.length > 1) {
      pairsList.push({ a, e });
    }
  }
});

console.log(`Total word pairs: ${pairsList.length}`);

// Find Armenian character frequency
const freq = {};
pairsList.forEach(({ a }) => {
  for (const ch of a) {
    const cp = ch.codePointAt(0);
    if (cp >= 0x0530 && cp <= 0x058F) {
      freq[ch] = (freq[ch] || 0) + 1;
    }
  }
});

console.log('\n=== Armenian Character Frequencies ===');
Object.entries(freq)
  .sort((a, b) => b[1] - a[1])
  .forEach(([ch, count]) => {
    console.log(`  ${ch} : ${count}`);
  });

// Extract unique first-letter mappings
const firstLetterMap = {};
pairsList.forEach(({ a, e }) => {
  const firstCh = a[0];
  const cp = firstCh.codePointAt(0);
  if (cp >= 0x0530 && cp <= 0x058F) {
    if (!firstLetterMap[firstCh]) firstLetterMap[firstCh] = {};
    const engStart = e.slice(0, Math.min(3, e.length));
    firstLetterMap[firstCh][engStart] = (firstLetterMap[firstCh][engStart] || 0) + 1;
  }
});

console.log('\n=== First Letter Mappings ===');
Object.entries(firstLetterMap)
  .sort((a, b) => Object.values(b[1]).reduce((s, v) => s + v, 0) - Object.values(a[1]).reduce((s, v) => s + v, 0))
  .forEach(([ch, mappings]) => {
    const top = Object.entries(mappings).sort((a, b) => b[1] - a[1]).slice(0, 5);
    console.log(`${ch} → ${top.map(([k, v]) => `${k}(${v})`).join(', ')}`);
  });

fs.writeFileSync('word-pairs.json', JSON.stringify(pairsList.slice(0, 500), null, 2));
console.log('\nSaved 500 word pairs to word-pairs.json');

// Try to derive complete letter mapping with context rules
console.log('\n=== Deriving Letter Mapping ===');
const deduced = {};
pairsList.forEach(({ a, e }) => {
  if (a.length >= 3 && e.length >= 3) {
    if (a.startsWith('Աստ')) {
      // Աստուած → Asdvadz
      // Ա=A, ս=s, տ=d/t, ւ=..., ա=a, ց=dz/ts, 
    }
  }
});
