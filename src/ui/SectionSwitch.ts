import type { I18n } from '../i18n/I18n';
import type { Section } from '../services/SettingsStore';
import { h } from './dom';

export const SECTIONS: readonly Section[] = ['roots', 'lists'];

/** Word roots · Object lists: the two halves of the app, at the very top of the side list. */
export class SectionSwitch {
  readonly el = h('div', { class: 'segmented section-switch', role: 'group' });

  constructor(
    private readonly i18n: I18n,
    private readonly onChange: (section: Section) => void,
  ) {}

  render(current: Section): void {
    this.el.setAttribute('aria-label', this.i18n.t('sectionLabel'));
    this.el.replaceChildren(
      ...SECTIONS.map((section) =>
        h('button', { type: 'button', 'aria-pressed': String(section === current), onclick: () => this.onChange(section) }, this.i18n.t(`section_${section}`)),
      ),
    );
  }
}
