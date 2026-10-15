import { AIController } from '../ai/AIController';
import type {
  ActionResult,
  Awards,
  CampaignType,
  Difficulty,
  FinalResult,
  GameEvent,
  GameState,
  PlayerAction,
  Restaurant,
} from '../types/GameTypes';
import {
  CAMPAIGNS,
  GAME_CONFIG,
  GAME_CONSTANTS,
  STAFF_SPECS,
  upgrade_cost,
} from '../utils/Constants';
import { MathUtils, type Rng } from '../utils/MathUtils';
import { SecurityValidator } from '../utils/SecurityValidator';
import { create_menu_item, create_staff, GameStateManager } from './GameState';
import { MarketEventManager } from './MarketEvents';
import {
  attractiveness,
  average_food_cost,
  average_order_value,
  buzz_gain,
  calculate_final_score,
  daily_fixed_costs,
  demand_curve,
  distribute_demand,
  kitchen_level,
  market_average_price,
  rating_for_cook_time,
  restaurant_capacity,
  target_popularity,
  target_satisfaction,
  weather_multiplier,
} from './Simulation';

export interface GameEngineOptions {
  playerName?: string;
  difficulty?: Difficulty;
  rng?: Rng;
  dishName?: (key: string, fallback: string) => string;
}

export interface GameSnapshot {
  version: 2;
  state: GameState;
}

type Listener = (event: GameEvent) => void;

const SNAPSHOT_VERSION = 2;

/**
 * View-agnostic game engine. Advances the simulation in fixed one-second
 * ticks and reports what happened through events; rendering lives in the UI.
 */
export class GameEngine {
  private readonly stateManager: GameStateManager;
  private readonly marketEvents: MarketEventManager;
  private readonly aiControllers: AIController[];
  private readonly listeners = new Set<Listener>();
  private readonly rng: Rng;
  private accumulatedMs = 0;
  private paused = false;
  private over = false;

  constructor(options: GameEngineOptions = {}) {
    this.rng = options.rng ?? Math.random;
    this.stateManager = new GameStateManager({
      playerName: options.playerName,
      difficulty: options.difficulty,
      dishName: options.dishName,
    });
    this.marketEvents = new MarketEventManager(this.rng);
    this.aiControllers = this.stateManager
      .get_state()
      .restaurants.filter(r => r.type === 'ai')
      .map(
        (restaurant, index) =>
          new AIController(restaurant.id, restaurant.strategyType as string, 2 + index, this.rng)
      );
  }

  /**
   * Restores an engine from a snapshot produced by {@link snapshot}.
   * @returns The engine, or null when the snapshot is invalid.
   */
  static restore(snapshot: unknown, options: GameEngineOptions = {}): GameEngine | null {
    if (!GameEngine.is_snapshot(snapshot)) return null;
    const engine = new GameEngine({ ...options, difficulty: snapshot.state.difficulty });
    engine.stateManager.set_state(structuredClone(snapshot.state));
    return engine;
  }

  /** Validates the rough shape of a saved snapshot. */
  static is_snapshot(value: unknown): value is GameSnapshot {
    if (!value || typeof value !== 'object') return false;
    const { version, state } = value as Partial<GameSnapshot>;
    return (
      version === SNAPSHOT_VERSION &&
      !!state &&
      Array.isArray(state.restaurants) &&
      state.restaurants.length === 6 &&
      typeof state.currentDay === 'number' &&
      state.currentDay >= 1 &&
      state.currentDay <= GAME_CONSTANTS.DAYS_PER_GAME
    );
  }

  /** Serializable copy of the current state. */
  snapshot(): GameSnapshot {
    return { version: SNAPSHOT_VERSION, state: structuredClone(this.stateManager.get_state()) };
  }

  /**
   * Subscribes to engine events.
   * @returns Unsubscribe function.
   */
  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Live game state (treat as read-only outside the engine). */
  get_state(): GameState {
    return this.stateManager.get_state();
  }

  /** The player's restaurant. */
  get_player(): Restaurant {
    return this.stateManager.get_player();
  }

