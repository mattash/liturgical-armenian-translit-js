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
const dictionaryOverrides = require('./dictionary-overrides.json');
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
Object.entries(dictionaryOverrides).forEach(([arm, trans]) => {
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
  'Լ': 'L',
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
  'լ': 'l',
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
const ARMENIAN_VOWELS_RE = /[ԱԵԷԸԻՈՕաեէըիոօև]/;
function transliterateByRules(word) {
  if (!word || word.length === 0) return '';
  let s = word;
  let zPrefix = '';
  // Strip զ/Զ article prefix so following Յ/Ե still get initial-vowel rules.
  // Before a vowel: z. Before a consonant: uz (e.g. uzsoorp).
  if (/^[զԶ]/.test(s)) {
    s = s.slice(1);
    zPrefix = (s.length > 0 && ARMENIAN_VOWELS_RE.test(s[0])) ? 'z' : 'uz';
  }
  if (s.length === 0) return zPrefix;
  const first = s[0];
  const isUpper = first === first.toUpperCase();
  // Word-initial Յ/յ before a vowel → H/h.
  // Applies even when preceded by զ, since զ is a declension/article prefix.
  const initialYegh = isUpper ? 'Յ' : 'յ';
  if (s.startsWith(initialYegh)) {
    const next = s[1];
    if (next && ARMENIAN_VOWELS_RE.test(next)) {
      s = (isUpper ? 'H' : 'h') + s.slice(1);
    }
  }
  // Initial ե before consonant → ye
  if (isUpper) {
    if (s.startsWith('Ե')) s = 'Ye' + s.slice(1);
  } else {
    if (s.startsWith('ե')) s = 'ye' + s.slice(1);
  }
  // Digraphs: order matters (longer first)
  const digraphs = [
    ['Ու', 'Oo'],   // uppercase [u] (word-initial)
    ['ու', 'oo'],   // standard [u]
    ['աւ', 'av'],   // [aw] or [av]
    ['եւ', 'yev'],  // [ev]
    ['իւ', 'yu'],   // Western [yu]
    ['ոյ', 'ooy'],  // [ooy]; final ն will add the n where needed (e.g. ոյն → ooyn)
    ['օյ', 'oy'],
  ];
  
  for (const [arm, lat] of digraphs) {
    s = s.split(arm).join(lat);
  }
  // Word-initial ո → vo (after digraphs so ու → oo is already handled)
  if (s.startsWith('ո')) s = 'vo' + s.slice(1);
  if (s.startsWith('Ո')) s = 'Vo' + s.slice(1);
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
  if (/^[Փփ]րկ/.test(word)) {
    out = out.replace(/^[Pp]rg/, (match) => (match[0] === 'P' ? 'Purg' : 'purg'));
  }
  // Pronunciation aid: avoid awkward vowel cluster when ե/է precedes ու
  out = out.replace(/eoo/g, 'eyoo');
  return zPrefix + out;
}
const SUFFIX_RULES = [
  {
    suffix: 'ութեան',
    apply: (trans) => trans
      .replace(/ootean$/i, 'utyan')
      .replace(/utean$/i, 'utyan'),
  },
  {
    suffix: 'ութիւն',
    apply: (trans) => trans
      .replace(/ootyun$/i, 'utyoon')
      .replace(/utyun$/i, 'utyoon'),
  },
  {
    suffix: 'ոյդ',
    apply: (trans) => trans.endsWith('t') ? `${trans.slice(0, -1)}d` : trans,
  },
  {
    suffix: 'ոյ',
    apply: (trans) => trans.endsWith('h') ? trans : `${trans}h`,
  },
  {
    suffix: 'եսցուք',
    apply: (trans) => trans.replace(/tzook$/i, 'tsook'),
  },
  {
    suffix: 'եսցէ',
    apply: (trans) => trans.replace(/tze$/i, 'tseh').replace(/tzeh$/i, 'tseh'),
  },
  {
    suffix: 'իցի',
    apply: (trans) => trans.replace(/tzi$/i, 'tsi'),
  },
  {
    suffix: 'եցեր',
    apply: (trans) => trans.replace(/tzer$/i, 'tser'),
  },
  {
    suffix: 'էք',
    apply: (trans) => (
      trans.length >= 2 && /^[Mm]/.test(trans) && !/[aeiouy]d[eé]k$/i.test(trans)
        ? `${trans[0]}u${trans.slice(1)}`
        : trans
    ),
  },
];
const SUFFIXES = Array.from(new Set([
  'էսցուք', 'եսցուք', 'եսցէ', 'ոյդ', 'ութեան', 'ութիւն', 'ութեամբ',
  'ութիւնդ', 'ութենէ', 'եամբ', 'ելոց', 'ացելոց', 'եցեր', 'եալ',
  'եաց', 'ումն', 'ութեան', 'ութիւն', 'ուց', 'աց', 'եց', 'ով',
  'ոյդ', 'ոց', 'նն', 'ն', 'ս', 'ց', 'ոյ',
])).sort((a, b) => b.length - a.length);
function lookupStem(word) {
  const lc = word.toLowerCase();
  for (const sfx of SUFFIXES) {
    if (lc.endsWith(sfx)) {
      const stem = lc.slice(0, -sfx.length);
      if (lowerMap.has(stem)) {
        return applySuffixRules(word, lowerMap.get(stem));
      }
    }
  }
  return null;
}
function applySuffixRules(word, transliteration) {
  return SUFFIX_RULES.reduce((result, rule) => (
    word.toLowerCase().endsWith(rule.suffix) ? rule.apply(result, word) : result
  ), transliteration);
}
function applyContextualHeuristics(word, transliteration) {
  return transliteration;
}
function applyCapitalization(sourceWord, transliteration) {
  return sourceWord[0] === sourceWord[0].toUpperCase()
    ? transliteration[0].toUpperCase() + transliteration.slice(1)
    : transliteration;
}
/**
 * Transliterate a single word.
 * Priority: exact → case-insensitive → stem lookup → rules
 */
function transliterateWord(word) {
  if (!word || word.length === 0) return '';
  const clean = word.replace(/[.,:;!?()՛՜՝՞։]/g, '');
  if (!clean) return word;
  if (exactMap.has(clean)) return applyContextualHeuristics(clean, exactMap.get(clean));
  const lc = clean.toLowerCase();
  let trans = lowerMap.get(lc);
  if (!trans) trans = lookupStem(clean);
  if (trans) {
    return applyCapitalization(clean, applyContextualHeuristics(clean, trans));
  }
  return applyContextualHeuristics(clean, applySuffixRules(clean, transliterateByRules(clean)));
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