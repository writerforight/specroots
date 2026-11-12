import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { LexiconParser } from '../src/data/LexiconParser';
import { parseRoute, sectionOf } from '../src/ui/routes';
import { DATA_DIR, diskRepository, expressionFiles, listFiles, objectFiles, readJson, rootFiles } from './helpers';

type Raw = { id: string; addedBy?: unknown; words?: { id: string; addedBy?: unknown }[] };

const people = readJson('contributors.json') as Record<string, { name?: unknown }>;
const deRootFiles = readdirSync(join(DATA_DIR, 'de', 'roots')).filter((f) => f.endsWith('.json'));
const files = [
  ...rootFiles().map((f) => `roots/${f}`),
  ...deRootFiles.map((f) => `de/roots/${f}`),
  ...objectFiles().map((f) => `objects/${f}`),
  ...listFiles().map((f) => `lists/${f}`),
  ...expressionFiles().map((f) => `expressions/${f}`),
];

describe('contributors', () => {
  it('contributors.json: every key looks like a GitHub user name and has a display name', () => {
    for (const [id, person] of Object.entries(people)) {
      expect(id, `contributors.json key "${id}" must be a GitHub user name`).toMatch(/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/);
      expect(typeof person.name === 'string' && person.name.trim().length > 0, `contributors.json › ${id} needs a "name" (shown on the site)`).toBe(true);
      expect(String(person.name).length, `contributors.json › ${id} › name is too long for a bubble (max 30 characters)`).toBeLessThanOrEqual(30);
    }
  });

  it('every root, object and list file says who added it, and that person is in contributors.json', () => {
    for (const file of files) {
      const raw = readJson(file) as Raw;
      expect(typeof raw.addedBy, `${file}: add "addedBy": "<your GitHub user name>" after "id"`).toBe('string');
      expect(Object.keys(people), `${file}: addedBy "${String(raw.addedBy)}" is not in contributors.json; add yourself there`).toContain(raw.addedBy);
      for (const word of raw.words ?? []) {
        if (word.addedBy !== undefined) {
          expect(Object.keys(people), `${file}, word ${word.id}: addedBy "${String(word.addedBy)}" is not in contributors.json`).toContain(word.addedBy);
        }
      }
    }
  });

  it('contributors-index.json counts every word and object exactly once', async () => {
    const contributors = await diskRepository().listContributors();
    const count = (file: string) => (readJson(file) as Raw).words?.length ?? 0;
    expect(contributors.map((c) => c.id).sort()).toEqual(Object.keys(people).sort());
    expect(contributors.reduce((n, c) => n + c.words.en, 0)).toBe(rootFiles().reduce((n, f) => n + count(`roots/${f}`), 0));
    expect(contributors.reduce((n, c) => n + c.words.de, 0)).toBe(deRootFiles.reduce((n, f) => n + count(`de/roots/${f}`), 0));
    expect(contributors.reduce((n, c) => n + c.objects, 0)).toBe(objectFiles().length);
    expect(contributors.reduce((n, c) => n + c.roots.length, 0)).toBe(rootFiles().length + deRootFiles.length);
    expect(contributors.reduce((n, c) => n + c.lists.length, 0)).toBe(listFiles().length);
  });

  it('a word added to someone else\'s root counts for the one who added the word', () => {
    const [ada, bo] = new LexiconParser().parseContributors([
      { id: 'ada', name: 'Ada', words: { en: 3, de: 1 }, objects: 2, roots: [{ id: 'spec', label: 'spec', lang: 'en' }], lists: [] },
      { id: 'bo', name: 'Bo', words: { en: 1, de: 0 }, objects: 0, roots: [], lists: [] },
    ]);
    expect(ada?.totalWords).toBe(4);
    expect(bo?.totalWords).toBe(1);
    expect(ada?.profileUrl).toBe('https://github.com/ada');
  });

  it('rejects a malformed contributors index', () => {
    expect(() => new LexiconParser().parseContributors([{ id: 'ada', name: 'Ada', words: { en: -1, de: 0 }, objects: 0, roots: [], lists: [] }])).toThrow(/words\.en/);
  });

  it('has its own address outside the three sections', () => {
    expect(parseRoute('#/contributors')).toEqual({ kind: 'contributors' });
    expect(sectionOf({ kind: 'contributors' })).toBeNull();
  });
});
