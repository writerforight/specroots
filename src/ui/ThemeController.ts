import type { ThemeChoice } from '../services/SettingsStore';

/** Applies the theme choice; "system" leaves it to prefers-color-scheme in the CSS. */
export class ThemeController {
  constructor(private readonly root: HTMLElement = document.documentElement) {}

  apply(choice: ThemeChoice): void {
    if (choice === 'system') this.root.removeAttribute('data-theme');
    else this.root.setAttribute('data-theme', choice);
  }

  /** The choice a one-tap button should switch to: flips light/dark, and black-on-white/white-on-black. */
  static flip(choice: ThemeChoice, systemDark: boolean): ThemeChoice {
    switch (choice) {
      case 'light': return 'dark';
      case 'dark': return 'light';
      case 'mono': return 'mono-dark';
      case 'mono-dark': return 'mono';
      case 'system': return systemDark ? 'light' : 'dark';
    }
  }
}
