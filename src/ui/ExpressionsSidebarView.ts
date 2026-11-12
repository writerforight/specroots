import { EXPRESSION_KINDS, type CategorySummary, type ExpressionCategory, type ExpressionKind } from '../domain/Expression';
import type { Lang, TranslationLang } from '../domain/Language';
import type { I18n } from '../i18n/I18n';
import { clear, h } from './dom';
import { expressionHref, kindHref, KINDS_HREF, SECTION_HOME } from './routes';

/**
 * The expressions section's side list: all categories (Anger 15, Relief 12…), or, inside one
 * category, its expressions in teaching order with what one would say in the first chosen language.
 * A switch on top turns the same expressions around: by kind (Verbs 44, Idioms 58…), and inside one
 * kind all of its expressions, feeling by feeling.
 */
export class ExpressionsSidebarView {
  readonly el = h('div', { class: 'browse-list' });

  constructor(private readonly i18n: I18n) {}

  renderCategories(categories: readonly CategorySummary[]): void {
    const lang = this.i18n.language;
    clear(this.el);
    this.el.append(
      this.modeSwitch('feeling'),
      h(
        'ul',
        { class: 'list-index' },
        ...categories.map((category) =>
          h(
            'li',
            {},
            h(
              'a',
              { class: 'root-link', href: expressionHref(category.id) },
              h('span', { class: 'root-forms' }, categoryTitle(category, lang)),
              lang === 'en' ? null : h('span', { class: 'root-meaning', lang: 'en' }, category.title.en ?? ''),
              h('span', { class: 'root-count' }, String(category.expressions.length)),
            ),
          ),
        ),
      ),
    );
  }

  renderKinds(categories: readonly CategorySummary[]): void {
    const all = categories.flatMap((category) => category.expressions);
    clear(this.el);
    this.el.append(
      this.modeSwitch('kind'),
      h(
        'ul',
        { class: 'list-index' },
        ...EXPRESSION_KINDS.map((kind) => {
          const of = all.filter((e) => e.kind === kind);
          return h(
            'li',
            {},
            h(
              'a',
              { class: 'root-link', href: kindHref(kind) },
              h('span', { class: 'root-forms' }, this.i18n.t(`exprKind_${kind}`)),
              h('span', { class: 'root-meaning', lang: 'en' }, of.slice(0, 3).map((e) => e.expr).join(' · ')),
              h('span', { class: 'root-count' }, String(of.length)),
            ),
          );
        }),
      ),
    );
  }

  renderKind(kind: ExpressionKind, groups: readonly ExpressionCategory[], translationLang: TranslationLang | undefined, selectedId: string | null): void {
    clear(this.el);
    this.el.append(
      h('a', { class: 'list-back', href: KINDS_HREF }, `← ${this.i18n.t('allKinds')}`),
      h('h2', { class: 'list-heading' }, this.i18n.t(`exprKind_${kind}`), h('span', { class: 'root-count' }, String(groups.reduce((n, g) => n + g.expressions.length, 0)))),
      ...groups.flatMap((group) => [
        h('h3', { class: 'list-subheading' }, categoryTitle(group, this.i18n.language)),
        h(
          'ul',
          { class: 'list-index' },
          ...group.expressions.map((expression) => {
            const said = translationLang ? expression.equivalent[translationLang] : undefined;
            return h(
              'li',
              {},
              h(
                'a',
                { class: 'root-link', href: kindHref(kind, expression.id), 'aria-current': expression.id === selectedId ? 'page' : null },
                h('span', { class: 'root-forms object-name', lang: 'en' }, expression.expr),
                said ? h('span', { class: 'root-meaning', lang: translationLang }, said) : null,
              ),
            );
          }),
        ),
      ]),
    );
  }

  /** By feeling · By type, above the section's two start lists. */
  private modeSwitch(current: 'feeling' | 'kind'): HTMLElement {
    const button = (mode: 'feeling' | 'kind', href: string) =>
      h('button', { type: 'button', 'aria-pressed': String(mode === current), onclick: () => (location.hash = href) }, this.i18n.t(`browse_${mode}`));
    return h('div', { class: 'segmented browse-switch', role: 'group', 'aria-label': this.i18n.t('browseBy') }, button('feeling', SECTION_HOME.expressions), button('kind', KINDS_HREF));
  }

  renderCategory(category: ExpressionCategory, translationLang: TranslationLang | undefined, selectedId: string | null): void {
    clear(this.el);
    this.el.append(
      h('a', { class: 'list-back', href: '#/expressions' }, `← ${this.i18n.t('allCategories')}`),
      h('h2', { class: 'list-heading' }, categoryTitle(category, this.i18n.language), h('span', { class: 'root-count' }, String(category.expressions.length))),
      h(
        'ul',
        { class: 'list-index' },
        ...category.expressions.map((expression) => {
          const said = translationLang ? expression.equivalent[translationLang] : undefined;
          return h(
            'li',
            {},
            h(
              'a',
              { class: 'root-link', href: expressionHref(category.id, expression.id), 'aria-current': expression.id === selectedId ? 'page' : null },
              h('span', { class: 'root-forms object-name', lang: 'en' }, expression.expr),
              said ? h('span', { class: 'root-meaning', lang: translationLang }, said) : null,
            ),
          );
        }),
      ),
    );
  }
}

export function categoryTitle(category: { readonly id: string; readonly title: CategorySummary['title'] }, lang: Lang): string {
  return category.title[lang] ?? category.title.en ?? category.id;
}
