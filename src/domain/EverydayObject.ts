import type { Localized, TranslationLang } from './Language';
import type { Sentence } from './Sentence';

/** The lightweight entry for lists and search; the full object loads on demand. */
export interface ObjectSummary {
  readonly id: string;
  /** English name, the headword: "chalk", "paper clip". */
  readonly name: string;
  /** The name in each translation language; nouns carry their article where the language has one. */
  readonly names: Readonly<Record<TranslationLang, string>>;
  /** Every word list the object appears in (an object can be in many: kitchen and wood). */
  readonly lists: readonly string[];
  /** Commons file name of its photo, for list tiles; null when there is none. */
  readonly photo: string | null;
}

/** A photo on Wikimedia Commons, found through the object's Wikidata item. */
export interface CommonsImage {
  /** Commons file name, e.g. "Chalk (25800474082).jpg". */
  readonly file: string;
  /** Wikidata item the photo was taken from, e.g. "Q183670". */
  readonly wikidata: string;
}

/** One piece of a name: "Kühl" (cool) in Kühl·schrank, "er" (-er) in stapl·er. */
export interface NamePart {
  readonly text: string;
  /** Short English meaning of the piece. */
  readonly gloss: string;
  /** A root of this lexicon the piece comes from, if any. */
  readonly rootId: string | null;
  /** An affix of this lexicon the piece is, if any. */
  readonly affixId: string | null;
}

/** Languages whose names are split into parts: English (the headword) and German (compounds). */
export const BREAKDOWN_LANGS = ['en', 'de'] as const;
export type BreakdownLang = (typeof BREAKDOWN_LANGS)[number];

/**
 * An everyday thing with its name in every language: chalk, die Kreide, tebeşir.
 * Part two of the learning plan (roots are part one): names that roots alone cannot predict.
 * It belongs to no list itself; lists point to it, so one object can be in several.
 */
export class EverydayObject {
  constructor(
    readonly id: string,
    readonly name: string,
    readonly names: Readonly<Record<TranslationLang, string>>,
    /** A short "what it is" in all six languages. */
    readonly definition: Localized,
    /** How the English and German names are built, where they can be split. */
    readonly breakdown: Readonly<Partial<Record<BreakdownLang, readonly NamePart[]>>>,
    /** One line of word history, e.g. "Old English ċealc ← Latin calx (limestone)". */
    readonly origin: string,
    /** A root of this lexicon the name comes from (scissors → cid), or null. */
    readonly rootId: string | null,
    readonly image: CommonsImage | null,
    /** Example sentences in different situations, the object [marked], with translations. */
    readonly sentences: readonly Sentence[],
  ) {}

  /** A scaled photo URL; Commons serves a thumbnail of the requested width. */
  imageUrl(width: number): string | null {
    return this.image ? commonsThumb(this.image.file, width) : null;
  }

  /** The Commons page of the photo, where its author and licence are given. */
  imagePage(): string | null {
    return this.image ? `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(this.image.file.replace(/ /g, '_'))}` : null;
  }
}

export function commonsThumb(file: string, width: number): string {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=${width}`;
}

/** The entry in the list of lists. */
export interface ListSummary {
  readonly id: string;
  readonly title: Localized;
  readonly count: number;
}

/** A word list around one idea (Kitchen, Bathroom…): only object ids, in no particular order. */
export interface WordList extends ListSummary {
  readonly objectIds: readonly string[];
}

/** "die Kreide" → "Kreide", "l'éponge" → "éponge", "el cucharón" → "cucharón". */
export function stripArticle(name: string): string {
  return name.replace(/^(der|die|das|le|la|les|il|lo|gli|i|el|los|las|un|une|una|uno)\s+/i, '').replace(/^l['’]/i, '');
}
