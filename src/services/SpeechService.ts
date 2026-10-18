import { SPEECH_TAGS, type Lang } from '../domain/Language';

/** Reads words and sentences aloud with the browser's own voices (no network). */
export class SpeechService {
  get available(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  speak(text: string, lang: Lang): void {
    if (!this.available) return;
    const tag = SPEECH_TAGS[lang];
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = tag;
    const voice = speechSynthesis.getVoices().find((v) => v.lang.replace('_', '-').startsWith(tag.slice(0, 2)));
    if (voice) utterance.voice = voice;
    utterance.rate = 0.9;
    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);
  }
}
