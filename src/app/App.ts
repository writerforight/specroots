import type { LexiconRepository } from '../data/LexiconRepository';
import type { Affix, AffixIndex } from '../domain/Affix';
import type { ListSummary, ObjectSummary } from '../domain/EverydayObject';
import type { RootSummary } from '../domain/Root';
import { I18n } from '../i18n/I18n';
import { SearchIndex } from '../services/SearchIndex';
import type { IndexLayout, Section, SettingsStore } from '../services/SettingsStore';
import { SpeechService } from '../services/SpeechService';
import { AffixListView } from '../ui/AffixListView';
import { BrowseModeSwitch } from '../ui/BrowseModeSwitch';
import { h } from '../ui/dom';
import { ListsSidebarView } from '../ui/ListsSidebarView';
import { RootDetailView } from '../ui/RootDetailView';
import { RootListView } from '../ui/RootListView';
import { affixHref, deRootHref, listHref, parseRoute, rootHref, sectionOf, type Route } from '../ui/routes';
import type { IndexItem } from '../ui/IndexView';
import { SearchBox } from '../ui/SearchBox';
import { SettingsDialog } from '../ui/SettingsDialog';
import { ThemeController } from '../ui/ThemeController';
import type { ViewContext } from '../ui/ViewContext';

/**
 * Wires data, settings and views together and reacts to route and setting changes.
 * Three sections share the layout: English word roots (roots, prefixes, suffixes), German word roots
 * (stehen → verstehen, from their own data folder) and object lists.
 */
export class App {
  private readonly i18n: I18n;
  private readonly speech = new SpeechService();
  private readonly theme = new ThemeController();
  private readonly list: RootListView;
  private readonly affixList: AffixListView;
  private readonly listsSidebar: ListsSidebarView;
  private readonly modeSwitch: BrowseModeSwitch;
  /** The same three tabs on top of the roots section's start page. */
  private readonly indexModeSwitch: BrowseModeSwitch;
  private readonly sidebar = h('nav', { class: 'root-list' });
  private readonly detail: RootDetailView;
  private readonly search: SearchBox;
  private readonly dialog: SettingsDialog;
  private readonly tagline = h('span', { class: 'tagline' });
  private readonly settingsButton = h('button', { class: 'icon-button settings-button', type: 'button', onclick: () => this.dialog.open('settings') });

  private readonly themeButton = h('button', {
    class: 'icon-button theme-button',
    type: 'button',
    onclick: () => this.settings.update({ theme: ThemeController.flip(this.settings.value.theme, window.matchMedia('(prefers-color-scheme: dark)').matches) }),
  });

  private roots: RootSummary[] = [];
  private affixes: ReadonlyMap<string, Affix> = new Map();
  private objects: ObjectSummary[] = [];
  private wordLists: ListSummary[] = [];
  private germanRoots: RootSummary[] = [];
  /** Loaded the first time the learner browses by prefix or suffix. */
  private affixIndex: AffixIndex | null = null;
  private route: Route = { kind: 'home' };
  /** Guards against a slow load finishing after the learner has already moved on. */
  private renderToken = 0;

