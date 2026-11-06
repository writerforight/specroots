import type { ObjectSummary } from '../domain/EverydayObject';
import type { TranslationLang } from '../domain/Language';
import type { I18n } from '../i18n/I18n';
import { clear, h } from './dom';
import { letterGroups } from './RootListView';
import { objectHref } from './routes';

/** Every everyday object A–Z by its English name, with its name in the first chosen language. */
export class ObjectListView {
  readonly el = h('div', { class: 'browse-list' });

  constructor(private readonly i18n: I18n) {}

  render(objects: readonly ObjectSummary[], translationLang: TranslationLang | undefined, selectedId: string | null): void {
    clear(this.el);
    this.el.append(
      h('p', { class: 'list-count' }, this.i18n.t('objectCount', { count: objects.length })),
      ...letterGroups(objects, (object) => object.name, (object) =>
        h(
          'a',
          { class: 'root-link', href: objectHref(object.id), 'aria-current': object.id === selectedId ? 'page' : null },
          h('span', { class: 'root-forms object-name', lang: 'en' }, object.name),
          translationLang ? h('span', { class: 'root-meaning', lang: translationLang }, object.names[translationLang]) : null,
        ),
      ),
    );
  }
}
