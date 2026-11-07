export type Route =
  | { kind: 'home' }
  | { kind: 'roots' }
  | { kind: 'root'; rootId: string; wordId: string | null }
  | { kind: 'affix'; affixId: string }
  | { kind: 'lists' }
  | { kind: 'list'; listId: string; objectId: string | null }
  | { kind: 'object'; objectId: string };

/**
 * Hash routes: #/ (start screen: roots or objects), #/roots , #/root/spec , #/root/spec/inspection , #/affix/re- (roots section);
 * #/lists , #/list/kitchen , #/list/kitchen/colander , #/object/colander (lists section).
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
  return { kind: 'home' };
}

/** Which half of the app a route belongs to; null for the neutral home address. */
export function sectionOf(route: Route): 'roots' | 'lists' | null {
  if (route.kind === 'home') return null;
  return route.kind === 'roots' || route.kind === 'root' || route.kind === 'affix' ? 'roots' : 'lists';
}

export function rootHref(rootId: string, wordId: string | null = null): string {
  return `#/root/${encodeURIComponent(rootId)}${wordId ? `/${encodeURIComponent(wordId)}` : ''}`;
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
