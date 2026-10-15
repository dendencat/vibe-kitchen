import type { MarketEvent, MarketEventEffect, Weather } from '../types/GameTypes';
import { GAME_CONFIG, GAME_CONSTANTS } from '../utils/Constants';
import { MathUtils, type Rng } from '../utils/MathUtils';

/**
 * Rolls random market events and aggregates the effects of active ones.
 * Durations are counted in simulated time, so pausing freezes them.
 */
export class MarketEventManager {
  constructor(
    private readonly rng: Rng = Math.random,
    private readonly catalog: MarketEvent[] = GAME_CONFIG.events,
    private readonly chance: number = GAME_CONFIG.eventChance
  ) {}

  /**
   * Possibly starts a new event that is not already active.
   * @param active - Currently active events.
   * @returns A fresh event copy, or null.
   */
  roll(active: MarketEvent[]): MarketEvent | null {
    if (this.rng() >= this.chance) return null;
    const activeIds = new Set(active.map(e => e.id));
    const available = this.catalog.filter(event => !activeIds.has(event.id));
    if (available.length === 0) return null;
    const picked = MathUtils.weighted_random(
      available,
      available.map(e => e.probability),
      this.rng
    );
    return { ...picked, effect: { ...picked.effect } };
  }

  /**
   * Advances event timers by one simulated second.
   * @param active - Events to age (mutated).
   */
  age(active: MarketEvent[]): void {
    active.forEach(event => {
      event.duration -= 1 / GAME_CONSTANTS.SECONDS_PER_DAY;
    });
  }

  /**
   * Product of a multiplier across active events relevant to a restaurant.
   * @param active - Active events.
   * @param key - Effect to combine.
   * @param isPlayer - Whether player-scoped events apply.
   */
  static multiplier(
    active: MarketEvent[],
    key: 'customerMultiplier' | 'costMultiplier',
    isPlayer = false
  ): number {
    return MarketEventManager.relevant(active, isPlayer).reduce(
      (product, event) => product * (event.effect[key] ?? 1),
      1
    );
  }

  /**
   * Sum of satisfaction bonuses across relevant events.
   * @param active - Active events.
   * @param isPlayer - Whether player-scoped events apply.
   */
  static satisfaction_bonus(active: MarketEvent[], isPlayer: boolean): number {
    return MarketEventManager.relevant(active, isPlayer).reduce(
      (sum, event) => sum + (event.effect.satisfactionBonus ?? 0),
      0
    );
  }

  /**
   * Creates an ad-hoc event (e.g. weather or competitor driven).
   * @param effect - Effect payload.
   * @param duration - Duration in days.
   */
  create_custom_event(
    name: string,
    description: string,
    effect: MarketEventEffect,
    duration: number
  ): MarketEvent {
    return {
      id: `custom-${name.toLowerCase().replace(/\s+/g, '-')}`,
      name,
      description,
      effect,
      duration,
      probability: 1,
      scope: 'market',
    };
  }

  /**
   * Random weather for a new day.
   */
  roll_weather(): Weather {
    return MathUtils.weighted_random<Weather>(['sunny', 'cloudy', 'rainy'], [5, 3, 2], this.rng);
  }

  private static relevant(active: MarketEvent[], isPlayer: boolean): MarketEvent[] {
    return active.filter(event => event.scope === 'market' || isPlayer);
  }
}
