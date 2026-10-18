/** Every language the app knows. English is the source language of the lexicon. */
export const LANGUAGES = ['en', 'tr', 'de', 'fr', 'it', 'es'] as const;
export type Lang = (typeof LANGUAGES)[number];

/** Languages a learner can pick for translations (everything except the source). */
export const TRANSLATION_LANGUAGES = ['tr', 'de', 'fr', 'it', 'es'] as const satisfies readonly Lang[];
export type TranslationLang = (typeof TRANSLATION_LANGUAGES)[number];

/** Each language named in itself, so a learner always finds their own. */
export const ENDONYMS: Record<Lang, string> = {
  en: 'English',
  tr: 'Türkçe',
  de: 'Deutsch',
  fr: 'Français',
  it: 'Italiano',
  es: 'Español',
};

/** BCP 47 tags for speech synthesis. */
export const SPEECH_TAGS: Record<Lang, string> = {
  en: 'en-US',
  tr: 'tr-TR',
  de: 'de-DE',
  fr: 'fr-FR',
  it: 'it-IT',
  es: 'es-ES',
};

/** A text in several languages. Missing languages are simply absent. */
export type Localized = Partial<Record<Lang, string>>;

export function isLang(value: unknown): value is Lang {
  return typeof value === 'string' && (LANGUAGES as readonly string[]).includes(value);
}

export function isTranslationLang(value: unknown): value is TranslationLang {
  return typeof value === 'string' && (TRANSLATION_LANGUAGES as readonly string[]).includes(value);
}
