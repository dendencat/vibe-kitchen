import type { CampaignType, GameConfig, StaffType, StrategyType } from '../types/GameTypes';

/** Core balance configuration (see CLAUDE.md "Game Balance Configuration"). */
export const GAME_CONFIG: GameConfig = {
  // Starting conditions
  startingCash: 50000,
  startingMenu: 3,
  startingStaff: 2,

  // Daily costs
  rentCost: 1200,
  utilityCost: 300,
  staffCostPerDay: 1000,

  // Market parameters
  maxDailyCustomers: 200,
  baseCustomerArrival: 50,
  satisfactionDecayRate: 0.05,
  eventChance: 0.025,

  // AI difficulty scaling
  aiEfficiency: {
    easy: 0.8,
    normal: 1.0,
    hard: 1.2,
  },

  // Market events (duration in in-game days)
  events: [
    {
      id: 'rainy-day',
      name: 'Rainy Day',
      description: 'Bad weather reduces customer traffic',
      effect: { customerMultiplier: 0.7 },
      duration: 0.5,
      probability: 0.2,
      scope: 'market',
    },
    {
      id: 'local-festival',
      name: 'Local Festival',
      description: 'A nearby festival brings more customers',
      effect: { customerMultiplier: 1.5 },
      duration: 0.5,
      probability: 0.1,
      scope: 'market',
    },
    {
      id: 'tv-feature',
      name: 'TV Food Show Feature',
      description: 'Your restaurant was featured on TV!',
      effect: { satisfactionBonus: 0.3 },
      duration: 0.5,
      probability: 0.05,
      scope: 'player',
    },
    {
      id: 'price-spike',
      name: 'Ingredient Price Spike',
      description: 'Supply chain issues increase costs',
      effect: { costMultiplier: 1.3 },
      duration: 1,
      probability: 0.15,
      scope: 'market',
    },
  ],
};

export const GAME_CONSTANTS = {
  GAME_DURATION_SECONDS: 420, // 7 minutes
  SECONDS_PER_DAY: 60,
  DAYS_PER_GAME: 7,
  UPDATE_INTERVAL_MS: 1000,
  MAX_MENU_ITEMS: 10,
  MIN_MENU_ITEMS: 1,
  MAX_STAFF_PER_TYPE: 5,
  MAX_EQUIPMENT_LEVEL: 5,
  MIN_SATISFACTION: 0,
  MAX_SATISFACTION: 100,
  AUTOSAVE_INTERVAL_SECONDS: 30,
  /** Potential guests per restaurant per simulated second at a normal hour. */
  BASE_DEMAND_PER_SECOND: 4,
  /** Average party size: menu items ordered per served guest group. */
  ITEMS_PER_GUEST: 3,
  MAX_BUZZ: 2.5,
  BUZZ_DECAY_PER_SECOND: 0.015,
  PRICE_STEP: 0.5,
  MIN_PRICE: 1,
  MAX_PRICE: 1000,
};

/** Default (English) names; the UI localizes AI names by `strategyType`. */
export const AI_RESTAURANT_NAMES: Record<StrategyType, string> = {
  aggressive: 'Fire Grill',
  strategic: 'Wisdom Table',
  emotional: 'Hospitality House',
  speed: 'Lightning Kitchen',
  balanced: 'Harmony Restaurant',
};

export const STRATEGY_TYPES: StrategyType[] = [
  'aggressive',
  'strategic',
  'emotional',
  'speed',
  'balanced',
];

export interface StartingMenuItem {
  key: string;
  name: string;
  price: number;
  cost: number;
  cookTime: number;
}

export const STARTING_MENU_ITEMS: StartingMenuItem[] = [
  { key: 'burger', name: 'Classic Burger', price: 12.99, cost: 4.5, cookTime: 15 },
  { key: 'salad', name: 'Caesar Salad', price: 8.99, cost: 2.5, cookTime: 5 },
  { key: 'chicken', name: 'Grilled Chicken', price: 15.99, cost: 6.0, cookTime: 20 },
];

export interface CampaignSpec {
  budget: number;
  icon: string;
}

/** Player-facing marketing channels. Effects are derived from the budget. */
export const CAMPAIGNS: Record<CampaignType, CampaignSpec> = {
  social: { budget: 2000, icon: '📱' },
  radio: { budget: 5000, icon: '📻' },
  tv: { budget: 12000, icon: '📺' },
};

export interface StaffSpec {
  salary: number;
  hireCost: number;
  capacity: number;
  icon: string;
}

/** Staff economics: salary per in-game day, one-off hiring cost, guests/second capacity. */
export const STAFF_SPECS: Record<StaffType, StaffSpec> = {
  chef: { salary: 600, hireCost: 1500, capacity: 2, icon: '👨‍🍳' },
  waiter: { salary: 450, hireCost: 1000, capacity: 1.5, icon: '🤵' },
};

/** Base capacity (guests/second) before staff are counted. */
export const BASE_CAPACITY = 1;

/** Cost to upgrade the kitchen from `level` to `level + 1`. */
export const upgrade_cost = (level: number): number => 4000 * level;

/** Menu presets offered in the "Add dish" dialog. */
export const DISH_PRESETS: StartingMenuItem[] = [
  { key: 'ramen', name: 'Shoyu Ramen', price: 11.5, cost: 3.8, cookTime: 12 },
  { key: 'pizza', name: 'Margherita Pizza', price: 14.0, cost: 4.2, cookTime: 18 },
  { key: 'tacos', name: 'Street Tacos', price: 9.5, cost: 3.0, cookTime: 8 },
  { key: 'parfait', name: 'Sakura Parfait', price: 7.5, cost: 2.0, cookTime: 4 },
];
