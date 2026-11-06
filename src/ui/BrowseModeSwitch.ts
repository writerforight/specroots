import type { I18n } from '../i18n/I18n';
import type { BrowseMode } from '../services/SettingsStore';
import { h } from './dom';

/** The two ways in, in the order the start screen offers them. */
export const BROWSE_MODES: readonly BrowseMode[] = ['root', 'words'];

/** Root route · Learn words, at the top of the side column so the choice is always in sight. */
export class BrowseModeSwitch {
  readonly el = h('div', { class: 'segmented browse-switch', role: 'group' });

  constructor(
    private readonly i18n: I18n,
    private readonly onChange: (mode: BrowseMode) => void,
  ) {}

  render(current: BrowseMode): void {
    this.el.setAttribute('aria-label', this.i18n.t('wayInQuestion'));
    this.el.replaceChildren(
      ...BROWSE_MODES.map((mode) =>
        h('button', { type: 'button', 'aria-pressed': String(mode === current), onclick: () => this.onChange(mode) }, this.i18n.t(`mode_${mode}`)),
      ),
    );
  }
}

/** The same choice as two large cards with a line each: on the start page when nothing is open. */
export function wayInCards(i18n: I18n, current: BrowseMode, onChange: (mode: BrowseMode) => void): HTMLElement {
  return h(
    'section',
    { class: 'way-in' },
    h('h1', { class: 'way-in-title' }, i18n.t('wayInQuestion')),
    h(
      'div',
      { class: 'way-in-cards' },
      ...BROWSE_MODES.map((mode) =>
        h(
          'button',
          { type: 'button', class: 'way-in-card', 'aria-pressed': String(mode === current), onclick: () => onChange(mode) },
          h('span', { class: 'way-in-name' }, i18n.t(`mode_${mode}`)),
          h('span', { class: 'way-in-text' }, i18n.t(`mode_${mode}_text`)),
        ),
      ),
    ),
  );
}
