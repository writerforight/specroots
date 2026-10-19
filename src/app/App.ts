import type { LexiconRepository } from '../data/LexiconRepository';
import type { Affix, AffixIndex } from '../domain/Affix';
import type { RootSummary } from '../domain/Root';
import { I18n } from '../i18n/I18n';
import { SearchIndex } from '../services/SearchIndex';
import type { SettingsStore } from '../services/SettingsStore';
import { SpeechService } from '../services/SpeechService';
import { AffixListView } from '../ui/AffixListView';
import { BrowseModeSwitch } from '../ui/BrowseModeSwitch';
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
  private readonly affixList: AffixListView;
  private readonly modeSwitch: BrowseModeSwitch;
  private readonly sidebar = h('nav', { class: 'root-list' });
  private readonly detail: RootDetailView;
  private readonly search: SearchBox;
  private readonly dialog: SettingsDialog;
  private readonly tagline = h('span', { class: 'tagline' });
  private readonly settingsButton = h('button', { class: 'icon-button settings-button', type: 'button', onclick: () => this.dialog.open('settings') });

  private roots: RootSummary[] = [];
  private affixes: ReadonlyMap<string, Affix> = new Map();
  /** Loaded the first time the learner browses by prefix or suffix. */
  private affixIndex: AffixIndex | null = null;
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
    this.affixList = new AffixListView(this.i18n);
    this.modeSwitch = new BrowseModeSwitch(this.i18n, (browseMode) => this.settings.update({ browseMode }));
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
      h('div', { class: 'layout' }, this.sidebar, this.detail.el),
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
    window.addEventListener('hashchange', () => this.navigate());

    try {
      [this.roots, this.affixes] = await Promise.all([this.repository.listRoots(), this.repository.getAffixes()]);
    } catch {
      this.detail.showError(this.context());
      return;
    }
    this.search.setIndex(new SearchIndex(this.roots));
    await this.navigate();
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

  /**
   * Follows the address. Opening an affix page also shows its list ("-ion" from a word card switches
   * to suffixes); that settings change renders by itself. Only on arrival, so the switch stays free.
   */
  private navigate(): Promise<void> {
    this.route = parseRoute(location.hash);
    const kind = this.route.kind === 'affix' ? this.affixes.get(this.route.affixId)?.kind : undefined;
    if (kind && kind !== this.settings.value.browseMode) {
      this.settings.update({ browseMode: kind });
      return Promise.resolve();
    }
    return this.render();
  }

  private async render(): Promise<void> {
    const token = ++this.renderToken;
    const route = this.route;
    document.body.dataset.view = route.kind;
    try {
      await this.renderSidebar(route);
      if (token !== this.renderToken) return;
      if (route.kind === 'home') {
        this.detail.showEmpty(this.context());
        document.title = 'specroots';
      } else if (route.kind === 'root') {
        const root = await this.repository.getRoot(route.rootId);
        if (token !== this.renderToken) return;
        this.detail.show(root, this.context(), route.wordId);
        document.title = `${root.forms[0] ?? root.id} · specroots`;
      } else {
        const affix = this.affixes.get(route.affixId);
        if (!affix) throw new Error(`unknown affix ${route.affixId}`);
        const occurrences = (await this.loadAffixIndex()).get(affix.id) ?? [];
        const roots = await Promise.all(occurrences.map((o) => this.repository.getRoot(o.rootId)));
        if (token !== this.renderToken) return;
        const groups = roots.map((root, i) => ({
          root,
          words: (occurrences[i]?.wordIds ?? []).map((id) => root.word(id)).filter((w) => w !== undefined),
        }));
        this.detail.showAffix(affix, groups, this.context());
        document.title = `${affix.label} · specroots`;
      }
    } catch {
      if (token === this.renderToken) this.detail.showError(this.context());
    }
  }

  /** The mode switch and the list it selects: roots, prefixes or suffixes. */
  private async renderSidebar(route: Route): Promise<void> {
    const mode = this.settings.value.browseMode;
    this.modeSwitch.render(mode);
    this.sidebar.setAttribute('aria-label', this.i18n.t(`browse_${mode}`));
    if (mode === 'root') {
      this.list.render(this.roots, route.kind === 'root' ? route.rootId : null);
      this.sidebar.replaceChildren(this.modeSwitch.el, this.list.el);
      return;
    }
    const index = await this.loadAffixIndex();
    this.affixList.render(mode, this.affixes, index, route.kind === 'affix' ? route.affixId : null);
    this.sidebar.replaceChildren(this.modeSwitch.el, this.affixList.el);
  }

  private async loadAffixIndex(): Promise<AffixIndex> {
    this.affixIndex ??= await this.repository.getAffixIndex();
    return this.affixIndex;
  }
}
