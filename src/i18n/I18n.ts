import type { Lang } from '../domain/Language';
import { MESSAGES, type MessageKey } from './messages';

/** Looks up interface texts in the current language and fills {placeholders}. */
export class I18n {
  constructor(private lang: Lang) {}

  get language(): Lang {
    return this.lang;
  }

  setLanguage(lang: Lang): void {
    this.lang = lang;
  }

  t(key: MessageKey, vars: Record<string, string | number> = {}): string {
    const template = MESSAGES[this.lang][key];
    return template.replace(/\{(\w+)\}/g, (whole, name: string) => (name in vars ? String(vars[name]) : whole));
  }
}
