import type { Affix } from '../domain/Affix';
import type { Root } from '../domain/Root';
import type { Word } from '../domain/Word';
import { h } from './dom';
import { rootHref } from './routes';
import type { ViewContext } from './ViewContext';
import { WordCard } from './WordCard';

/** The words of one root that carry the affix. */
export interface AffixGroup {
  readonly root: Root;
  readonly words: readonly Word[];
}

/** One prefix or suffix with every word built with it, grouped by root; each word links to its card. */
export class AffixFamilyView {
  private readonly card: WordCard;

  constructor(private readonly ctx: ViewContext) {
    this.card = new WordCard(ctx);
  }

  render(affix: Affix, groups: readonly AffixGroup[]): HTMLElement[] {
    const { i18n, settings } = this.ctx;
    const lang = i18n.language;
    const meanings = [...new Set(['en', lang, ...settings.translationLangs] as const)]
      .map((l) => affix.meaning[l])
      .filter((m, i, all): m is string => m !== undefined && all.indexOf(m) === i);
    const wordCount = groups.reduce((n, g) => n + g.words.length, 0);

    return [
      h(
        'header',
        { class: 'root-head' },
        h('h1', { class: `root-title part-${affix.kind}`, lang: 'en' }, affix.label),
        h('p', { class: 'root-gloss' }, ...meanings.map((m) => h('span', {}, m))),
        h(
          'p',
          { class: 'root-meta' },
          h('span', {}, i18n.t(`part_${affix.kind}`)),
          h('span', { class: 'dot' }, '·'),
          h('span', {}, i18n.t('wordCount', { count: wordCount })),
          h('span', { class: 'dot' }, '·'),
          h('span', {}, i18n.t('rootCount', { count: groups.length })),
        ),
      ),
      h('div', { class: 'derivations affix-family' }, ...groups.map((g) => this.renderGroup(affix, g))),
    ];
  }

  private renderGroup(affix: Affix, { root, words }: AffixGroup): HTMLElement {
    const lang = this.ctx.i18n.language;
    return h(
      'section',
      { class: 'formation-group' },
      h(
        'h2',
        { class: 'group-title' },
        h('a', { class: 'group-root', href: rootHref(root.id), lang: 'en' }, root.forms.join(' / ')),
        h('span', { class: 'group-meaning' }, root.meaning[lang] ?? root.meaning.en ?? ''),
        h('span', { class: 'count' }, String(words.length)),
      ),
      h(
        'ul',
        { class: 'affix-words' },
        ...[...words]
          .sort((a, b) => a.text.localeCompare(b.text))
          .map((word) =>
            h(
              'li',
              {},
              h(
                'a',
                { class: 'affix-word', href: rootHref(root.id, word.id) },
                this.card.renderParts(word.parts, affix.id),
                h('span', { class: 'tree-gloss' }, this.gloss(word)),
              ),
            ),
          ),
      ),
    );
  }

  /** The first chosen translation, as in the tree view, or the English definition. */
  private gloss(word: Word): string {
    return this.ctx.settings.translationLangs.map((l) => word.gloss[l]).find((g) => g !== undefined) ?? word.gloss.en ?? '';
  }
}
