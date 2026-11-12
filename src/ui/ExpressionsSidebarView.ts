import type { CategorySummary, ExpressionCategory } from '../domain/Expression';
import type { Lang, TranslationLang } from '../domain/Language';
import type { I18n } from '../i18n/I18n';
import { clear, h } from './dom';
import { expressionHref } from './routes';

/**
 * The expressions section's side list: all categories (Anger 15, Relief 12…), or, inside one
 * category, its expressions in teaching order with what one would say in the first chosen language.
 */
export class ExpressionsSidebarView {
  readonly el = h('div', { class: 'browse-list' });

  constructor(private readonly i18n: I18n) {}

  renderCategories(categories: readonly CategorySummary[]): void {
    const lang = this.i18n.language;
    clear(this.el);
    this.el.append(
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
