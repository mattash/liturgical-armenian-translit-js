const fs = require('fs');

const html = fs.readFileSync('/Users/oshii/.openclaw/media/inbound/divine-liturgy-grabar-translit---e5a4fe1a-2422-416f-8dbf-66003aac7a55.html', 'utf-8');

// Extract word pairs from the HTML
const regex = /\u003cdiv class="lang-content"\u003e\s*\u003cp\u003e([\s\S]*?)\u003c\/p\u003e\s*\u003c\/div\u003e\s*\u003c\/div\u003e\s*\u003cdiv class="lang"\u003e\s*\u003cdiv class="lang-content"\u003e\s*\u003cp\u003e([\s\S]*?)\u003c\/p\u003e/g;

const dict = {};
let match;

while ((match = regex.exec(html)) !== null) {
  const arm = match[1].replace(/\s+/g, ' ').trim();
  const eng = match[2].replace(/\s+/g, ' ').trim();
  
  if (!arm || !eng) continue;
  
  const armWords = arm.split(/\s+/).filter(w => w.length > 0);
  const engWords = eng.split(/\s+/).filter(w => w.length > 0);
  const minLen = Math.min(armWords.length, engWords.length);
  
  for (let i = 0; i < minLen; i++) {
    const a = armWords[i].replace(/[.,:;!?()՛՜՝՞։]/g, '');
    const e = engWords[i].replace(/[.,:;!?()]/g, '');
    if (!a || !e) continue;
    
    // Normalize case for lookup
    const key = a.toLowerCase();
    if (!dict[key]) {
      dict[key] = { arm: a, freq: 0, trans: {} };
    }
    dict[key].freq++;
    const elc = e.toLowerCase();
    dict[key].trans[elc] = (dict[key].trans[elc] || 0) + 1;
    // Use most frequent transliteration for each case variant
  }
}

// Pick best transliteration for each word
const bestMappings = {};
Object.entries(dict).forEach(([key, data]) => {
  const bestTransliteration = Object.entries(data.trans)
    .sort((a, b) => b[1] - a[1])[0][0];
  
  // Preserve original case where it matters
  bestMappings[key] = bestTransliteration;
});

// Also preserve case variants (original Armenian with original transliteration)
const exactMappings = {};
Object.entries(dict).forEach(([key, data]) => {
  const bestTransliteration = Object.entries(data.trans)
    .sort((a, b) => b[1] - a[1])[0][0];
  exactMappings[data.arm] = bestTransliteration;
});

console.log(`Built dictionary with ${Object.keys(bestMappings).length} unique words`);

// Save full dictionary
fs.writeFileSync('dictionary.json', JSON.stringify(bestMappings, null, 2));
fs.writeFileSync('exact-dictionary.json', JSON.stringify(exactMappings, null, 2));

// Also create a compact version (only words with freq > 1 or longer than 3 chars)
const compact = {};
Object.entries(bestMappings).forEach(([k, v]) => {
  if (k.length >= 3 || dict[k].freq > 1) {
    compact[k] = v;
  }
});
fs.writeFileSync('compact-dictionary.json', JSON.stringify(compact, null, 2));
console.log(`Dictionary sizes — full: ${Object.keys(bestMappings).length}, compact: ${Object.keys(compact).length}`);
