export type Route =
  | { kind: 'home' }
  | { kind: 'root'; rootId: string; wordId: string | null }
  | { kind: 'words'; titleIds: readonly string[] };

/**
 * Hash routes: #/ , #/root/spec , #/root/spec/inspection , #/words/re-,-ion (the words built with the
 * ticked titles). #/affix/re- is the older one-title address and still opens #/words/re-.
 */
export function parseRoute(hash: string): Route {
  const [, kind, id, wordId] = hash.replace(/^#/, '').split('/');
  if (kind === 'root' && id) return { kind: 'root', rootId: decodeURIComponent(id), wordId: wordId ? decodeURIComponent(wordId) : null };
  if (kind === 'affix' && id) return { kind: 'words', titleIds: [decodeURIComponent(id)] };
  if (kind === 'words' && id) {
    const titleIds = [...new Set(id.split(',').filter(Boolean).map(decodeURIComponent))];
    if (titleIds.length > 0) return { kind: 'words', titleIds };
  }
  return { kind: 'home' };
}

export function rootHref(rootId: string, wordId: string | null = null): string {
  return `#/root/${encodeURIComponent(rootId)}${wordId ? `/${encodeURIComponent(wordId)}` : ''}`;
}

/** The words built with the given titles; no titles is the start page. */
export function wordsHref(titleIds: readonly string[]): string {
  return titleIds.length === 0 ? '#/' : `#/words/${titleIds.map(encodeURIComponent).join(',')}`;
}
