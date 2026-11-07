import { ENDONYMS, LANGUAGES, TRANSLATION_LANGUAGES, type Lang, type TranslationLang } from '../domain/Language';
import type { I18n } from '../i18n/I18n';
import type { BrowseMode, Section, Settings, SettingsStore, ThemeChoice } from '../services/SettingsStore';
import { BROWSE_MODES } from './BrowseModeSwitch';
import { h } from './dom';

export type DialogMode = 'welcome' | 'settings';

/** True when the address shows a different section than the one just chosen. */
function sectionChanged(section: Section): boolean {
  const lists = /^#\/(lists|list|object)\b/.test(location.hash);
  return lists !== (section === 'lists');
}

/** One form for both the first-visit welcome and the settings screen. */
export class SettingsDialog {
  readonly el = h('dialog', { class: 'settings-dialog' });

  constructor(
    private readonly i18n: I18n,
    private readonly store: SettingsStore,
  ) {
    // Esc must not skip the welcome screen before languages are chosen.
    this.el.addEventListener('cancel', (e) => {
      if (!this.store.value.onboarded) e.preventDefault();
    });
  }

  open(mode: DialogMode): void {
    this.build(mode, this.store.value);
    if (!this.el.open) this.el.showModal();
  }

  private build(mode: DialogMode, s: Settings): void {
    const t = (k: Parameters<I18n['t']>[0]) => this.i18n.t(k);
    const warning = h('p', { class: 'form-warning', role: 'alert', hidden: true }, t('pickAtLeastOne'));

    const uiSelect = h(
      'select',
      {
        name: 'uiLang',
        onchange: () => {
          // Re-render in the newly chosen language right away, keeping the other choices.
          this.store.update({ uiLang: uiSelect.value as Lang, translationLangs: this.checkedLangs(form) });
          this.build(mode, this.store.value);
        },
      },
      ...LANGUAGES.map((l) => h('option', { value: l, selected: l === s.uiLang }, ENDONYMS[l])),
    );

    const form = h(
      'form',
      {
        method: 'dialog',
        onsubmit: (e: Event) => {
          const langs = this.checkedLangs(form);
          if (langs.length === 0) {
            e.preventDefault();
            warning.hidden = false;
            return;
          }
          const theme = (form.querySelector<HTMLInputElement>('input[name="theme"]:checked')?.value ?? 'system') as ThemeChoice;
          // "Start with": a roots-section mode, or the object lists.
          const start = form.querySelector<HTMLInputElement>('input[name="browse"]:checked')?.value ?? 'root';
          const section: Section = start === 'lists' ? 'lists' : 'roots';
          const browseMode = (start === 'lists' ? s.browseMode : start) as BrowseMode;
          this.store.update({ translationLangs: langs, theme, browseMode, section, onboarded: true });
          // Show the chosen section right away.
          if (sectionChanged(section)) location.hash = section === 'lists' ? '#/lists' : '#/';
        },
      },
      h('h2', {}, mode === 'welcome' ? t('welcomeTitle') : t('settings')),
      mode === 'welcome' ? h('p', { class: 'dialog-lead' }, t('welcomeText')) : null,
      h('label', { class: 'field' }, h('span', { class: 'field-label' }, t('interfaceLanguage')), uiSelect),
      h(
        'fieldset',
        { class: 'field' },
        h('legend', { class: 'field-label' }, t('translationLanguages')),
        h(
          'div',
          { class: 'chips' },
          ...TRANSLATION_LANGUAGES.map((l) =>
            h('label', { class: 'chip' }, h('input', { type: 'checkbox', name: 'lang', value: l, checked: s.translationLangs.includes(l) }), ENDONYMS[l]),
          ),
        ),
        warning,
      ),
      h(
        'fieldset',
        { class: 'field' },
        h('legend', { class: 'field-label' }, t('startWith')),
        h(
          'div',
          { class: 'chips' },
          ...BROWSE_MODES.map((mode) =>
            h('label', { class: 'chip' }, h('input', { type: 'radio', name: 'browse', value: mode, checked: s.section === 'roots' && s.browseMode === mode }), t(`browse_${mode}`)),
          ),
          h('label', { class: 'chip' }, h('input', { type: 'radio', name: 'browse', value: 'lists', checked: s.section === 'lists' }), t('section_lists')),
        ),
      ),
      h(
        'fieldset',
        { class: 'field' },
        h('legend', { class: 'field-label' }, t('theme')),
        h(
          'div',
          { class: 'chips' },
          ...(['system', 'light', 'dark', 'mono'] as const).map((theme) =>
            h('label', { class: 'chip' }, h('input', { type: 'radio', name: 'theme', value: theme, checked: s.theme === theme }), t(`theme_${theme}`)),
          ),
        ),
      ),
      h('div', { class: 'dialog-actions' }, h('button', { class: 'primary', type: 'submit' }, mode === 'welcome' ? t('start') : t('done'))),
    );
    this.el.replaceChildren(form);
  }

  private checkedLangs(form: HTMLFormElement): TranslationLang[] {
    const checked = new Set([...form.querySelectorAll<HTMLInputElement>('input[name="lang"]:checked')].map((i) => i.value));
    // Keep the fixed language order regardless of click order.
    return TRANSLATION_LANGUAGES.filter((l) => checked.has(l));
  }
}
