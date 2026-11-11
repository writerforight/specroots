# Contributing to specroots

Thank you for helping! specroots grows through people who add words. Türkçe: [CONTRIBUTING.tr.md](CONTRIBUTING.tr.md).

## Without code

- **Suggest something:** open an issue for an [English root](https://github.com/writerforight/specroots/issues/new?template=new-root.yml),
  a [German root](https://github.com/writerforight/specroots/issues/new?template=de-root.yml),
  an [object list](https://github.com/writerforight/specroots/issues/new?template=list.yml) or
  an [affix](https://github.com/writerforight/specroots/issues/new?template=affix.yml).
- **Report a mistake:** a wrong translation, an unnatural sentence or a wrong word split:
  [open a "Mistake" issue](https://github.com/writerforight/specroots/issues/new?template=mistake.yml).

## Adding words yourself

Content is plain JSON: one file per root, per object and per list. The complete rules, with a full
example for every kind of content, are in **[AGENTS.md](AGENTS.md)**.

**Working with an AI agent (Claude Code, Codex, Cursor…)?** Tell it: *"Read AGENTS.md and add the
roots … to specroots."* That file is written so an agent can do the whole job without asking.

The short version:

1. Fork, clone, `npm ci`.
2. Pick open issues (`en-root`, `de-root`, `list`, `affix`) or bring your own idea. Issues are optional.
3. First time: add yourself to `public/data/contributors.json`
   (`"<your GitHub user name>": { "name": "<the name shown on the site>" }`).
4. Write the files. Everything you create carries `"addedBy": "<your GitHub user name>"`.
5. `npm run check` until it is green. A failing test names the file, the word and the problem.
6. Open a pull request against `main`.

**How much:** a pull request with new content brings **at least 5 roots and about 100 words** (or at
least 30 objects). Corrections have no minimum.

**Credit:** the [Contributors page](https://writerforight.github.io/specroots/#/contributors) shows
everyone who added words, as equal bubbles in random order. "Details" shows how many words each
person added, per section, and which roots.

**License:** what you add is published under this repository's [license](LICENSE).

Only the maintainer merges into `main`; every pull request runs `npm run check` and the build in
GitHub Actions.

## Code changes

The code is TypeScript in layers: `src/domain` (pure classes) → `src/data` → `src/services` →
`src/ui` (one class per view) → `src/app`. Views receive everything through `ViewContext` and never
read data files. Colors and fonts are tokens in `src/styles/tokens.css`. See [SPEC.md](SPEC.md) for
the decisions; open an issue before larger changes. Keep code and content in separate pull requests.
