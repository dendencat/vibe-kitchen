import { describe, expect, it } from 'vitest';
import { sequence_rng } from '../../test/factories';
import type { MarketEvent } from '../types/GameTypes';
import { GAME_CONFIG } from '../utils/Constants';
import { MarketEventManager } from './MarketEvents';

const event = (overrides: Partial<MarketEvent>): MarketEvent => ({
  id: 'e',
  name: 'E',
  description: '',
  effect: {},
  duration: 1,
  probability: 1,
  scope: 'market',
  ...overrides,
});

describe('MarketEventManager', () => {
  it('does nothing when the roll fails', () => {
    expect(new MarketEventManager(() => 0.99).roll([])).toBeNull();
  });

  it('rolls a copy of an inactive event', () => {
    const manager = new MarketEventManager(sequence_rng(0, 0));
    const rolled = manager.roll([]);
    expect(rolled?.id).toBe(GAME_CONFIG.events[0].id);
    rolled!.effect.customerMultiplier = 9;
    expect(GAME_CONFIG.events[0].effect.customerMultiplier).toBe(0.7);
  });

  it('skips events that are already active', () => {
    const manager = new MarketEventManager(sequence_rng(0, 0));
    expect(manager.roll([GAME_CONFIG.events[0]])?.id).toBe(GAME_CONFIG.events[1].id);
    expect(manager.roll(GAME_CONFIG.events)).toBeNull();
  });

  it('ages events by one simulated second', () => {
    const events = [event({ duration: 1 })];
    new MarketEventManager().age(events);
    expect(events[0].duration).toBeCloseTo(1 - 1 / 60);
  });

  it('combines multipliers by scope', () => {
    const active = [
      event({ effect: { customerMultiplier: 0.5 } }),
      event({ effect: { customerMultiplier: 2, costMultiplier: 1.5 }, scope: 'player' }),
    ];
    expect(MarketEventManager.multiplier(active, 'customerMultiplier')).toBe(0.5);
    expect(MarketEventManager.multiplier(active, 'customerMultiplier', true)).toBe(1);
    expect(MarketEventManager.multiplier(active, 'costMultiplier', true)).toBe(1.5);
    expect(MarketEventManager.multiplier([], 'costMultiplier')).toBe(1);
  });

  it('sums satisfaction bonuses by scope', () => {
    const active = [event({ effect: { satisfactionBonus: 0.3 }, scope: 'player' }), event({})];
    expect(MarketEventManager.satisfaction_bonus(active, true)).toBe(0.3);
    expect(MarketEventManager.satisfaction_bonus(active, false)).toBe(0);
  });

  it('creates custom events', () => {
    expect(
      new MarketEventManager().create_custom_event('Price War', 'd', { costMultiplier: 0.9 }, 2)
    ).toMatchObject({
      id: 'custom-price-war',
      duration: 2,
      scope: 'market',
    });
  });

  it('rolls weather', () => {
    expect(new MarketEventManager(() => 0).roll_weather()).toBe('sunny');
    expect(new MarketEventManager(() => 0.99).roll_weather()).toBe('rainy');
  });
});
