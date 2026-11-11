import type { Localized, SourceLang } from './Language';

/** A root someone added: enough to link to it. */
export interface AddedRoot {
  readonly id: string;
  readonly label: string;
  readonly lang: SourceLang;
}

export interface AddedList {
  readonly id: string;
  readonly title: Localized;
}

/**
 * Someone who added words. The id is the GitHub user name (the key in contributors.json); the name
 * is whatever the person chose to be shown as. Counts come from "addedBy" in the data files.
 */
export class Contributor {
  constructor(
    readonly id: string,
    readonly name: string,
    readonly words: Readonly<Record<SourceLang, number>>,
    readonly objects: number,
    readonly roots: readonly AddedRoot[],
    readonly lists: readonly AddedList[],
  ) {}

  get totalWords(): number {
    return this.words.en + this.words.de;
  }

  get profileUrl(): string {
    return `https://github.com/${encodeURIComponent(this.id)}`;
  }
}
