# User Mode and Read Ticks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A PIN-opened owner mode in which English and German words and roots can be ticked as read, shown dimmed with a `12/30` counter, and kept in sync between devices through a private GitHub repo.

**Architecture:** Three services with no DOM (`ProgressStore` state + merge, `UserMode` credentials sealed by the PIN, `GitHubProgressRemote` + `ProgressSync` for the private repo) and one optional field on `ViewContext` (`progress`, `null` when the mode is off). Views draw ticks only when that field is set, so a visitor's DOM and network traffic stay exactly as today.

**Tech Stack:** TypeScript 7, Vite 8, vitest 5 (node; happy-dom for the one view test file), WebCrypto (PBKDF2 + AES-GCM), GitHub REST contents API. No new runtime dependency.

**Spec:** `docs/superpowers/specs/2026-11-15-kullanici-modu-tikler-design.md` (Turkish). Approved mockup: `.superpowers/brainstorm/15561-1794755429/content/tik-taslak-v2.html` (local, untracked).

## Global Constraints

- Static site, no server, no third-party service; **no new runtime dependency**. `happy-dom` may be added as a devDependency only.
- Only English and German roots. Object lists and expressions get nothing.
- Mode off ⇒ none of this feature's elements exist in the DOM (not hidden: never created) and **zero** requests go to `api.github.com`.
- The token never appears in the repo, the bundle, `console.*` or any error text shown or thrown.
- Ticks are never written to the public `specroots` repo. Remote file: `progress.json` in the private repo named at setup.
- A ticked word **stays in place, dimmed (~40% opacity)**; ticking again undoes it.
- Root tick and word ticks are independent; the counter always counts word ticks: `done/total`.
- Look: no boxes, bars or badges. A small light-grey `✓` (text colour when on) and a small grey number. Values live in `src/styles/tokens.css` and must read in all four themes (light, dark, mono, mono-dark).
- UI strings in all six languages in `src/i18n/messages.ts`.
- `npm run check` stays green; no existing test is loosened. Layering as in SPEC decision 12: views get everything through `ViewContext`.
- Commits: no `Co-Authored-By` trailer. Do not commit generated `*-index.json`. Another session may commit data files to this repo: `git pull --rebase` before each commit, never revert others' commits.

## Review Focus

1. **Device clocks disagree** (phone behind the laptop): un-ticking on the phone must still win over the laptop's earlier tick. → Task 1 test `toggle outlives a newer timestamp`.
2. **Remote file is unreadable** (hand-edited, truncated, wrong `version`): local ticks must survive and sync must recover. → Task 3 test `unreadable remote is treated as empty`.
3. **Non-ASCII word ids** (`Schließung`, `Überfall`) must survive the base64 round trip. → Task 3 test `non-ASCII keys round-trip`.
4. **A tick lands while a push is in flight**: it must not be marked as sent. → Task 3 test `tick during push stays dirty`.
5. **Storage is blocked or the pasted token has spaces/newlines** (phone paste): setup must trim, and a blocked `localStorage` must not throw. → Task 2 tests `setup trims credentials`, `blocked storage does not throw`.

---

### Task 1: ProgressStore

**Files:**
- Create: `src/services/ProgressStore.ts`
- Modify: `src/services/KeyValueStore.ts` (add `remove`)
- Test: `tests/progress.test.ts`

**Interfaces:**
- Produces:

