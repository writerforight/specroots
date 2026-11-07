import type { Affix } from '../domain/Affix';
import type { EverydayObject, ListSummary, ObjectSummary, WordList } from '../domain/EverydayObject';
import type { Root } from '../domain/Root';
import { AffixFamilyView, type AffixGroup } from './AffixFamilyView';
import type { DerivationViewKind } from '../services/SettingsStore';
import { clear, h } from './dom';
import { DERIVATION_VIEWS } from './derivations';
import { ListPageView } from './ListPageView';
import { ObjectCardView } from './ObjectCardView';
import { SECTION_HOME } from './routes';
import type { ViewContext } from './ViewContext';

/** The right-hand pane: one root with its word family, one affix with the words built with it, or one object. */
export class RootDetailView {
  readonly el = h('main', { class: 'root-detail', tabindex: '-1' });

  constructor(private readonly onViewChange: (kind: DerivationViewKind) => void) {}

  /** The first screen: English roots, German roots or objects. */
  showStart(ctx: ViewContext): void {
    clear(this.el);
    this.el.append(
      h(
        'div',
        { class: 'start-screen' },
        h('h1', { class: 'start-title' }, ctx.i18n.t('startPrompt')),
        h(
          'div',
          { class: 'start-choices' },
          h('a', { class: 'start-choice', href: SECTION_HOME.roots }, ctx.i18n.t('section_roots')),
          h('a', { class: 'start-choice', href: SECTION_HOME.german }, ctx.i18n.t('section_german')),
          h('a', { class: 'start-choice', href: SECTION_HOME.lists }, ctx.i18n.t('section_lists')),
        ),
      ),
    );
  }

  showEmpty(ctx: ViewContext): void {
    clear(this.el);
    const { section, browseMode } = ctx.settings;
    const hint = section === 'lists' ? 'chooseList' : section === 'german' || browseMode === 'root' ? 'chooseRoot' : 'chooseAffix';
    this.el.append(h('p', { class: 'empty-state' }, ctx.i18n.t(hint)));
  }

  showAffix(affix: Affix, groups: readonly AffixGroup[], ctx: ViewContext): void {
    clear(this.el);
    this.el.append(h('a', { class: 'back-link', href: '#/roots' }, `← ${ctx.i18n.t('back')}`), ...new AffixFamilyView(ctx).render(affix, groups));
    // Arriving from a word card deep in a root page: start the new page at its top.
    window.scrollTo?.({ top: 0 });
  }

  showList(list: WordList, objects: readonly ObjectSummary[], ctx: ViewContext): void {
    clear(this.el);
    this.el.append(h('a', { class: 'back-link', href: '#/lists' }, `← ${ctx.i18n.t('allLists')}`), ...new ListPageView(ctx).render(list, objects));
    window.scrollTo?.({ top: 0 });
  }

  /** backHref: the list the object was opened from, or all lists. */
  showObject(object: EverydayObject, lists: readonly ListSummary[], backHref: string, ctx: ViewContext): void {
    clear(this.el);
    this.el.append(h('a', { class: 'back-link', href: backHref }, `← ${ctx.i18n.t('back')}`), ...new ObjectCardView(ctx).render(object, lists));
    window.scrollTo?.({ top: 0 });
  }

  showError(ctx: ViewContext): void {
    clear(this.el);
    this.el.append(h('p', { class: 'error-state', role: 'alert' }, ctx.i18n.t('loadError')));
  }

  show(root: Root, ctx: ViewContext, focusWordId: string | null): void {
    const { i18n, settings } = ctx;
    const lang = i18n.language;
    const meanings = [lang, ...settings.translationLangs.filter((l) => l !== lang)]
      .map((l) => root.meaning[l])
      .filter((m): m is string => m !== undefined);
    const own = root.meaning[root.language];

    clear(this.el);
    this.el.append(
      h('a', { class: 'back-link', href: root.language === 'de' ? SECTION_HOME.german : SECTION_HOME.roots }, `← ${i18n.t('back')}`),
      h(
        'header',
        { class: 'root-head' },
        h('h1', { class: 'root-title', lang: root.language }, root.forms.join(' · ')),
        // The meaning in the root's own language leads: "to look" for spec, "stehen, aufrecht sein" for steh.
        h('p', { class: 'root-gloss' }, own ? h('span', { lang: root.language }, own) : null, ...meanings.filter((m) => m !== own).map((m) => h('span', {}, m))),
        h(
          'p',
          { class: 'root-meta' },
          ...this.etymonLine(ctx, root),
          h('span', { class: 'dot' }, '·'),
          h('span', {}, i18n.t('wordCount', { count: root.words.length })),
        ),
        this.renderSwitch(ctx),
      ),
      new DERIVATION_VIEWS[settings.derivationView](ctx).render(root),
    );
    if (focusWordId) this.focusWord(focusWordId);
    else this.el.scrollTo?.({ top: 0 });
  }

  /** "from Latin specere" (or "German stehen") with the source word in italics, wherever the language puts it. */
  private etymonLine(ctx: ViewContext, root: Root): (HTMLElement | string)[] {
    const marker = '\u0000';
    const key = root.origin === 'la' ? 'fromLatin' : root.origin === 'gr' ? 'fromGreek' : 'fromGerman';
    const [before = '', after = ''] = ctx.i18n.t(key, { etymon: marker }).split(marker);
    return [before, h('i', { lang: root.origin }, root.etymon), after];
  }

  private renderSwitch(ctx: ViewContext): HTMLElement {
    const kinds: DerivationViewKind[] = ['list', 'tree'];
    return h(
      'div',
      { class: 'segmented', role: 'group' },
      ...kinds.map((kind) =>
        h(
          'button',
          { type: 'button', 'aria-pressed': String(ctx.settings.derivationView === kind), onclick: () => this.onViewChange(kind) },
          ctx.i18n.t(kind === 'list' ? 'viewList' : 'viewTree'),
        ),
      ),
    );
  }

  private focusWord(wordId: string): void {
    // In the tree the card sits inside a closed <details>; open it and its ancestors first.
    const node = this.el.querySelector<HTMLDetailsElement>(`details.tree-node[data-word="${CSS.escape(wordId)}"]`);
    if (node) node.open = true;
    const card = this.el.querySelector<HTMLElement>(`#word-${CSS.escape(wordId)}`);
    if (!card) return;
    card.scrollIntoView({ block: 'start', behavior: 'smooth' });
    card.classList.remove('flash');
    void card.offsetWidth;
    card.classList.add('flash');
  }
}
