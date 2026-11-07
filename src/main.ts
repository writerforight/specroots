import './styles/tokens.css';
import './styles/app.css';
import { App } from './app/App';
import { JsonLexiconRepository } from './data/JsonLexiconRepository';
import { BrowserStore } from './services/KeyValueStore';
import { SettingsStore } from './services/SettingsStore';

const host = document.getElementById('app');
if (!host) throw new Error('#app is missing from index.html');

const base = new URL(import.meta.env.BASE_URL, location.href).href;
const repository = JsonLexiconRepository.overHttp(base);
const german = JsonLexiconRepository.overHttp(base, 'data/de/', 'de');
const settings = new SettingsStore(new BrowserStore(), navigator.languages);
void new App(host, repository, settings, german).start();