```ts
// KeyValueStore gains: remove(key: string): void   (BrowserStore swallows errors like set; MemoryStore deletes)

export type ProgressSection = 'en' | 'de';
export interface Mark { readonly d: 0 | 1; readonly t: number }           // t: unix seconds
export interface ProgressData { readonly version: 1; readonly words: Readonly<Record<string, Mark>>; readonly roots: Readonly<Record<string, Mark>> }
export const EMPTY_PROGRESS: ProgressData;
export function wordKey(section: ProgressSection, rootId: string, wordId: string): string; // "en/spec/inspect"
export function rootKey(section: ProgressSection, rootId: string): string;                 // "en/spec"
export function parseProgress(json: string | null): ProgressData;   // anything invalid → EMPTY_PROGRESS; drops malformed marks
export function mergeProgress(a: ProgressData, b: ProgressData): ProgressData; // per key: larger t wins; equal t → d:1 wins
export class ProgressStore {
  constructor(store: KeyValueStore, now?: () => number);
  readonly data: ProgressData;            // getter
  readonly dirty: boolean;                // getter; persisted
  isWordDone(s: ProgressSection, rootId: string, wordId: string): boolean;
  isRootDone(s: ProgressSection, rootId: string): boolean;
  toggleWord(s: ProgressSection, rootId: string, wordId: string): boolean; // returns the new state
  toggleRoot(s: ProgressSection, rootId: string): boolean;
  countDone(s: ProgressSection, rootId: string, wordIds: readonly string[]): number;
  absorb(remote: ProgressData): void;     // merge in; dirty stays true iff the merged data differs from `remote`
  markSynced(sent: ProgressData): void;   // clears dirty only if data is still deep-equal to `sent`
  clear(): void;                          // forget everything locally
  subscribe(listener: () => void): () => void;
}
```

Storage keys: `specroots.progress.v1` (JSON of `ProgressData`), `specroots.progress.dirty` (`"1"` or removed).

- [ ] **Step 1: Write the failing tests** in `tests/progress.test.ts` (use `MemoryStore` and an injected `now`):

```ts
it('toggles a word and counts it', () => {
  const p = new ProgressStore(new MemoryStore(), () => 100);
  expect(p.toggleWord('en', 'spec', 'inspect')).toBe(true);
  expect(p.countDone('en', 'spec', ['inspect', 'inspection'])).toBe(1);
  expect(p.toggleWord('en', 'spec', 'inspect')).toBe(false);
  expect(p.data.words['en/spec/inspect']).toEqual({ d: 0, t: 101 }); // kept, not deleted
  expect(p.dirty).toBe(true);
});
it('root tick and word ticks are independent', () => {
  const p = new ProgressStore(new MemoryStore(), () => 100);
  p.toggleRoot('de', 'steh');
  expect(p.isRootDone('de', 'steh')).toBe(true);
  expect(p.countDone('de', 'steh', ['verstehen'])).toBe(0);
});
it('toggle outlives a newer timestamp', () => {          // Review Focus 1
  const store = new MemoryStore();
  const p = new ProgressStore(store, () => 50);           // this device's clock is behind
  p.absorb({ version: 1, words: { 'en/spec/inspect': { d: 1, t: 900 } }, roots: {} });
  p.toggleWord('en', 'spec', 'inspect');
  expect(p.data.words['en/spec/inspect']).toEqual({ d: 0, t: 901 });
});
it('merge: larger t wins, equal t prefers done, unknown keys are kept', () => {
  const a = { version: 1, words: { x: { d: 1, t: 5 }, y: { d: 0, t: 9 }, z: { d: 0, t: 3 } }, roots: {} } as const;
  const b = { version: 1, words: { x: { d: 0, t: 7 }, y: { d: 1, t: 2 }, z: { d: 1, t: 3 }, q: { d: 1, t: 1 } }, roots: { 'en/spec': { d: 1, t: 1 } } } as const;
  expect(mergeProgress(a, b)).toEqual({ version: 1, words: { x: { d: 0, t: 7 }, y: { d: 0, t: 9 }, z: { d: 1, t: 3 }, q: { d: 1, t: 1 } }, roots: { 'en/spec': { d: 1, t: 1 } } });
});
it('absorb clears dirty only when nothing local is newer', () => { /* local tick + absorb(remote without it) → dirty true; absorb(p.data) → dirty false */ });
it('markSynced ignores a stale snapshot', () => { /* snapshot = p.data; toggle again; markSynced(snapshot) → dirty still true */ });
it('persists and restores; parseProgress rejects garbage', () => {
  expect(parseProgress('{"version":2}')).toEqual(EMPTY_PROGRESS);
  expect(parseProgress('not json')).toEqual(EMPTY_PROGRESS);
  expect(parseProgress('{"version":1,"words":{"a":{"d":1,"t":1},"b":{"d":"x"}},"roots":{}}').words).toEqual({ a: { d: 1, t: 1 } });
});
it('notifies subscribers on toggle, absorb and clear', () => { /* counter of calls */ });
```

