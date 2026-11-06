import type { LexiconRepository } from '../data/LexiconRepository';
import type { Affix, AffixIndex } from '../domain/Affix';
import type { RootSummary } from '../domain/Root';
import { I18n } from '../i18n/I18n';
import { SearchIndex } from '../services/SearchIndex';
import type { BrowseMode, SettingsStore } from '../services/SettingsStore';
import { SpeechService } from '../services/SpeechService';
import { BrowseModeSwitch } from '../ui/BrowseModeSwitch';
import { h } from '../ui/dom';
import { RootDetailView } from '../ui/RootDetailView';
import { RootListView } from '../ui/RootListView';
import { parseRoute, wordsHref, type Route } from '../ui/routes';
import { SearchBox } from '../ui/SearchBox';
import { SettingsDialog } from '../ui/SettingsDialog';
import { ThemeController } from '../ui/ThemeController';
import { TitlePickerView } from '../ui/TitlePickerView';
import type { ViewContext } from '../ui/ViewContext';

/** Wires data, settings and views together and reacts to route and setting changes. */
export class App {
  private readonly i18n: I18n;
  private readonly speech = new SpeechService();
  private readonly theme = new ThemeController();
  private readonly list: RootListView;
  private readonly picker: TitlePickerView;
  private readonly modeSwitch: BrowseModeSwitch;
  private readonly sidebar = h('nav', { class: 'root-list' });
  private readonly detail: RootDetailView;
  private readonly search: SearchBox;
  private readonly dialog: SettingsDialog;
  private readonly tagline = h('span', { class: 'tagline' });
  private readonly settingsButton = h('button', { class: 'icon-button settings-button', type: 'button', onclick: () => this.dialog.open('settings') });

  private roots: RootSummary[] = [];
  private affixes: ReadonlyMap<string, Affix> = new Map();
  /** Loaded the first time the learner picks words by their titles. */
  private affixIndex: AffixIndex | null = null;
  /** The titles last ticked; kept while a word's card is open so the boxes stay ticked. */
  private selection: readonly string[] = [];
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
    this.picker = new TitlePickerView(
      this.i18n,
      (titleIds) => (location.hash = wordsHref(titleIds)),
      () => this.detail.el.scrollIntoView({ block: 'start', behavior: 'smooth' }),
    );
    this.modeSwitch = new BrowseModeSwitch(this.i18n, (browseMode) => this.chooseMode(browseMode));
    this.detail = new RootDetailView(
      (kind) => this.settings.update({ derivationView: kind }),
      (browseMode) => this.chooseMode(browseMode),
    );
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
    this.search.setIndex(new SearchIndex(this.roots, this.affixes.values()));
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

  /** Switching the way in starts that way from its beginning: the root list, or no titles ticked. */
  private chooseMode(browseMode: BrowseMode): void {
    if (browseMode === this.settings.value.browseMode) return;
    this.selection = [];
    if (location.hash && location.hash !== '#/') {
      // The hash change renders; set the mode first so it renders the new way in.
      this.settings.update({ browseMode });
      location.hash = '#/';
    } else {
      this.settings.update({ browseMode });
    }
  }

  /** Follows the address. A words address (#/words/re-, or "re-" on a word card) opens "Learn words". */
  private navigate(): Promise<void> {
    this.route = parseRoute(location.hash);
    if (this.route.kind === 'words') this.selection = this.route.titleIds.filter((id) => this.affixes.has(id));
    else if (this.route.kind === 'home') this.selection = [];
    if (this.route.kind === 'words' && this.settings.value.browseMode !== 'words') {
      this.settings.update({ browseMode: 'words' });
      return Promise.resolve();
    }
    return this.render();
  }

  private async render(): Promise<void> {
    const token = ++this.renderToken;
    const route = this.route;
    document.body.dataset.view = route.kind;
    document.body.dataset.mode = this.settings.value.browseMode;
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
        const titles = this.selection.map((id) => this.affixes.get(id)).filter((a) => a !== undefined);
        if (titles.length === 0) throw new Error(`unknown titles ${route.titleIds.join(',')}`);
        const index = await this.loadAffixIndex();
        const groups = await Promise.all(
          titles.map(async (affix) => {
            const occurrences = index.get(affix.id) ?? [];
            const roots = await Promise.all(occurrences.map((o) => this.repository.getRoot(o.rootId)));
            const words = roots.flatMap((root, i) =>
              (occurrences[i]?.wordIds ?? []).flatMap((id) => {
                const word = root.word(id);
                return word ? [{ root, word }] : [];
              }),
            );
            return { affix, words };
          }),
        );
        if (token !== this.renderToken) return;
        this.detail.showWords(groups, this.context(), () => this.sidebar.scrollIntoView({ block: 'start', behavior: 'smooth' }));
        document.title = `${titles.map((a) => a.label).join(' ')} · specroots`;
      }
    } catch {
      if (token === this.renderToken) this.detail.showError(this.context());
    }
  }

  /** The way-in switch, then the root list or the titles to tick. */
  private async renderSidebar(route: Route): Promise<void> {
    const mode = this.settings.value.browseMode;
    this.modeSwitch.render(mode);
    this.sidebar.setAttribute('aria-label', this.i18n.t(`mode_${mode}`));
    if (mode === 'root') {
      this.list.render(this.roots, route.kind === 'root' ? route.rootId : null);
      this.sidebar.replaceChildren(this.modeSwitch.el, this.list.el);
      return;
    }
    const index = await this.loadAffixIndex();
    this.picker.render(this.affixes, index, this.selection);
    if (this.sidebar.lastChild !== this.picker.el) this.sidebar.replaceChildren(this.modeSwitch.el, this.picker.el);
  }

  private async loadAffixIndex(): Promise<AffixIndex> {
    this.affixIndex ??= await this.repository.getAffixIndex();
    return this.affixIndex;
  }
}
