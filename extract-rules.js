const fs = require('fs');
const cheerio = require('cheerio');

// Read the HTML file
const html = fs.readFileSync('/Users/oshii/.openclaw/media/inbound/divine-liturgy-grabar-translit---e5a4fe1a-2422-416f-8dbf-66003aac7a55.html', 'utf-8');
const $ = cheerio.load(html);

const pairs = [];

// Extract all parallel lang blocks
$('.langs').each((i, el) => {
  const langs = $(el).find('.lang-content p');
  if (langs.length >= 2) {
    const arm = $(langs[0]).text().trim().replace(/\s+/g, ' ');
    const eng = $(langs[1]).text().trim().replace(/\s+/g, ' ');
    if (arm && eng && arm.length > 5) {
      pairs.push({ arm, eng });
    }
  }
});

console.log(`Found ${pairs.length} parallel paragraphs`);

// Word-level extraction
const wordPairs = [];
pairs.forEach(({ arm, eng }) => {
  const armWords = arm.split(/\s+/).filter(w => w.length > 0);
  const engWords = eng.split(/\s+/).filter(w => w.length > 0);
  const minLen = Math.min(armWords.length, engWords.length);
  for (let i = 0; i < minLen; i++) {
    const a = armWords[i].replace(/[.,:;!?()]/g, '');
    const e = engWords[i].replace(/[.,:;!?()]/g, '');
    if (a && e && a.length > 1) {
      wordPairs.push({ a, e });
    }
  }
});

// Extract character mappings with context
const charMappings = {}; // armChar -> { translit: count }
const sequences = {}; // multi-char patterns

wordPairs.forEach(({ a, e }) => {
  // Simple heuristic: scan both and find longest matching substrings
  // For now, collect first-letter and last-letter mappings
  const firstCh = a[0];
  const firstEng = e.slice(0, Math.min(3, e.length));
  
  if (!charMappings[firstCh]) charMappings[firstCh] = {};
  charMappings[firstCh][firstEng] = (charMappings[firstCh][firstEng] || 0) + 1;
  
  // Collect all unique Armenian chars
  for (const ch of a) {
    if (ch.trim()) {
      const code = ch.codePointAt(0);
      if (code >= 0x0530 && code <= 0x058F) {
        if (!sequences[ch]) sequences[ch] = 0;
        sequences[ch]++;
      }
    }
  }
});

console.log('\n=== ARMENIAN CHARACTERS BY FREQUENCY ===');
Object.entries(sequences)
  .sort((a, b) => b[1] - a[1])
  .forEach(([ch, count]) => {
    const code = ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0');
    console.log(`U+${code} ${ch} : ${count}`);
  });

console.log('\n=== FIRST-LETTER MAPPINGS (top candidates) ===');
Object.entries(charMappings)
  .sort((a, b) => Object.values(b[1]).reduce((s, v) => s + v, 0) - Object.values(a[1]).reduce((s, v) => s + v, 0))
  .forEach(([ch, mappings]) => {
    const sorted = Object.entries(mappings).sort((a, b) => b[1] - a[1]).slice(0, 3);
    if (sorted.length > 0) {
      console.log(`${ch} → ${sorted.map(([k, v]) => `${k}(${v})`).join(', ')}`);
    }
  });

// Save all pairs
fs.writeFileSync('word-pairs.json', JSON.stringify(wordPairs.slice(0, 1000), null, 2));
console.log('\nSaved', wordPairs.length, 'word pairs to word-pairs.json');

// Now let's derive a comprehensive mapping table by aligning known words
// We'll use a heuristic approach: find words where Armenian and transliteration lengths are similar
const goodPairs = wordPairs.filter(({ a, e }) => {
  const ratio = a.length / e.length;
  return ratio >= 0.6 && ratio <= 1.5 && a.length > 2;
}).slice(0, 200);

fs.writeFileSync('good-pairs.json', JSON.stringify(goodPairs, null, 2));
console.log('Saved', goodPairs.length, 'good aligned pairs to good-pairs.json');
