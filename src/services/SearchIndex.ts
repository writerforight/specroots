import type { RootSummary } from '../domain/Root';

export interface SearchHit {
  readonly label: string;
  readonly rootId: string;
  /** Set when the hit is a word rather than the root itself. */
  readonly wordId: string | null;
}

interface Entry extends SearchHit {
  readonly key: string;
}

/** Finds roots and words by what the learner types; prefix matches rank before inner matches. */
export class SearchIndex {
  private readonly entries: Entry[];

  constructor(roots: readonly RootSummary[]) {
    this.entries = roots.flatMap((root) => [
      ...root.forms.map((form) => ({ key: SearchIndex.normalize(form), label: form, rootId: root.id, wordId: null })),
      ...root.words.map((word) => ({ key: SearchIndex.normalize(word), label: word, rootId: root.id, wordId: word })),
    ]);
  }

  search(query: string, limit = 8): SearchHit[] {
    const q = SearchIndex.normalize(query);
    if (q.length === 0) return [];
    const starts = this.entries.filter((e) => e.key.startsWith(q));
    const contains = this.entries.filter((e) => !e.key.startsWith(q) && e.key.includes(q));
    const byLength = (a: Entry, b: Entry) => a.key.length - b.key.length || a.key.localeCompare(b.key);
    return [...starts.sort(byLength), ...contains.sort(byLength)]
      .slice(0, limit)
      .map(({ label, rootId, wordId }) => ({ label, rootId, wordId }));
  }

  static normalize(text: string): string {
    return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
  }
}
