import type { Affix } from '../domain/Affix';
import type { I18n } from '../i18n/I18n';
import type { SpeechService } from '../services/SpeechService';
import type { Settings } from '../services/SettingsStore';

/** Everything a view needs to render, passed in rather than imported, so views stay swappable. */
export interface ViewContext {
  readonly i18n: I18n;
  readonly settings: Settings;
  readonly speech: SpeechService;
  readonly affixes: ReadonlyMap<string, Affix>;
}
