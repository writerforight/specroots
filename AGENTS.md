# AGENTS.md: how to add words to specroots

This file is for AI coding agents (Claude Code, Codex, Cursor, Copilot…) and for people who want the
full rules. Read it once and you can add content without asking anyone. Türkçe: [AGENTS.tr.md](AGENTS.tr.md).

**Your job here is data, not code.** You add JSON files under `public/data/`. Do not edit `src/`,
`scripts/`, `tests/`, `.github/` or `SPEC.md` in a content pull request.

## 1. What this project is

specroots is a static website that teaches vocabulary through word building. It has three sections:

| Section | What it holds | Folder | Source language |
|---|---|---|---|
| English roots | Latin and Greek roots and the English words built on them (*spec* → inspect, spectator) | `public/data/roots/` + `public/data/affixes.json` | English |
| German roots | German stems and their word families (*steh* → verstehen, Verstand) | `public/data/de/roots/` + `public/data/de/affixes.json` | German |
| Object lists | Everyday objects with a photo, grouped in lists (Kitchen, Bathroom…) | `public/data/objects/` + `public/data/lists/` | English |

Everything is shown with translations in six languages: `en`, `tr`, `de`, `fr`, `it`, `es`. **All six
are required everywhere.** One file per root, per object and per list.

Generated files (`index.json`, `affix-index.json`, `objects-index.json`, `lists-index.json`,
`contributors-index.json`, `de/index.json`) are **not in the repository**. `npm run data` builds them;
`npm run dev`, `npm run test` and `npm run build` run it for you. Never create or edit them by hand.

## 2. The workflow

1. Fork the repository and clone your fork. `npm ci` (Node ≥ 22.12).
2. Decide what to add (section 3).
3. First contribution only: add yourself to `public/data/contributors.json` (section 4).
4. Write the data files (sections 5–8).
5. Run `npm run check`. Fix the **data** until it is green. The failing test names the file, the word
   and the problem. Never loosen, skip or delete a test.
6. Check yourself (section 9).
7. Commit, push to your fork, open a pull request against `main` and fill in the template.
8. GitHub Actions runs `npm run check` and the build. The maintainer reviews and merges; the site and
   the contributors page update by themselves.

Only the maintainer merges into `main`.

## 3. What to add, and how much

- **Pick from the queue:** open issues labelled `en-root`, `de-root`, `list` or `affix`. Comment
  "I'll take this" so nobody does the same work twice.
- **Or bring your own:** issues are optional. You may open a pull request directly, or open an issue
  first to note what you plan to add.
- **Check it does not exist yet**, cheaply, without reading the data:
  - a root: `ls public/data/roots` (or `public/data/de/roots`)
  - a word: `grep -rl '"id": "inspect"' public/data/roots`
  - an object: `ls public/data/objects`
- **Size of a pull request with new content: at least 5 roots and about 100 words** (roughly 20 words
  per root), or for objects at least 30 objects. Small batches cost the maintainer more review time
  than they add. Corrections (a wrong translation, a typo, a bad sentence) have no minimum.
- Words per root: every real, worth-learning word, **20 to 40**. If a root honestly has fewer good
  words, add what exists; never invent or pad.

To stay cheap: read this file and one example file of the kind you are adding (`roots/spec.json`,
`de/roots/steh.json`, `objects/refrigerator.json`). Do not read the whole data folder.

## 4. Credit: `addedBy` and `contributors.json`

- `public/data/contributors.json` maps a **GitHub user name** to the name shown on the site:

  ```json
  {
    "octocat": { "name": "Mona" }
  }
  ```

  `name` is your choice (real name or nickname, at most 30 characters). Keep the keys in A–Z order.
- Every root file, object file and list file you **create** carries `"addedBy": "<your GitHub user name>"`
  right after `"id"`.
- When you add words to a root that **someone else created**, leave the root's `addedBy` alone and put
  `"addedBy": "<you>"` on each word you add (right after the word's `"id"`). A word without its own
  `addedBy` counts for whoever created the root.
- **Fixing something never changes its `addedBy`.**
- The site's Contributors page shows names as equal bubbles in random order; the numbers (words per
  person, per section, roots added) appear only under "Details". They are computed from `addedBy`.

## 5. Recipe: an English root

File: `public/data/roots/<id>.json`. The file name is the root's `id` (its main spelling).

