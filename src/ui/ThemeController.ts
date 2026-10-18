import type { ThemeChoice } from '../services/SettingsStore';

/** Applies the theme choice; "system" leaves it to prefers-color-scheme in the CSS. */
export class ThemeController {
  constructor(private readonly root: HTMLElement = document.documentElement) {}

  apply(choice: ThemeChoice): void {
    if (choice === 'system') this.root.removeAttribute('data-theme');
    else this.root.setAttribute('data-theme', choice);
  }
}
