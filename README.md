# specroots

**Learn English words through their roots.** Pick a Latin or Greek root and see the whole word family
built on it — every word split into prefix · root · suffix, its meaning in the languages you choose,
and short example sentences you can listen to.

**Live:** https://writerforight.github.io/specroots/

```
spec / spect  "to look"
├── in·spect          to look at closely
│   ├── in·spect·ion
│   └── in·spect·or
├── re·spect          to look back at → to look up to
│   └── re·spect·ful
├── spect·ator
└── per·spect·ive     looking through → a way of seeing
```

- Translations in Turkish, German, French, Italian and Spanish — choose any of them on first visit
- Interface in all six languages, light and dark theme
- List view (grouped by prefix / suffix) or tree view (root → words → derivatives)
- Search by root or word; pronunciation with your browser's built-in voices
- Works on phone and desktop; no account, no tracking, no server

## Run locally

```sh
npm install
npm run dev      # http://localhost:5173
npm run check    # type check + tests
npm run build    # rebuilds data/index.json, then the site into dist/
```

## How it is built

Object-oriented and layered so the look can change without touching data or logic:
`domain` (Root, Word, Morpheme…) → `data` (repository + validating parser) → `services` (settings,
search, speech) → `ui` (one class per view) → `app` (wiring). All colors and fonts live in
`src/styles/tokens.css`. Details and decisions: [SPEC.md](SPEC.md).

## Adding a root

Add `public/data/roots/<root>.json` (see `spec.json`), add any new prefix or suffix to
`public/data/affixes.json`, run `npm run data`, then `npm run check` — the tests tell you exactly what
is missing or misspelled.

## License

Code: MIT. The demo word data was written for this project. Data compiled later from Wiktionary
(CC BY-SA 4.0) and Tatoeba (CC BY 2.0 FR) keeps those licenses and their attribution.
