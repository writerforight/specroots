import { BREAKDOWN_LANGS, type EverydayObject, type ListSummary, type NamePart } from '../domain/EverydayObject';
import { ENDONYMS, TRANSLATION_LANGUAGES, type Lang } from '../domain/Language';
import { h } from './dom';
import { title } from './ListsSidebarView';
import { affixHref, listHref, rootHref } from './routes';
import type { ViewContext } from './ViewContext';
import { WordCard } from './WordCard';

/**
 * One everyday object: photo, English name, its name in the chosen languages (the others below,
 * quieter), how the English and German names are built, example sentences, word history and the
 * lists it is in. Every name can be heard.
 */
export class ObjectCardView {
  private readonly words: WordCard;

  constructor(private readonly ctx: ViewContext) {
    this.words = new WordCard(ctx);
  }

  render(object: EverydayObject, lists: readonly ListSummary[]): HTMLElement[] {
    const { i18n, settings } = this.ctx;
    const lang = i18n.language;
    const chosen = settings.translationLangs;
    const others = TRANSLATION_LANGUAGES.filter((l) => !chosen.includes(l));
    const definition = object.definition[lang] ?? object.definition.en ?? '';
    const photo = object.imageUrl(480);
    const breakdowns = BREAKDOWN_LANGS.flatMap((l) => {
      const parts = object.breakdown[l];
      return parts ? [this.breakdownRow(l, l === 'en' ? object.name : object.names.de, parts)] : [];
    });

    return [
      h(
        'header',
        { class: 'root-head object-head' },
        h('h1', { class: 'root-title', lang: 'en' }, object.name, ' ', this.listen(object.name, 'en')),
        h('p', { class: 'root-gloss' }, h('span', { lang }, definition)),
        lists.length > 0
          ? h(
              'p',
              { class: 'root-meta object-lists' },
              h('span', {}, i18n.t('inLists')),
              ...lists.map((list) => h('a', { class: 'list-chip', href: listHref(list.id, object.id) }, title(list, lang))),
            )
          : null,
      ),
      h(
        'div',
        { class: 'object-body' },
        photo
          ? h(
              'figure',
              { class: 'object-photo' },
              h('img', { src: photo, alt: object.name, loading: 'lazy', decoding: 'async' }),
              h('figcaption', {}, h('a', { href: object.imagePage() ?? '#', target: '_blank', rel: 'noopener' }, i18n.t('photoCredit'))),
            )
          : null,
        h(
          'div',
          { class: 'object-names' },
          h('dl', { class: 'glosses object-glosses' }, ...chosen.flatMap((l) => this.nameRow(object, l))),
          others.length > 0 ? h('dl', { class: 'glosses object-glosses object-others' }, ...others.flatMap((l) => this.nameRow(object, l))) : null,
        ),
      ),
      breakdowns.length > 0
        ? h('section', { class: 'object-section' }, h('h2', { class: 'group-title' }, i18n.t('partsTitle')), ...breakdowns)
        : null,
      h(
        'section',
        { class: 'object-section' },
        h('h2', { class: 'group-title' }, i18n.t('examples')),
        h('ul', { class: 'sentence-list' }, ...object.sentences.map((s) => this.words.renderSentence(s))),
      ),
      h(
        'section',
        { class: 'object-section object-origin' },
        h('h2', { class: 'group-title' }, i18n.t('objectOrigin')),
        h('p', { lang: 'en' }, object.origin),
        object.rootId ? h('p', {}, h('a', { class: 'object-root-link', href: rootHref(object.rootId) }, i18n.t('objectRoot', { root: object.rootId }))) : null,
      ),
    ].filter((el): el is HTMLElement => el !== null);
  }

  /** "DE  Wasser·kocher   Wasser water · kocher cooker (kochen = to boil)" */
  private breakdownRow(lang: 'en' | 'de', word: string, parts: readonly NamePart[]): HTMLElement {
    return h(
      'div',
      { class: 'name-breakdown' },
      h('span', { class: 'lang-tag', title: ENDONYMS[lang] }, lang.toUpperCase()),
      h('span', { class: 'parts', lang, title: word }, ...parts.map((p) => h('span', { class: `part ${p.affixId ? 'part-suffix' : p.rootId ? 'part-root' : ''}` }, p.text))),
      h(
        'ul',
        { class: 'breakdown' },
        ...parts.map((p) => {
          const label = [h('b', { lang }, p.text), ' ', p.gloss] as const;
          const href = p.affixId ? affixHref(p.affixId) : p.rootId ? rootHref(p.rootId) : null;
          return h('li', { class: 'breakdown-item' }, href ? h('a', { class: 'breakdown-link', href }, ...label) : h('span', {}, ...label));
        }),
      ),
    );
  }

  private nameRow(object: EverydayObject, lang: Exclude<Lang, 'en'>): HTMLElement[] {
    const name = object.names[lang];
    return [h('dt', { title: ENDONYMS[lang] }, lang.toUpperCase()), h('dd', { lang }, name, ' ', this.listen(name, lang))];
  }

  private listen(text: string, lang: Lang): HTMLElement | null {
    if (!this.ctx.speech.available) return null;
    const label = this.ctx.i18n.t('listen');
    const button = h('button', { class: 'icon-button listen', type: 'button', title: label, 'aria-label': `${label}: ${text}`, onclick: () => this.ctx.speech.speak(text, lang) });
    button.innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16 8.5a4.5 4.5 0 0 1 0 7M18.5 6a8 8 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
    return button;
  }
}