```json
{
  "id": "spec",
  "addedBy": "octocat",
  "forms": ["spec", "spect", "pect", "pic", "spic"],
  "origin": "la",
  "etymon": "specere",
  "meaning": { "en": "to look, to see", "tr": "bakmak, görmek", "de": "schauen, sehen", "fr": "regarder, voir", "it": "guardare, vedere", "es": "mirar, ver" },
  "words": [
    {
      "id": "inspect",
      "pos": "verb",
      "parent": null,
      "parts": ["in-", "spect"],
      "gloss": { "en": "to look at something closely", "tr": "incelemek, denetlemek", "de": "untersuchen, prüfen", "fr": "inspecter, examiner", "it": "ispezionare, esaminare", "es": "inspeccionar, examinar" },
      "sentences": [
        { "en": "The mechanic [inspected] the brakes before the trip.", "tr": "Tamirci yolculuktan önce frenleri inceledi.", "de": "Der Mechaniker prüfte vor der Reise die Bremsen.", "fr": "Le mécanicien a inspecté les freins avant le voyage.", "it": "Il meccanico ha ispezionato i freni prima del viaggio.", "es": "El mecánico inspeccionó los frenos antes del viaje." },
        { "en": "Please [inspect] the box before you sign for it.", "tr": "…", "de": "…", "fr": "…", "it": "…", "es": "…" }
      ]
    },
    {
      "id": "inspection",
      "pos": "noun",
      "parent": "inspect",
      "parts": ["in-", "spect", "-ion"],
      "gloss": { "en": "…", "tr": "…", "de": "die Inspektion", "fr": "…", "it": "…", "es": "…" },
      "sentences": [ … ]
    }
  ]
}
```

Rules:

- `forms`: every spelling of the root that appears in its words. `origin`: `"la"` (Latin) or `"gr"`
  (Greek). `etymon`: the source word.
- **Word choice:** most common words first (everyday, news, school), then academic ones. Only words
  whose etymology really goes back to this root. If you are not sure, leave it out. No rare, obsolete
  or jargon words.
- **Tree:** `parent` is `null` for a word that comes straight from the root, otherwise the `id` of the
  word it is derived from (inspect → inspection, inspector). The parent must be in the same file.
- **`parts`** must spell the word exactly when joined: prefix ids (end with `-`), one of the root's
  `forms`, suffix ids (start with `-`). `["de-", "script", "-ion"]` → *description*.
- **`pos`:** `verb`, `noun`, `adjective`, `adverb` or `preposition`.
- **`gloss.en`:** a short, teaching definition; add "literally: …" when it shows the root at work.
  `tr, de, fr, it, es`: the natural equivalent in that language; nouns with their article
  (`die Inspektion`, `la inspección`).
- **`sentences`:** at least 2 (3 if the word has several meanings). See section 9 for what makes a
  good one. The target word stands in `[square brackets]` in the English sentence, exactly once, as
  the word itself or a regular inflection. All five translations are required.

### New prefixes and suffixes

Every affix used in `parts` must exist in `public/data/affixes.json`. Add missing ones there:

```json
"re-": { "kind": "prefix", "meaning": { "en": "again, back", "tr": "…", "de": "…", "fr": "…", "it": "…", "es": "…" } },
"in-not-": { "kind": "prefix", "form": "in", "meaning": { "en": "not", … } },
"photo-": { "kind": "prefix", "combining": true, "meaning": { "en": "light (Greek phos)", … } }
```

- Prefix ids end with `-`, suffix ids start with `-`.
- Two different affixes with the same spelling get different ids and say their spelling in `form`
  (`"in-"` into, `"in-not-"` not).
- A piece that is really the stem of another noun, adjective or number (`photo-`, `geo-`, `-logy`)
  gets `"combining": true`; true prefixes and suffixes (`re-`, `un-`, `-ion`) do not.
- Before adding an affix, check it is not there already: `grep -n '"re-"' public/data/affixes.json`.

## 6. Recipe: a German root

File: `public/data/de/roots/<id>.json`, affixes in `public/data/de/affixes.json`. Same layout as an
English root, with these differences:

```json
{
  "id": "steh",
  "addedBy": "octocat",
  "forms": ["steh", "stand", "ständ"],
  "origin": "de",
  "etymon": "stehen",
  "meaning": { "en": "to stand", "tr": "ayakta durmak, durmak", "de": "stehen, aufrecht sein (stand, gestanden)", "fr": "…", "it": "…", "es": "…" },
  "words": [
    {
      "id": "Verstand",
      "pos": "noun",
      "parent": "verstehen",
      "parts": ["ver-", "stand"],
      "gloss": { "en": "mind, reason, intellect", "tr": "…", "de": "die Fähigkeit zu denken und zu verstehen", "fr": "…", "it": "…", "es": "…" },
      "sentences": [
        { "de": "Er hat einen scharfen [Verstand].", "tr": "…", "en": "…", "fr": "…", "it": "…", "es": "…" }
      ]
    }
  ]
}
```

- Roots are **German stems**, not Latin ones. `origin` is `"de"`, `etymon` is the infinitive.
- `gloss.de` is a short German definition; the other five are translations.
- The sentence is **German** (`de` carries the `[marked]` word); translations are `tr, en, fr, it, es`.
- `parts` are lower case; a noun's capital letter comes from its `id` (`Verstand` = `ver-` + `stand`).
- Separable verbs appear unsplit in the sentence (infinitive or participle: `aufstehen`,
  `abgefahren`). The marked word must contain one of the root's `forms`.
- Vowel changes are extra `forms` (`steh`, `stand`, `ständ`).
- Affix ids may contain ä, ö, ü, ß. A second stem in a compound is an affix with `"combining": true`
  (`-zeug`, `-karte`, `teil-`).

