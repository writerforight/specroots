import type { Affix, AffixIndex } from '../domain/Affix';
import type { I18n } from '../i18n/I18n';
import { append, clear, h } from './dom';
import { letterGroups } from './RootListView';

/**
 * "Learn words": the titles (prefixes, suffixes, parts from other words) with a box each, and no words.
 * Ticking boxes chooses which words the right-hand side shows. The list is built once per language;
 * a new selection only updates the boxes, so focus and scroll position stay where they were.
 */
export class TitlePickerView {
  readonly el = h('div', { class: 'browse-list title-picker' });
  private readonly bar = h('div', { class: 'picker-bar' });
  private readonly body = h('div', {});
  private builtFor = '';
  private selected: readonly string[] = [];

  constructor(
    private readonly i18n: I18n,
    /** Called with the new selection, in the order the titles were ticked. */
    private readonly onSelect: (titleIds: readonly string[]) => void,
    /** Phones: jump from the list to the words below it. */
    private readonly onShowWords: () => void,
  ) {
    this.el.append(this.bar, this.body);
  }

  render(affixes: ReadonlyMap<string, Affix>, index: AffixIndex, selected: readonly string[]): void {
    const lang = this.i18n.language;
    if (this.builtFor !== lang) {
      this.build(affixes, index);
      this.builtFor = lang;
    }
    this.selected = selected;
    const chosen = new Set(selected);
    for (const box of this.body.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')) box.checked = chosen.has(box.value);
    // A word with two ticked titles (re·act·ion) counts once.
    const words = new Set(selected.flatMap((id) => (index.get(id) ?? []).flatMap((o) => o.wordIds.map((w) => `${o.rootId}/${w}`)))).size;
    clear(this.bar);
    append(this.bar, [
      h('span', { class: 'picker-status' }, selected.length === 0 ? this.i18n.t('pickTitles') : this.i18n.t('titleCount', { count: selected.length })),
      selected.length > 0 ? h('button', { type: 'button', class: 'link-button', onclick: () => this.onSelect([]) }, this.i18n.t('clearSelection')) : null,
      selected.length > 0 ? h('button', { type: 'button', class: 'primary picker-show', onclick: () => this.onShowWords() }, this.i18n.t('showWords', { count: words })) : null,
    ]);
  }

  private build(affixes: ReadonlyMap<string, Affix>, index: AffixIndex): void {
    const lang = this.i18n.language;
    const count = (affix: Affix) => (index.get(affix.id) ?? []).reduce((n, o) => n + o.wordIds.length, 0);
    // Homographs ("in-" into, "in-" not) stay separate rows; their meanings tell them apart.
    const used = [...affixes.values()].filter((a) => count(a) > 0).sort((a, b) => a.form.localeCompare(b.form) || a.id.localeCompare(b.id));
    const row = (affix: Affix) =>
      h(
        'label',
        { class: 'root-link title-option' },
        h('input', {
          type: 'checkbox',
          value: affix.id,
          onchange: (e: Event) => {
            const box = e.currentTarget as HTMLInputElement;
            this.onSelect(box.checked ? [...this.selected, affix.id] : this.selected.filter((id) => id !== affix.id));
          },
        }),
        h('span', { class: `root-forms part-${affix.kind}`, lang: 'en' }, affix.label),
        h('span', { class: 'root-meaning' }, affix.meaning[lang] ?? affix.meaning.en ?? ''),
        h('span', { class: 'root-count' }, String(count(affix))),
      );
    const section = (title: string, list: readonly Affix[]) =>
      list.length === 0 ? [] : [h('h2', { class: 'list-section-title' }, title), ...letterGroups(list, (affix) => affix.form, row)];
    // True prefixes, true suffixes, then stems borrowed from other words (photo-, -logy) together.
    this.body.replaceChildren(
      ...section(this.i18n.t('browse_prefix'), used.filter((a) => a.kind === 'prefix' && !a.combining)),
      ...section(this.i18n.t('browse_suffix'), used.filter((a) => a.kind === 'suffix' && !a.combining)),
      ...section(this.i18n.t('combiningForms'), used.filter((a) => a.combining)),
    );
  }
}
