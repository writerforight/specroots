/** Every language the app knows. English is the source language of the main lexicon; German of the German one. */
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

/** The languages a lexicon can be written in: English roots, and German roots (stehen → verstehen). */
export type SourceLang = 'en' | 'de';

/**
 * Which meanings a word card shows, in order: the word's own language first (its definition), then for
 * German words English, then the learner's chosen languages without repeats.
 */
export function glossLangs(source: SourceLang, chosen: readonly TranslationLang[]): Lang[] {
  const out: Lang[] = [source];
  if (source !== 'en') out.push('en');
  for (const lang of chosen) if (!out.includes(lang)) out.push(lang);
  return out;
}

/** The translations shown under an example sentence: the gloss languages without the sentence's own. */
export function sentenceLangs(source: SourceLang, chosen: readonly TranslationLang[]): Lang[] {
  return glossLangs(source, chosen).filter((lang) => lang !== source);
}

export function isTranslationLang(value: unknown): value is TranslationLang {
  return typeof value === 'string' && (TRANSLATION_LANGUAGES as readonly string[]).includes(value);
}
