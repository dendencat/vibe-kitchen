import type {
  Difficulty,
  Equipment,
  GameState,
  MarketEvent,
  MenuItem,
  Restaurant,
  Staff,
  StaffType,
  StrategyType,
} from '../types/GameTypes';
import {
  AI_RESTAURANT_NAMES,
  GAME_CONFIG,
  GAME_CONSTANTS,
  STAFF_SPECS,
  STARTING_MENU_ITEMS,
  STRATEGY_TYPES,
} from '../utils/Constants';
import { MathUtils } from '../utils/MathUtils';

export interface GameStateOptions {
  playerName?: string;
  difficulty?: Difficulty;
  /** Resolves a localized dish name from a menu key. */
  dishName?: (key: string, fallback: string) => string;
}

let idCounter = 0;

/**
 * Creates a reasonably unique id with the given prefix.
 * @param prefix - Id prefix, e.g. `menu`.
 */
export function create_id(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${idCounter}`;
}

/**
 * Builds a staff member with the default economics for its role.
 * @param type - Staff role.
 */
export function create_staff(type: StaffType): Staff {
  const { salary } = STAFF_SPECS[type];
  return {
    id: create_id('staff'),
    name: type === 'chef' ? 'Chef' : 'Waiter',
    type,
    salary,
    efficiency: 1,
    experience: 30,
  };
}

/**
 * Builds a menu item and derives its margin.
 * @param draft - Name, price, cost and cook time.
 * @param rating - Customer rating (1-5).
 */
export function create_menu_item(
  draft: { name: string; price: number; cost: number; cookTime: number },
  rating = 4
): MenuItem {
  const { name, price, cost, cookTime } = draft;
  return {
    id: create_id('menu'),
    name,
    price: MathUtils.round_money(price),
    cost,
    cookTime,
    popularity: 60,
    profitMargin: MathUtils.calculate_profit_margin(price, cost),
    customerRating: rating,
  };
}

/**
 * Owns the mutable game state and the helpers that create it.
 */
export class GameStateManager {
  private state: GameState;

  constructor(private readonly options: GameStateOptions = {}) {
    this.state = this.initialize_game_state();
  }

  /** Creates a fresh day-1 state with the player and five AI rivals. */
  initialize_game_state(): GameState {
    return {
      currentDay: 1,
      timeRemaining: GAME_CONSTANTS.SECONDS_PER_DAY,
      elapsedSeconds: 0,
      restaurants: [this.create_player_restaurant(), ...this.create_ai_restaurants()],
      marketEvents: [],
      weatherCondition: 'sunny',
      globalMarketTrends: [],
      difficulty: this.options.difficulty ?? 'normal',
    };
  }

  /** The player's restaurant with starting resources. */
  create_player_restaurant(): Restaurant {
    return this.create_restaurant('player', this.options.playerName ?? 'Your Restaurant', 'player');
  }

  /** One restaurant per AI strategy archetype. */
  create_ai_restaurants(): Restaurant[] {
    return STRATEGY_TYPES.map(type => ({
      ...this.create_restaurant(`ai-${type}`, AI_RESTAURANT_NAMES[type], 'ai'),
      strategyType: type as StrategyType,
    }));
  }

  /** Starting crew: one chef and one waiter. */
  create_starting_staff(): Staff[] {
    return [create_staff('chef'), create_staff('waiter')];
  }

  /** Starting menu, localized through `options.dishName` when provided. */
  create_starting_menu(): MenuItem[] {
    const resolve = this.options.dishName ?? ((_key: string, fallback: string) => fallback);
    return STARTING_MENU_ITEMS.map(item =>
      create_menu_item({ ...item, name: resolve(item.key, item.name) })
    );
  }

  /** A level-1 kitchen. */
  create_starting_equipment(): Equipment[] {
    return [
      {
        id: create_id('equip'),
        name: 'Kitchen',
        type: 'kitchen',
        level: 1,
        efficiencyBoost: 1,
        maintenanceCost: 100,
      },
    ];
  }

  /** Current state (live reference). */
  get_state(): GameState {
    return this.state;
  }

  /** Replaces the whole state, e.g. when loading a save. */
  set_state(state: GameState): void {
    this.state = state;
  }

  /** Shallow-merges top-level fields. */
  update_state(updates: Partial<GameState>): void {
    this.state = { ...this.state, ...updates };
  }

  /** Looks a restaurant up by id. */
  get_restaurant(id: string): Restaurant | undefined {
    return this.state.restaurants.find(r => r.id === id);
  }

  /** The player's restaurant. */
  get_player(): Restaurant {
    return this.state.restaurants.find(r => r.type === 'player') as Restaurant;
  }

  /** Merges fields into a restaurant in place (keeps object identity). */
  update_restaurant(id: string, updates: Partial<Restaurant>): void {
    const restaurant = this.get_restaurant(id);
    if (restaurant) {
      Object.assign(restaurant, updates);
    }
  }

  /** Adds an active market event. */
  add_market_event(event: MarketEvent): void {
    this.state.marketEvents.push(event);
  }

  /** Drops events whose duration has run out. */
  remove_expired_events(): void {
    this.state.marketEvents = this.state.marketEvents.filter(e => e.duration > 1e-9);
  }

  /** Recomputes market share from cumulative customers. */
  calculate_market_shares(): void {
    const shares = MathUtils.calculate_market_share(this.state.restaurants);
    this.state.restaurants.forEach((restaurant, index) => {
      restaurant.marketShare = shares[index];
    });
  }

  private create_restaurant(id: string, name: string, type: 'player' | 'ai'): Restaurant {
    return {
      id,
      name,
      type,
      revenue: 0,
      expenses: 0,
      cash: GAME_CONFIG.startingCash,
      dailyProfit: 0,
      customerCount: 0,
      satisfaction: 75,
      marketShare: 100 / 6,
      efficiency: 1,
      buzz: 0,
      lastServed: 0,
      lastLost: 0,
      utilization: 0,
      menuChanges: 0,
      staff: this.create_starting_staff(),
      menu: this.create_starting_menu(),
      equipment: this.create_starting_equipment(),
    };
  }
}
