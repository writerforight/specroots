import { describe, expect, it } from 'vitest';
import { BubblePhysics } from '../src/ui/BubblePhysics';

/** A repeatable stand-in for Math.random. */
function seeded(seed = 7): () => number {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

describe('bubble physics', () => {
  it('keeps every bubble inside the field and apart from the others', () => {
    const world = new BubblePhysics(600, 400, seeded());
    for (let i = 0; i < 8; i++) world.add(40);
    for (let i = 0; i < 2000; i++) world.step(1 / 60);
    for (const b of world.bodies) {
      expect(b.x).toBeGreaterThanOrEqual(b.r - 0.01);
      expect(b.x).toBeLessThanOrEqual(600 - b.r + 0.01);
      expect(b.y).toBeGreaterThanOrEqual(b.r - 0.01);
      expect(b.y).toBeLessThanOrEqual(400 - b.r + 0.01);
    }
    world.bodies.forEach((a, i) =>
      world.bodies.slice(i + 1).forEach((b) => expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(a.r + b.r - 6)),
    );
  });

  it('never stops drifting, and never races on its own', () => {
    const world = new BubblePhysics(600, 400, seeded(3));
    const b = world.add(40);
    for (let i = 0; i < 3000; i++) world.step(1 / 60);
    const speed = Math.hypot(b.vx, b.vy);
    expect(speed).toBeGreaterThan(2);
    expect(speed).toBeLessThan(40);
  });

  it('a thrown bubble flies off and then calms down', () => {
    const world = new BubblePhysics(2000, 2000, seeded(5));
    const b = world.add(40);
    world.grab(b);
    world.moveTo(b, 500, 500, 0.016);
    world.moveTo(b, 540, 500, 0.016);
    world.moveTo(b, 580, 500, 0.016);
    world.release(b);
    expect(b.held).toBe(false);
    const thrown = Math.hypot(b.vx, b.vy);
    expect(thrown).toBeGreaterThan(500);
    const startX = b.x;
    for (let i = 0; i < 30; i++) world.step(1 / 60);
    expect(b.x).toBeGreaterThan(startX + 100);
    for (let i = 0; i < 900; i++) world.step(1 / 60);
    expect(Math.hypot(b.vx, b.vy)).toBeLessThan(40);
  });

  it('a held bubble stays where the pointer is and pushes the others away', () => {
    const world = new BubblePhysics(600, 400, seeded(9));
    const held = world.add(40);
    const other = world.add(40);
    world.grab(held);
    world.moveTo(held, other.x, other.y, 0.016);
    const at = { x: held.x, y: held.y };
    world.step(1 / 60);
    expect({ x: held.x, y: held.y }).toEqual(at);
    expect(Math.hypot(held.x - other.x, held.y - other.y)).toBeGreaterThan(40);
  });
});
