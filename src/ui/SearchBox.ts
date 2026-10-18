import type { I18n } from '../i18n/I18n';
import type { SearchIndex } from '../services/SearchIndex';
import { clear, h } from './dom';
import { rootHref } from './routes';

/** Type a root or a word and jump to it. Enter opens the first hit. */
export class SearchBox {
  readonly el: HTMLElement;
  private readonly input: HTMLInputElement;
  private readonly results = h('ul', { class: 'search-results', role: 'listbox', hidden: true });
  private index: SearchIndex | null = null;

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

  relabel(): void {
    const label = this.i18n.t('searchPlaceholder');
    this.input.placeholder = label;
    this.input.setAttribute('aria-label', label);
  }

  private update(): void {
    const hits = this.index?.search(this.input.value) ?? [];
    clear(this.results);
    if (this.input.value.trim() === '') return this.hide();
    if (hits.length === 0) this.results.append(h('li', { class: 'search-empty' }, this.i18n.t('noResults')));
    for (const hit of hits) {
      this.results.append(
        h(
          'li',
          { role: 'option' },
          h('a', { href: rootHref(hit.rootId, hit.wordId), onclick: () => this.reset() }, h('span', { lang: 'en' }, hit.label), hit.wordId ? null : h('span', { class: 'hit-kind' }, this.i18n.t('part_root'))),
        ),
      );
    }
    this.results.hidden = false;
  }

  private onKey(event: KeyboardEvent): void {
    if (event.key === 'Escape') return this.reset();
    if (event.key !== 'Enter') return;
    const first = this.results.querySelector('a');
    if (first) {
      this.navigate(first.getAttribute('href') ?? '#/');
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
