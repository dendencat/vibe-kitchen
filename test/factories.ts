import { GameStateManager } from '../src/game/GameState';
import type { GameState, MenuItem, Restaurant } from '../src/types/GameTypes';

/** Fresh default state for tests. */
export function make_state(overrides: Partial<GameState> = {}): GameState {
  return { ...new GameStateManager().get_state(), ...overrides };
}

/** A restaurant from a fresh state with overrides applied. */
export function make_restaurant(overrides: Partial<Restaurant> = {}, index = 0): Restaurant {
  return { ...make_state().restaurants[index], ...overrides };
}

/** A menu item with sensible defaults. */
export function make_item(overrides: Partial<MenuItem> = {}): MenuItem {
  return {
    id: 'item-1',
    name: 'Dish',
    price: 10,
    cost: 4,
    cookTime: 10,
    popularity: 50,
    profitMargin: 60,
    customerRating: 4,
    ...overrides,
  };
}

/** Deterministic RNG cycling through the given values. */
export function sequence_rng(...values: number[]): () => number {
  let i = 0;
  return () => values[i++ % values.length];
}

/** Seeded PRNG (mulberry32) for reproducible whole-game simulations. */
export function seeded_rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