- [ ] **Step 2:** Run `npx vitest run tests/progress.test.ts` — expect FAIL (module missing).
- [ ] **Step 3:** Implement. A toggle's timestamp is `max(now(), existing.t + 1)` (this is what makes the clock-skew test pass). Listeners fire only when data actually changes.
- [ ] **Step 4:** Run `npm run check` — expect all green.
- [ ] **Step 5:** Commit `feat: progress store for read ticks`.

---

### Task 2: UserMode (credentials sealed by the PIN)

**Files:**
- Create: `src/services/UserMode.ts`
- Test: `tests/usermode.test.ts`

**Interfaces:**
- Consumes: `KeyValueStore` with `remove` (Task 1).
- Produces:

```ts
export interface Credentials { readonly repo: string; readonly token: string }   // repo: "owner/name"
export function isPin(s: string): boolean;                                       // /^\d{4}$/
export function encodeSetupPackage(c: Credentials): string;                      // base64url(JSON), no padding
export function decodeSetupPackage(s: string): Credentials | null;               // null on anything malformed
export class UserMode {
  constructor(store: KeyValueStore, crypto?: Crypto);                            // default globalThis.crypto
  readonly isSetUp: boolean;                      // a sealed blob exists on this device
  readonly credentials: Credentials | null;       // non-null = mode is on
  setUp(c: Credentials, pin: string): Promise<void>;   // trims repo/token, validates, seals, and turns the mode on
  unlock(pin: string): Promise<boolean>;               // false on wrong PIN or nothing sealed
  lock(): void;                                        // mode off; sealed blob stays
  forget(): void;                                      // removes sealed blob and open credentials
  subscribe(listener: () => void): () => void;
}
```

Storage keys: `specroots.user.sealed` (JSON `{ salt, iv, data }`, each base64), `specroots.user.open` (JSON `Credentials`, present only while the mode is on). Sealing: PBKDF2-SHA-256 over the PIN, 200 000 iterations, random 16-byte salt → AES-GCM 256 key, random 12-byte iv. `setUp` rejects (throws `Error('invalid')`) when the PIN is not four digits, `repo` is not `owner/name`, or the token is empty after trimming. No error message may contain the token.

