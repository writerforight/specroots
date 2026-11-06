import type { Affix, AffixIndex } from '../domain/Affix';
import type { EverydayObject, ListSummary, ObjectSummary, WordList } from '../domain/EverydayObject';
import type { Root, RootSummary } from '../domain/Root';
import { LexiconParser } from './LexiconParser';
import type { LexiconRepository } from './LexiconRepository';

export type Fetcher = (path: string) => Promise<unknown>;

/**
 * Reads public/data: index.json for the list, one file per root loaded when it is opened, and
 * affix-index.json only once the learner browses by prefix or suffix. Objects work the same way:
 * objects-index.json and lists-index.json for lists and search, one file per list or object when opened.
 */
export class JsonLexiconRepository implements LexiconRepository {
  private readonly parser = new LexiconParser();
  private index: Promise<RootSummary[]> | null = null;
  private affixes: Promise<ReadonlyMap<string, Affix>> | null = null;
  private affixIndex: Promise<AffixIndex> | null = null;
  private readonly roots = new Map<string, Promise<Root>>();
  private listIndex: Promise<ListSummary[]> | null = null;
  private readonly lists = new Map<string, Promise<WordList>>();
  private objectIndex: Promise<ObjectSummary[]> | null = null;
  private readonly objects = new Map<string, Promise<EverydayObject>>();

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

  getAffixIndex(): Promise<AffixIndex> {
    this.affixIndex ??= Promise.all([this.fetchJson('data/affix-index.json'), this.getAffixes()]).then(([raw, affixes]) =>
      this.parser.parseAffixIndex(raw, affixes),
    );
    // Like a root, a failed load is retried next time.
    this.affixIndex.catch(() => (this.affixIndex = null));
    return this.affixIndex;
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

  listObjects(): Promise<ObjectSummary[]> {
    this.objectIndex ??= this.fetchJson('data/objects-index.json').then((raw) => this.parser.parseObjectIndex(raw).sort((a, b) => a.name.localeCompare(b.name)));
    this.objectIndex.catch(() => (this.objectIndex = null));
    return this.objectIndex;
  }

  getObject(id: string): Promise<EverydayObject> {
    let object = this.objects.get(id);
    if (!object) {
      object = Promise.all([this.fetchJson(`data/objects/${encodeURIComponent(id)}.json`), this.getAffixes()]).then(([raw, affixes]) =>
        this.parser.parseObject(raw, affixes),
      );
      object.catch(() => this.objects.delete(id));
      this.objects.set(id, object);
    }
    return object;
  }

  listLists(): Promise<ListSummary[]> {
    this.listIndex ??= this.fetchJson('data/lists-index.json').then((raw) => this.parser.parseListIndex(raw));
    this.listIndex.catch(() => (this.listIndex = null));
    return this.listIndex;
  }

  getList(id: string): Promise<WordList> {
    let list = this.lists.get(id);
    if (!list) {
      list = this.fetchJson(`data/lists/${encodeURIComponent(id)}.json`).then((raw) => this.parser.parseList(raw));
      list.catch(() => this.lists.delete(id));
      this.lists.set(id, list);
    }
    return list;
  }
}
