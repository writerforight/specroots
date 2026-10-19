import type { I18n } from '../i18n/I18n';
import type { BrowseMode } from '../services/SettingsStore';
import { h } from './dom';

export const BROWSE_MODES: readonly BrowseMode[] = ['root', 'prefix', 'suffix'];

/** Roots · Prefixes · Suffixes, above the side list. */
export class BrowseModeSwitch {
  readonly el = h('div', { class: 'segmented browse-switch', role: 'group' });

  constructor(
    private readonly i18n: I18n,
    private readonly onChange: (mode: BrowseMode) => void,
  ) {}

  render(current: BrowseMode): void {
    this.el.setAttribute('aria-label', this.i18n.t('browseBy'));
    this.el.replaceChildren(
      ...BROWSE_MODES.map((mode) =>
        h('button', { type: 'button', 'aria-pressed': String(mode === current), onclick: () => this.onChange(mode) }, this.i18n.t(`browse_${mode}`)),
      ),
    );
  }
}
