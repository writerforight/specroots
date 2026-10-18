export type Route = { kind: 'home' } | { kind: 'root'; rootId: string; wordId: string | null };

/** Hash routes: #/ , #/root/spec , #/root/spec/inspection */
export function parseRoute(hash: string): Route {
  const [, kind, rootId, wordId] = hash.replace(/^#/, '').split('/');
  if (kind === 'root' && rootId) return { kind: 'root', rootId: decodeURIComponent(rootId), wordId: wordId ? decodeURIComponent(wordId) : null };
  return { kind: 'home' };
}

export function rootHref(rootId: string, wordId: string | null = null): string {
  return `#/root/${encodeURIComponent(rootId)}${wordId ? `/${encodeURIComponent(wordId)}` : ''}`;
}
