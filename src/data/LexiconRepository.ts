import type { Affix, AffixIndex } from '../domain/Affix';
import type { EverydayObject, ListSummary, ObjectSummary, WordList } from '../domain/EverydayObject';
import type { Root, RootSummary } from '../domain/Root';

/**
 * Where the app gets its words. The UI only talks to this interface, so the static JSON
 * files can later be swapped for another source without touching any view.
 */
export interface LexiconRepository {
  /** Every root, sorted alphabetically by its first form. */
  listRoots(): Promise<RootSummary[]>;
  getRoot(id: string): Promise<Root>;
  getAffixes(): Promise<ReadonlyMap<string, Affix>>;
  /** Which words of which roots carry each affix, for browsing by prefix or suffix. */
  getAffixIndex(): Promise<AffixIndex>;
  /** Every everyday object, sorted alphabetically by its English name. */
  listObjects(): Promise<ObjectSummary[]>;
  getObject(id: string): Promise<EverydayObject>;
  /** Every word list (Kitchen, Bathroom…) with its size. */
  listLists(): Promise<ListSummary[]>;
  getList(id: string): Promise<WordList>;
}
