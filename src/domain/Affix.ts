import type { Localized } from './Language';

export type AffixKind = 'prefix' | 'suffix';

/** A reusable prefix or suffix. Its id keeps the dash: "re-", "-ion". */
export class Affix {
  constructor(
    readonly id: string,
    readonly kind: AffixKind,
    readonly meaning: Localized,
  ) {}

  /** The letters that appear in a word, without the dash. */
  get form(): string {
    return this.id.replace(/-/g, '');
  }
}
