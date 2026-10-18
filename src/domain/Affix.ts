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
  ) {}
}