  /** Fraction of the current day elapsed (0..1). */
  get_day_progress(): number {
    const state = this.get_state();
    const fromTicks = 1 - state.timeRemaining / GAME_CONSTANTS.SECONDS_PER_DAY;
    const fromAccumulator = this.accumulatedMs / GAME_CONSTANTS.UPDATE_INTERVAL_MS / 60;
    return MathUtils.clamp(fromTicks + fromAccumulator, 0, 1);
  }

  /**
   * Feeds wall-clock time; runs as many one-second ticks as are due.
   * Large gaps (background tab) are capped to one tick.
   * @param deltaMs - Milliseconds since the previous frame.
   * @returns Number of ticks executed.
   */
  update(deltaMs: number): number {
    if (this.paused || this.over) return 0;
    this.accumulatedMs += MathUtils.clamp(deltaMs, 0, GAME_CONSTANTS.UPDATE_INTERVAL_MS);
    let ticks = 0;
    while (this.accumulatedMs >= GAME_CONSTANTS.UPDATE_INTERVAL_MS && !this.over) {
      this.accumulatedMs -= GAME_CONSTANTS.UPDATE_INTERVAL_MS;
      this.tick();
      ticks += 1;
    }
    return ticks;
  }

  /** Advances the simulation by exactly one second. */
  tick(): void {
    if (this.over) return;
    const state = this.get_state();
    state.elapsedSeconds += 1;
    state.timeRemaining -= 1;

    this.process_ai_actions();
    this.simulate_market();
    this.process_market_events();
    this.stateManager.calculate_market_shares();

    if (state.timeRemaining <= 0) {
      this.end_day();
    }
    this.emit({ type: 'tick', state: this.get_state() });
  }

  /** Pauses the simulation. */
  pause(): void {
    this.paused = true;
  }

  /** Resumes the simulation. */
  resume(): void {
    this.paused = false;
  }

  /** Whether the simulation is paused. */
  is_paused(): boolean {
    return this.paused;
  }

  /** Whether day 7 has finished. */
  is_over(): boolean {
    return this.over;
  }

  /**
   * Validates and applies an action for a restaurant.
   * @param restaurantId - Acting restaurant.
   * @param action - Requested action.
   * @returns Result with a localization key in `reason` on failure.
   */
  execute_action(restaurantId: string, action: PlayerAction): ActionResult {
    const restaurant = this.stateManager.get_restaurant(restaurantId);
    let result: ActionResult;
    if (!restaurant || this.over) {
      result = { ok: false, reason: 'errors.notFound' };
    } else {
      try {
        result = this.apply_action(restaurant, action);
      } catch {
        result = { ok: false, reason: 'errors.invalid' };
      }
    }
    this.emit({ type: 'action', restaurantId, action, result });
    return result;
  }

  /** Ranked final results (highest score first). */
  get_final_results(): FinalResult[] {
    return this.get_state()
      .restaurants.map(restaurant => ({
        id: restaurant.id,
        name: restaurant.name,
        type: restaurant.type,
        strategyType: restaurant.strategyType,
        score: calculate_final_score(restaurant),
        marketShare: restaurant.marketShare,
        revenue: restaurant.revenue,
        satisfaction: restaurant.satisfaction,
        efficiency: restaurant.revenue / Math.max(1, restaurant.expenses),
        menuChanges: restaurant.menuChanges,
      }))
      .sort((a, b) => b.score - a.score);
  }

  /** Winners of the secondary categories (restaurant ids). */
  get_awards(results: FinalResult[] = this.get_final_results()): Awards {
    const best = (metric: (r: FinalResult) => number): string =>
      results.reduce((top, r) => (metric(r) > metric(top) ? r : top)).id;
    return {
      revenue: best(r => r.revenue),
      satisfaction: best(r => r.satisfaction),
      efficiency: best(r => r.efficiency),
      innovation: best(r => r.menuChanges),
    };
  }

  private apply_action(restaurant: Restaurant, action: PlayerAction): ActionResult {
    switch (action.type) {
      case 'menu':
        return this.apply_menu_action(restaurant, action);
      case 'marketing':
        return this.launch_campaign(
          restaurant,
          action.parameters.campaignType,
          action.parameters.budget
        );
      default:
        return action.action === 'hire_staff'
          ? this.hire_staff(restaurant, action.parameters.staffType)
          : this.upgrade_kitchen(restaurant);
    }
  }

