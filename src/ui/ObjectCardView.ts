import type { EverydayObject, Place } from '../domain/EverydayObject';
import { ENDONYMS, TRANSLATION_LANGUAGES, type Lang } from '../domain/Language';
import { h } from './dom';
import { rootHref } from './routes';
import type { ViewContext } from './ViewContext';

/**
 * One everyday object: photo, English name, its name in the chosen languages (the others below,
 * quieter), what it is, and where the word comes from. Every name can be heard.
 */
export class ObjectCardView {
  constructor(private readonly ctx: ViewContext) {}

  render(object: EverydayObject, place: Place | undefined): HTMLElement[] {
    const { i18n, settings } = this.ctx;
    const lang = i18n.language;
    const chosen = settings.translationLangs;
    const others = TRANSLATION_LANGUAGES.filter((l) => !chosen.includes(l));
    const definition = object.definition[lang] ?? object.definition.en ?? '';
    const photo = object.imageUrl(480);

    return [
      h(
        'header',
        { class: 'root-head object-head' },
        h('h1', { class: 'root-title', lang: 'en' }, object.name, ' ', this.listen(object.name, 'en')),
        h('p', { class: 'root-gloss' }, h('span', { lang }, definition)),
        h(
          'p',
          { class: 'root-meta' },
          h('span', {}, i18n.t('part_object')),
          place ? h('span', { class: 'dot' }, '·') : null,
          place ? h('span', {}, place.name[lang] ?? place.name.en ?? place.id) : null,
        ),
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
          h(
            'section',
            { class: 'object-origin' },
            h('h2', { class: 'group-title' }, i18n.t('objectOrigin')),
            h('p', { lang: 'en' }, object.origin),
            object.rootId ? h('p', {}, h('a', { class: 'object-root-link', href: rootHref(object.rootId) }, i18n.t('objectRoot', { root: object.rootId }))) : null,
          ),
        ),
      ),
    ];
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
