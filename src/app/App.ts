import type { LexiconRepository } from '../data/LexiconRepository';
import type { Affix } from '../domain/Affix';
import type { RootSummary } from '../domain/Root';
import { I18n } from '../i18n/I18n';
import { SearchIndex } from '../services/SearchIndex';
import type { SettingsStore } from '../services/SettingsStore';
import { SpeechService } from '../services/SpeechService';
import { h } from '../ui/dom';
import { RootDetailView } from '../ui/RootDetailView';
import { RootListView } from '../ui/RootListView';
import { parseRoute, type Route } from '../ui/routes';
import { SearchBox } from '../ui/SearchBox';
import { SettingsDialog } from '../ui/SettingsDialog';
import { ThemeController } from '../ui/ThemeController';
import type { ViewContext } from '../ui/ViewContext';

/** Wires data, settings and views together and reacts to route and setting changes. */
export class App {
  private readonly i18n: I18n;
  private readonly speech = new SpeechService();
  private readonly theme = new ThemeController();
  private readonly list: RootListView;
  private readonly detail: RootDetailView;
  private readonly search: SearchBox;
  private readonly dialog: SettingsDialog;
  private readonly tagline = h('span', { class: 'tagline' });
  private readonly settingsButton = h('button', { class: 'icon-button settings-button', type: 'button', onclick: () => this.dialog.open('settings') });

  private roots: RootSummary[] = [];
  private affixes: ReadonlyMap<string, Affix> = new Map();
  private route: Route = { kind: 'home' };
  /** Guards against a slow load finishing after the learner has already moved on. */
  private renderToken = 0;

  constructor(
    private readonly host: HTMLElement,
    private readonly repository: LexiconRepository,
    private readonly settings: SettingsStore,
  ) {
    this.i18n = new I18n(settings.value.uiLang);
    this.list = new RootListView(this.i18n);
    this.detail = new RootDetailView((kind) => this.settings.update({ derivationView: kind }));
    this.search = new SearchBox(this.i18n, (href) => (location.hash = href));
    this.dialog = new SettingsDialog(this.i18n, settings);
  }

  async start(): Promise<void> {
    // index.html ships a plain-HTML root list for crawlers and no-JS readers; the app takes over.
    this.host.replaceChildren(
      h(
        'header',
        { class: 'topbar' },
        h('a', { class: 'brand', href: '#/' }, h('span', { class: 'brand-name' }, 'spec', h('b', {}, 'roots')), this.tagline),
        this.search.el,
        this.settingsButton,
      ),
      h('div', { class: 'layout' }, this.list.el, this.detail.el),
      this.dialog.el,
    );
    this.settingsButton.innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h4M12 17h8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none"/><circle cx="16" cy="7" r="2" stroke="currentColor" stroke-width="1.8" fill="none"/><circle cx="10" cy="17" r="2" stroke="currentColor" stroke-width="1.8" fill="none"/></svg>';

    this.theme.apply(this.settings.value.theme);
    this.applyLanguage();
    this.settings.subscribe((now, before) => {
      if (now.theme !== before.theme) this.theme.apply(now.theme);
      if (now.uiLang !== before.uiLang) this.applyLanguage();
      void this.render();
    });
    window.addEventListener('hashchange', () => {
      this.route = parseRoute(location.hash);
      void this.render();
    });

    try {
      [this.roots, this.affixes] = await Promise.all([this.repository.listRoots(), this.repository.getAffixes()]);
    } catch {
      this.detail.showError(this.context());
      return;
    }
    this.search.setIndex(new SearchIndex(this.roots));
    this.route = parseRoute(location.hash);
    await this.render();
    if (!this.settings.value.onboarded) this.dialog.open('welcome');
  }

  private applyLanguage(): void {
    this.i18n.setLanguage(this.settings.value.uiLang);
    document.documentElement.lang = this.settings.value.uiLang;
    this.tagline.textContent = this.i18n.t('tagline');
    this.settingsButton.title = this.i18n.t('settings');
    this.settingsButton.setAttribute('aria-label', this.i18n.t('settings'));
    this.search.relabel();
  }

  private context(): ViewContext {
    return { i18n: this.i18n, settings: this.settings.value, speech: this.speech, affixes: this.affixes };
  }

  private async render(): Promise<void> {
    const token = ++this.renderToken;
    const route = this.route;
    const selected = route.kind === 'root' ? route.rootId : null;
    document.body.dataset.view = route.kind;
    this.list.render(this.roots, selected);

    if (route.kind === 'home') {
      this.detail.showEmpty(this.context());
      document.title = 'specroots';
      return;
    }
    try {
      const root = await this.repository.getRoot(route.rootId);
      if (token !== this.renderToken) return;
      this.detail.show(root, this.context(), route.wordId);
      document.title = `${root.forms[0] ?? root.id} · specroots`;
    } catch {
      if (token === this.renderToken) this.detail.showError(this.context());
    }
  }
}
