import { describe, expect, it } from 'vitest';
import { LexiconParser } from '../src/data/LexiconParser';
import { LANGUAGES, TRANSLATION_LANGUAGES } from '../src/domain/Language';
import { diskRepository, listFiles, objectFiles, readJson, rootFiles } from './helpers';

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
            for (const lang of TRANSLATION_LANGUAGES) expect(sentence.translation(lang), `${word.id} ${lang}: ${sentence.text}`).toBeTruthy();
          }
        }
      });

      it('the marked word in each sentence is a form of the word', () => {
        for (const word of root.words) {
          const stem = word.text.replace(/[ey]$/, '').toLowerCase();
          for (const sentence of word.sentences) expect(sentence.highlighted[0]?.toLowerCase(), sentence.text).toContain(stem);
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

describe('everyday objects and word lists', () => {
  const rootIds = new Set(rootFiles().map((f) => f.replace(/\.json$/, '')));
  const objects = objectFiles().map((f) => ({ file: f, object: parser.parseObject(readJson(`objects/${f}`), affixes) }));
  const lists = listFiles().map((f) => ({ file: f, list: parser.parseList(readJson(`lists/${f}`)) }));
  const objectIds = new Set(objects.map((o) => o.object.id));

  for (const { file, object } of objects) {
    it(`${file}: complete, named after its file, links resolve, sentences mark the object`, () => {
      expect(`${object.id}.json`).toBe(file);
      expect(Object.keys(object.definition).sort(), object.id).toEqual([...LANGUAGES].sort());
      if (object.rootId) expect(rootIds.has(object.rootId), `root ${object.rootId}`).toBe(true);
      for (const parts of Object.values(object.breakdown)) {
        for (const part of parts ?? []) if (part.rootId) expect(rootIds.has(part.rootId), `${object.id}: root ${part.rootId}`).toBe(true);
      }
      expect(object.sentences.length, object.id).toBeGreaterThanOrEqual(3);
      // "knife" may be marked as "knives": the first three letters must match.
      const head = object.name.slice(0, 3).toLowerCase();
      for (const sentence of object.sentences) {
        expect(sentence.highlighted[0]?.toLowerCase().startsWith(head), `${object.id}: ${sentence.text}`).toBe(true);
        for (const lang of TRANSLATION_LANGUAGES) expect(sentence.translation(lang), `${object.id} ${lang}: ${sentence.text}`).toBeTruthy();
      }
    });
  }

  for (const { file, list } of lists) {
    it(`lists/${file}: named after its file, titled in six languages, every object exists`, () => {
      expect(`${list.id}.json`).toBe(file);
      expect(Object.keys(list.title).sort()).toEqual([...LANGUAGES].sort());
      for (const id of list.objectIds) expect(objectIds.has(id), `${list.id}: ${id}`).toBe(true);
    });
  }

  it('every object is in at least one list', () => {
    const listed = new Set(lists.flatMap(({ list }) => list.objectIds));
    expect([...objectIds].filter((id) => !listed.has(id))).toEqual([]);
  });

  it('objects-index.json and lists-index.json are up to date (run npm run data)', () => {
    const index = parser.parseObjectIndex(readJson('objects-index.json'));
    expect(index.map((o) => o.name)).toEqual([...index.map((o) => o.name)].sort((a, b) => a.localeCompare(b)));
    expect(index.map((o) => o.id).sort()).toEqual([...objectIds].sort());
    for (const { object } of objects) {
      const inLists = lists.filter(({ list }) => list.objectIds.includes(object.id)).map(({ list }) => list.id).sort();
      const entry = index.find((o) => o.id === object.id);
      expect({ ...entry, lists: [...(entry?.lists ?? [])].sort() }, object.id).toEqual({
        id: object.id,
        name: object.name,
        names: object.names,
        lists: inLists,
        photo: object.image?.file ?? null,
      });
    }
    const listIndex = parser.parseListIndex(readJson('lists-index.json'));
    expect(listIndex.map((l) => [l.id, l.count]).sort()).toEqual(lists.map(({ list }) => [list.id, list.objectIds.length]).sort());
  });

  it('rejects a bad object: id not its name, missing translation, bad Wikidata id, parts that do not spell the name', () => {
    const base = readJson('objects/kettle.json') as Record<string, unknown>;
    expect(() => parser.parseObject({ ...base, id: 'kocher' }, affixes)).toThrow(/id must be the name/);
    expect(() => parser.parseObject({ ...base, names: { tr: 'su ısıtıcısı' } }, affixes)).toThrow(/names › de/);
    expect(() => parser.parseObject({ ...base, image: { file: 'x.jpg', wikidata: '107444' } }, affixes)).toThrow(/Wikidata id/);
    const badParts = { de: [{ text: 'Wasser', gloss: 'water' }, { text: 'topf', gloss: 'pot' }] };
    expect(() => parser.parseObject({ ...base, breakdown: badParts }, affixes)).toThrow(/parts spell "Wassertopf", not "Wasserkocher"/);
    expect(() => parser.parseObject({ ...base, breakdown: { fr: [{ text: 'bouilloire', gloss: 'x' }] } }, affixes)).toThrow(/only en, de/);
    expect(() => parser.parseObject({ ...base, sentences: [] }, affixes)).toThrow(/sentences: must not be empty/);
  });

  it('rejects a list that names an object twice', () => {
    expect(() => parser.parseList({ id: 'x', title: { en: 'X' }, objects: ['jar', 'jar'] })).toThrow(/"jar" appears twice/);
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
