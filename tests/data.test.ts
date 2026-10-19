import { describe, expect, it } from 'vitest';
import { LexiconParser } from '../src/data/LexiconParser';
import { LANGUAGES, TRANSLATION_LANGUAGES } from '../src/domain/Language';
import { diskRepository, readJson, rootFiles } from './helpers';

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
