import type { I18n } from '../i18n/I18n';
import type { SearchHit, SearchIndex } from '../services/SearchIndex';
import type { Section } from '../services/SettingsStore';
import { clear, h } from './dom';
import { affixHref, deRootHref, expressionHref, listHref, objectHref, rootHref } from './routes';

/** Type a root, a word, an affix or an object (in any language) and jump to it. Enter opens the first hit. */
export class SearchBox {
  readonly el: HTMLElement;
  private readonly input: HTMLInputElement;
  private readonly results = h('ul', { class: 'search-results', role: 'listbox', hidden: true });
  private index: SearchIndex | null = null;
  private scope: Section | undefined;

  constructor(
    private readonly i18n: I18n,
    private readonly navigate: (href: string) => void,
  ) {
    this.input = h('input', {
      class: 'search-input',
      type: 'search',
      autocomplete: 'off',
      spellcheck: 'false',
      lang: 'en',
      oninput: () => this.update(),
      onkeydown: (e: Event) => this.onKey(e as KeyboardEvent),
      onblur: () => setTimeout(() => this.hide(), 150),
    });
    this.el = h('div', { class: 'search', role: 'search' }, this.input, this.results);
    this.relabel();
  }

  setIndex(index: SearchIndex): void {
    this.index = index;
  }

  /** Roots section: only roots, words and affixes. Lists section: only objects and lists. */
  setScope(scope: Section): void {
    this.scope = scope;
  }

  relabel(): void {
    const label = this.i18n.t('searchPlaceholder');
    this.input.placeholder = label;
    this.input.setAttribute('aria-label', label);
  }

  private update(): void {
    const hits = this.index?.search(this.input.value, 8, this.scope) ?? [];
    clear(this.results);
    if (this.input.value.trim() === '') return this.hide();
    if (hits.length === 0) this.results.append(h('li', { class: 'search-empty' }, this.i18n.t('noResults')));
    for (const hit of hits) {
      this.results.append(
        h('li', { role: 'option' }, h('a', { href: this.href(hit), onclick: () => this.reset() }, h('span', { lang: hit.german ? 'de' : 'en' }, hit.label), this.tag(hit))),
      );
    }
    this.results.hidden = false;
  }

  private href(hit: SearchHit): string {
    if (hit.affix) return affixHref(hit.affix.id);
    if (hit.objectId) return objectHref(hit.objectId);
    if (hit.listId) return listHref(hit.listId);
    if (hit.categoryId) return expressionHref(hit.categoryId, hit.expressionId ?? null);
    if (hit.german && hit.rootId) return deRootHref(hit.rootId, hit.wordId);
    return hit.rootId ? rootHref(hit.rootId, hit.wordId) : '#/roots';
  }

  /** Roots say "root"; affixes show their meaning, which also tells homographs (in- into, in- not) apart. */
  private tag(hit: SearchHit): HTMLElement | null {
    if (hit.objectId) return h('span', { class: 'hit-kind' }, hit.matched ?? this.i18n.t('part_object'));
    if (hit.listId) return h('span', { class: 'hit-kind' }, this.i18n.t('part_list'));
    if (hit.categoryId) return h('span', { class: 'hit-kind' }, this.i18n.t(hit.expressionId ? 'part_expression' : 'part_category'));
    if (hit.affix) return h('span', { class: 'hit-kind' }, hit.affix.meaning[this.i18n.language] ?? hit.affix.meaning.en ?? '');
    return hit.wordId ? null : h('span', { class: 'hit-kind' }, this.i18n.t('part_root'));
  }

  private onKey(event: KeyboardEvent): void {
    if (event.key === 'Escape') return this.reset();
    if (event.key !== 'Enter') return;
    const first = this.results.querySelector('a');
    if (first) {
      this.navigate(first.getAttribute('href') ?? '#/roots');
      this.reset();
    }
  }

  private reset(): void {
    this.input.value = '';
    this.hide();
    this.input.blur();
  }

  private hide(): void {
    this.results.hidden = true;
  }
}
