import { describe, expect, it } from 'vitest';
import { Sentence } from '../src/domain/Sentence';
import { diskRepository } from './helpers';

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

describe('Root and Word', async () => {
  const spec = await diskRepository().getRoot('spec');

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
