import type { Lang, Localized } from './Language';
import type { Sentence } from './Sentence';

/** The detail texts behind "Details" on a card; each is optional and written in English and Turkish. */
export const EXPRESSION_DETAILS = ['literal', 'usage', 'collocations', 'variety', 'register', 'note'] as const;
export type ExpressionDetail = (typeof EXPRESSION_DETAILS)[number];

/** How strong the feeling is, 1 (mild) to 4 (extreme); colours the intensity tag. */
export type IntensityLevel = 1 | 2 | 3 | 4;

/**
 * An everyday English expression for a feeling: "be fed up (with)", "get cold feet".
 * Part three of the learning plan (roots, objects, expressions): phrases whose meaning the single
 * words do not give away.
 */
export class Expression {
  constructor(
    readonly id: string,
    /** The headword as a learner would look it up: "lose one's temper". */
    readonly expr: string,
    /** What it really means, as a short definition in each language. */
    readonly meaning: Localized,
    /** What a speaker of that language would say instead: "die Nase voll haben", "gına gelmek". */
    readonly equivalent: Localized,
    /** "mild", "strong"…; null when the source gives none. */
    readonly intensity: Localized | null,
    readonly level: IntensityLevel | null,
    readonly details: Readonly<Partial<Record<ExpressionDetail, Localized>>>,
    /** Example sentences, the expression [marked], with translations. */
    readonly sentences: readonly Sentence[],
  ) {}

  /** A detail in the given language, falling back to English. */
  detail(kind: ExpressionDetail, lang: Lang): string | undefined {
    return this.details[kind]?.[lang] ?? this.details[kind]?.en;
  }
}

/** The entry in the list of categories and in search: enough to name and link every expression. */
export interface CategorySummary {
  readonly id: string;
  readonly title: Localized;
  readonly expressions: readonly { readonly id: string; readonly expr: string }[];
}

/** One feeling (Anger, Relief…) with its expressions, in teaching order: the common ones first. */
export interface ExpressionCategory {
  readonly id: string;
  readonly title: Localized;
  readonly expressions: readonly Expression[];
}
