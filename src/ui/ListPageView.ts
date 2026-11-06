import { commonsThumb, type ObjectSummary, type WordList } from '../domain/EverydayObject';
import { h } from './dom';
import { title } from './ListsSidebarView';
import { listHref } from './routes';
import type { ViewContext } from './ViewContext';

/** One word list on the right: its title and a grid of tiles, photo + English + chosen languages. */
export class ListPageView {
  constructor(private readonly ctx: ViewContext) {}

  render(list: WordList, objects: readonly ObjectSummary[]): HTMLElement[] {
    const { i18n, settings } = this.ctx;
    const lang = i18n.language;
    return [
      h(
        'header',
        { class: 'root-head' },
        h('h1', { class: 'root-title' }, title(list, lang)),
        h('p', { class: 'root-meta' }, h('span', {}, i18n.t('objectCount', { count: objects.length }))),
      ),
      h(
        'ul',
        { class: 'object-grid' },
        ...objects.map((object) => {
          const photo = object.photo;
          return h(
            'li',
            {},
            h(
              'a',
              { class: 'object-tile', href: listHref(list.id, object.id) },
              photo ? h('img', { src: commonsThumb(photo, 240), alt: '', loading: 'lazy', decoding: 'async' }) : h('span', { class: 'tile-blank' }),
              h('b', { lang: 'en' }, object.name),
              ...settings.translationLangs.map((l) => h('span', { lang: l }, object.names[l])),
            ),
          );
        }),
      ),
    ];
  }
}
