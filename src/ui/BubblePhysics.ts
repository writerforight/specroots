/** One bubble: centre, velocity (px/s), radius. A held bubble follows the pointer, not the physics. */
export interface Body {
  x: number;
  y: number;
  vx: number;
  vy: number;
  readonly r: number;
  held: boolean;
}

const CRUISE = 14; // px/s a free bubble keeps drifting at
const WANDER = 26; // px/s² of random push, so paths curve
const DRAG = 0.9; // per second; a thrown bubble calms down within a few seconds
const BOUNCE = 0.86; // speed kept after hitting a wall or another bubble
const MAX_SPEED = 2400;

/**
 * Soft bubbles in a box: they drift slowly, bounce off the walls and off each other, and can be
 * held, dragged and thrown. No DOM here, so it can be tested and reused by another look.
 */
export class BubblePhysics {
  readonly bodies: Body[] = [];

  constructor(
    private width: number,
    private height: number,
    private readonly random: () => number = Math.random,
  ) {}

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  /** Places a new bubble where it touches no other one, if such a spot is found in a few tries. */
  add(r: number): Body {
    let x = 0;
    let y = 0;
    for (let attempt = 0; attempt < 60; attempt++) {
      x = r + this.random() * Math.max(0, this.width - 2 * r);
      y = r + this.random() * Math.max(0, this.height - 2 * r);
      if (this.bodies.every((b) => Math.hypot(b.x - x, b.y - y) >= b.r + r + 4)) break;
    }
    const angle = this.random() * Math.PI * 2;
    const body: Body = { x, y, vx: Math.cos(angle) * CRUISE, vy: Math.sin(angle) * CRUISE, r, held: false };
    this.bodies.push(body);
    return body;
  }

  grab(body: Body): void {
    body.held = true;
    body.vx = 0;
    body.vy = 0;
  }

  /** The pointer moved a held bubble; its speed is remembered so letting go throws it. */
  moveTo(body: Body, x: number, y: number, dt: number): void {
    const nx = Math.min(Math.max(x, body.r), Math.max(body.r, this.width - body.r));
    const ny = Math.min(Math.max(y, body.r), Math.max(body.r, this.height - body.r));
    if (dt > 0) {
      body.vx = 0.6 * body.vx + 0.4 * ((nx - body.x) / dt);
      body.vy = 0.6 * body.vy + 0.4 * ((ny - body.y) / dt);
    }
    body.x = nx;
    body.y = ny;
  }

  release(body: Body): void {
    body.held = false;
    const speed = Math.hypot(body.vx, body.vy);
    if (speed > MAX_SPEED) {
      body.vx *= MAX_SPEED / speed;
      body.vy *= MAX_SPEED / speed;
    }
  }

  /** Advances the world by dt seconds (long pauses, like a hidden tab, count as one short step). */
  step(dt: number): void {
    const t = Math.min(dt, 0.05);
    for (const b of this.bodies) {
      if (b.held) continue;
      b.vx += (this.random() - 0.5) * WANDER * t;
      b.vy += (this.random() - 0.5) * WANDER * t;
      const speed = Math.hypot(b.vx, b.vy);
      if (speed > CRUISE) {
        const slowed = Math.max(CRUISE, speed * Math.exp(-DRAG * t));
        b.vx *= slowed / speed;
        b.vy *= slowed / speed;
      }
      b.x += b.vx * t;
      b.y += b.vy * t;
      this.keepInside(b);
    }
    for (let i = 0; i < this.bodies.length; i++) {
      for (let j = i + 1; j < this.bodies.length; j++) this.collide(this.bodies[i] as Body, this.bodies[j] as Body);
    }
  }

  private keepInside(b: Body): void {
    const maxX = Math.max(b.r, this.width - b.r);
    const maxY = Math.max(b.r, this.height - b.r);
    if (b.x < b.r) [b.x, b.vx] = [b.r, Math.abs(b.vx) * BOUNCE];
    else if (b.x > maxX) [b.x, b.vx] = [maxX, -Math.abs(b.vx) * BOUNCE];
    if (b.y < b.r) [b.y, b.vy] = [b.r, Math.abs(b.vy) * BOUNCE];
    else if (b.y > maxY) [b.y, b.vy] = [maxY, -Math.abs(b.vy) * BOUNCE];
  }

  /** Two bubbles of equal weight: pushed apart, and their speeds along the line between them swap. */
  private collide(a: Body, b: Body): void {
    let dx = b.x - a.x;
    let dy = b.y - a.y;
    let dist = Math.hypot(dx, dy);
    const overlap = a.r + b.r - dist;
    if (overlap <= 0) return;
    if (dist === 0) [dx, dy, dist] = [1, 0, 1];
    const nx = dx / dist;
    const ny = dy / dist;
    // A held bubble does not give way; the other one takes the whole push.
    const shareA = a.held ? 0 : b.held ? 1 : 0.5;
    a.x -= nx * overlap * shareA;
    a.y -= ny * overlap * shareA;
    b.x += nx * overlap * (1 - shareA);
    b.y += ny * overlap * (1 - shareA);
    const closing = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
    if (closing > 0) {
      const impulse = closing * (1 + BOUNCE) * 0.5;
      if (a.held) {
        b.vx += nx * impulse * 2;
        b.vy += ny * impulse * 2;
      } else if (b.held) {
        a.vx -= nx * impulse * 2;
        a.vy -= ny * impulse * 2;
      } else {
        a.vx -= nx * impulse;
        a.vy -= ny * impulse;
        b.vx += nx * impulse;
        b.vy += ny * impulse;
      }
    }
    if (!a.held) this.keepInside(a);
    if (!b.held) this.keepInside(b);
  }
}