  private apply_menu_action(
    restaurant: Restaurant,
    action: Extract<PlayerAction, { type: 'menu' }>
  ): ActionResult {
    if (action.action === 'add_item') {
      if (restaurant.menu.length >= GAME_CONSTANTS.MAX_MENU_ITEMS) {
        return { ok: false, reason: 'errors.menuFull' };
      }
      const draft = SecurityValidator.validate_menu_item_input(action.parameters);
      restaurant.menu.push(create_menu_item(draft, rating_for_cook_time(draft.cookTime)));
      restaurant.menuChanges += 1;
      return { ok: true };
    }

    const index = restaurant.menu.findIndex(item => item.id === action.parameters.itemId);
    if (index === -1) return { ok: false, reason: 'errors.notFound' };

    if (action.action === 'remove_item') {
      if (restaurant.menu.length <= GAME_CONSTANTS.MIN_MENU_ITEMS) {
        return { ok: false, reason: 'errors.minMenu' };
      }
      restaurant.menu.splice(index, 1);
      restaurant.menuChanges += 1;
      return { ok: true };
    }

    const item = restaurant.menu[index];
    item.price = MathUtils.round_money(
      SecurityValidator.validate_number(
        action.parameters.price,
        GAME_CONSTANTS.MIN_PRICE,
        GAME_CONSTANTS.MAX_PRICE
      )
    );
    item.profitMargin = MathUtils.calculate_profit_margin(item.price, item.cost);
    return { ok: true };
  }

  private launch_campaign(restaurant: Restaurant, type: string, budget: number): ActionResult {
    const preset = CAMPAIGNS[type as CampaignType];
    const cost = SecurityValidator.validate_number(preset ? preset.budget : budget, 0, 1e7);
    if (cost > restaurant.cash) return { ok: false, reason: 'errors.notEnoughCash' };
    restaurant.cash -= cost;
    restaurant.expenses += cost;
    restaurant.dailyProfit -= cost;
    restaurant.buzz = Math.min(GAME_CONSTANTS.MAX_BUZZ, restaurant.buzz + buzz_gain(cost));
    restaurant.satisfaction = Math.min(
      GAME_CONSTANTS.MAX_SATISFACTION,
      restaurant.satisfaction + (type === 'tv' ? 3 : cost / 4000)
    );
    return { ok: true };
  }

  private hire_staff(restaurant: Restaurant, staffType: 'chef' | 'waiter'): ActionResult {
    const spec = STAFF_SPECS[staffType];
    if (!spec) return { ok: false, reason: 'errors.invalid' };
    const current = restaurant.staff.filter(s => s.type === staffType).length;
    if (current >= GAME_CONSTANTS.MAX_STAFF_PER_TYPE)
      return { ok: false, reason: 'errors.staffLimit' };
    if (spec.hireCost > restaurant.cash) return { ok: false, reason: 'errors.notEnoughCash' };
    restaurant.cash -= spec.hireCost;
    restaurant.expenses += spec.hireCost;
    restaurant.dailyProfit -= spec.hireCost;
    restaurant.staff.push(create_staff(staffType));
    return { ok: true };
  }

  private upgrade_kitchen(restaurant: Restaurant): ActionResult {
    const kitchen = restaurant.equipment.find(e => e.type === 'kitchen');
    if (!kitchen) return { ok: false, reason: 'errors.notFound' };
    if (kitchen.level >= GAME_CONSTANTS.MAX_EQUIPMENT_LEVEL)
      return { ok: false, reason: 'errors.maxLevel' };
    const cost = upgrade_cost(kitchen.level);
    if (cost > restaurant.cash) return { ok: false, reason: 'errors.notEnoughCash' };
    restaurant.cash -= cost;
    restaurant.expenses += cost;
    restaurant.dailyProfit -= cost;
    kitchen.level += 1;
    kitchen.efficiencyBoost = 1 + 0.15 * (kitchen.level - 1);
    kitchen.maintenanceCost = 100 * kitchen.level;
    restaurant.efficiency = kitchen.efficiencyBoost;
    return { ok: true };
  }

  private process_ai_actions(): void {
    const state = this.get_state();
    this.aiControllers.forEach(controller => {
      controller
        .make_decisions(state)
        .forEach(action => this.execute_action(controller.get_restaurant_id(), action));
    });
  }

