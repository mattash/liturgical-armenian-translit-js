/**
 * Liturgical Armenian (Grabar/Classical) to English Transliteration
 * 
 * Hybrid approach:
 * 1. Dictionary lookup for ~1,000 known liturgical words
 * 2. Rule-based fallback for unknown words using Western Armenian pronunciation
 * 
 * Characteristics:
 * - Follows Western Armenian voicing shifts (բ=p, պ=b, գ=k, կ=g, դ=t, տ=d)
 * - Handles classical digraphs (ու=oo, աւ=av, եւ=yev, իւ=yu)
 * - Recognizes liturgical article prefix զ as "uz" or "z"
 * - Preserves word capitalization
 */

const dictionary = require('./dictionary.json');

// Fast lookup maps
const exactMap = new Map();
const lowerMap = new Map();
function setDictionaryEntry(arm, trans) {
  exactMap.set(arm, trans);
  lowerMap.set(arm.toLowerCase(), trans);
  dictionary[arm] = trans;
}

Object.entries(dictionary).forEach(([arm, trans]) => {
  setDictionaryEntry(arm, trans);
});

// Western Armenian character mapping
const CHAR_MAP = {
  // --- Uppercase consonants (Western voicing shift) ---
  'Բ': 'P',   // Eastern /b/ → Western /p/
  'Գ': 'K',   // Eastern /g/ → Western /k/
  'Դ': 'T',   // Eastern /d/ → Western /t/
  'Զ': 'Z',
  'Թ': 'T',   // Eastern /tʰ/ → Western /t/
  'Ժ': 'Zh',
  'Խ': 'Kh',
  'Ծ': 'Dz',  // Eastern /ts/ → Western /dz/ in many positions
  'Կ': 'G',   // Eastern /k/ → Western /g/
  'Հ': 'H',
  'Ձ': 'Dz',
  'Ղ': 'Gh',
  'Ճ': 'J',
  'Մ': 'M',
  'Յ': 'Y',
  'Ն': 'N',
  'Շ': 'Sh',
  'Ո': 'Vo',
  'Չ': 'Ch',
  'Պ': 'B',   // Eastern /p/ → Western /b/
  'Ջ': 'J',
  'Ռ': 'R',
  'Ս': 'S',
  'Վ': 'V',
  'Տ': 'D',   // Eastern /t/ → Western /d/
  'Ր': 'R',
  'Ց': 'Tz',
  'Ու': 'Oo',
  'Փ': "P",
  'Ք': "K",
  'Ֆ': 'F',
  // --- Lowercase consonants ---
  'բ': 'p',
  'գ': 'k',
  'դ': 't',
  'զ': 'z',
  'թ': 't',
  'ժ': 'zh',
  'խ': 'kh',
  'ծ': 'dz',
  'կ': 'g',
  'հ': 'h',
  'ձ': 'dz',
  'ղ': 'gh',
  'ճ': 'j',
  'մ': 'm',
  'յ': 'y',
  'ն': 'n',
  'շ': 'sh',
  'ո': 'o',
  'չ': 'ch',
  'պ': 'b',
  'ջ': 'j',
  'ռ': 'r',
  'ս': 's',
  'վ': 'v',
  'տ': 'd',
  'ր': 'r',
  'ց': 'tz',
  'ու': 'oo',
  'փ': 'p',
  'ք': 'k',
  'ֆ': 'f',
  // --- Vowels ---
  'Ա': 'A', 'Ե': 'E', 'Է': 'E', 'Ը': 'U', 'Ի': 'I', 'Օ': 'O',
  'ա': 'a', 'ե': 'e', 'է': 'e', 'ը': 'u', 'ի': 'i', 'օ': 'o',
  // --- Special ---
  'և': 'yev',
};

/**
 * Rule-based transliteration for unknown words.
 */
