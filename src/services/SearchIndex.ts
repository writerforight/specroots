import type { Affix } from '../domain/Affix';
import { stripArticle, type ListSummary, type ObjectSummary } from '../domain/EverydayObject';
import { LANGUAGES } from '../domain/Language';
import type { RootSummary } from '../domain/Root';

export interface SearchHit {
  readonly label: string;
  /** The root, or the root a word belongs to; null for an affix. */
  readonly rootId: string | null;
  /** Set when the hit is a word rather than the root itself. */
  readonly wordId: string | null;
  /** Set when the hit is a prefix or suffix: "re-", "-ion". */
  readonly affix: Affix | null;
  /** Set when the hit is an everyday object, found by its name in any language. */
  readonly objectId?: string;
  /** For an object found by a translation: what was matched, e.g. "tebeşir". */
  readonly matched?: string;
  /** Set when the hit is a word list, found by its title in any language ("mutfak"). */
  readonly listId?: string;
  /** Set when the root or word is German (stehen, verstehen) rather than English. */
  readonly german?: boolean;
}

type Scope = 'roots' | 'lists' | 'german';

interface Entry extends SearchHit {
  readonly key: string;
  readonly scope: Scope;
}

/** Finds roots, words, affixes, objects and lists by what the learner types; prefix matches rank before inner matches. */
export class SearchIndex {
  private readonly entries: Entry[];

  constructor(
    roots: readonly RootSummary[],
    affixes: Iterable<Affix> = [],
    objects: readonly ObjectSummary[] = [],
    lists: readonly ListSummary[] = [],
    germanRoots: readonly RootSummary[] = [],
  ) {
    const rootEntries = (summaries: readonly RootSummary[], scope: Scope) =>
      summaries.flatMap((root) => [
        ...root.forms.map((form) => ({ key: SearchIndex.normalize(form), label: form, rootId: root.id, wordId: null, affix: null, scope })),
        ...root.words.map((word) => ({ key: SearchIndex.normalize(word), label: word, rootId: root.id, wordId: word, affix: null, scope })),
      ]);
    const tagged: Entry[] = [
      ...rootEntries(roots, 'roots'),
      ...rootEntries(germanRoots, 'german').map((e) => ({ ...e, german: true })),
      // Keyed with the dash, so "re-" and "-ion" find the affix first and "re" still finds words.
      ...[...affixes].map((affix) => ({ key: affix.label, label: affix.label, rootId: null, wordId: null, affix, scope: 'roots' as const })),
      // Objects are found by every name, without the article: "kreide" and "tebeşir" both find chalk.
      ...objects.flatMap((object) => {
        const base = { label: object.name, rootId: null, wordId: null, affix: null, objectId: object.id, scope: 'lists' as const };
        const translations = [...new Set(Object.values(object.names))].map((name) => ({ ...base, key: SearchIndex.normalize(stripArticle(name)), matched: name }));
        return [{ ...base, key: SearchIndex.normalize(object.name) }, ...translations];
      }),
      ...lists.flatMap((list) =>
        [...new Set(LANGUAGES.map((l) => list.title[l]).filter((t): t is string => t !== undefined))].map((title) => ({
          key: SearchIndex.normalize(title),
          label: list.title.en ?? list.id,
          rootId: null,
          wordId: null,
          affix: null,
          listId: list.id,
          matched: title,
          scope: 'lists' as const,
        })),
      ),
    ];
    this.entries = tagged;
  }

  /**
   * scope "roots" finds only English roots, words and affixes; "german" only German roots and words;
   * "lists" only objects and lists; omitted finds everything.
   */
  search(query: string, limit = 8, scope?: Scope): SearchHit[] {
    const q = SearchIndex.normalize(query);
    if (q.length === 0) return [];
    const pool = scope ? this.entries.filter((e) => e.scope === scope) : this.entries;
    const starts = pool.filter((e) => e.key.startsWith(q));
    const contains = pool.filter((e) => !e.key.startsWith(q) && e.key.includes(q));
    const byLength = (a: Entry, b: Entry) => a.key.length - b.key.length || a.key.localeCompare(b.key);
    // An object matched by several of its names shows up once, under its best match.
    const seen = new Set<string>();
    return [...starts.sort(byLength), ...contains.sort(byLength)]
      .filter((e) => {
        const id = e.objectId ?? (e.listId ? `list:${e.listId}` : null);
        return !id || (!seen.has(id) && Boolean(seen.add(id)));
      })
      .slice(0, limit)
      .map(({ key: _key, scope: _scope, ...hit }) => hit);
  }

  /** Kept for callers of the old name; see stripArticle in the domain. */
  static stripArticle(name: string): string {
    return stripArticle(name);
  }

  static normalize(text: string): string {
    return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
  }
}
