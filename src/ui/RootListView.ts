import type { RootSummary } from '../domain/Root';
import type { I18n } from '../i18n/I18n';
import { clear, h } from './dom';
import { rootHref } from './routes';

/** The alphabetical root list, grouped under initial letters. */
export class RootListView {
  readonly el = h('div', { class: 'browse-list' });

  constructor(private readonly i18n: I18n) {}

  render(roots: readonly RootSummary[], selectedId: string | null): void {
    const lang = this.i18n.language;
    clear(this.el);
    this.el.append(
      ...letterGroups(roots, (root) => root.forms[0] ?? root.id, (root) =>
        h(
          'a',
          { class: 'root-link', href: rootHref(root.id), 'aria-current': root.id === selectedId ? 'page' : null },
          h('span', { class: 'root-forms', lang: 'en' }, root.forms.join(', ')),
          h('span', { class: 'root-meaning' }, root.meaning[lang] ?? root.meaning.en ?? ''),
          h('span', { class: 'root-count' }, String(root.words.length)),
        ),
      ),
    );
  }
}

/** Items under their initial letter, in the order given: A · aud, B · bio … */
export function letterGroups<T>(items: readonly T[], key: (item: T) => string, link: (item: T) => HTMLElement): HTMLElement[] {
  const byLetter = new Map<string, T[]>();
  for (const item of items) {
    const letter = key(item).charAt(0).toUpperCase();
    byLetter.set(letter, [...(byLetter.get(letter) ?? []), item]);
  }
  return [...byLetter].map(([letter, group]) =>
    h('section', { class: 'letter-group' }, h('h3', { class: 'letter' }, letter), h('ul', {}, ...group.map((item) => h('li', {}, link(item))))),
  );
}
