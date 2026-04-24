# Liturgical Armenian Transliteration

Convert Classical Armenian (Grabar) Unicode text to English transliteration using Western Armenian liturgical pronunciation conventions.

Available as an [npm package](https://www.npmjs.com/package/liturgical-armenian-translit) — works in Node.js (CJS & ESM) and the browser.

## Installation

```bash
npm install liturgical-armenian-translit
```

## Usage

### Node.js (CommonJS)

```javascript
const { transliterate, transliterateWord, loadDictionary } = require('liturgical-armenian-translit');

transliterateWord('Աստուած');
// => "Asdvadz"

transliterate('Տէր Աստուած մեր, կեցո՛ զմեզ եւ ողորմեա՛։');
// => "Der Asdvadz mer, getzo uzmez yev voghormia:"
```

### Node.js (ESM)

```javascript
import { transliterate, transliterateWord } from 'liturgical-armenian-translit';

transliterateWord('սուրբ');
// => "soorp"
```

### Browser (CDN via importmap or script tag)

```html
<script type="module">
import { transliterate, transliterateWord } from 'https://cdn.jsdelivr.net/npm/liturgical-armenian-translit@1/dist/translit.browser.mjs';

console.log(transliterate('Տէր Յիսուս Քրիստոս'));
// => "Der Hisoos Krisdos"
</script>
```

### Custom dictionary entries at runtime

```javascript
loadDictionary({ Մահր: 'Mahr', գետ: 'get' });
transliterateWord('Մահր');
// => "Mahr"
```

### Bundled dictionary (JSON)

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

The repository includes a normalized Divine Liturgy corpus at `corpus/divine-liturgy.json`. Running `npm run test:corpus` currently measures:

| Metric | Value |
| --- | --- |
| Corpus segments | 220 |
| Paragraph exact match | **100.0%** |
| Word exact accuracy | **99.8%** |
| Word mismatches | 7 out of 3,430 |

A baseline snapshot is tracked at `test/fixtures/corpus-metrics-baseline.json`; `npm test` fails if exact-match counts regress.

## Development

- `npm test` runs API and regression tests with Node's built-in test runner.
- `npm run test:corpus` prints corpus-level evaluation metrics using sequence-aligned word comparison.
- `npm run metrics` prints the checked-in corpus metric snapshot in JSON form.
- `npm run build:browser` generates `dist/translit.browser.mjs` — a self-contained ESM build for the browser.
- `npm run build:dictionary` generates derived dictionary artifacts under `corpus/derived/` from the checked-in corpus.
- `npm run analyze` prints character frequencies, first-letter mappings, and mismatch buckets.
- `npm run audit:dictionary` writes a dictionary quality report to `corpus/analysis/dictionary-audit.json`.

The browser build is regenerated automatically via `prepublishOnly` before each npm publish.

## Limitations

- Optimized for liturgical Classical Armenian, not modern spoken Eastern or Western Armenian.
- Morphology handling is heuristic and intentionally lightweight.
- Proper nouns and rare forms may still need custom dictionary entries.

## License

MIT
