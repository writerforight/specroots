import type { Lang, Localized } from './Language';

export interface TextSegment {
  readonly text: string;
  readonly highlight: boolean;
}

/**
 * An English example sentence with translations. The source marks the target word with
 * square brackets ("The [inspector] came."); the brackets never reach the screen.
 */
export class Sentence {
  readonly english: string;
  readonly segments: readonly TextSegment[];

  constructor(
    marked: string,
    readonly translations: Localized,
  ) {
    this.segments = Sentence.split(marked);
    this.english = this.segments.map((s) => s.text).join('');
  }

  translation(lang: Lang): string | undefined {
    return lang === 'en' ? this.english : this.translations[lang];
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
