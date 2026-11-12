import { describe, expect, it } from 'vitest';
import { LexiconParser } from '../src/data/LexiconParser';
import { LANGUAGES } from '../src/domain/Language';
import { SearchIndex } from '../src/services/SearchIndex';
import { expressionHref, parseRoute, sectionOf } from '../src/ui/routes';
import { diskRepository, expressionFiles, readJson } from './helpers';

/** The languages every expression must be explained in; fr, it, es are welcome but optional. */
const REQUIRED = ['en', 'tr', 'de'] as const;
const parser = new LexiconParser();
const categories = expressionFiles().map((file) => ({ file, raw: readJson(`expressions/${file}`) as { addedBy?: unknown }, category: parser.parseExpressionCategory(readJson(`expressions/${file}`)) }));

describe('everyday expressions', () => {
  for (const { file, raw, category } of categories) {
    it(`expressions/${file}: named after its file, titled in six languages, every expression complete`, () => {
      expect(`${category.id}.json`).toBe(file);
      expect(typeof raw.addedBy, 'addedBy').toBe('string');
      expect(Object.keys(category.title).sort()).toEqual([...LANGUAGES].sort());
      for (const e of category.expressions) {
        for (const lang of REQUIRED) expect(e.meaning[lang], `${e.id}: meaning.${lang}`).toBeTruthy();
        for (const lang of ['tr', 'de'] as const) expect(e.equivalent[lang], `${e.id}: equivalent.${lang}`).toBeTruthy();
        expect(e.equivalent.en, `${e.id}: the English "equivalent" is the expression itself`).toBeUndefined();
        expect(e.sentences.length, e.id).toBeGreaterThanOrEqual(2);
        for (const sentence of e.sentences) {
          for (const lang of ['tr', 'de'] as const) expect(sentence.translation(lang), `${e.id} ${lang}: ${sentence.text}`).toBeTruthy();
        }
        for (const text of Object.values(e.details)) expect(text.en, `${e.id}: every detail needs English`).toBeTruthy();
      }
    });
  }

  it('an expression id is used once in the whole section', () => {
    const ids = categories.flatMap(({ category }) => category.expressions.map((e) => e.id));
    expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([]);
  });

  it('expressions-index.json is up to date (run npm run data)', async () => {
    const index = await diskRepository().listExpressionCategories();
    expect(index.map((c) => c.id).sort()).toEqual(categories.map(({ category }) => category.id).sort());
    for (const { category } of categories) {
      const entry = index.find((c) => c.id === category.id);
      expect(entry?.title).toEqual(category.title);
      expect(entry?.expressions).toEqual(category.expressions.map((e) => ({ id: e.id, expr: e.expr })));
    }
  });

  it('counts every expression for the person who added its category', async () => {
    const contributors = await diskRepository().listContributors();
    expect(contributors.reduce((n, c) => n + c.expressions, 0)).toBe(categories.reduce((n, { category }) => n + category.expressions.length, 0));
  });

  it('rejects an expression without a marked example', () => {
    const category = (sentences: unknown) => ({
      id: 'anger',
      title: { en: 'Anger' },
      expressions: [{ id: 'blow-up', expr: 'blow up', meaning: { en: 'to explode with anger' }, equivalent: { tr: 'patlamak' }, sentences }],
    });
    expect(() => parser.parseExpressionCategory(category([{ en: 'He blew up at me.', tr: 'Bana patladı.' }]))).toThrow(/mark exactly one/);
    expect(() => parser.parseExpressionCategory(category([]))).toThrow(/must not be empty/);
    expect(parser.parseExpressionCategory(category([{ en: 'He [blew up] at me.', tr: 'Bana patladı.' }])).expressions[0]?.sentences[0]?.highlighted).toEqual(['blew up']);
  });
});

describe('expressions in search and routes', async () => {
  const repo = diskRepository();
  const index = new SearchIndex(await repo.listRoots(), (await repo.getAffixes()).values(), await repo.listObjects(), await repo.listLists(), [], await repo.listExpressionCategories());

  it('finds an expression by any word in it, only in its own section', () => {
    expect(index.search('nerves', 8, 'expressions')[0]).toMatchObject({ categoryId: 'anger', expressionId: 'get-on-someones-nerves' });
    expect(index.search('fed up', 8, 'roots')).toEqual([]);
    expect(index.search('a', 50, 'lists').every((h) => !h.categoryId)).toBe(true);
  });

  it('finds a category by its title in any language, once', () => {
    const hits = index.search('öfke', 8, 'expressions');
    expect(hits[0]).toMatchObject({ categoryId: 'anger' });
    expect(hits[0]?.expressionId).toBeUndefined();
    expect(index.search('ärger', 8, 'expressions').filter((h) => h.categoryId === 'anger' && !h.expressionId)).toHaveLength(1);
  });

  it('round-trips expression links', () => {
    expect(parseRoute('#/expressions')).toEqual({ kind: 'expressions' });
    expect(parseRoute(expressionHref('anger'))).toEqual({ kind: 'expressionCategory', categoryId: 'anger', expressionId: null });
    expect(parseRoute(expressionHref('anger', 'blow-up'))).toEqual({ kind: 'expressionCategory', categoryId: 'anger', expressionId: 'blow-up' });
    expect([parseRoute('#/expressions'), parseRoute('#/expressions/anger')].map(sectionOf)).toEqual(['expressions', 'expressions']);
  });
});
