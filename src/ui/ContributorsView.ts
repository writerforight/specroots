import type { Contributor } from '../domain/Contributor';
import { h } from './dom';
import { deRootHref, listHref, rootHref } from './routes';
import type { ViewContext } from './ViewContext';

const CONTRIBUTING_URL = 'https://github.com/writerforight/specroots/blob/main/CONTRIBUTING.md';

/**
 * Who added the words. The first look shows only names, as bubbles of one size in a random order
 * that drift a little: nobody is first. "Details" switches to the numbers: words per person, split
 * by section, and the roots and lists each one added.
 */
export class ContributorsView {
  readonly el = h('section', { class: 'contributors' });
  private detailed = false;

  constructor(
    private readonly ctx: ViewContext,
    private readonly contributors: readonly Contributor[],
    /** Injected so tests can fix the order. */
    private readonly random: () => number = Math.random,
  ) {
    this.render();
  }

  private render(): void {
    const { i18n } = this.ctx;
    const toggle = (detailed: boolean, label: string) =>
      h('button', { type: 'button', 'aria-pressed': String(this.detailed === detailed), onclick: () => this.show(detailed) }, label);
    this.el.replaceChildren(
      h(
        'header',
        { class: 'contributors-head' },
        h('h1', { class: 'index-title' }, i18n.t('contributors')),
        h('div', { class: 'segmented', role: 'group' }, toggle(false, i18n.t('contributorsNames')), toggle(true, i18n.t('contributorsDetails'))),
      ),
      h('p', { class: 'contributors-intro' }, i18n.t('contributorsIntro')),
      this.detailed ? this.details() : this.bubbles(),
      h('a', { class: 'contribute-link', href: CONTRIBUTING_URL, target: '_blank', rel: 'noopener' }, `${i18n.t('contribute')} →`),
    );
  }

  private show(detailed: boolean): void {
    this.detailed = detailed;
    this.render();
  }

  /** Same size, shuffled on every visit; each bubble drifts on its own slow, small path. */
  private bubbles(): HTMLElement {
    const order = [...this.contributors];
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(this.random() * (i + 1));
      [order[i], order[j]] = [order[j] as Contributor, order[i] as Contributor];
    }
    const between = (min: number, max: number) => (min + this.random() * (max - min)).toFixed(1);
    return h(
      'ul',
      { class: 'bubbles' },
      ...order.map((c) =>
        h(
          'li',
          {},
          h(
            'button',
            {
              class: 'bubble',
              type: 'button',
              style: `--dx:${between(-10, 10)}px;--dy:${between(-14, 14)}px;--drift:${between(5, 9)}s;--delay:-${between(0, 9)}s`,
              onclick: () => this.show(true),
            },
            c.name,
          ),
        ),
      ),
    );
  }

  /** A–Z by name, so the order still says nothing about who added more. */
  private details(): HTMLElement {
    const { i18n } = this.ctx;
    const lang = i18n.language;
    const stat = (label: string, value: number) => h('div', { class: 'stat' }, h('dt', {}, label), h('dd', {}, String(value)));
    const people = [...this.contributors].sort((a, b) => a.name.localeCompare(b.name));
    return h(
      'div',
      { class: 'contributor-cards' },
      ...people.map((c) =>
        h(
          'article',
          { class: 'contributor-card' },
          h('h2', {}, h('a', { href: c.profileUrl, target: '_blank', rel: 'noopener' }, c.name)),
          h(
            'dl',
            { class: 'stats' },
            stat(i18n.t('stat_words'), c.totalWords),
            stat(i18n.t('stat_english'), c.words.en),
            stat(i18n.t('stat_german'), c.words.de),
            stat(i18n.t('stat_objects'), c.objects),
          ),
          c.roots.length > 0 &&
            h(
              'details',
              { class: 'added' },
              h('summary', {}, `${i18n.t('stat_roots')} (${c.roots.length})`),
              h(
                'div',
                { class: 'added-links' },
                ...c.roots.map((r) => h('a', { class: 'list-chip', lang: r.lang, href: r.lang === 'de' ? deRootHref(r.id) : rootHref(r.id) }, r.label)),
              ),
            ),
          c.lists.length > 0 &&
            h(
              'details',
              { class: 'added' },
              h('summary', {}, `${i18n.t('stat_lists')} (${c.lists.length})`),
              h('div', { class: 'added-links' }, ...c.lists.map((l) => h('a', { class: 'list-chip', href: listHref(l.id) }, l.title[lang] ?? l.title.en ?? l.id))),
            ),
        ),
      ),
    );
  }
}
