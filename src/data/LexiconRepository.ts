import type { Affix, AffixIndex } from '../domain/Affix';
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
}
