import type { Localized } from './Language';
import type { Morpheme } from './Morpheme';
import type { Sentence } from './Sentence';

export type PartOfSpeech = 'verb' | 'noun' | 'adjective' | 'adverb';

/** How a word is built from its root, used to group the derivation list. */
export type Formation = 'bare' | 'prefix' | 'suffix' | 'both';

export class Word {
  constructor(
    readonly id: string,
    readonly pos: PartOfSpeech,
    /** The word this one is derived from, or null when it comes straight from the root. */
    readonly parentId: string | null,
    readonly parts: readonly Morpheme[],
    readonly gloss: Localized,
    readonly sentences: readonly Sentence[],
  ) {}

  /** The spelling, which is always the parts joined together. */
  get text(): string {
    return this.parts.map((p) => p.text).join('');
  }

  get prefixes(): Morpheme[] {
    return this.parts.filter((p) => p.kind === 'prefix');
  }

  get suffixes(): Morpheme[] {
    return this.parts.filter((p) => p.kind === 'suffix');
  }

  get formation(): Formation {
    const pre = this.prefixes.length > 0;
    const suf = this.suffixes.length > 0;
    if (pre && suf) return 'both';
    if (pre) return 'prefix';
    if (suf) return 'suffix';
    return 'bare';
  }
}
