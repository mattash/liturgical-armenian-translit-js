# Liturgical Armenian Transliteration (JavaScript)

Convert Classical Armenian (Grabar) Unicode text to English transliteration using the Western Armenian liturgical pronunciation conventions found in the Divine Liturgy.

## Background

This library was built from the parallel text of the **Divine Liturgy** (Սուրբ Պատարագ), containing ~1,000 unique Armenian words with their liturgical transliteration. It uses a hybrid approach:

1. **Dictionary lookup** — exact or near-exact matches for known liturgical words (~85% hit rate)
2. **Rule-based fallback** — Western Armenian phonology for unknown words

The transliteration follows the conventions used in the Armenian Church's Western Diocese liturgical texts, where:

| Letter | Eastern | Transliteration |
|--------|---------|----------------|
| Բ | [b] | **p** |
| Պ | [p] | **b** |
| Գ | [g] | **k** |
| Կ | [k] | **g** |
| Դ | [d] | **t** |
| Տ | [t] | **d** |
| Թ | [tʰ] | **t** |
| Ու | [u] | **oo** |
| Եւ | [ev] | **yev** |
| Կեցո | (word) | **getzo** |
| Աստուած | (word) | **Asdvadz** |

## Installation

```bash
npm install liturgical-armenian-translit
```

Or use directly:

```javascript
const { transliterate } = require('./src/translit.js');
```

## Usage

### Single word

```javascript
const { transliterateWord } = require('liturgical-armenian-translit');

transliterateWord('Աստուած');
// → "Asdvadz"

transliterateWord('կեցո');
// → "getzo"

transliterateWord('խաղաղութիւն');
// → "khaghaghootyun"
```

### Full text

```javascript
const { transliterate } = require('liturgical-armenian-translit');

const armenianText = "Տէր Աստուած մեր, կեցո՛ զմեզ եւ ողորմեա՛:";
console.log(transliterate(armenianText));
// → "Der Asdvadz mer, getzo uzmez yev voghormia:"
```

### Using the dictionary directly

The library ships with a JSON dictionary of ~1,000 liturgical words:

```javascript
const dictionary = require('liturgical-armenian-translit/src/dictionary.json');
console.log(dictionary['սուրբ']); // → "soorp"
```

## API

### `transliterate(text)`
Transliterate a full string (paragraph, sentence, or phrase). Non-Armenian characters pass through unchanged.

### `transliterateWord(word)`
Transliterate a single word. Prioritizes dictionary lookup, then falls back to rule-based phonology.

### `transliterateByRules(word)`
Pure rule-based transliteration for unknown words (Western Armenian phonology).

### `loadDictionary(dictData)`
Extend the built-in dictionary with your own word mappings at runtime.

```javascript
const { loadDictionary } = require('liturgical-armenian-translit');
loadDictionary({ 'մահր': 'mahr', 'գետ': 'get' });
```

## Accuracy

Tested against the full text of the Divine Liturgy:

| Metric | Value |
|--------|-------|
| Unique words in dictionary | ~1,000 |
| Word-level exact accuracy | **85.9%** |
| Paragraph exact match | **53.2%** |
| Paragraph near match (≤15% error) | **38.2%** |
| Combined paragraph accuracy | **91.4%** |

Most remaining errors are due to:
- Complex morphological inflections not in the dictionary
- Dialectal/pronunciation variations in the source text
- HTML parsing artifacts in the training data

## Limitations

- Optimized for **liturgical Classical Armenian**, not modern Eastern or Western colloquial speech
- Does not handle **modern reformed orthography** (post-1922 spellings)
- Proper nouns and foreign loanwords may need manual supplementation

## License

MIT — free to use, modify, and distribute.

## Acknowledgments

Built from the parallel transliterated text of the Divine Liturgy of the Armenian Apostolic Church, as used in the Western Diocese of North America.
