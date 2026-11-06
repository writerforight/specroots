import type { Affix } from '../domain/Affix';
import type { Root } from '../domain/Root';
import type { Word } from '../domain/Word';
import { h } from './dom';
import { rootHref } from './routes';
import type { ViewContext } from './ViewContext';
import { WordCard } from './WordCard';

/** One ticked title and the words built with it, each with the root it comes from. */
export interface TitleGroup {
  readonly affix: Affix;
  readonly words: readonly { readonly root: Root; readonly word: Word }[];
}

/**
 * "Learn words", right-hand side: the words that contain the ticked titles, one section per title in
 * the order they were ticked. Each word links to its full card in its root's family.
 */
export class SelectedWordsView {
  private readonly card: WordCard;

  constructor(private readonly ctx: ViewContext) {
    this.card = new WordCard(ctx);
  }

  render(groups: readonly TitleGroup[], onChangeTitles: () => void): HTMLElement[] {
    const { i18n } = this.ctx;
    const distinct = new Set(groups.flatMap((g) => g.words.map(({ root, word }) => `${root.id}/${word.id}`))).size;
    return [
      h(
        'header',
        { class: 'root-head' },
        h('h1', { class: 'root-title selection-title', lang: 'en' }, ...groups.map((g) => h('span', { class: `part-${g.affix.kind}` }, g.affix.label))),
        h(
          'p',
          { class: 'root-meta' },
          h('span', {}, i18n.t('titleCount', { count: groups.length })),
          h('span', { class: 'dot' }, '·'),
          h('span', {}, i18n.t('wordCount', { count: distinct })),
        ),
        h('button', { type: 'button', class: 'link-button change-titles', onclick: onChangeTitles }, `↑ ${i18n.t('changeTitles')}`),
      ),
      h('div', { class: 'derivations selected-words' }, ...groups.map((g) => this.renderGroup(g))),
    ];
  }

  private renderGroup({ affix, words }: TitleGroup): HTMLElement {
    const { i18n, settings } = this.ctx;
    const lang = i18n.language;
    const meanings = [...new Set(['en', lang, ...settings.translationLangs] as const)]
      .map((l) => affix.meaning[l])
      .filter((m, i, all): m is string => m !== undefined && all.indexOf(m) === i);
    return h(
      'section',
      { class: 'formation-group' },
      h(
        'h2',
        { class: 'group-title' },
        h('span', { class: `group-root part-${affix.kind}`, lang: 'en' }, affix.label),
        h('span', { class: 'group-meaning' }, meanings.join(' · ')),
        h('span', { class: 'count' }, String(words.length)),
      ),
      h(
        'ul',
        { class: 'affix-words' },
        ...[...words]
          .sort((a, b) => a.word.text.localeCompare(b.word.text))
          .map(({ root, word }) =>
            h(
              'li',
              {},
              h(
                'a',
                { class: 'affix-word', href: rootHref(root.id, word.id) },
                this.card.renderParts(word.parts, affix.id),
                h('span', { class: 'tree-gloss' }, this.gloss(word)),
                h('span', { class: 'word-root', lang: 'en' }, root.forms[0] ?? root.id),
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
