import { describe, expect, it } from 'vitest';
import {
  AI_RESTAURANT_NAMES,
  CAMPAIGNS,
  DISH_PRESETS,
  GAME_CONFIG,
  GAME_CONSTANTS,
  STAFF_SPECS,
  STARTING_MENU_ITEMS,
  STRATEGY_TYPES,
  upgrade_cost,
} from './Constants';

describe('Constants', () => {
  it('keeps the 7 × 60 second game length', () => {
    expect(GAME_CONSTANTS.DAYS_PER_GAME * GAME_CONSTANTS.SECONDS_PER_DAY).toBe(
      GAME_CONSTANTS.GAME_DURATION_SECONDS
    );
  });

  it('matches the specified starting conditions', () => {
    expect(GAME_CONFIG.startingCash).toBe(50000);
    expect(GAME_CONFIG.startingMenu).toBe(STARTING_MENU_ITEMS.length);
    expect(GAME_CONFIG.aiEfficiency).toEqual({ easy: 0.8, normal: 1, hard: 1.2 });
  });

  it('defines valid market events', () => {
    expect(GAME_CONFIG.events.map(e => e.id)).toEqual([
      'rainy-day',
      'local-festival',
      'tv-feature',
      'price-spike',
    ]);
    GAME_CONFIG.events.forEach(event => {
      expect(event.probability).toBeGreaterThan(0);
      expect(event.duration).toBeGreaterThan(0);
    });
  });

  it('names one rival per strategy', () => {
    expect(Object.keys(AI_RESTAURANT_NAMES).sort()).toEqual([...STRATEGY_TYPES].sort());
  });

  it('keeps profitable menu presets', () => {
    [...STARTING_MENU_ITEMS, ...DISH_PRESETS].forEach(item =>
      expect(item.cost).toBeLessThan(item.price)
    );
  });

  it('prices campaigns, staff and upgrades sensibly', () => {
    expect(CAMPAIGNS.social.budget).toBeLessThan(CAMPAIGNS.radio.budget);
    expect(CAMPAIGNS.radio.budget).toBeLessThan(CAMPAIGNS.tv.budget);
    expect(STAFF_SPECS.chef.capacity).toBeGreaterThan(STAFF_SPECS.waiter.capacity);
    expect(upgrade_cost(1)).toBe(4000);
    expect(upgrade_cost(3)).toBe(12000);
  });
});
