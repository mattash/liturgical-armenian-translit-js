# Repository Guidelines

## Project Structure & Module Organization

Core library code lives in `src/`. The main entry point is `src/translit.js`, and the bundled lookup data lives beside it in `src/dictionary.json`, `src/exact-dictionary.json`, and `src/compact-dictionary.json`. Root-level scripts such as `build-dict.js`, `extract-rules.js`, `analyze.js`, `demo.js`, `debug.js`, `test.js`, and `test-paragraph.js` are developer utilities rather than published API modules.

## Build, Test, and Development Commands

- `npm test` runs `node test-paragraph.js` to compare paragraph transliteration output against a source HTML export.
- `node test.js` exercises word-level transliteration examples for quick sanity checks.
- `node demo.js` prints sample full-text and word-by-word transliterations.
- `node debug.js` inspects Unicode code points and transliteration for selected words.
- `node build-dict.js` rebuilds dictionary artifacts from the source liturgy HTML.

Several scripts currently read an absolute HTML path under `/Users/oshii/...`; update those paths or make them configurable before relying on them in shared workflows.

## Coding Style & Naming Conventions

Use CommonJS modules (`require`, `module.exports`) and keep logic in small, testable functions. Follow the existing JavaScript style: 2-space indentation, semicolons, `const` by default, and uppercase names for constant maps such as `CHAR_MAP` and `SUFFIXES`. Prefer descriptive function names like `transliterateWord` and `lookupStem`. Keep Armenian dictionary keys normalized and lowercase unless case-sensitive behavior is intentional.

## Testing Guidelines

Add or update targeted script-based checks whenever transliteration rules or dictionary data change. Name ad hoc test files descriptively, following the current pattern (`test.js`, `test-paragraph.js`). For rule changes, include both single-word and sentence-level examples, and document any external fixture required to reproduce results.

## Commit & Pull Request Guidelines

Git history is minimal, but the existing style uses concise, imperative subjects, for example `Initial commit: liturgical Armenian transliteration library`. Continue with short, clear commit lines such as `Add fallback for word-initial ե`. In pull requests, include a brief summary, representative Armenian input/output examples, and note whether the change affects rules, dictionary data, or both. If a script depends on local data, call that out in the PR description.
