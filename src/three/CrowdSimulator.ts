import type { Rng } from '../utils/MathUtils';
import { INNER_RADIUS, SPAWN_RADIUS, type ShopSlot } from './SceneLayout';

/**
 * Lightweight agent simulation for the guests walking around the plaza.
 * Pure TypeScript; the renderer only reads positions.
 */

export type WalkerPhase = 'arrive' | 'inside' | 'leave';

export interface Walker {
  id: number;
  shop: number;
  x: number;
  z: number;
  heading: number;
  path: Array<[number, number]>;
  phase: WalkerPhase;
  /** Turned away at the door because the restaurant was full. */
  rejected: boolean;
  wait: number;
  speed: number;
  tint: number;
  bob: number;
}

export const WALKER_COLORS = [0xff8fab, 0x8ecae6, 0xffd166, 0x95d5b2, 0xcdb4db, 0xf4a261];

/** Walkers spawned per served guest (keeps the crowd readable). */
export const SPAWN_SCALE = 0.35;

export class CrowdSimulator {
  private walkers: Walker[] = [];
  private readonly accumulators: Array<{ served: number; lost: number }>;
  private nextId = 1;

  /**
   * @param slots - Shop layout.
   * @param maxWalkers - Hard cap on simultaneous walkers.
   * @param rng - Random source.
   */
  constructor(
    private readonly slots: ShopSlot[],
    private readonly maxWalkers = 140,
    private readonly rng: Rng = Math.random
  ) {
    this.accumulators = slots.map(() => ({ served: 0, lost: 0 }));
  }

  /** Active walkers (read-only use). */
  get_walkers(): readonly Walker[] {
    return this.walkers;
  }

  /**
   * Queues spawns from one simulated second of traffic.
   * @param traffic - Served and turned-away guests per shop.
   */
  add_traffic(traffic: Array<{ served: number; lost: number }>): void {
    traffic.forEach(({ served, lost }, shop) => {
      const acc = this.accumulators[shop];
      if (!acc) return;
      acc.served += served * SPAWN_SCALE;
      acc.lost += lost * SPAWN_SCALE;
      while (acc.served >= 1) {
        acc.served -= 1;
        this.spawn(shop, false);
      }
      while (acc.lost >= 1) {
        acc.lost -= 1;
        this.spawn(shop, true);
      }
    });
  }

  /**
   * Adds one walker heading to a shop.
   * @param shop - Target shop index.
   * @param rejected - Whether they will be turned away.
   * @returns The walker, or null when the cap is reached.
   */
  spawn(shop: number, rejected: boolean): Walker | null {
    if (this.walkers.length >= this.maxWalkers) return null;
    const slot = this.slots[shop];
    const gapCount = this.slots.length;
    const gap = slot.angle + (Math.PI / gapCount) * (this.rng() < 0.5 ? -1 : 1);
    const start = this.polar(gap + (this.rng() - 0.5) * 0.15, SPAWN_RADIUS);
    const inner = this.polar(
      slot.angle + (this.rng() - 0.5) * 0.5,
      INNER_RADIUS + this.rng() * 1.5
    );
    const walker: Walker = {
      id: this.nextId++,
      shop,
      x: start[0],
      z: start[1],
      heading: 0,
      path: [inner, [slot.doorX, slot.doorZ]],
      phase: 'arrive',
      rejected,
      wait: 0,
      speed: 2.4 + this.rng() * 1.4,
      tint: WALKER_COLORS[Math.floor(this.rng() * WALKER_COLORS.length) % WALKER_COLORS.length],
      bob: this.rng() * Math.PI * 2,
    };
    this.walkers.push(walker);
    return walker;
  }

  /**
   * Advances all walkers.
   * @param dt - Seconds since the last update.
   */
  update(dt: number): void {
    this.walkers = this.walkers.filter(walker => this.step(walker, dt));
  }

  /** Removes everyone (e.g. on restart). */
  clear(): void {
    this.walkers = [];
    this.accumulators.forEach(acc => {
      acc.served = 0;
      acc.lost = 0;
    });
  }

  private step(walker: Walker, dt: number): boolean {
    walker.bob += dt * walker.speed * 4;
    if (walker.phase === 'inside') {
      walker.wait -= dt;
      if (walker.wait <= 0) this.depart(walker);
      return true;
    }

    let budget = walker.speed * dt;
    while (budget > 0 && walker.path.length > 0) {
      const [tx, tz] = walker.path[0];
      const dx = tx - walker.x;
      const dz = tz - walker.z;
      const distance = Math.hypot(dx, dz);
      if (distance <= budget) {
        walker.x = tx;
        walker.z = tz;
        budget -= distance;
        walker.path.shift();
      } else {
        walker.x += (dx / distance) * budget;
        walker.z += (dz / distance) * budget;
        walker.heading = Math.atan2(dx, dz);
        budget = 0;
      }
    }

    if (walker.path.length > 0) return true;
    if (walker.phase === 'leave') return false;
    if (walker.rejected) {
      this.depart(walker);
    } else {
      walker.phase = 'inside';
      walker.wait = 1.5 + this.rng() * 2;
    }
    return true;
  }

  private depart(walker: Walker): void {
    const slot = this.slots[walker.shop];
    walker.phase = 'leave';
    const exitGap = slot.angle + (Math.PI / this.slots.length) * (this.rng() < 0.5 ? -1 : 1);
    walker.path = [
      this.polar(slot.angle + (this.rng() - 0.5) * 0.5, INNER_RADIUS + this.rng() * 1.5),
      this.polar(exitGap, SPAWN_RADIUS + 2),
    ];
  }

  private polar(angle: number, radius: number): [number, number] {
    return [Math.cos(angle) * radius, Math.sin(angle) * radius];
  }
}