  constructor(
    private readonly host: HTMLElement,
    private readonly repository: LexiconRepository,
    private readonly settings: SettingsStore,
    /** The German lexicon (data/de/); without it the German section stays empty. */
    private readonly german: LexiconRepository | null = null,
  ) {
    this.i18n = new I18n(settings.value.uiLang);
    this.list = new RootListView(this.i18n);
    this.affixList = new AffixListView(this.i18n);
    this.listsSidebar = new ListsSidebarView(this.i18n);
    this.modeSwitch = new BrowseModeSwitch(this.i18n, (browseMode) => this.settings.update({ browseMode }));
    this.indexModeSwitch = new BrowseModeSwitch(this.i18n, (browseMode) => this.settings.update({ browseMode }));
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
        this.themeButton,
        this.settingsButton,
      ),
      h('div', { class: 'layout' }, this.sidebar, this.detail.el),
      this.dialog.el,
    );
    this.themeButton.innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="1.8" fill="none"/><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor"/></svg>';
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
      [this.roots, this.affixes, this.objects, this.wordLists] = await Promise.all([
        this.repository.listRoots(),
        this.repository.getAffixes(),
        this.repository.listObjects(),
        this.repository.listLists(),
      ]);
    } catch {
      this.detail.showError(this.context());
      return;
    }
    // German roots are small and found by search from the start; if they fail, the rest still works.
    this.germanRoots = (await this.german?.listRoots().catch(() => [])) ?? [];
    this.search.setIndex(new SearchIndex(this.roots, this.affixes.values(), this.objects, this.wordLists, this.germanRoots));
    // No settings form on the first visit: the start screen asks one question at a time, and
    // translation languages and theme start from the browser and live in Settings.
    await this.navigate();
  }

  private applyLanguage(): void {
    this.i18n.setLanguage(this.settings.value.uiLang);
    document.documentElement.lang = this.settings.value.uiLang;
    this.tagline.textContent = this.i18n.t('tagline');
    this.settingsButton.title = this.i18n.t('settings');
    this.settingsButton.setAttribute('aria-label', this.i18n.t('settings'));
    this.themeButton.title = this.i18n.t('theme');
    this.themeButton.setAttribute('aria-label', this.i18n.t('theme'));
    this.search.relabel();
  }

  private context(): ViewContext {
    return { i18n: this.i18n, settings: this.settings.value, speech: this.speech, affixes: this.affixes };
  }

  /**
   * Follows the address. An address of one section also switches the side list to it, and an affix
   * page shows its list ("-ion" from a word card switches to suffixes); those settings changes render
   * by themselves. Only on arrival, so the switches stay free.
   */
  private navigate(): Promise<void> {
    this.route = parseRoute(location.hash);
    const patch: { section?: Section; browseMode?: 'prefix' | 'suffix' } = {};
    const section = sectionOf(this.route);
    if (section && section !== this.settings.value.section) patch.section = section;
    const kind = this.route.kind === 'affix' ? this.affixes.get(this.route.affixId)?.kind : undefined;
    if (kind && kind !== this.settings.value.browseMode) patch.browseMode = kind;
    if (patch.section || patch.browseMode) {
      this.settings.update(patch);
      return Promise.resolve();
    }
    return this.render();
  }

  private async render(): Promise<void> {
    const token = ++this.renderToken;
    const route = this.route;
    // Mobile shows either the side list or the page; the lists start page is a side-list page.
    // "#/" is the start screen (roots or objects); mobile shows the side list on a section's start page.
    const view = route.kind === 'deRoot' ? 'root' : route.kind;
    document.body.dataset.view =
      route.kind === 'home' ? 'start' : route.kind === 'roots' || route.kind === 'german' ? 'index' : route.kind === 'lists' ? 'home' : view;
    try {
      await this.renderSidebar(route);
      if (token !== this.renderToken) return;
      if (route.kind === 'home') {
        this.detail.showStart(this.context(), (section) => this.settings.update({ section, onboarded: true }));
        document.title = 'specroots';
      } else if (route.kind === 'roots' || route.kind === 'german') {
        await this.showIndex(route.kind);
        if (token !== this.renderToken) return;
        document.title = 'specroots';
      } else if (route.kind === 'lists') {
        this.detail.showEmpty(this.context());
        document.title = 'specroots';
      } else if (route.kind === 'root') {
        const root = await this.repository.getRoot(route.rootId);
        if (token !== this.renderToken) return;
        this.detail.show(root, this.context(), route.wordId);
        document.title = `${root.forms[0] ?? root.id} · specroots`;
      } else if (route.kind === 'deRoot') {
        if (!this.german) throw new Error('no German lexicon');
        const root = await this.german.getRoot(route.rootId);
        if (token !== this.renderToken) return;
        this.detail.show(root, this.context(), route.wordId);
        document.title = `${root.forms[0] ?? root.id} · specroots`;
      } else if (route.kind === 'affix') {
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
      } else if (route.kind === 'list' && route.objectId === null) {
        const list = await this.repository.getList(route.listId);
        if (token !== this.renderToken) return;
        this.detail.showList(list, this.objectsOf(list.objectIds), this.context());
        document.title = `${list.title[this.i18n.language] ?? list.title.en ?? list.id} · specroots`;
      } else {
        const object = await this.repository.getObject(route.objectId ?? '');
        if (token !== this.renderToken) return;
        const summary = this.objects.find((o) => o.id === object.id);
        const lists = this.wordLists.filter((l) => summary?.lists.includes(l.id));
        const back = route.kind === 'list' ? listHref(route.listId) : '#/lists';
        this.detail.showObject(object, lists, back, this.context());
        document.title = `${object.name} · specroots`;
      }
    } catch {
      if (token === this.renderToken) this.detail.showError(this.context());
    }
  }

  /** Section switch on top; below it the roots section's mode switch and list, or the word lists. */
  private async renderSidebar(route: Route): Promise<void> {
    const { section, browseMode: mode, translationLangs } = this.settings.value;
    this.search.setScope(section);
    if (section === 'lists') {
      this.sidebar.setAttribute('aria-label', this.i18n.t('section_lists'));
      if (route.kind === 'list') {
        const list = await this.repository.getList(route.listId);
        this.listsSidebar.renderList(list, this.objectsOf(list.objectIds), translationLangs[0], route.objectId);
      } else {
        this.listsSidebar.renderLists(this.wordLists, null);
      }
      this.sidebar.replaceChildren(this.listsSidebar.el);
      return;
    }
    if (section === 'german') {
      this.sidebar.setAttribute('aria-label', this.i18n.t('section_german'));
      this.list.render(this.germanRoots, route.kind === 'deRoot' ? route.rootId : null, (id) => deRootHref(id));
      this.sidebar.replaceChildren(this.list.el);
      return;
    }
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

  /** A section's start page: German roots, or the roots section's roots, prefixes or suffixes. */
  private async showIndex(kind: 'roots' | 'german'): Promise<void> {
    const { browseMode: mode } = this.settings.value;
    const lang = this.i18n.language;
    const onLayout = (indexLayout: IndexLayout) => this.settings.update({ indexLayout });
    const fromRoots = (roots: readonly RootSummary[], href: (id: string) => string): IndexItem[] =>
      roots.map((root) => ({
        key: root.forms[0] ?? root.id,
        label: root.forms.join(', '),
        meaning: root.meaning[lang] ?? root.meaning.en ?? '',
        count: root.words.length,
        examples: root.words.slice(0, 4),
        href: href(root.id),
        lang: root.origin === 'de' ? 'de' : 'en',
      }));
    if (kind === 'german') {
      this.detail.showIndex(this.context(), this.i18n.t('section_german'), fromRoots(this.germanRoots, (id) => deRootHref(id)), null, onLayout);
      return;
    }
    this.indexModeSwitch.render(mode);
    if (mode === 'root') {
      this.detail.showIndex(this.context(), this.i18n.t('section_roots'), fromRoots(this.roots, (id) => rootHref(id)), this.indexModeSwitch.el, onLayout);
      return;
    }
    const index = await this.loadAffixIndex();
    const items = [...this.affixes.values()]
      .filter((a) => a.kind === mode)
      .map((affix) => {
        const occurrences = index.get(affix.id) ?? [];
        return {
          key: affix.form,
          label: affix.label,
          meaning: affix.meaning[lang] ?? affix.meaning.en ?? '',
          count: occurrences.reduce((n, o) => n + o.wordIds.length, 0),
          examples: occurrences.flatMap((o) => o.wordIds).slice(0, 4),
          href: affixHref(affix.id),
          lang: 'en',
          kind: affix.kind,
        };
      })
      .filter((item) => item.count > 0)
      .sort((a, b) => a.key.localeCompare(b.key) || a.label.localeCompare(b.label));
    this.detail.showIndex(this.context(), this.i18n.t('section_roots'), items, this.indexModeSwitch.el, onLayout);
  }

  /** The summaries of the given objects, A–Z by English name. */
  private objectsOf(ids: readonly string[]): ObjectSummary[] {
    const wanted = new Set(ids);
    return this.objects.filter((o) => wanted.has(o.id));
  }

  private async loadAffixIndex(): Promise<AffixIndex> {
    this.affixIndex ??= await this.repository.getAffixIndex();
    return this.affixIndex;
  }
}