## 7. Recipe: an everyday object

File: `public/data/objects/<id>.json`. `id` is the English name with dashes (`paper-clip`).

```json
{
  "id": "refrigerator",
  "addedBy": "octocat",
  "name": "refrigerator",
  "names": { "tr": "buzdolabı", "de": "der Kühlschrank", "fr": "le réfrigérateur", "it": "il frigorifero", "es": "el frigorífico" },
  "definition": { "en": "a machine that keeps food cold", "tr": "…", "de": "…", "fr": "…", "it": "…", "es": "…" },
  "breakdown": {
    "en": [
      { "text": "re", "gloss": "again", "affix": "re-" },
      { "text": "frig", "gloss": "cold (Latin frīgus)" },
      { "text": "er", "gloss": "verb stem (refrigerāre)" },
      { "text": "ator", "gloss": "thing that does", "affix": "-ator" }
    ],
    "de": [
      { "text": "Kühl", "gloss": "cool (kühlen = to cool)" },
      { "text": "schrank", "gloss": "cupboard" }
    ]
  },
  "origin": "Latin refrigerāre (to make cool again: re- + frīgus, cold)",
  "root": null,
  "image": { "file": "LG refrigerator interior.jpg", "wikidata": "Q37828" },
  "sentences": [
    { "en": "Put the milk back in the [refrigerator].", "tr": "…", "de": "…", "fr": "…", "it": "…", "es": "…" },
    { "en": "…", … },
    { "en": "…", … }
  ]
}
```

Steps:

1. Run `node scripts/lookup-object.mjs "<english name>"`. It prints Wiktionary senses, translations and
   etymology, and Wikidata candidates with a photo. Pick the translation of the **right sense**
   (chalk: the stick you write with, not the rock). Take only the photo file and the Q id from
   Wikidata; its labels are not reliable translations.
2. `names`: what people actually call it, with the article (`die Kreide`, `la craie`).
3. `definition`: short, your own words, six languages.
4. `breakdown.en`: only if the name really splits (dish·wash·er, tooth·brush). If a part is a
   specroots root or affix, add `"root": "<root id>"` or `"affix": "<affix id>"`. Use `{}` if neither
   language splits.
5. `breakdown.de`: **required whenever the German name is a compound or derived** (Kühl·schrank,
   Schneide·brett). A linking sound may be its own part (`{ "text": "s", "gloss": "linking s" }`).
   The parts joined together spell the name without its article.
6. `origin`: one line. `root`: a specroots root id if the name comes from one, otherwise `null`.
7. `image`: check that `https://commons.wikimedia.org/wiki/Special:FilePath/<file>?width=320` loads
   and that the photo really shows the object (not a painting, logo or namesake). No good photo → `null`.
8. `sentences`: **3**, each in a different situation: at home, outside (shop, work), and if possible
   an idiom or figurative use (*throw in the towel*). Use the matching idiom in each translation
   (*jeter l'éponge*, *das Handtuch werfen*). The target word in `[brackets]`; plural is fine.
9. Add the object's id to the `objects` array of every list it belongs to. An object that already
   exists is not created again; only its id goes into the list.

## 8. Recipe: a list

File: `public/data/lists/<id>.json`:

```json
{
  "id": "garden",
  "addedBy": "octocat",
  "title": { "en": "Garden", "tr": "Bahçe", "de": "Garten", "fr": "Jardin", "it": "Giardino", "es": "Jardín" },
  "objects": ["rake", "watering-can", "wheelbarrow"]
}
```

Every id in `objects` needs a file in `public/data/objects/`. Start with what everyone sees there
every day, then the less common things worth knowing the name of. Foods are allowed.

## 9. Quality rules (all sections)

**A good example sentence**

- Short (12 words or fewer), built from common words, so the target word is the only new one.
- Shows the meaning: *"The [inspector] asked to see the kitchen."* beats *"He is an [inspector]."*
- Natural in every translation; translate freely rather than word by word.
- **Your own sentence.** Never copy from a dictionary, a textbook or another site.

**Before you open the pull request**, re-read at random: the etymology of 5 words, 5 translations
and 3 sentences. Fix or remove anything doubtful. If you used an AI to write the content, you are
still responsible for it; check the languages you can read yourself.

**Do not**

- edit or delete other people's words, except to fix a real mistake (say which one in the pull request);
- change `addedBy` on anything that exists;
- add generated index files to the commit;
- touch code, tests, workflows or repository settings;
- loosen a test to make it pass.

## 10. The pull request

Title: `data: <roots or list> (+N words)`, for example `data: vert, voc, cur, spir, flect (+97 words)`.
The template asks what you added and how many words, and has one required box: **the content you add
is published under this repository's license.** If the pull request closes issues, write `Closes #12`.

## 11. Adding a new kind of content later

Every section follows the same pattern: **a data folder + a recipe in this file + tests that enforce
the recipe.** A new section or a new language is added by the maintainer as one more folder, one more
recipe here and its tests; nothing else in this file changes.
