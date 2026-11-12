import { EXPRESSION_DETAILS, EXPRESSION_KINDS, type Expression, type ExpressionCategory, type ExpressionKind } from '../domain/Expression';
import { ENDONYMS, type Lang } from '../domain/Language';
import { h } from './dom';
import { expressionHref } from './routes';
import { categoryTitle } from './ExpressionsSidebarView';
import type { ViewContext } from './ViewContext';
import { WordCard } from './WordCard';

/**
 * One category of everyday expressions: a short card per expression (what it means, what you would
 * say in your language, examples) with the grammar and usage notes folded away under "Details".
 */
export class ExpressionCategoryView {
  private readonly words: WordCard;

  constructor(private readonly ctx: ViewContext) {
    this.words = new WordCard(ctx);
  }

  render(category: ExpressionCategory): HTMLElement[] {
    const { i18n } = this.ctx;
    return [
      h(
        'header',
        { class: 'root-head' },
        h('h1', { class: 'root-title' }, categoryTitle(category, i18n.language)),
        h('p', { class: 'root-meta' }, h('span', {}, i18n.t('expressionCount', { count: category.expressions.length }))),
      ),
      ...this.filtered(category.expressions),
    ];
  }

  /** Every expression of one kind (all the verbs…) as one list, under the feeling each belongs to. */
  renderKind(kind: ExpressionKind, groups: readonly ExpressionCategory[]): HTMLElement[] {
    const { i18n } = this.ctx;
    const count = groups.reduce((n, group) => n + group.expressions.length, 0);
    return [
      h('header', { class: 'root-head' }, h('h1', { class: 'root-title' }, i18n.t(`exprKind_${kind}`)), h('p', { class: 'root-meta' }, h('span', {}, i18n.t('expressionCount', { count })))),
      ...groups.flatMap((group) => [
        h(
          'h2',
          { class: 'expr-group' },
          h('a', { href: expressionHref(group.id) }, categoryTitle(group, i18n.language)),
          h('span', { class: 'root-count' }, String(group.expressions.length)),
        ),
        ...group.expressions.map((expression) => this.card(expression, false)),
      ]),
    ];
  }

  /** The cards of one feeling, with a switch above them that leaves only one kind (only the verbs…). */
  private filtered(expressions: readonly Expression[]): HTMLElement[] {
    const { i18n } = this.ctx;
    const cards = expressions.map((expression) => ({ kind: expression.kind, el: this.card(expression, true) }));
    const kinds = EXPRESSION_KINDS.filter((kind) => expressions.some((e) => e.kind === kind));
    if (kinds.length < 2) return cards.map((card) => card.el);
    const buttons = (['all', ...kinds] as const).map((kind) => {
      const count = kind === 'all' ? expressions.length : expressions.filter((e) => e.kind === kind).length;
      const button = h('button', { type: 'button', 'aria-pressed': String(kind === 'all') }, i18n.t(`exprKind_${kind}`), h('span', { class: 'expr-filter-count' }, String(count)));
      button.addEventListener('click', () => {
        for (const other of buttons) other.setAttribute('aria-pressed', String(other === button));
        for (const card of cards) card.el.hidden = kind !== 'all' && card.kind !== kind;
      });
      return button;
    });
    return [h('div', { class: 'segmented expr-filter', role: 'group', 'aria-label': i18n.t('expr_kind') }, ...buttons), ...cards.map((card) => card.el)];
  }

  private card(expression: Expression, showKind: boolean): HTMLElement {
    const { i18n, settings } = this.ctx;
    const lang = i18n.language;
    const intensity = expression.intensity?.[lang] ?? expression.intensity?.en;
    // The short register ("informal") is a tag; a longer one with a remark stays in the details.
    const register = expression.detail('register', lang);
    const shortRegister = register && register.length <= 24 ? register : null;
    const rows = settings.translationLangs.flatMap((l) => {
      const said = expression.equivalent[l];
      const meaning = expression.meaning[l];
      if (!said && !meaning) return [];
      return [
        h('dt', { title: ENDONYMS[l] }, l.toUpperCase()),
        h('dd', { lang: l }, said ? h('b', {}, said) : null, said && meaning ? h('span', { class: 'expr-explained' }, meaning) : (meaning ?? null)),
      ];
    });
    const details = EXPRESSION_DETAILS.map((kind) => [kind, kind === 'register' && shortRegister ? undefined : expression.detail(kind, lang)] as const).filter(
      (pair): pair is readonly [(typeof EXPRESSION_DETAILS)[number], string] => pair[1] !== undefined,
    );

    return h(
      'article',
      { class: 'word-card expr-card', id: `expr-${expression.id}` },
      h(
        'header',
        { class: 'word-head' },
        h('h3', { class: 'word-title', lang: 'en' }, expression.expr),
        this.listen(expression.expr, 'en'),
        intensity ? h('span', { class: `expr-tag expr-level-${expression.level ?? 2}`, title: i18n.t('expr_intensity') }, intensity) : null,
        shortRegister ? h('span', { class: 'expr-tag', title: i18n.t('expr_register') }, shortRegister) : null,
        showKind ? h('span', { class: 'expr-tag', title: i18n.t('expr_kind') }, i18n.t(`exprKindOne_${expression.kind}`)) : null,
      ),
      h('p', { class: 'expr-meaning', lang: 'en' }, expression.meaning.en ?? ''),
      rows.length > 0 ? h('dl', { class: 'glosses' }, ...rows) : null,
      h('ul', { class: 'sentence-list' }, ...expression.sentences.map((s) => this.words.renderSentence(s))),
      details.length > 0
        ? h(
            'details',
            { class: 'examples expr-more' },
            h('summary', {}, i18n.t('exprDetails')),
            h('dl', { class: 'expr-details' }, ...details.flatMap(([kind, text]) => [h('dt', {}, i18n.t(`expr_${kind}`)), h('dd', {}, text)])),
          )
        : null,
    );
  }

  private listen(text: string, lang: Lang): HTMLElement | null {
    if (!this.ctx.speech.available) return null;
    const label = this.ctx.i18n.t('listen');
    const button = h('button', { class: 'icon-button listen', type: 'button', title: label, 'aria-label': `${label}: ${text}`, onclick: () => this.ctx.speech.speak(text, lang) });
    button.innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16 8.5a4.5 4.5 0 0 1 0 7M18.5 6a8 8 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
    return button;
  }
}
