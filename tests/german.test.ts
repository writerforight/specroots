import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { JsonLexiconRepository } from '../src/data/JsonLexiconRepository';
import { LexiconParser } from '../src/data/LexiconParser';
import { glossLangs, LANGUAGES, sentenceLangs } from '../src/domain/Language';
import { SearchIndex } from '../src/services/SearchIndex';
import { deRootHref, parseRoute, sectionOf } from '../src/ui/routes';
import { DATA_DIR, readJson } from './helpers';

const parser = new LexiconParser();
const affixes = parser.parseAffixes(readJson('de/affixes.json'));
const files = readdirSync(join(DATA_DIR, 'de', 'roots')).filter((f) => f.endsWith('.json'));
/** The translations a German sentence must carry: everything but German. */
const TRANSLATIONS = LANGUAGES.filter((l) => l !== 'de');

describe('German lexicon data (data/de)', () => {
  it('has roots', () => expect(files.length).toBeGreaterThan(0));

  it('every German affix has a meaning in all six languages', () => {
    for (const affix of affixes.values()) expect(Object.keys(affix.meaning).sort(), affix.id).toEqual([...LANGUAGES].sort());
  });

  for (const file of files) {
    describe(file, () => {
      const root = parser.parseRoot(readJson(`de/roots/${file}`), affixes, 'de');

      it('is a German root named after its file', () => {
        expect(`${root.id}.json`).toBe(file);
        expect(root.origin).toBe('de');
        expect(root.language).toBe('de');
        expect(Object.keys(root.meaning).sort()).toEqual([...LANGUAGES].sort());
      });

      it('every word has a gloss in all six languages and at least two translated German sentences', () => {
        for (const word of root.words) {
          expect(Object.keys(word.gloss).sort(), word.id).toEqual([...LANGUAGES].sort());
          expect(word.sentences.length, word.id).toBeGreaterThanOrEqual(2);
          for (const sentence of word.sentences) {
            expect(sentence.source).toBe('de');
            for (const lang of TRANSLATIONS) expect(sentence.translation(lang), `${word.id} ${lang}: ${sentence.text}`).toBeTruthy();
          }
        }
      });

      it('nouns start with a capital, other words do not, and parts keep the spelling', () => {
        for (const word of root.words) {
          const first = word.id.charAt(0);
          expect(first === first.toUpperCase(), word.id).toBe(word.pos === 'noun');
          expect(word.text, word.id).toBe(word.id);
        }
      });

      it('the marked word in each sentence carries the root (stehen, verstanden, Abstand)', () => {
        for (const word of root.words) {
          for (const sentence of word.sentences) {
            const marked = sentence.highlighted[0]?.toLowerCase() ?? '';
            expect(root.forms.some((form) => marked.includes(form)), `${word.id}: ${sentence.text}`).toBe(true);
          }
        }
      });
    });
  }

  it('de/index.json matches the root files', async () => {
    const repo = new JsonLexiconRepository(async (path) => readJson(path.replace(/^data\//, '')), 'data/de/', 'de');
    const summaries = await repo.listRoots();
    expect(summaries.map((s) => s.id).sort()).toEqual(files.map((f) => f.replace(/\.json$/, '')).sort());
    for (const summary of summaries) {
      const root = await repo.getRoot(summary.id);
      expect(root.language).toBe('de');
      expect(summary.words).toEqual(root.words.map((w) => w.id));
    }
  });
});

describe('German parsing rules', () => {
  const base = {
    id: 'steh',
    forms: ['steh', 'stand'],
    origin: 'de',
    etymon: 'stehen',
    meaning: { en: 'to stand' },
  };
  const word = (over: Record<string, unknown>) => ({
    ...base,
    words: [{ id: 'Verstand', pos: 'noun', parent: null, parts: ['ver-', 'stand'], gloss: { en: 'mind' }, sentences: [{ de: 'Benutz deinen [Verstand].' }], ...over }],
  });

  it('spells a capitalised noun from lower-case parts and keeps the capital on screen', () => {
    const root = parser.parseRoot(word({}), affixes, 'de');
    expect(root.words[0]?.parts.map((p) => p.text)).toEqual(['Ver', 'stand']);
  });
  it('still rejects parts that spell another word', () => {
    expect(() => parser.parseRoot(word({ id: 'Bestand' }), affixes, 'de')).toThrow(/parts spell "verstand"/);
  });
  it('needs the German sentence, not an English one', () => {
    expect(() => parser.parseRoot(word({ sentences: [{ en: 'Use your [head].' }] }), affixes, 'de')).toThrow(/German sentence is required/);
  });
  it('keeps English roots case-sensitive', () => {
    const english = { ...base, id: 'x', forms: ['stand'], origin: 'la', words: [{ id: 'Stand', pos: 'noun', parent: null, parts: ['stand'], gloss: {}, sentences: [] }] };
    expect(() => parser.parseRoot(english, new Map())).toThrow(/parts spell "stand", not "Stand"/);
  });
});

describe('German section plumbing', () => {
  it('shows a German word in German first, then English, then the chosen languages', () => {
    expect(glossLangs('de', ['tr', 'de'])).toEqual(['de', 'en', 'tr']);
    expect(sentenceLangs('de', ['tr', 'de'])).toEqual(['en', 'tr']);
    expect(glossLangs('en', ['tr', 'de'])).toEqual(['en', 'tr', 'de']);
  });
  it('routes #/de to the German section', () => {
    expect(parseRoute('#/de')).toEqual({ kind: 'german' });
    expect(parseRoute(deRootHref('steh', 'Verständnis'))).toEqual({ kind: 'deRoot', rootId: 'steh', wordId: 'Verständnis' });
    expect(sectionOf(parseRoute('#/de/steh'))).toBe('german');
  });
  it('searches German roots only in the German section', () => {
    const de = [{ id: 'steh', forms: ['steh'], origin: 'de' as const, meaning: {}, words: ['verstehen'] }];
    const en = [{ id: 'spec', forms: ['spec'], origin: 'la' as const, meaning: {}, words: ['inspect'] }];
    const index = new SearchIndex(en, [], [], [], de);
    expect(index.search('verst', 8, 'german').map((h) => [h.label, h.german])).toEqual([['verstehen', true]]);
    expect(index.search('verst', 8, 'roots')).toEqual([]);
    expect(index.search('insp', 8, 'german')).toEqual([]);
  });
});
