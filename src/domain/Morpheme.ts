import type { Affix } from './Affix';

export type MorphemeKind = 'prefix' | 'root' | 'suffix';

/** One piece of a word as it is spelled in that word: in · spect · ion. */
export class Morpheme {
  private constructor(
    readonly text: string,
    readonly kind: MorphemeKind,
    readonly affix: Affix | null,
  ) {}

  static ofAffix(affix: Affix): Morpheme {
    return new Morpheme(affix.form, affix.kind, affix);
  }

  static ofRoot(form: string): Morpheme {
    return new Morpheme(form, 'root', null);
  }
}