- [ ] **Step 1: Write the failing tests** (node's `globalThis.crypto` is WebCrypto):

```ts
const C = { repo: 'me/specroots-progress', token: 'github_pat_TESTONLY' };
it('setUp turns the mode on and survives a reload', async () => {
  const s = new MemoryStore(); const u = new UserMode(s);
  await u.setUp(C, '4821');
  expect(u.credentials).toEqual(C);
  expect(new UserMode(s).credentials).toEqual(C);       // stays open on this device
});
it('lock then unlock with the PIN', async () => {
  const s = new MemoryStore(); const u = new UserMode(s); await u.setUp(C, '4821'); u.lock();
  expect(u.credentials).toBeNull(); expect(u.isSetUp).toBe(true);
  expect(await u.unlock('0000')).toBe(false); expect(u.credentials).toBeNull();
  expect(await u.unlock('4821')).toBe(true);  expect(u.credentials).toEqual(C);
});
it('the sealed blob does not contain the token', async () => {
  const s = new MemoryStore(); const u = new UserMode(s); await u.setUp(C, '4821'); u.lock();
  expect(s.get('specroots.user.sealed')).not.toContain('TESTONLY');
  expect(s.get('specroots.user.open')).toBeNull();
});
it('forget removes everything', async () => { /* isSetUp false, both keys null */ });
it('setup trims credentials', async () => {            // Review Focus 5
  const u = new UserMode(new MemoryStore());
  await u.setUp({ repo: '  me/specroots-progress\n', token: ' github_pat_TESTONLY \n' }, '4821');
  expect(u.credentials).toEqual(C);
});
it('rejects a bad PIN, repo or empty token without leaking the token', async () => {
  const u = new UserMode(new MemoryStore());
  await expect(u.setUp(C, '12')).rejects.toThrow('invalid');
  await expect(u.setUp({ ...C, repo: 'norepo' }, '4821')).rejects.toThrow('invalid');
  await u.setUp(C, 'abcd').catch((e: Error) => expect(e.message).not.toContain('TESTONLY'));
});
it('blocked storage does not throw', async () => {     // Review Focus 5
  const blocked = { get: () => null, set: () => {}, remove: () => {} };
  const u = new UserMode(blocked); await u.setUp(C, '4821');
  expect(u.credentials).toEqual(C);                    // lasts for this visit only
});
it('setup package round-trips and rejects garbage', () => {
  expect(decodeSetupPackage(encodeSetupPackage(C))).toEqual(C);
  expect(encodeSetupPackage(C)).toMatch(/^[A-Za-z0-9_-]+$/);
  expect(decodeSetupPackage('%%%')).toBeNull(); expect(decodeSetupPackage('e30')).toBeNull(); // "{}"
});
it('notifies on setUp, unlock, lock, forget', async () => { /* call counter */ });
```

- [ ] **Step 2:** Run `npx vitest run tests/usermode.test.ts` — expect FAIL.
- [ ] **Step 3:** Implement with `crypto.subtle` only.
- [ ] **Step 4:** `npm run check` — green.
- [ ] **Step 5:** Commit `feat: user mode with PIN-sealed credentials`.

---

### Task 3: GitHub remote and sync

**Files:**
- Create: `src/services/ProgressRemote.ts` (interface + `GitHubProgressRemote`), `src/services/ProgressSync.ts`
- Test: `tests/progress-sync.test.ts`

**Interfaces:**
- Consumes: `ProgressData`, `parseProgress`, `ProgressStore` (Task 1); `Credentials`, `UserMode` (Task 2).
- Produces:

```ts
export class RemoteFailure extends Error { constructor(readonly kind: 'auth' | 'network') }   // message is the kind only
export interface RemoteSnapshot { readonly data: ProgressData; readonly sha: string | null }  // sha null = file does not exist yet
export interface ProgressRemote {
  read(): Promise<RemoteSnapshot>;
  write(data: ProgressData, sha: string | null): Promise<'ok' | 'conflict'>;
}
export class GitHubProgressRemote implements ProgressRemote { constructor(c: Credentials, fetchFn?: typeof fetch) }

export type SyncStatus = 'idle' | 'pending' | 'auth-error';
export class ProgressSync {
  constructor(store: ProgressStore, remote: ProgressRemote, options?: { delayMs?: number; schedule?: (fn: () => void, ms: number) => unknown });
  readonly status: SyncStatus;
  pull(): Promise<void>;        // read → store.absorb; never throws
  schedulePush(): void;         // debounced flush; default delayMs 3000
  flush(): Promise<void>;       // read → absorb → if dirty: write → on 'conflict' repeat (max 3) → markSynced; never throws
  subscribe(listener: () => void): () => void;
}
/** The only place a remote is created. Returns null, and touches nothing, while the mode is off. */
export function startProgressSync(userMode: UserMode, store: ProgressStore, fetchFn?: typeof fetch): ProgressSync | null;
```

GitHub details:
- `GET https://api.github.com/repos/{repo}/contents/progress.json` with headers `Authorization: Bearer <token>`, `Accept: application/vnd.github+json`, `X-GitHub-Api-Version: 2022-11-28`; `cache: 'no-store'`.
- 200 → `content` is base64 of UTF-8 JSON (may contain newlines) → `parseProgress`. 404 on the file → `GET /repos/{repo}`: 200 means the file is simply missing (`{ data: EMPTY_PROGRESS, sha: null }`), anything else → `RemoteFailure('auth')`.
- `PUT` same URL, body `{ message: 'progress', content: <base64 UTF-8 JSON>, sha? }`. 200/201 → `'ok'`; 409 or 422 → `'conflict'`.
- 401/403 → `RemoteFailure('auth')`; fetch rejection or 5xx → `RemoteFailure('network')`.
- `ProgressSync`: `'auth'` → status `'auth-error'` (local ticks untouched, dirty stays); `'network'` → status `'pending'`; success with nothing dirty → `'idle'`.

- [ ] **Step 1: Write the failing tests** with a hand-written fake `fetch` (a function recording calls and returning `new Response(...)`) and a fake `ProgressRemote` for the sync tests:

```ts
it('read decodes the file; a missing file in a reachable repo is empty with sha null', async () => { ... });
it('non-ASCII keys round-trip', async () => {            // Review Focus 3
  // write {words:{'de/schliess/Schließung':{d:1,t:1}}} → capture PUT body → feed its content back through read → deep-equal
});
it('unreadable remote is treated as empty', async () => { // Review Focus 2
  // GET returns content = base64('{{{') → read() resolves { data: EMPTY_PROGRESS, sha: 'abc' }
  // then ProgressSync.flush() with a dirty store writes the local data with sha 'abc' and local ticks are unchanged
});
it('401 maps to auth, a rejected fetch to network, and neither message holds the token', async () => { ... });
it('flush merges remote ticks in and pushes local ones', async () => {
  // remote has word A, local has word B (dirty) → after flush: store has A and B, remote received A and B, dirty false, status 'idle'
});
it('conflict: re-read, merge, write again', async () => { // fake remote answers 'conflict' once, with a new tick C added meanwhile → final write holds A, B, C
});
it('tick during push stays dirty', async () => {         // Review Focus 4
  // fake remote.write toggles another word on the store before resolving 'ok' → store.dirty still true
});
it('auth error keeps local ticks and reports auth-error', async () => { ... });
it('schedulePush debounces into one flush', () => { /* injected schedule; three calls → one timer → one write */ });
it('startProgressSync returns null and never calls fetch while the mode is off', () => {
  const fetchFn = vi.fn(); expect(startProgressSync(new UserMode(new MemoryStore()), new ProgressStore(new MemoryStore()), fetchFn)).toBeNull();
  expect(fetchFn).not.toHaveBeenCalled();
});
```

- [ ] **Step 2:** Run `npx vitest run tests/progress-sync.test.ts` — expect FAIL.
- [ ] **Step 3:** Implement. Base64 of UTF-8 via `TextEncoder`/`TextDecoder` (plain `btoa` breaks on `ß`).
- [ ] **Step 4:** `npm run check` — green.
- [ ] **Step 5:** Commit `feat: sync read ticks with a private GitHub repo`.

---

### Task 4: Ticks, counters and dimming in the views

**Files:**
- Create: `src/ui/tick.ts`, `tests/progress-views.test.ts`
- Modify: `src/ui/ViewContext.ts`, `src/ui/WordCard.ts`, `src/ui/derivations.ts`, `src/ui/IndexView.ts`, `src/ui/RootDetailView.ts` (root page header + `showIndex` total), `src/ui/AffixFamilyView.ts`, `src/ui/SearchBox.ts`, `src/app/App.ts` (`context()` and `showIndex` item building only), `src/styles/tokens.css`, `src/styles/app.css`, `src/i18n/messages.ts`, `package.json` (devDependency `happy-dom`, exact version)

**Interfaces:**
- Consumes: `ProgressStore`, `ProgressSection` (Task 1).
- Produces:

```ts
// ViewContext gains:
readonly progress: ProgressStore | null;      // null = mode off; every view checks this and nothing else

// src/ui/tick.ts
/** A small ✓ toggle. `toggle` performs the change and returns the new state. */
export function tickButton(pressed: boolean, label: string, toggle: () => boolean): HTMLButtonElement;
// class "tick", type="button", aria-pressed, aria-label=label, text "✓"; click → preventDefault + stopPropagation, then updates aria-pressed

// IndexItem gains (set by App only for root items while the mode is on):
readonly progress?: { readonly done: boolean; readonly doneWords: number; readonly toggle: () => boolean };
// INDEX_LAYOUTS functions gain a third parameter: tickLabel: string
```

Behaviour to build (mockup v2 is the visual reference):
- **Word card** (`WordCard.render`): when `ctx.progress` is set and `root.language` is `en` or `de`, the header gets a `tickButton` as its last child and the `article` gets class `is-done` when ticked. Clicking toggles the class in place (no re-render).
- **Tree view**: the `details.tree-node` also gets `is-done` so the summary line dims; it follows the card's tick.
- **Root page header**: next to the root name a `tickButton` for the root and a `span.progress-count` with `done/total`; the count updates when any word on the page is ticked (subscribe to the store; unsubscribe when the view is replaced).
- **Index, grid**: the tick is a **sibling** of the `a.index-tile` inside the `li` (a button inside a link is invalid), top right; `span.progress-count` `12/30` inside the tile, bottom right; `li.is-done` dims label, forms and meaning. **Index, dictionary**: same data inline at the end of the entry, same quietness.
- **Index total**: `showIndex` shows `span.progress-total` `done roots/all roots` in the title row when the mode is on.
- **Affix pages and search results**: rows for words that are ticked get `is-done` (dim only, no tick button).
- **CSS**: tokens `--tick-off`, `--tick-on`, `--done-opacity: 0.4` in `tokens.css`, defined for all four themes; `.tick` has no border or background, visible glyph ~12px, hit area at least 32×32px; `.is-done` applies `opacity: var(--done-opacity)` to the text, never to the tick itself.
- **i18n** (six languages each): `markRead` ("Mark as read" / "Okundu işaretle"), `markUnread` ("Mark as unread" / "Okunmadı işaretle").

- [ ] **Step 1:** `npm i -D --save-exact happy-dom`; put `// @vitest-environment happy-dom` at the top of `tests/progress-views.test.ts` (leave `vitest.config.ts` on `node`).
- [ ] **Step 2: Write the failing tests.** Build a `ViewContext` from the existing test helpers (`tests/helpers.ts`) with a real root loaded from `public/data/roots/spec.json`:

```ts
it('mode off: word card has no tick and no done class', () => {
  const el = new WordCard({ ...ctx, progress: null }).render(word, root);
  expect(el.querySelector('.tick')).toBeNull(); expect(el.classList.contains('is-done')).toBe(false);
});
it('mode off: index and root page output is byte-identical to before', () => {
  // render grid + dictionary with items lacking `progress`; expect no .tick, .progress-count, .progress-total, .is-done anywhere
});
it('mode on: clicking the tick dims the card and records the word', () => {
  const p = new ProgressStore(new MemoryStore());
  const el = new WordCard({ ...ctx, progress: p }).render(word, root);
  const tick = el.querySelector<HTMLButtonElement>('.tick')!;
  tick.click();
  expect(el.classList.contains('is-done')).toBe(true); expect(tick.getAttribute('aria-pressed')).toBe('true');
  expect(p.isWordDone('en', 'spec', word.id)).toBe(true);
  tick.click(); expect(el.classList.contains('is-done')).toBe(false);
});
it('tree view dims the node of a ticked word', () => { ... });
it('grid tile shows 12/30, a sibling tick, and dims a done root', () => {
  // item.progress = { done: true, doneWords: 12, toggle } , item.count = 30
  // expect li.is-done, li > button.tick (not inside the <a>), .progress-count text "12/30"
});
it('dictionary entry shows the same count and tick', () => { ... });
it('root page header counts word ticks and updates on click', () => {
  // render the root page with progress; header .progress-count "0/N"; click a word tick; header reads "1/N"; root tick still aria-pressed="false"
});
```

- [ ] **Step 3:** Run `npx vitest run tests/progress-views.test.ts` — expect FAIL.
- [ ] **Step 4:** Implement the views, CSS and messages; in `App.context()` pass `progress: null` for now (Task 5 wires the real value) and build `IndexItem.progress` only when the context's progress is set.
- [ ] **Step 5:** `npm run check` — green. Then `npm run dev` and compare the root page and both index layouts with the mockup in all four themes by temporarily passing a `ProgressStore` in `context()`; revert that temporary line.
- [ ] **Step 6:** Commit `feat: read ticks, counters and dimming in root views`.

---

### Task 5: Setup page, settings entry and app wiring

**Files:**
- Create: `src/ui/SetupView.ts`
- Modify: `src/ui/routes.ts`, `src/ui/SettingsDialog.ts`, `src/app/App.ts`, `src/main.ts`, `src/i18n/messages.ts`, `src/styles/app.css`
- Test: `tests/progress-views.test.ts` (same happy-dom file), `tests/services.test.ts` or wherever `parseRoute` is tested today

**Interfaces:**
- Consumes: everything from Tasks 1–4.
- Produces:

```ts
// routes.ts
| { kind: 'setup'; pkg: string | null }        // "#/setup" and "#/setup/<package>"
export const SETUP_HREF = '#/setup';           // sectionOf(setup) === null
export function setupHref(pkg: string): string;

// SetupView.ts
export class SetupView {
  constructor(ctx: ViewContext, userMode: UserMode, onDone: () => void);
  render(prefill: Credentials | null): HTMLElement;   // form: repo, token (type=password), PIN (inputmode=numeric, maxlength 4)
}

// SettingsDialog constructor gains: userMode: UserMode, getSyncStatus: () => SyncStatus | null
// App constructor gains (after `german`): userMode: UserMode, progress: ProgressStore
```

Behaviour:
- **`#/setup`** is linked from nowhere except the settings note below. With a package: decode it, immediately `history.replaceState` the address to `#/setup` (so the token leaves the address bar and history), prefill and lock the repo/token fields, ask only for the PIN. A package that does not decode shows the empty form.
- **Save**: `userMode.setUp` → then one `remote.read()` to prove the token works. `auth` failure → `userMode.forget()`, show `setupFailed`; network failure → keep the setup, show `setupOffline`; success → `onDone()` (go to `#/roots`).
- **Settings dialog**: a block that is rendered **only if `userMode.isSetUp`**. Locked: a 4-digit PIN field + button; wrong PIN shows `wrongPin`. Unlocked: buttons `leaveUserMode` (→ `lock()`), `setUpAnotherDevice` (copies `location.origin + location.pathname + setupHref(encodeSetupPackage(credentials))` to the clipboard, then shows `linkCopied`), `forgetDevice` (asks for a second click to confirm, then `userMode.forget()` + `progress.clear()`); when sync status is `'auth-error'`, one quiet line `syncStopped` linking to `SETUP_HREF`.
- **App**: `context().progress = userMode.credentials ? progress : null`. On start and whenever `userMode` changes: stop the old sync, `startProgressSync(...)`, `pull()` if non-null, re-render. `progress.subscribe` → `schedulePush()`. `visibilitychange` to hidden and `online` → `flush()`. Re-render the current route when `absorb` changed data (so ticks from the other device appear), but not on the user's own click (Task 4 updates in place).
- **i18n** (six languages each; EN / TR given): `userMode` "Owner mode" / "Kullanıcı modu"; `pin` "4-digit code" / "4 haneli şifre"; `unlock` "Open" / "Aç"; `wrongPin` "Wrong code" / "Şifre yanlış"; `leaveUserMode` "Leave owner mode" / "Moddan çık"; `setUpAnotherDevice` "Set up another device" / "Başka cihaza kur"; `linkCopied` "Link copied. Open it once on the other device." / "Link kopyalandı. Öbür cihazda bir kez aç."; `forgetDevice` "Forget this device" / "Bu cihazı unut"; `forgetConfirm` "Tap again to erase ticks on this device" / "Bu cihazdaki tikleri silmek için tekrar bas"; `syncStopped` "Sync stopped: renew the key" / "Eşitleme durdu: anahtarı yenile"; `setupTitle` "Set up this device" / "Bu cihazı kur"; `setupRepo` "Private repository (owner/name)" / "Gizli depo (sahip/ad)"; `setupToken` "Access key" / "Erişim anahtarı"; `setupSave` "Save" / "Kaydet"; `setupFailed` "The key or repository was not accepted" / "Anahtar ya da depo kabul edilmedi"; `setupOffline` "Saved. It will sync when you are online." / "Kaydedildi. İnternet gelince eşitlenecek."

- [ ] **Step 1: Write the failing tests:**

```ts
it('parses #/setup and #/setup/<pkg>', () => {
  expect(parseRoute('#/setup')).toEqual({ kind: 'setup', pkg: null });
  expect(parseRoute('#/setup/abc_-9')).toEqual({ kind: 'setup', pkg: 'abc_-9' });
  expect(sectionOf({ kind: 'setup', pkg: null })).toBeNull();
});
it('settings dialog shows nothing about owner mode on a device that is not set up', () => {
  // open('settings') with a fresh UserMode → dialog text contains none of: userMode, pin labels; no input[inputmode=numeric]
});
it('set-up but locked device shows only the PIN field; the right PIN turns the mode on', async () => { ... });
it('unlocked device offers leave / another device / forget', async () => { ... });
it('setup view with a package prefills, hides the token from the address, and asks only for the PIN', () => {
  // location.hash = setupHref(encodeSetupPackage(C)); render via the route handler; expect location.hash === '#/setup'
});
```

- [ ] **Step 2:** Run the two test files — expect FAIL.
- [ ] **Step 3:** Implement routes, `SetupView`, the settings block, `main.ts` construction (`new UserMode(store)`, `new ProgressStore(store)` sharing the one `BrowserStore`) and the App wiring above.
- [ ] **Step 4:** `npm run check` and `npm run build` — both green. `grep -R "api.github.com" dist/assets/*.js` may match (the code is there) but `grep -Ri "github_pat" dist` must match nothing.
- [ ] **Step 5:** Manual check with `npm run dev`, DevTools network tab open: as a visitor (fresh profile) browse roots, a root page, settings → no request to `api.github.com`, no tick anywhere.
- [ ] **Step 6:** Commit `feat: owner mode setup page and settings entry`.

---

### Task 6: SPEC decision 20 and end-to-end check

**Files:**
- Modify: `SPEC.md` (add decision 20, Turkish, in the style of decisions 17–19; add the three services to the "Mimari" section)

- [ ] **Step 1:** Write decision 20: what the mode is, PIN = curtain / token = real key, private repo `specroots-progress`, data format, independence of root tick and counter, EN+DE only, visitor sees nothing, offline browsing deferred to D3.
- [ ] **Step 2:** `npm run check` — green. Commit `docs: SPEC decision 20, owner mode and read ticks`, push.
- [ ] **Step 3 (needs the owner):** the private repo and the fine-grained key are created by the owner; then on the live site: set up the laptop at `#/setup`, tick three words and one root, confirm `progress.json` appears in the private repo; copy the "another device" link, open it on the phone, enter the PIN, confirm the same ticks show; un-tick one on the phone, reload the laptop, confirm it is un-ticked.
