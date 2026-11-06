import { groupByPlace, type ObjectSummary, type Place } from '../domain/EverydayObject';
import type { TranslationLang } from '../domain/Language';
import type { I18n } from '../i18n/I18n';
import type { ObjectGrouping } from '../services/SettingsStore';
import { clear, h } from './dom';
import { letterGroups } from './RootListView';
import { objectHref } from './routes';

/**
 * The everyday objects: grouped under the place where they are most used (Kitchen: colander, ladle…)
 * or as one A–Z list. Each row also shows the name in the first chosen language.
 */
export class ObjectListView {
  readonly el = h('div', { class: 'browse-list' });

  constructor(
    private readonly i18n: I18n,
    private readonly onGroupingChange: (grouping: ObjectGrouping) => void,
  ) {}

  render(
    objects: readonly ObjectSummary[],
    places: ReadonlyMap<string, Place>,
    grouping: ObjectGrouping,
    translationLang: TranslationLang | undefined,
    selectedId: string | null,
  ): void {
    const t = this.i18n.t.bind(this.i18n);
    const lang = this.i18n.language;
    const link = (object: ObjectSummary) =>
      h(
        'a',
        { class: 'root-link', href: objectHref(object.id), 'aria-current': object.id === selectedId ? 'page' : null },
        h('span', { class: 'root-forms object-name', lang: 'en' }, object.name),
        translationLang ? h('span', { class: 'root-meaning', lang: translationLang }, object.names[translationLang]) : null,
      );
    const groups =
      grouping === 'alpha'
        ? letterGroups(objects, (object) => object.name, link)
        : groupByPlace(objects, places, lang).map(({ place, objects: inPlace }) =>
            h(
              'section',
              { class: 'letter-group place-group' },
              h('h3', { class: 'letter place-title' }, place.name[lang] ?? place.name.en ?? place.id, h('span', { class: 'root-count' }, String(inPlace.length))),
              h('ul', {}, ...inPlace.map((object) => h('li', {}, link(object)))),
            ),
          );
    clear(this.el);
    this.el.append(
      h(
        'div',
        { class: 'object-list-head' },
        h('span', { class: 'list-count' }, t('objectCount', { count: objects.length })),
        h(
          'div',
          { class: 'segmented object-grouping', role: 'group', 'aria-label': t('objectGrouping') },
          ...(['place', 'alpha'] as const).map((g) =>
            h('button', { type: 'button', 'aria-pressed': String(g === grouping), onclick: () => this.onGroupingChange(g) }, t(g === 'place' ? 'groupPlace' : 'groupAlpha')),
          ),
        ),
      ),
      ...groups,
    );
  }
}
