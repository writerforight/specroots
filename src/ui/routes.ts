import { isExpressionKind, type ExpressionKind } from '../domain/Expression';

export type Route =
  | { kind: 'home' }
  | { kind: 'roots' }
  | { kind: 'root'; rootId: string; wordId: string | null }
  | { kind: 'affix'; affixId: string }
  | { kind: 'lists' }
  | { kind: 'list'; listId: string; objectId: string | null }
  | { kind: 'object'; objectId: string }
  | { kind: 'expressions' }
  | { kind: 'expressionCategory'; categoryId: string; expressionId: string | null }
  | { kind: 'expressionKinds' }
  | { kind: 'expressionKind'; kindId: ExpressionKind; expressionId: string | null }
  | { kind: 'contributors' }
  | { kind: 'german' }
  | { kind: 'deRoot'; rootId: string; wordId: string | null };

/**
 * Hash routes: #/ (start screen: roots or objects), #/roots , #/root/spec , #/root/spec/inspection , #/affix/re- (roots section);
 * #/lists , #/list/kitchen , #/list/kitchen/colander , #/object/colander (lists section);
 * #/expressions , #/expressions/anger , #/expressions/anger/blow-up (everyday expressions section, by feeling);
 * #/kinds , #/kind/verb , #/kind/verb/blow-up (the same expressions by kind of phrase);
 * #/de , #/de/steh , #/de/steh/verstehen (German roots section); #/contributors (who added the words).
 */
export function parseRoute(hash: string): Route {
  const [, kind, id, sub] = hash.replace(/^#/, '').split('/');
  const dec = (s: string | undefined) => (s ? decodeURIComponent(s) : null);
  if (kind === 'root' && id) return { kind: 'root', rootId: decodeURIComponent(id), wordId: dec(sub) };
  if (kind === 'affix' && id) return { kind: 'affix', affixId: decodeURIComponent(id) };
  if (kind === 'roots') return { kind: 'roots' };
  if (kind === 'lists') return { kind: 'lists' };
  if (kind === 'list' && id) return { kind: 'list', listId: decodeURIComponent(id), objectId: dec(sub) };
  if (kind === 'object' && id) return { kind: 'object', objectId: decodeURIComponent(id) };
  if (kind === 'expressions') return id ? { kind: 'expressionCategory', categoryId: decodeURIComponent(id), expressionId: dec(sub) } : { kind: 'expressions' };
  if (kind === 'kinds') return { kind: 'expressionKinds' };
  if (kind === 'kind') return isExpressionKind(id) ? { kind: 'expressionKind', kindId: id, expressionId: dec(sub) } : { kind: 'expressionKinds' };
  if (kind === 'contributors') return { kind: 'contributors' };
  if (kind === 'de') return id ? { kind: 'deRoot', rootId: decodeURIComponent(id), wordId: dec(sub) } : { kind: 'german' };
  return { kind: 'home' };
}

/** Which half of the app a route belongs to; null for the neutral home address. */
export function sectionOf(route: Route): 'roots' | 'lists' | 'german' | 'expressions' | null {
  if (route.kind === 'home' || route.kind === 'contributors') return null;
  if (route.kind === 'german' || route.kind === 'deRoot') return 'german';
  if (route.kind === 'expressions' || route.kind === 'expressionCategory' || route.kind === 'expressionKinds' || route.kind === 'expressionKind') return 'expressions';
  return route.kind === 'roots' || route.kind === 'root' || route.kind === 'affix' ? 'roots' : 'lists';
}

/** Where each section starts. */
export const SECTION_HOME: Record<'roots' | 'lists' | 'german' | 'expressions', string> = { roots: '#/roots', lists: '#/lists', german: '#/de', expressions: '#/expressions' };

export function rootHref(rootId: string, wordId: string | null = null): string {
  return `#/root/${encodeURIComponent(rootId)}${wordId ? `/${encodeURIComponent(wordId)}` : ''}`;
}

/** A German root or one of its words: #/de/steh/verstehen. */
export function deRootHref(rootId: string, wordId: string | null = null): string {
  return `#/de/${encodeURIComponent(rootId)}${wordId ? `/${encodeURIComponent(wordId)}` : ''}`;
}

export function affixHref(affixId: string): string {
  return `#/affix/${encodeURIComponent(affixId)}`;
}

export function listHref(listId: string, objectId: string | null = null): string {
  return `#/list/${encodeURIComponent(listId)}${objectId ? `/${encodeURIComponent(objectId)}` : ''}`;
}

export function objectHref(objectId: string): string {
  return `#/object/${encodeURIComponent(objectId)}`;
}

/** A category of everyday expressions, or one expression inside it: #/expressions/anger/blow-up. */
export function expressionHref(categoryId: string, expressionId: string | null = null): string {
  return `#/expressions/${encodeURIComponent(categoryId)}${expressionId ? `/${encodeURIComponent(expressionId)}` : ''}`;
}

export const KINDS_HREF = '#/kinds';

/** Every expression of one kind (all the verbs…), or one of them on that page: #/kind/verb/blow-up. */
export function kindHref(kind: ExpressionKind, expressionId: string | null = null): string {
  return `#/kind/${kind}${expressionId ? `/${encodeURIComponent(expressionId)}` : ''}`;
}

export const CONTRIBUTORS_HREF = '#/contributors';
