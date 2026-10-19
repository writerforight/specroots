import type { Affix } from '../domain/Affix';
import type { RootSummary } from '../domain/Root';

export interface SearchHit {
  readonly label: string;
  /** The root, or the root a word belongs to; null for an affix. */
  readonly rootId: string | null;
  /** Set when the hit is a word rather than the root itself. */
  readonly wordId: string | null;
  /** Set when the hit is a prefix or suffix: "re-", "-ion". */
  readonly affix: Affix | null;
}

interface Entry extends SearchHit {
  readonly key: string;
}

/** Finds roots, words and affixes by what the learner types; prefix matches rank before inner matches. */
export class SearchIndex {
  private readonly entries: Entry[];

  constructor(roots: readonly RootSummary[], affixes: Iterable<Affix> = []) {
    this.entries = [
      ...roots.flatMap((root) => [
        ...root.forms.map((form) => ({ key: SearchIndex.normalize(form), label: form, rootId: root.id, wordId: null, affix: null })),
        ...root.words.map((word) => ({ key: SearchIndex.normalize(word), label: word, rootId: root.id, wordId: word, affix: null })),
      ]),
      // Keyed with the dash, so "re-" and "-ion" find the affix first and "re" still finds words.
      ...[...affixes].map((affix) => ({ key: affix.label, label: affix.label, rootId: null, wordId: null, affix })),
    ];
  }

  search(query: string, limit = 8): SearchHit[] {
    const q = SearchIndex.normalize(query);
    if (q.length === 0) return [];
    const starts = this.entries.filter((e) => e.key.startsWith(q));
    const contains = this.entries.filter((e) => !e.key.startsWith(q) && e.key.includes(q));
    const byLength = (a: Entry, b: Entry) => a.key.length - b.key.length || a.key.localeCompare(b.key);
    return [...starts.sort(byLength), ...contains.sort(byLength)]
      .slice(0, limit)
      .map(({ label, rootId, wordId, affix }) => ({ label, rootId, wordId, affix }));
  }

  static normalize(text: string): string {
    return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
  }
}