  private simulate_market(): void {
    const state = this.get_state();
    const { restaurants, marketEvents } = state;
    const marketAvg = market_average_price(restaurants);
    const progress = 1 - state.timeRemaining / GAME_CONSTANTS.SECONDS_PER_DAY;
    const skill = GAME_CONFIG.aiEfficiency[state.difficulty];

    const weights = restaurants.map(
      r =>
        attractiveness(r, marketAvg, r.type === 'ai' ? skill : 1) *
        MarketEventManager.multiplier(marketEvents, 'customerMultiplier', r.type === 'player')
    );
    const totalDemand =
      GAME_CONSTANTS.BASE_DEMAND_PER_SECOND *
      restaurants.length *
      demand_curve(progress) *
      weather_multiplier(state.weatherCondition) *
      MarketEventManager.multiplier(marketEvents, 'customerMultiplier');
    const arrivals = distribute_demand(totalDemand, weights);

    restaurants.forEach((restaurant, index) => {
      const isPlayer = restaurant.type === 'player';
      const capacity = restaurant_capacity(restaurant);
      const served = Math.min(arrivals[index], capacity);
      const lost = arrivals[index] - served;
      const plates = served * GAME_CONSTANTS.ITEMS_PER_GUEST;
      const revenue = plates * average_order_value(restaurant.menu);
      const foodCost =
        plates *
        average_food_cost(restaurant.menu) *
        MarketEventManager.multiplier(marketEvents, 'costMultiplier', isPlayer);
      const fixed =
        daily_fixed_costs(restaurant, GAME_CONFIG.rentCost, GAME_CONFIG.utilityCost) /
        GAME_CONSTANTS.SECONDS_PER_DAY;
      const expenses = foodCost + fixed;

      restaurant.customerCount += served;
      restaurant.revenue += revenue;
      restaurant.expenses += expenses;
      restaurant.cash += revenue - expenses;
      restaurant.dailyProfit += revenue - expenses;
      restaurant.lastServed = served;
      restaurant.lastLost = lost;
      restaurant.utilization = MathUtils.clamp(arrivals[index] / capacity, 0, 2);
      restaurant.efficiency = 1 + 0.15 * (kitchen_level(restaurant) - 1);
      restaurant.buzz *= 1 - GAME_CONSTANTS.BUZZ_DECAY_PER_SECOND;

      const overload = arrivals[index] > 0 ? lost / arrivals[index] : 0;
      const target = target_satisfaction(restaurant, marketAvg, overload);
      const bonus = MarketEventManager.satisfaction_bonus(marketEvents, isPlayer);
      restaurant.satisfaction = MathUtils.clamp(
        restaurant.satisfaction +
          (target - restaurant.satisfaction) * 0.03 -
          GAME_CONFIG.satisfactionDecayRate +
          bonus,
        GAME_CONSTANTS.MIN_SATISFACTION,
        GAME_CONSTANTS.MAX_SATISFACTION
      );

      restaurant.menu.forEach(item => {
        item.popularity += (target_popularity(item, marketAvg) - item.popularity) * 0.05;
      });
    });
  }

  private process_market_events(): void {
    const state = this.get_state();
    this.marketEvents.age(state.marketEvents);
    this.stateManager.remove_expired_events();
    const event = this.marketEvents.roll(state.marketEvents);
    if (event) {
      this.stateManager.add_market_event(event);
      this.emit({ type: 'market-event', event });
    }
  }

  private end_day(): void {
    const state = this.get_state();
    if (state.currentDay >= GAME_CONSTANTS.DAYS_PER_GAME) {
      state.timeRemaining = 0;
      this.over = true;
      const results = this.get_final_results();
      this.emit({ type: 'game-over', results, awards: this.get_awards(results) });
      return;
    }
    const weather = this.marketEvents.roll_weather();
    state.restaurants.forEach(r => {
      r.dailyProfit = 0;
    });
    this.stateManager.update_state({
      currentDay: state.currentDay + 1,
      timeRemaining: GAME_CONSTANTS.SECONDS_PER_DAY,
      weatherCondition: weather,
    });
    this.emit({ type: 'day-start', day: state.currentDay + 1, weather });
  }

  private emit(event: GameEvent): void {
    this.listeners.forEach(listener => listener(event));
  }
}
