import type { Affix, AffixIndex, AffixKind } from '../domain/Affix';
import type { I18n } from '../i18n/I18n';
import { clear, h } from './dom';
import { letterGroups } from './RootListView';
import { affixHref } from './routes';

/** The alphabetical list of prefixes or suffixes, each with how many words carry it. */
export class AffixListView {
  readonly el = h('div', { class: 'browse-list' });

  constructor(private readonly i18n: I18n) {}

  render(kind: AffixKind, affixes: ReadonlyMap<string, Affix>, index: AffixIndex, selectedId: string | null): void {
    const lang = this.i18n.language;
    const count = (affix: Affix) => (index.get(affix.id) ?? []).reduce((n, o) => n + o.wordIds.length, 0);
    // Homographs ("in-" into, "in-" not) stay separate rows; their meanings tell them apart.
    const list = [...affixes.values()]
      .filter((a) => a.kind === kind && count(a) > 0)
      .sort((a, b) => a.form.localeCompare(b.form) || a.id.localeCompare(b.id));
    const link = (affix: Affix) =>
      h(
        'a',
        { class: 'root-link', href: affixHref(affix.id), 'aria-current': affix.id === selectedId ? 'page' : null },
        h('span', { class: `root-forms part-${affix.kind}`, lang: 'en' }, affix.label),
        h('span', { class: 'root-meaning' }, affix.meaning[lang] ?? affix.meaning.en ?? ''),
        h('span', { class: 'root-count' }, String(count(affix))),
      );
    // True affixes first; stems borrowed from other words (photo-, -logy) follow under their own title.
    const borrowed = list.filter((a) => a.combining);
    clear(this.el);
    this.el.append(
      ...letterGroups(list.filter((a) => !a.combining), (affix) => affix.form, link),
      ...(borrowed.length > 0
        ? [h('h2', { class: 'list-section-title' }, this.i18n.t('combiningForms')), ...letterGroups(borrowed, (affix) => affix.form, link)]
        : []),
    );
  }
}
