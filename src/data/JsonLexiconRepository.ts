import type { Affix } from '../domain/Affix';
import type { Root, RootSummary } from '../domain/Root';
import { LexiconParser } from './LexiconParser';
import type { LexiconRepository } from './LexiconRepository';

export type Fetcher = (path: string) => Promise<unknown>;

/** Reads public/data: index.json for the list, one file per root loaded when it is opened. */
export class JsonLexiconRepository implements LexiconRepository {
  private readonly parser = new LexiconParser();
  private index: Promise<RootSummary[]> | null = null;
  private affixes: Promise<ReadonlyMap<string, Affix>> | null = null;
  private readonly roots = new Map<string, Promise<Root>>();

  constructor(private readonly fetchJson: Fetcher) {}

  /** A repository backed by HTTP, relative to the page so it works under any Pages path. */
  static overHttp(baseUrl: string): JsonLexiconRepository {
    return new JsonLexiconRepository(async (path) => {
      const response = await fetch(new URL(path, baseUrl));
      if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
      return response.json();
    });
  }

  listRoots(): Promise<RootSummary[]> {
    this.index ??= this.fetchJson('data/index.json').then((raw) =>
      this.parser.parseIndex(raw).sort((a, b) => (a.forms[0] ?? a.id).localeCompare(b.forms[0] ?? b.id)),
    );
    return this.index;
  }

  getAffixes(): Promise<ReadonlyMap<string, Affix>> {
    this.affixes ??= this.fetchJson('data/affixes.json').then((raw) => this.parser.parseAffixes(raw));
    return this.affixes;
  }

  getRoot(id: string): Promise<Root> {
    let root = this.roots.get(id);
    if (!root) {
      root = Promise.all([this.fetchJson(`data/roots/${encodeURIComponent(id)}.json`), this.getAffixes()]).then(
        ([raw, affixes]) => this.parser.parseRoot(raw, affixes),
      );
      // A failed load is forgotten so the next attempt retries instead of replaying the error.
      root.catch(() => this.roots.delete(id));
      this.roots.set(id, root);
    }
    return root;
  }
}
