export type Route =
  | { kind: 'home' }
  | { kind: 'root'; rootId: string; wordId: string | null }
  | { kind: 'affix'; affixId: string };

/** Hash routes: #/ , #/root/spec , #/root/spec/inspection , #/affix/re- */
export function parseRoute(hash: string): Route {
  const [, kind, id, wordId] = hash.replace(/^#/, '').split('/');
  if (kind === 'root' && id) return { kind: 'root', rootId: decodeURIComponent(id), wordId: wordId ? decodeURIComponent(wordId) : null };
  if (kind === 'affix' && id) return { kind: 'affix', affixId: decodeURIComponent(id) };
  return { kind: 'home' };
}

export function rootHref(rootId: string, wordId: string | null = null): string {
  return `#/root/${encodeURIComponent(rootId)}${wordId ? `/${encodeURIComponent(wordId)}` : ''}`;
}

export function affixHref(affixId: string): string {
  return `#/affix/${encodeURIComponent(affixId)}`;
}
