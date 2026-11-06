import type { Localized, TranslationLang } from './Language';

/** Where an object is usually found (kitchen, classroom…); groups growth rounds, shown on the card. */
export interface Place {
  readonly id: string;
  readonly name: Localized;
}

/** The lightweight entry for the alphabetical object list and search; the full object loads on demand. */
export interface ObjectSummary {
  readonly id: string;
  /** English name, the headword: "chalk", "paper clip". */
  readonly name: string;
  readonly place: string;
  /** The name in each translation language; nouns carry their article where the language has one. */
  readonly names: Readonly<Record<TranslationLang, string>>;
}

/** A photo on Wikimedia Commons, found through the object's Wikidata item. */
export interface CommonsImage {
  /** Commons file name, e.g. "Chalk (25800474082).jpg". */
  readonly file: string;
  /** Wikidata item the photo was taken from, e.g. "Q183670". */
  readonly wikidata: string;
}

/**
 * An everyday thing with its name in every language: chalk, die Kreide, tebeşir.
 * Part two of the learning plan (roots are part one): names that roots alone cannot predict.
 */
export class EverydayObject implements ObjectSummary {
  constructor(
    readonly id: string,
    readonly name: string,
    readonly place: string,
    readonly names: Readonly<Record<TranslationLang, string>>,
    /** A short "what it is" in all six languages. */
    readonly definition: Localized,
    /** One line of word history, e.g. "Old English ċealc ← Latin calx (limestone)". */
    readonly origin: string,
    /** A root of this lexicon the name comes from (scissors → cid), or null. */
    readonly rootId: string | null,
    readonly image: CommonsImage | null,
  ) {}

  /** A scaled photo URL; Commons serves a thumbnail of the requested width. */
  imageUrl(width: number): string | null {
    return this.image ? `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(this.image.file)}?width=${width}` : null;
  }

  /** The Commons page of the photo, where its author and licence are given. */
  imagePage(): string | null {
    return this.image ? `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(this.image.file.replace(/ /g, '_'))}` : null;
  }
}

/** The objects of one place, A–Z, as shown under that place's heading. */
export interface PlaceGroup {
  readonly place: Place;
  readonly objects: readonly ObjectSummary[];
}

/**
 * Objects under the place where they are most used (kitchen → ladle, colander…). Places are sorted
 * by their name in the given language, objects A–Z inside; empty places are left out.
 */
export function groupByPlace(objects: readonly ObjectSummary[], places: ReadonlyMap<string, Place>, lang: keyof Place['name']): PlaceGroup[] {
  const name = (place: Place) => place.name[lang] ?? place.name.en ?? place.id;
  return [...places.values()]
    .map((place) => ({ place, objects: objects.filter((o) => o.place === place.id).sort((a, b) => a.name.localeCompare(b.name)) }))
    .filter((group) => group.objects.length > 0)
    .sort((a, b) => name(a.place).localeCompare(name(b.place), lang));
}
