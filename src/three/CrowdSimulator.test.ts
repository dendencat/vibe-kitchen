import { describe, expect, it } from 'vitest';
import { sequence_rng } from '../../test/factories';
import { CrowdSimulator, SPAWN_SCALE } from './CrowdSimulator';
import { shop_slots } from './SceneLayout';

const slots = shop_slots(6);

describe('CrowdSimulator', () => {
  it('spawns walkers proportional to traffic, carrying fractions', () => {
    const crowd = new CrowdSimulator(slots, 100, () => 0.5);
    const traffic = slots.map(() => ({ served: 0, lost: 0 }));
    traffic[0] = { served: 2 / SPAWN_SCALE, lost: 1 / SPAWN_SCALE };
    crowd.add_traffic(traffic);
    const walkers = crowd.get_walkers();
    expect(walkers).toHaveLength(3);
    expect(walkers.filter(w => w.rejected)).toHaveLength(1);
    crowd.add_traffic([{ served: 1, lost: 0 }]);
    expect(crowd.get_walkers()).toHaveLength(3);
    crowd.add_traffic([{ served: 2, lost: 0 }]);
    expect(crowd.get_walkers()).toHaveLength(4);
  });

  it('ignores traffic for unknown shops and respects the cap', () => {
    const crowd = new CrowdSimulator(slots, 2, () => 0.5);
    crowd.add_traffic([...slots.map(() => ({ served: 0, lost: 0 })), { served: 100, lost: 0 }]);
    expect(crowd.get_walkers()).toHaveLength(0);
    expect(crowd.spawn(0, false)).not.toBeNull();
    expect(crowd.spawn(1, true)).not.toBeNull();
    expect(crowd.spawn(2, false)).toBeNull();
  });

  it('walks guests in, keeps them inside for a while, then out and away', () => {
    const crowd = new CrowdSimulator(slots, 10, sequence_rng(0.2, 0.7, 0.4));
    const walker = crowd.spawn(0, false)!;
    expect(walker.phase).toBe('arrive');
    for (let i = 0; i < 200 && walker.phase === 'arrive'; i++) crowd.update(0.1);
    expect(walker.phase).toBe('inside');
    expect(walker.x).toBeCloseTo(slots[0].doorX);
    for (let i = 0; i < 100 && walker.phase === 'inside'; i++) crowd.update(0.1);
    expect(walker.phase).toBe('leave');
    for (let i = 0; i < 400 && crowd.get_walkers().length > 0; i++) crowd.update(0.1);
    expect(crowd.get_walkers()).toHaveLength(0);
  });

  it('turns rejected guests around at the door', () => {
    const crowd = new CrowdSimulator(slots, 10, () => 0.6);
    const walker = crowd.spawn(3, true)!;
    for (let i = 0; i < 200 && walker.phase === 'arrive'; i++) crowd.update(0.1);
    expect(walker.phase).toBe('leave');
  });

  it('clears everyone', () => {
    const crowd = new CrowdSimulator(slots);
    crowd.spawn(0, false);
    crowd.add_traffic([{ served: 1, lost: 1 }]);
    crowd.clear();
    expect(crowd.get_walkers()).toHaveLength(0);
    crowd.add_traffic([{ served: 2, lost: 0 }]);
    expect(crowd.get_walkers()).toHaveLength(0);
  });
});
