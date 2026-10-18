import { describe, expect, it } from 'vitest';
import { LexiconParser } from '../src/data/LexiconParser';
import { Sentence } from '../src/domain/Sentence';
import { readJson } from './helpers';

describe('Sentence', () => {
  it('splits the marked word out and drops the brackets', () => {
    const s = new Sentence('The [inspector] came.', { tr: 'Müfettiş geldi.' });
    expect(s.english).toBe('The inspector came.');
    expect(s.highlighted).toEqual(['inspector']);
    expect(s.segments).toEqual([
      { text: 'The ', highlight: false },
      { text: 'inspector', highlight: true },
      { text: ' came.', highlight: false },
    ]);
    expect(s.translation('tr')).toBe('Müfettiş geldi.');
    expect(s.translation('en')).toBe('The inspector came.');
  });

  it('handles a mark at the very start', () => {
    expect(new Sentence('[Education] matters.', {}).segments[0]).toEqual({ text: 'Education', highlight: true });
  });
});

describe('Root and Word', () => {
  // A fixed miniature root, so these checks do not shift as the real data grows.
  const parser = new LexiconParser();
  const affixes = parser.parseAffixes(readJson('affixes.json'));
  const word = (id: string, parent: string | null, parts: string[]) => ({ id, pos: 'noun', parent, parts, gloss: { en: id }, sentences: [] });
  const spec = parser.parseRoot(
    {
      id: 'spec',
      forms: ['spec', 'spect'],
      origin: 'la',
      etymon: 'specere',
      meaning: { en: 'to look' },
      words: [
        word('inspect', null, ['in-', 'spect']),
        word('inspection', 'inspect', ['in-', 'spect', '-ion']),
        word('inspector', 'inspect', ['in-', 'spect', '-or']),
        word('respect', null, ['re-', 'spect']),
        word('respectful', 'respect', ['re-', 'spect', '-ful']),
        word('spectator', null, ['spect', '-ator']),
        word('perspective', null, ['per-', 'spect', '-ive']),
      ],
    },
    affixes,
  );

  it('classifies how each word is formed', () => {
    expect(spec.word('inspect')?.formation).toBe('prefix');
    expect(spec.word('spectator')?.formation).toBe('suffix');
    expect(spec.word('inspection')?.formation).toBe('both');
  });

  it('builds the tree: base words, then their children', () => {
    expect(spec.baseWords.map((w) => w.id)).toEqual(['inspect', 'respect', 'spectator', 'perspective']);
    const inspect = spec.word('inspect');
    expect(inspect && spec.childrenOf(inspect).map((w) => w.id)).toEqual(['inspection', 'inspector']);
  });

  it('groups by formation in a fixed order, alphabetically inside', () => {
    const groups = spec.groupByFormation();
    expect([...groups.keys()]).toEqual(['prefix', 'suffix', 'both']);
    expect(groups.get('both')?.map((w) => w.id)).toEqual(['inspection', 'inspector', 'perspective', 'respectful']);
  });

  it('links each prefix and suffix to its catalogue entry', () => {
    const parts = spec.word('inspection')?.parts ?? [];
    expect(parts.map((p) => [p.text, p.kind, p.affix?.id ?? null])).toEqual([
      ['in', 'prefix', 'in-'],
      ['spect', 'root', null],
      ['ion', 'suffix', '-ion'],
    ]);
  });
});
