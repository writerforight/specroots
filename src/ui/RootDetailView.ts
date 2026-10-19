import type { Affix } from '../domain/Affix';
import type { Root } from '../domain/Root';
import { AffixFamilyView, type AffixGroup } from './AffixFamilyView';
import type { DerivationViewKind } from '../services/SettingsStore';
import { clear, h } from './dom';
import { DERIVATION_VIEWS } from './derivations';
import type { ViewContext } from './ViewContext';

/** The right-hand pane: one root with its word family, or one affix with the words built with it. */
export class RootDetailView {
  readonly el = h('main', { class: 'root-detail', tabindex: '-1' });

  constructor(private readonly onViewChange: (kind: DerivationViewKind) => void) {}

  showEmpty(ctx: ViewContext): void {
    clear(this.el);
    this.el.append(h('p', { class: 'empty-state' }, ctx.i18n.t(ctx.settings.browseMode === 'root' ? 'chooseRoot' : 'chooseAffix')));
  }

  showAffix(affix: Affix, groups: readonly AffixGroup[], ctx: ViewContext): void {
    clear(this.el);
    this.el.append(h('a', { class: 'back-link', href: '#/' }, `← ${ctx.i18n.t('back')}`), ...new AffixFamilyView(ctx).render(affix, groups));
    // Arriving from a word card deep in a root page: start the new page at its top.
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

    clear(this.el);
    this.el.append(
      h('a', { class: 'back-link', href: '#/' }, `← ${i18n.t('back')}`),
      h(
        'header',
        { class: 'root-head' },
        h('h1', { class: 'root-title', lang: 'en' }, root.forms.join(' · ')),
        h('p', { class: 'root-gloss' }, root.meaning.en ? h('span', { lang: 'en' }, root.meaning.en) : null, ...meanings.filter((m) => m !== root.meaning.en).map((m) => h('span', {}, m))),
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

  /** "from Latin specere" with the Latin word in italics, wherever the language puts it. */
  private etymonLine(ctx: ViewContext, root: Root): (HTMLElement | string)[] {
    const marker = '\u0000';
    const [before = '', after = ''] = ctx.i18n.t(root.origin === 'la' ? 'fromLatin' : 'fromGreek', { etymon: marker }).split(marker);
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
