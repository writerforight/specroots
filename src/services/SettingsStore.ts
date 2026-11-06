import { isLang, isTranslationLang, type Lang, type TranslationLang } from '../domain/Language';
import type { KeyValueStore } from './KeyValueStore';

export type ThemeChoice = 'system' | 'light' | 'dark';
export type DerivationViewKind = 'list' | 'tree';
/** The two halves of the app: word roots (part one of the plan) and object lists (part two). */
export type Section = 'roots' | 'lists';
/** What the roots section's side list shows: roots, or the prefixes or suffixes words are built with. */
export type BrowseMode = 'root' | 'prefix' | 'suffix';

export interface Settings {
  readonly uiLang: Lang;
  readonly translationLangs: readonly TranslationLang[];
  readonly theme: ThemeChoice;
  readonly derivationView: DerivationViewKind;
  readonly section: Section;
  readonly browseMode: BrowseMode;
  /** False until the learner has picked languages on the welcome screen. */
  readonly onboarded: boolean;
}

type Listener = (settings: Settings, previous: Settings) => void;

const KEY = 'specroots.settings.v1';

/** Holds the learner's choices, persists them, and tells subscribers when they change. */
export class SettingsStore {
  private current: Settings;
  private readonly listeners = new Set<Listener>();

  constructor(
    private readonly store: KeyValueStore,
    browserLanguages: readonly string[] = [],
  ) {
    this.current = SettingsStore.restore(store.get(KEY), SettingsStore.guessLang(browserLanguages));
  }

  get value(): Settings {
    return this.current;
  }

  update(patch: Partial<Settings>): void {
    const previous = this.current;
    this.current = { ...previous, ...patch };
    this.store.set(KEY, JSON.stringify(this.current));
    for (const listener of this.listeners) listener(this.current, previous);
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  static defaults(uiLang: Lang): Settings {
    return {
      uiLang,
      translationLangs: isTranslationLang(uiLang) ? [uiLang] : ['tr'],
      theme: 'system',
      derivationView: 'list',
      section: 'roots',
      browseMode: 'root',
      onboarded: false,
    };
  }

  private static guessLang(browserLanguages: readonly string[]): Lang {
    for (const tag of browserLanguages) {
      const base = tag.slice(0, 2).toLowerCase();
      if (isLang(base)) return base;
    }
    return 'en';
  }

  /** Reads saved settings, keeping only values that are still valid. */
  private static restore(saved: string | null, fallbackLang: Lang): Settings {
    const defaults = SettingsStore.defaults(fallbackLang);
    if (!saved) return defaults;
    let raw: Record<string, unknown>;
    try {
      raw = JSON.parse(saved) as Record<string, unknown>;
    } catch {
      return defaults;
    }
    const langs = Array.isArray(raw.translationLangs) ? raw.translationLangs.filter(isTranslationLang) : null;
    return {
      uiLang: isLang(raw.uiLang) ? raw.uiLang : defaults.uiLang,
      translationLangs: langs ?? defaults.translationLangs,
      theme: raw.theme === 'light' || raw.theme === 'dark' || raw.theme === 'system' ? raw.theme : defaults.theme,
      derivationView: raw.derivationView === 'tree' ? 'tree' : 'list',
      section: raw.section === 'lists' ? 'lists' : 'roots',
      browseMode: raw.browseMode === 'prefix' || raw.browseMode === 'suffix' ? raw.browseMode : 'root',
      onboarded: raw.onboarded === true,
    };
  }
}
