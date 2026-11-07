import type { Lang, Localized, SourceLang } from './Language';

export interface TextSegment {
  readonly text: string;
  readonly highlight: boolean;
}

/**
 * An example sentence in the lexicon's language (English, or German) with translations. The source
 * marks the target word with square brackets ("The [inspector] came."); the brackets never reach the screen.
 */
export class Sentence {
  /** The sentence as written, without the brackets. */
  readonly text: string;
  readonly segments: readonly TextSegment[];

  constructor(
    marked: string,
    readonly translations: Localized,
    readonly source: SourceLang = 'en',
  ) {
    this.segments = Sentence.split(marked);
    this.text = this.segments.map((s) => s.text).join('');
  }

  translation(lang: Lang): string | undefined {
    return lang === this.source ? this.text : this.translations[lang];
  }

  get highlighted(): string[] {
    return this.segments.filter((s) => s.highlight).map((s) => s.text);
  }

  private static split(marked: string): TextSegment[] {
    const segments: TextSegment[] = [];
    const pattern = /\[([^\]]+)\]/g;
    let last = 0;
    for (const match of marked.matchAll(pattern)) {
      if (match.index > last) segments.push({ text: marked.slice(last, match.index), highlight: false });
      segments.push({ text: match[1] ?? '', highlight: true });
      last = match.index + match[0].length;
    }
    if (last < marked.length) segments.push({ text: marked.slice(last), highlight: false });
    return segments;
  }
}
