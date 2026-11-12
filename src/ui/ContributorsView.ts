import type { Contributor } from '../domain/Contributor';
import { BubblePhysics, type Body } from './BubblePhysics';
import { h } from './dom';
import { deRootHref, listHref, rootHref } from './routes';
import type { ViewContext } from './ViewContext';

const CONTRIBUTING_URL = 'https://github.com/writerforight/specroots/blob/main/CONTRIBUTING.md';

/**
 * Who added the words. The first look shows only names, as bubbles of one size at random places that
 * drift and can be thrown around: nobody is first. "Details" switches to the numbers: words per person, split
 * by section, and the roots and lists each one added.
 */
export class ContributorsView {
  readonly el = h('section', { class: 'contributors' });
  private detailed = false;

  constructor(
    private readonly ctx: ViewContext,
    private readonly contributors: readonly Contributor[],
    /** Injected so tests can fix the order. */
    private readonly random: () => number = Math.random,
  ) {
    this.render();
  }

  private render(): void {
    const { i18n } = this.ctx;
    const toggle = (detailed: boolean, label: string) =>
      h('button', { type: 'button', 'aria-pressed': String(this.detailed === detailed), onclick: () => this.show(detailed) }, label);
    this.el.replaceChildren(
      h(
        'header',
        { class: 'contributors-head' },
        h('h1', { class: 'index-title' }, i18n.t('contributors')),
        h('div', { class: 'segmented', role: 'group' }, toggle(false, i18n.t('contributorsNames')), toggle(true, i18n.t('contributorsDetails'))),
      ),
      h('p', { class: 'contributors-intro' }, i18n.t('contributorsIntro')),
      this.detailed ? this.details() : this.bubbles(),
      h('a', { class: 'contribute-link', href: CONTRIBUTING_URL, target: '_blank', rel: 'noopener' }, `${i18n.t('contribute')} →`),
    );
  }

  private show(detailed: boolean): void {
    this.detailed = detailed;
    this.render();
  }

  /**
   * Same size, placed at random on every visit, so nobody is first. The bubbles drift, bounce softly
   * off each other and can be grabbed and thrown; a tap without dragging opens the details.
   * With "reduce motion" they stand still in a shuffled row instead.
   */
  private bubbles(): HTMLElement {
    const order = [...this.contributors];
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(this.random() * (i + 1));
      [order[i], order[j]] = [order[j] as Contributor, order[i] as Contributor];
    }
    const still = typeof requestAnimationFrame !== 'function' || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
    if (still) {
      return h('ul', { class: 'bubbles' }, ...order.map((c) => h('li', {}, h('button', { class: 'bubble', type: 'button', onclick: () => this.show(true) }, c.name))));
    }

    const field = h('ul', { class: 'bubble-field' });
    const physics = new BubblePhysics(0, 0, this.random);
    let placed = false;
    const items: { el: HTMLElement; body: Body | null }[] = order.map((c) => {
      const item: { el: HTMLElement; body: Body | null } = { el: h('button', { class: 'bubble', type: 'button' }, c.name), body: null };
      let moved = false;
      let grip = { dx: 0, dy: 0, at: 0, startX: 0, startY: 0 };
      const local = (e: PointerEvent) => {
        const box = field.getBoundingClientRect();
        return { x: e.clientX - box.left, y: e.clientY - box.top };
      };
      item.el.addEventListener('pointerdown', (e) => {
        if (!item.body) return;
        const at = local(e);
        grip = { dx: item.body.x - at.x, dy: item.body.y - at.y, at: e.timeStamp, startX: e.clientX, startY: e.clientY };
        moved = false;
        physics.grab(item.body);
        item.el.setPointerCapture?.(e.pointerId);
        item.el.classList.add('held');
      });
      item.el.addEventListener('pointermove', (e) => {
        if (!item.body?.held) return;
        if (Math.hypot(e.clientX - grip.startX, e.clientY - grip.startY) > 6) moved = true;
        const at = local(e);
        physics.moveTo(item.body, at.x + grip.dx, at.y + grip.dy, (e.timeStamp - grip.at) / 1000);
        grip.at = e.timeStamp;
      });
      const drop = () => {
        if (!item.body?.held) return;
        physics.release(item.body);
        item.el.classList.remove('held');
      };
      item.el.addEventListener('pointerup', drop);
      item.el.addEventListener('pointercancel', drop);
      // A drag ends in a click too; only a real tap (or the keyboard) opens the details.
      item.el.addEventListener('click', () => {
        if (!moved) this.show(true);
        moved = false;
      });
      field.append(h('li', {}, item.el));
      return item;
    });

    let last = 0;
    let seen = false;
    const frame = (now: number) => {
      if (!field.isConnected) {
        if (!seen) requestAnimationFrame(frame); // not on the page yet
        return; // left the page: stop
      }
      seen = true;
      const width = field.clientWidth;
      const radius = (items[0]?.el.offsetWidth ?? 132) / 2;
      // Room for everyone: about a third of the field is bubbles, however many people there are.
      const height = Math.max(360, Math.ceil((items.length * Math.PI * radius * radius * 3) / Math.max(width, 1)));
      field.style.height = `${height}px`;
      physics.resize(width, height);
      if (!placed) {
        for (const item of items) item.body = physics.add(radius);
        placed = true;
      }
      physics.step(last ? (now - last) / 1000 : 0);
      last = now;
      for (const { el, body } of items) if (body) el.style.transform = `translate(${(body.x - body.r).toFixed(1)}px, ${(body.y - body.r).toFixed(1)}px)`;
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
    return field;
  }

  /** A–Z by name, so the order still says nothing about who added more. */
  private details(): HTMLElement {
    const { i18n } = this.ctx;
    const lang = i18n.language;
    const stat = (label: string, value: number) => h('div', { class: 'stat' }, h('dt', {}, label), h('dd', {}, String(value)));
    const people = [...this.contributors].sort((a, b) => a.name.localeCompare(b.name));
    return h(
      'div',
      { class: 'contributor-cards' },
      ...people.map((c) =>
        h(
          'article',
          { class: 'contributor-card' },
          h('h2', {}, h('a', { href: c.profileUrl, target: '_blank', rel: 'noopener' }, c.name)),
          h(
            'dl',
            { class: 'stats' },
            stat(i18n.t('stat_words'), c.totalWords),
            stat(i18n.t('stat_english'), c.words.en),
            stat(i18n.t('stat_german'), c.words.de),
            stat(i18n.t('stat_objects'), c.objects),
            stat(i18n.t('stat_expressions'), c.expressions),
          ),
          c.roots.length > 0 &&
            h(
              'details',
              { class: 'added' },
              h('summary', {}, `${i18n.t('stat_roots')} (${c.roots.length})`),
              h(
                'div',
                { class: 'added-links' },
                ...c.roots.map((r) => h('a', { class: 'list-chip', lang: r.lang, href: r.lang === 'de' ? deRootHref(r.id) : rootHref(r.id) }, r.label)),
              ),
            ),
          c.lists.length > 0 &&
            h(
              'details',
              { class: 'added' },
              h('summary', {}, `${i18n.t('stat_lists')} (${c.lists.length})`),
              h('div', { class: 'added-links' }, ...c.lists.map((l) => h('a', { class: 'list-chip', href: listHref(l.id) }, l.title[lang] ?? l.title.en ?? l.id))),
            ),
        ),
      ),
    );
  }
}
