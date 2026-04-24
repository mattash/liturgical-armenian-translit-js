# Known Issues

This file tracks known transliteration problems, edge cases, and planned improvements.
These are **not** bugs in the strict sense—most arise from the tension between
rule-based fallback and liturgical conventions that are only fully knowable
via dictionary overrides.

## Issue 1: Capitalisation of the article prefix `զ` / `Զ`

### Status
Open

### Description
When `զ` or `Զ` (the definite-article prefix “z-”) precedes a proper noun
that begins with an uppercase letter, the current logic produces a capital
`Z` prefix: `ZMariam`, `ZHovhannes`, `ZSdepannos`.

The desired output is a lowercase `z` prefix so the proper noun keeps its
original capitalisation: `zMariam`, `zHovhannes`, `zStepannos`.

### Root cause
`transliterateByRules` strips the prefix and then infers the prefix case
from the **next** Armenian character. If that character is uppercase, the
prefix is rendered as uppercase `Z`.

### Potential fix
- Treat the `զ` prefix case independently (always `z`/`Z` based on the `զ`
  itself, not the following character), **or**
- Lower-case the prefix when the source word is not sentence-initial.

### Affected forms
- `զՄարիամ` → `ZMariam` (should be `zMariam`)
- `զՅովհաննէս` → `ZHovhannes` (should be `zHovhannes`)
- `զՍտեփաննոս` → `ZSdepannos` (should be `zStepannos`)

---

## Issue 2: Յ is `h` word-initially before a vowel, but `y` medially

### Status
Partially fixed (rule-based fallback only)

### Description
The library now correctly maps **word-initial** `Յ` / `յ` before a vowel
to `H` / `h` in `transliterateByRules`.  However, this rule is currently
**only applied inside the rule-based fallback path**.  If a dictionary
entry contains a hard-coded `Y` for an initial `Յ`, the override wins and
the `H` rule is bypassed.

### Desired behaviour
- `Յովհաննէս` → `Hovhannes` (initial, before vowel `ո`) ✅ rule fallback
- `յաղթող` → `haghtogh` (initial, before vowel `ա`) ✅ rule fallback
- `զյաղթող` → `zhaghtogh` (after `զ`, still initial) ✅ rule fallback
- Medial `յ` remains `y`, e.g. `կայսր` → `kaysr`

### Risk
Any future dictionary entry that manually maps `Յ...` → `Y...` will
silently override the heuristic.  We should either:
- audit dictionary imports for initial `Յ` mappings, or
- run the `Յ` → `H` heuristic **after** dictionary lookup as a
  post-processing step.

---

## Issue 3: `զ-` prefix pronunciation (`z` vs `uz`)

### Status
Open — convention-driven, not rule-driven

### Description
Classical Armenian `զ` before a word can be pronounced either `z-` or
`uz-` depending on the following word and liturgical convention:

- `զմեծ` → `zmedz`
- `զսուրբ` → `uzsoorp` (conventionally “uz-”)
- `զպատուական` → `uzbadvagan` (conventionally “uz-”)

There is no simple phonological rule that predicts which form is used.
The library currently:
1. Strips `զ` in rule fallback (always produces `z-`).
2. Relies on `dictionary-overrides.json` for the `uz-` cases.

### Open question
Should we encode a heuristic (e.g. “`uz` before specific consonant clusters”)
or continue to handle every `uz-` form as an override?

---

## Issue 4: `ո` + `յ` digraph (`ոյ`) mapping

### Status
Fixed in rule fallback (`ooy`), but dictionary may contain old `uyn` values

### Description
The classical digraph `ոյ` was historically transliterated as `uyn` in the
library.  Based on liturgical pronunciation, the correct mapping is `ooy`.
When the word ends in `ն`, the `n` is preserved: `ոյն` → `ooyn`.

### Action needed
Audit existing dictionary entries that contain `uyn` in their transliteration
and update them to `ooy` / `ooyn` where appropriate.

---

## Issue 5: Mined-dictionary pollution

### Status
Ongoing hygiene task

### Description
The main `dictionary.json` was mined from a parallel corpus via
sequence alignment.  Some entries are “poisoned” — the Armenian word maps
to an unrelated English word that happened to align in the corpus.

### Known bad patterns
| Armenian | Bad value | Correct value |
|----------|-----------|---------------|
| `կոյսն` | `zmishd` | `gooysn` |
| `զյաղթող` | `yev` | `zyaghtogh` |
| `զփառս` | `yev` | `uzparus` |

### Mitigation
- `dictionary-overrides.json` supersedes poisoned entries.
- Periodically re-run `npm run audit:dictionary` to surface new outliers.

---

*Last updated: 2026-04-24*
