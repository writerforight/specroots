import { describe, expect, it } from 'vitest';
import { LexiconParser } from '../src/data/LexiconParser';
import { LANGUAGES, TRANSLATION_LANGUAGES } from '../src/domain/Language';
import { diskRepository, objectFiles, readJson, rootFiles } from './helpers';

const parser = new LexiconParser();
const affixes = parser.parseAffixes(readJson('affixes.json'));

describe('lexicon data', () => {
  it('every affix has a meaning in all six languages', () => {
    for (const affix of affixes.values()) expect(Object.keys(affix.meaning).sort(), affix.id).toEqual([...LANGUAGES].sort());
  });

  for (const file of rootFiles()) {
    describe(file, () => {
      const root = parser.parseRoot(readJson(`roots/${file}`), affixes);

      it('file name matches the root id', () => {
        expect(`${root.id}.json`).toBe(file);
      });

      it('root meaning exists in all six languages', () => {
        expect(Object.keys(root.meaning).sort()).toEqual([...LANGUAGES].sort());
      });

      it('every word has a gloss in all six languages and at least two translated sentences', () => {
        for (const word of root.words) {
          expect(Object.keys(word.gloss).sort(), word.id).toEqual([...LANGUAGES].sort());
          expect(word.sentences.length, word.id).toBeGreaterThanOrEqual(2);
          for (const sentence of word.sentences) {
            for (const lang of TRANSLATION_LANGUAGES) expect(sentence.translation(lang), `${word.id} ${lang}: ${sentence.english}`).toBeTruthy();
          }
        }
      });

      it('the marked word in each sentence is a form of the word', () => {
        for (const word of root.words) {
          const stem = word.text.replace(/[ey]$/, '').toLowerCase();
          for (const sentence of word.sentences) expect(sentence.highlighted[0]?.toLowerCase(), sentence.english).toContain(stem);
        }
      });
    });
  }

  it('index.json is up to date (run npm run data)', async () => {
    const index = parser.parseIndex(readJson('index.json'));
    const repo = diskRepository();
    const roots = await Promise.all(rootFiles().map((f) => repo.getRoot(f.replace(/\.json$/, ''))));
    expect(index.map((r) => r.id).sort()).toEqual(roots.map((r) => r.id).sort());
    for (const root of roots) {
      expect(index.find((r) => r.id === root.id)?.words, root.id).toEqual(root.words.map((w) => w.id));
    }
  });

  it('affix-index.json lists every word that carries each affix (run npm run data)', async () => {
    const index = parser.parseAffixIndex(readJson('affix-index.json'), affixes);
    const repo = diskRepository();
    const roots = await Promise.all(rootFiles().map((f) => repo.getRoot(f.replace(/\.json$/, ''))));
    const expected = new Map<string, Set<string>>();
    for (const root of roots) {
      for (const word of root.words) {
        for (const part of word.parts) if (part.affix) expected.set(part.affix.id, (expected.get(part.affix.id) ?? new Set()).add(`${root.id}/${word.id}`));
      }
    }
    const actual = new Map([...index].map(([id, occurrences]) => [id, new Set(occurrences.flatMap((o) => o.wordIds.map((w) => `${o.rootId}/${w}`)))]));
    expect(actual).toEqual(expected);
  });
});

