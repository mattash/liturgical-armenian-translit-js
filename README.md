# Liturgical Armenian Transliteration

Convert Classical Armenian (Grabar) Unicode text to English transliteration using Western Armenian liturgical pronunciation conventions.

## Installation

```bash
npm install liturgical-armenian-translit
```

For local development:

```bash
npm test
npm run test:corpus
```

## Usage

```javascript
const {
  loadDictionary,
  transliterate,
  transliterateWord,
} = require('liturgical-armenian-translit');

transliterateWord('Աստուած');
// => "Asdvadz"

transliterate('Տէր Աստուած մեր, կեցո՛ զմեզ եւ ողորմեա՛։');
// => "Der Asdvadz mer, getzo uzmez yev voghormia:"

loadDictionary({ Մահր: 'Mahr', գետ: 'get' });
transliterateWord('Մահր');
// => "Mahr"
```

The bundled dictionary is also available directly:

```javascript
const dictionary = require('liturgical-armenian-translit/src/dictionary.json');
console.log(dictionary['սուրբ']);
// => "soorp"
```

## API

### `transliterate(text)`

Transliterate full Armenian text while leaving non-Armenian content unchanged.

### `transliterateWord(word)`

Transliterate a single word using exact lookup, case-insensitive lookup, stem lookup, then rule-based fallback.

### `transliterateByRules(word)`

Apply only the fallback phonology rules.

### `loadDictionary(dictData)`

Merge custom Armenian-to-Latin mappings into the in-memory dictionary at runtime.

## Accuracy

The repository includes a normalized Divine Liturgy corpus at `corpus/divine-liturgy.json`, derived from the source export referenced in this project. Running `npm run test:corpus` currently measures:

| Metric | Value |
| --- | --- |
| Corpus segments | 220 |
| Aligned word exact accuracy | 88.5% |
| Paragraph exact match | 53.6% |
| Paragraph near match (<15% normalized edit distance) | 40.9% |
| Combined paragraph accuracy | 94.5% |

## Development

- `npm test` runs API and regression tests with Node's built-in test runner.
- `npm run test:corpus` prints corpus-level evaluation metrics using sequence-aligned word comparison.
- `npm run build:dictionary` generates derived dictionary artifacts under `corpus/derived/` from the checked-in corpus.
- `npm run analyze` prints character frequencies, first-letter mappings, and mismatch buckets.
- `npm run audit:dictionary` writes a dictionary quality report to `corpus/analysis/dictionary-audit.json`.

## Limitations

- Optimized for liturgical Classical Armenian, not modern spoken Eastern or Western Armenian.
- Morphology handling is heuristic and intentionally lightweight.
- Proper nouns and rare forms may still need custom dictionary entries.

## License

MIT
