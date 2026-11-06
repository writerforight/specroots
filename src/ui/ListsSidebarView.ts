import type { ListSummary, ObjectSummary, WordList } from '../domain/EverydayObject';
import type { TranslationLang } from '../domain/Language';
import type { I18n } from '../i18n/I18n';
import { clear, h } from './dom';
import { letterGroups } from './RootListView';
import { listHref } from './routes';

/**
 * The lists section's side list: all word lists (Kitchen 100, Bathroom 60…), or, inside one list,
 * its objects A–Z with the name in the first chosen language.
 */
export class ListsSidebarView {
  readonly el = h('div', { class: 'browse-list' });

  constructor(private readonly i18n: I18n) {}

  renderLists(lists: readonly ListSummary[], selectedId: string | null): void {
    const lang = this.i18n.language;
    const sorted = [...lists].sort((a, b) => title(a, lang).localeCompare(title(b, lang), lang));
    clear(this.el);
    this.el.append(
      h(
        'ul',
        { class: 'list-index' },
        ...sorted.map((list) =>
          h(
            'li',
            {},
            h(
              'a',
              { class: 'root-link', href: listHref(list.id), 'aria-current': list.id === selectedId ? 'page' : null },
              h('span', { class: 'root-forms' }, title(list, lang)),
              h('span', { class: 'root-meaning', lang: 'en' }, list.title.en ?? ''),
              h('span', { class: 'root-count' }, String(list.count)),
            ),
          ),
        ),
      ),
    );
  }

  renderList(list: WordList, objects: readonly ObjectSummary[], translationLang: TranslationLang | undefined, selectedId: string | null): void {
    const lang = this.i18n.language;
    clear(this.el);
    this.el.append(
      h('a', { class: 'list-back', href: '#/lists' }, `← ${this.i18n.t('allLists')}`),
      h('h2', { class: 'list-heading' }, title(list, lang), h('span', { class: 'root-count' }, String(objects.length))),
      ...letterGroups(objects, (o) => o.name, (object) =>
        h(
          'a',
          { class: 'root-link', href: listHref(list.id, object.id), 'aria-current': object.id === selectedId ? 'page' : null },
          h('span', { class: 'root-forms object-name', lang: 'en' }, object.name),
          translationLang ? h('span', { class: 'root-meaning', lang: translationLang }, object.names[translationLang]) : null,
        ),
      ),
    );
  }
}

export function title(list: ListSummary, lang: keyof ListSummary['title']): string {
  return list.title[lang] ?? list.title.en ?? list.id;
}