function transliterateByRules(word) {
  if (!word || word.length === 0) return '';

  let s = word;
  const first = s[0];
  const isUpper = first === first.toUpperCase();

  // Initial ե before consonant → ye
  if (isUpper) {
    if (s.startsWith('Ե')) s = 'Ye' + s.slice(1);
  } else {
    if (s.startsWith('ե')) s = 'ye' + s.slice(1);
  }
  
  // Digraphs: order matters (longer first)
  const digraphs = [
    ['ու', 'oo'],   // standard [u]
    ['աւ', 'av'],   // [aw] or [av]
    ['եւ', 'yev'],  // [ev]
    ['իւ', 'yu'],   // Western [yu]
    ['ոյ', 'uyn'],  // [uyn] or [ooyn]
    ['օյ', 'oy'],
  ];
  
  for (const [arm, lat] of digraphs) {
    s = s.split(arm).join(lat);
  }

  // Character-by-character
  let out = '';
  for (const ch of s) {
    if (CHAR_MAP[ch] !== undefined) {
      out += CHAR_MAP[ch];
    } else if (ch === 'ւ') {
      // Stray  ъ — usually becomes v (especially before vowels)
      out += 'v';
    } else if (/[՛՜՝՞։]/.test(ch)) {
      out += '';
    } else {
      out += ch;
    }
  }
  return out;
}

/** Try to strip common inflection endings and look up stem */
const SUFFIXES = Array.from(new Set([
  'ն', 'նն', 'ս', 'ց', 'ով', 'եամբ', 'ութեամբ',
  'ութիւն', 'ութեան', 'ուց', 'աց', 'եց', 'ումն',
  'ելոց', 'ացելոց', 'եալ', 'եաց', 'եցեր',
  'ութիւնդ', 'ութենէ', 'ոց',
])).sort((a, b) => b.length - a.length);

function lookupStem(word) {
  const lc = word.toLowerCase();
  for (const sfx of SUFFIXES) {
    if (lc.endsWith(sfx)) {
      const stem = lc.slice(0, -sfx.length);
      if (lowerMap.has(stem)) return lowerMap.get(stem);
    }
  }
  return null;
}

/**
 * Transliterate a single word.
 * Priority: exact → case-insensitive → stem lookup → rules
 */
function transliterateWord(word) {
  if (!word || word.length === 0) return '';

  const clean = word.replace(/[.,:;!?()՛՜՝՞։]/g, '');
  if (!clean) return word;

  if (exactMap.has(clean)) return exactMap.get(clean);

  const lc = clean.toLowerCase();
  let trans = lowerMap.get(lc);
  if (!trans) trans = lookupStem(clean);

  if (trans) {
    if (clean[0] === clean[0].toUpperCase()) {
      trans = trans[0].toUpperCase() + trans.slice(1);
    }
    return trans;
  }

  return transliterateByRules(clean);
}

/**
 * Transliterate a full text.
 */
function transliterate(text) {
  if (!text) return '';
  return text.replace(/[\u0530-\u058F]+(?:\u055d?[\u0530-\u058F]+)*/g, (match) => {
    // Split on Armenian hyphen (u+055d)
    const parts = match.split('֊');
    return parts.map(p => transliterateWord(p)).join('-');
  });
}

/**
 * Merge custom dictionary entries into the in-memory lookup tables.
 */
function loadDictionary(dictData) {
  if (!dictData || typeof dictData !== 'object' || Array.isArray(dictData)) {
    throw new TypeError('loadDictionary(dictData) expects an object map of Armenian words to transliterations.');
  }

  Object.entries(dictData).forEach(([arm, trans]) => {
    if (typeof arm !== 'string' || typeof trans !== 'string') {
      throw new TypeError('Dictionary entries must use string keys and string transliterations.');
    }

    const cleanKey = arm.trim();
    const cleanValue = trans.trim();

    if (!cleanKey || !cleanValue) {
      throw new TypeError('Dictionary entries must not be empty.');
    }

    setDictionaryEntry(cleanKey, cleanValue);
  });

  return dictionary;
}

module.exports = {
  transliterate,
  transliterateWord,
  transliterateByRules,
  loadDictionary,
};
