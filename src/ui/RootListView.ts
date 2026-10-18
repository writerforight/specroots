import type { RootSummary } from '../domain/Root';
import type { I18n } from '../i18n/I18n';
import { clear, h } from './dom';
import { rootHref } from './routes';

/** The alphabetical root list, grouped under initial letters. */
export class RootListView {
  readonly el = h('nav', { class: 'root-list' });

  constructor(private readonly i18n: I18n) {}

  render(roots: readonly RootSummary[], selectedId: string | null): void {
    const lang = this.i18n.language;
    const byLetter = new Map<string, RootSummary[]>();
    for (const root of roots) {
      const letter = (root.forms[0] ?? root.id).charAt(0).toUpperCase();
      byLetter.set(letter, [...(byLetter.get(letter) ?? []), root]);
    }
    clear(this.el);
    this.el.setAttribute('aria-label', this.i18n.t('rootsHeading'));
    this.el.append(
      h('h2', { class: 'pane-title' }, this.i18n.t('rootsHeading')),
      ...[...byLetter].map(([letter, group]) =>
        h(
          'section',
          { class: 'letter-group' },
          h('h3', { class: 'letter' }, letter),
          h(
            'ul',
            {},
            ...group.map((root) =>
              h(
                'li',
                {},
                h(
                  'a',
                  { class: 'root-link', href: rootHref(root.id), 'aria-current': root.id === selectedId ? 'page' : null },
                  h('span', { class: 'root-forms', lang: 'en' }, root.forms.join(', ')),
                  h('span', { class: 'root-meaning' }, root.meaning[lang] ?? root.meaning.en ?? ''),
                  h('span', { class: 'root-count' }, String(root.words.length)),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
