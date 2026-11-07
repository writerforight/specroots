import type { Localized, SourceLang } from './Language';
import type { Formation, Word } from './Word';

/** Latin, Greek, or a German stem (stehen, fahren) for the German lexicon. */
export type Origin = 'la' | 'gr' | 'de';

/** The lightweight entry shown in the alphabetical list; the full root loads on demand. */
export interface RootSummary {
  readonly id: string;
  readonly forms: readonly string[];
  readonly origin: Origin;
  readonly meaning: Localized;
  readonly words: readonly string[];
}

export const FORMATION_ORDER: readonly Formation[] = ['bare', 'prefix', 'suffix', 'both'];

/** A root with every word built on it: Latin or Greek with English words, or a German stem with German words. */
export class Root {
  private readonly byId: ReadonlyMap<string, Word>;

  constructor(
    readonly id: string,
    readonly forms: readonly string[],
    readonly origin: Origin,
    /** The source word, e.g. Latin "specere". */
    readonly etymon: string,
    readonly meaning: Localized,
    readonly words: readonly Word[],
    /** The language its words are in. */
    readonly language: SourceLang = 'en',
  ) {
    this.byId = new Map(words.map((w) => [w.id, w]));
  }

  word(id: string): Word | undefined {
    return this.byId.get(id);
  }

  /** Words built directly on the root: the first level of the tree. */
  get baseWords(): Word[] {
    return this.words.filter((w) => w.parentId === null);
  }

  childrenOf(word: Word): Word[] {
    return this.words.filter((w) => w.parentId === word.id);
  }

  /** Words grouped by how they are formed, in a fixed group order, alphabetical inside. */
  groupByFormation(): Map<Formation, Word[]> {
    const groups = new Map<Formation, Word[]>();
    for (const formation of FORMATION_ORDER) {
      const words = this.words.filter((w) => w.formation === formation);
      if (words.length > 0) groups.set(formation, [...words].sort((a, b) => a.text.localeCompare(b.text)));
    }
    return groups;
  }
}
