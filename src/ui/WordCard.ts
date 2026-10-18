import { ENDONYMS, type Lang, type TranslationLang } from '../domain/Language';
import type { Morpheme } from '../domain/Morpheme';
import type { Root } from '../domain/Root';
import type { Sentence } from '../domain/Sentence';
import type { Word } from '../domain/Word';
import { h } from './dom';
import type { ViewContext } from './ViewContext';

/** Renders one word: its parts, meanings in the chosen languages, and example sentences. */
export class WordCard {
  constructor(private readonly ctx: ViewContext) {}

  render(word: Word, root: Root): HTMLElement {
    const { i18n } = this.ctx;
    const parent = word.parentId ? root.word(word.parentId) : undefined;
    return h(
      'article',
      { class: 'word-card', id: `word-${word.id}`, 'data-word': word.id },
      h(
        'header',
        { class: 'word-head' },
        h('h3', { class: 'word-title', lang: 'en' }, this.renderParts(word.parts)),
        this.listenButton(word.text, 'en'),
        h('span', { class: 'word-pos' }, i18n.t(`pos_${word.pos}`)),
        parent ? h('span', { class: 'word-parent' }, i18n.t('derivedFrom', { word: parent.text })) : null,
      ),
      this.renderBreakdown(word, root),
      this.renderGlosses(word),
      word.sentences.length > 0
        ? h(
            'details',
            { class: 'examples', open: true },
            h('summary', {}, i18n.t('examples')),
            h('ul', { class: 'sentence-list' }, ...word.sentences.map((s) => this.renderSentence(s))),
          )
        : null,
    );
  }

  /** The word with each piece styled by kind: in·spect·ion. */
  renderParts(parts: readonly Morpheme[]): HTMLElement {
    return h('span', { class: 'parts' }, ...parts.map((p) => h('span', { class: `part part-${p.kind}`, title: this.ctx.i18n.t(`part_${p.kind}`) }, p.text)));
  }

  private renderBreakdown(word: Word, root: Root): HTMLElement {
    const lang = this.ctx.i18n.language;
    const items = word.parts.map((part) => {
      const label = part.affix ? part.affix.id : part.text;
      const meaning = part.affix ? (part.affix.meaning[lang] ?? part.affix.meaning.en) : (root.meaning[lang] ?? root.meaning.en);
      return h('li', { class: `breakdown-item part-${part.kind}` }, h('b', { lang: 'en' }, label), ' ', meaning ?? '');
    });
    return h('ul', { class: 'breakdown' }, ...items);
  }

  private renderGlosses(word: Word): HTMLElement {
    const rows: [Lang, string | undefined][] = [['en', word.gloss.en], ...this.ctx.settings.translationLangs.map((l) => [l, word.gloss[l]] as [Lang, string | undefined])];
    return h(
      'dl',
      { class: 'glosses' },
      ...rows.flatMap(([lang, text]) => (text ? [h('dt', { title: ENDONYMS[lang] }, lang.toUpperCase()), h('dd', { lang }, text)] : [])),
    );
  }

  private renderSentence(sentence: Sentence): HTMLElement {
    const translations = this.ctx.settings.translationLangs
      .map((lang) => [lang, sentence.translation(lang)] as const)
      .filter((pair): pair is readonly [TranslationLang, string] => pair[1] !== undefined);
    return h(
      'li',
      { class: 'sentence' },
      h(
        'p',
        { class: 'sentence-en', lang: 'en' },
        ...sentence.segments.map((s) => (s.highlight ? h('mark', {}, s.text) : s.text)),
        ' ',
        this.listenButton(sentence.english, 'en'),
      ),
      ...translations.map(([lang, text]) => h('p', { class: 'sentence-tr', lang }, h('span', { class: 'lang-tag' }, lang.toUpperCase()), text)),
    );
  }

  private listenButton(text: string, lang: Lang): HTMLElement | null {
    if (!this.ctx.speech.available) return null;
    const label = this.ctx.i18n.t('listen');
    return h(
      'button',
      { class: 'icon-button listen', type: 'button', title: label, 'aria-label': `${label}: ${text}`, onclick: () => this.ctx.speech.speak(text, lang) },
      speakerIcon(),
    );
  }
}

function speakerIcon(): SVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = '<path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16 8.5a4.5 4.5 0 0 1 0 7M18.5 6a8 8 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>';
  return svg;
}
