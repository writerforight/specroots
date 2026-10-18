import type { Root } from '../domain/Root';
import type { Word } from '../domain/Word';
import type { DerivationViewKind } from '../services/SettingsStore';
import { h } from './dom';
import type { ViewContext } from './ViewContext';
import { WordCard } from './WordCard';

/** A way of laying out a root's words. Add a class here and register it to get a new view. */
export interface DerivationView {
  render(root: Root): HTMLElement;
}

/** Words grouped by how they are built: root alone, with prefix, with suffix, with both. */
export class DerivationListView implements DerivationView {
  private readonly card: WordCard;

  constructor(private readonly ctx: ViewContext) {
    this.card = new WordCard(ctx);
  }

  render(root: Root): HTMLElement {
    const sections = [...root.groupByFormation()].map(([formation, words]) =>
      h(
        'section',
        { class: 'formation-group' },
        h('h2', { class: 'group-title' }, this.ctx.i18n.t(`formation_${formation}`), h('span', { class: 'count' }, String(words.length))),
        ...words.map((w) => this.card.render(w, root)),
      ),
    );
    return h('div', { class: 'derivations derivations-list' }, ...sections);
  }
}

/** Root → base words → their derivatives, as a collapsible tree. */
export class DerivationTreeView implements DerivationView {
  private readonly card: WordCard;

  constructor(private readonly ctx: ViewContext) {
    this.card = new WordCard(ctx);
  }

  render(root: Root): HTMLElement {
    return h(
      'div',
      { class: 'derivations derivations-tree' },
      h(
        'ul',
        { class: 'tree', role: 'tree' },
        h(
          'li',
          { class: 'tree-root', role: 'treeitem', 'aria-expanded': 'true' },
          h('span', { class: 'tree-root-label', lang: 'en' }, root.forms.join(' / ')),
          this.branch(root, root.baseWords),
        ),
      ),
    );
  }

  private branch(root: Root, words: readonly Word[]): HTMLElement {
    const sorted = [...words].sort((a, b) => a.text.localeCompare(b.text));
    return h('ul', { role: 'group' }, ...sorted.map((w) => this.node(root, w)));
  }

  private node(root: Root, word: Word): HTMLElement {
    const children = root.childrenOf(word);
    const gloss = this.ctx.settings.translationLangs.map((l) => word.gloss[l]).find((g) => g !== undefined) ?? word.gloss.en;
    return h(
      'li',
      { role: 'treeitem' },
      h(
        'details',
        { class: 'tree-node', 'data-word': word.id },
        h('summary', {}, this.card.renderParts(word.parts), h('span', { class: 'tree-gloss' }, gloss ?? '')),
        this.card.render(word, root),
      ),
      children.length > 0 ? this.branch(root, children) : null,
    );
  }
}

export const DERIVATION_VIEWS: Record<DerivationViewKind, new (ctx: ViewContext) => DerivationView> = {
  list: DerivationListView,
  tree: DerivationTreeView,
};