describe('everyday objects', () => {
  const places = parser.parsePlaces(readJson('places.json'));
  const rootIds = new Set(rootFiles().map((f) => f.replace(/\.json$/, '')));

  it('every place is named in all six languages', () => {
    for (const place of places.values()) expect(Object.keys(place.name).sort(), place.id).toEqual([...LANGUAGES].sort());
  });

  for (const file of objectFiles()) {
    it(`${file}: valid, complete, named after its file, linked root exists`, () => {
      const object = parser.parseObject(readJson(`objects/${file}`), places);
      expect(`${object.id}.json`).toBe(file);
      expect(Object.keys(object.definition).sort(), object.id).toEqual([...LANGUAGES].sort());
      if (object.rootId) expect(rootIds.has(object.rootId), `root ${object.rootId}`).toBe(true);
    });
  }

  it('objects-index.json is up to date and alphabetical (run npm run data)', () => {
    const raw = readJson('objects-index.json') as { name: string }[];
    const index = parser.parseObjectIndex(raw, places);
    const files = objectFiles().map((f) => parser.parseObject(readJson(`objects/${f}`), places));
    expect(index.map((o) => o.name)).toEqual([...index.map((o) => o.name)].sort((a, b) => a.localeCompare(b)));
    expect(index.map((o) => o.id).sort()).toEqual(files.map((o) => o.id).sort());
    for (const object of files) {
      const entry = index.find((o) => o.id === object.id);
      expect({ ...entry }, object.id).toEqual({ id: object.id, name: object.name, place: object.place, names: object.names });
    }
  });

  it('rejects an object whose id is not its name, an unknown place, or a missing translation', () => {
    const base = readJson('objects/chalk.json') as Record<string, unknown>;
    expect(() => parser.parseObject({ ...base, id: 'kreide' }, places)).toThrow(/id must be the name/);
    expect(() => parser.parseObject({ ...base, place: 'moon' }, places)).toThrow(/place "moon"/);
    expect(() => parser.parseObject({ ...base, names: { tr: 'tebeşir' } }, places)).toThrow(/names › de/);
    expect(() => parser.parseObject({ ...base, image: { file: 'x.jpg', wikidata: '183670' } }, places)).toThrow(/Wikidata id/);
  });
});

describe('LexiconParser rejects bad data', () => {
  const base = {
    id: 'spec',
    forms: ['spect'],
    origin: 'la',
    etymon: 'specere',
    meaning: { en: 'to look' },
    words: [{ id: 'inspect', pos: 'verb', parent: null, parts: ['in-', 'spect'], gloss: { en: 'x' }, sentences: [{ en: 'They [inspect] it.' }] }],
  };
  const withWord = (patch: object) => ({ ...base, words: [{ ...base.words[0], ...patch }] });

  it('accepts the valid base case', () => {
    expect(() => parser.parseRoot(base, affixes)).not.toThrow();
  });
  it('rejects parts that do not spell the word', () => {
    expect(() => parser.parseRoot(withWord({ id: 'inspection' }), affixes)).toThrow(/parts spell "inspect"/);
  });
  it('rejects an unknown affix', () => {
    expect(() => parser.parseRoot(withWord({ parts: ['zz-', 'spect'], id: 'zzspect' }), affixes)).toThrow(/affix "zz-"/);
  });
  it('rejects a parent that does not exist', () => {
    expect(() => parser.parseRoot(withWord({ parent: 'nothing' }), affixes)).toThrow(/parent "nothing"/);
  });
  it('rejects a sentence without a marked word', () => {
    expect(() => parser.parseRoot(withWord({ sentences: [{ en: 'No mark here.' }] }), affixes)).toThrow(/exactly one \[word\]/);
  });
  it('homograph affixes spell with their form, not their id', () => {
    const extra = parser.parseAffixes({ 'in-not-': { kind: 'prefix', form: 'in', meaning: { en: 'not' } } });
    const all = new Map([...affixes, ...extra]);
    const root = parser.parseRoot(withWord({ id: 'inspect', parts: ['in-not-', 'spect'] }), all);
    expect(root.word('inspect')?.parts[0]?.affix?.id).toBe('in-not-');
    expect(() => parser.parseAffixes({ 'in-not-': { kind: 'prefix', meaning: { en: 'not' } } })).toThrow(/explicit "form"/);
  });
  it('rejects an affix index entry for an affix that is not in the catalogue', () => {
    expect(() => parser.parseAffixIndex({ 'zz-': { spec: ['zzspect'] } }, affixes)).toThrow(/affix "zz-"/);
    expect(parser.parseAffixIndex({ 're-': { spec: ['respect'] } }, affixes).get('re-')).toEqual([{ rootId: 'spec', wordIds: ['respect'] }]);
  });
  it('rejects an unknown language', () => {
    expect(() => parser.parseRoot({ ...base, meaning: { en: 'x', xx: 'y' } }, affixes)).toThrow(/unknown language "xx"/);
  });
});
