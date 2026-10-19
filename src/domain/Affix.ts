import type { Localized } from './Language';

export type AffixKind = 'prefix' | 'suffix';

/**
 * A reusable prefix or suffix. Its id keeps the dash: "re-", "-ion". Two affixes spelled the same
 * get distinct ids ("in-" into, "in-not-" not) and name their spelling in `form`.
 */
export class Affix {
  constructor(
    readonly id: string,
    readonly kind: AffixKind,
    readonly meaning: Localized,
    /** The letters that appear in a word. */
    readonly form: string,
    /**
     * A stem borrowed from another word rather than a true prefix or suffix: photo- (light),
     * geo- (earth), -logy (study). Listed apart from the true affixes.
     */
    readonly combining: boolean = false,
  ) {}

  /** How it is written on its own: "in-", "-ion". Homographs share a label; their meanings differ. */
  get label(): string {
    return this.kind === 'prefix' ? `${this.form}-` : `-${this.form}`;
  }
}

/** The words of one root that carry an affix, as listed in affix-index.json. */
export interface AffixOccurrence {
  readonly rootId: string;
  readonly wordIds: readonly string[];
}

/** Every affix id → the roots and words that use it, in root list order. */
export type AffixIndex = ReadonlyMap<string, readonly AffixOccurrence[]>;
