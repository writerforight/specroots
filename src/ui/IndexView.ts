import type { IndexLayout } from '../services/SettingsStore';
import { h } from './dom';

/** One root or affix on a section's start page. */
export interface IndexItem {
  /** Sort and letter key: "spec", "re-" */
  readonly key: string;
  /** The headword: "spec, spic". Tiles show only its first form big, the rest small. */
  readonly label: string;
  readonly meaning: string;
  readonly count: number;
  /** A few words of the family, for the dictionary page. */
  readonly examples: readonly string[];
  readonly href: string;
  readonly lang: string;
  /** Prefixes and suffixes keep their part colour/underline. */
  readonly kind?: 'prefix' | 'suffix';
}

/**
 * A section's start page: every root (or prefix/suffix) at once, as a wall of tiles or as a
 * printed-dictionary page with big initial letters. Layouts are a registry, like the derivation views,
 * so a new look is one more function.
 */
export const INDEX_LAYOUTS: Record<IndexLayout, (items: readonly IndexItem[], wordsLabel: (n: number) => string) => HTMLElement> = {
  grid: (items, wordsLabel) =>
    h(
      'ul',
      { class: 'index-grid' },
      ...items.map((item) =>
        h(
          'li',
          {},
          h(
            'a',
            { class: 'index-tile', href: item.href },
            h('span', { class: 'tile-count' }, wordsLabel(item.count)),
            h('span', { class: `tile-label${item.kind ? ` part-${item.kind}` : ''}`, lang: item.lang }, item.label.split(', ')[0]),
            item.label.includes(', ') ? h('span', { class: 'tile-forms', lang: item.lang }, item.label.split(', ').slice(1).join(' · ')) : null,
            h('span', { class: 'tile-meaning' }, item.meaning),
          ),
        ),
      ),
    ),

  dictionary: (items) => {
    const byLetter = new Map<string, IndexItem[]>();
    for (const item of items) {
      const letter = item.key.replace(/^-/, '').charAt(0).toUpperCase();
      byLetter.set(letter, [...(byLetter.get(letter) ?? []), item]);
    }
    const letters = [...byLetter.keys()];
    return h(
      'div',
      { class: 'index-dictionary' },
      h(
        'nav',
        { class: 'dict-rail' },
        ...letters.map((l) => h('a', { href: '#', onclick: (e: Event) => jump(e, l) }, l)),
      ),
      h(
        'div',
        { class: 'dict-page' },
        ...[...byLetter].map(([letter, group]) =>
          h(
            'section',
            { class: 'dict-letter', 'data-letter': letter },
            h('h2', { class: 'dict-initial' }, letter),
            h(
              'div',
              { class: 'dict-columns' },
              ...group.map((item) =>
                h(
                  'a',
                  { class: 'dict-entry', href: item.href },
                  h('span', { class: `dict-head${item.kind ? ` part-${item.kind}` : ''}`, lang: item.lang }, item.label),
                  h('span', { class: 'dict-meaning' }, item.meaning),
                  item.examples.length > 0 ? h('span', { class: 'dict-examples', lang: item.lang }, item.examples.join(' · ')) : null,
                ),
              ),
            ),
          ),
        ),
      ),
    );
  },
};

/** The rail links scroll to a letter without touching the hash route. */
function jump(e: Event, letter: string): void {
  e.preventDefault();
  document.querySelector(`.dict-letter[data-letter="${CSS.escape(letter)}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
