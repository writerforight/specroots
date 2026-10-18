# Contributing to specroots

Thank you for helping! The easiest ways to help need no code:

- **Suggest a root**: [open a "New root" issue](https://github.com/writerforight/specroots/issues/new?template=new-root.yml) with the root,
  its meaning and a few English words built on it.
- **Report a mistake**: a wrong translation, an unnatural example sentence or a wrong word split:
  [open a "Mistake" issue](https://github.com/writerforight/specroots/issues/new?template=mistake.yml).

## Adding a root yourself

1. Copy `public/data/roots/spec.json` to `public/data/roots/<root>.json`. The file name is the root's `id`.
2. Fill in:
   - `forms`: every spelling of the root that appears in words (`["scrib", "scribe", "script"]`).
   - `origin`: `"la"` (Latin) or `"gr"` (Greek); `etymon`: the source word (`"scribere"`).
   - `meaning`: in all six languages: `en`, `tr`, `de`, `fr`, `it`, `es`.
   - `words`: for each word:
     - `parts`: prefix ids, root forms and suffix ids that spell the word exactly:
       `["de-", "script", "-ion"]` → *description*.
     - `parent`: the word it comes from (`"describe"`), or `null` if it comes straight from the root.
     - `pos`: `verb`, `noun`, `adjective`, `adverb` or `preposition`.
     - `gloss`: a short English definition plus a translation in the other five languages.
     - `sentences`: at least two. Mark the word in the English sentence with square brackets:
       `"Can you [describe] the man you saw?"`, and translate the sentence into all five languages.
3. New prefix or suffix? Add it to `public/data/affixes.json` (prefix ids end with `-`, suffix ids
   start with `-`) with its meaning in all six languages.
4. Run `npm run data` (updates `index.json`) and `npm run check`. A failing test names the file,
   the word and what is wrong.

### What makes a good example sentence

- Short (under ~12 words) and built from common words, so the target word is the only new one.
- The sentence shows the meaning: *"The [inspector] asked to see the kitchen."* beats *"He is an [inspector]."*
- Natural in every translation; it is fine to translate freely rather than word by word.
- Your own sentences only. Do not copy sentences from dictionaries or other copyrighted sources.

## Code changes

The code is TypeScript in layers: `src/domain` (pure classes) → `src/data` → `src/services` →
`src/ui` (one class per view) → `src/app`. Views receive everything through `ViewContext` and never
read data files. Colors and fonts are tokens in `src/styles/tokens.css`. See [SPEC.md](SPEC.md) for
the decisions; open an issue before larger changes.

Every pull request runs `npm run check` and the build in GitHub Actions.
