/** Strategy archetypes used by the five AI rivals. */
export type StrategyType = 'aggressive' | 'strategic' | 'emotional' | 'speed' | 'balanced';

/** Weather that affects foot traffic for the whole market. */
export type Weather = 'sunny' | 'rainy' | 'cloudy';

/** AI difficulty presets selectable on the title screen. */
export type Difficulty = 'easy' | 'normal' | 'hard';

/** Marketing channels available to every restaurant. */
export type CampaignType = 'social' | 'radio' | 'tv';

/** Staff roles that can be hired. */
export type StaffType = 'chef' | 'waiter';

export interface GameState {
  currentDay: number;
  /** Seconds left in the current in-game day. */
  timeRemaining: number;
  /** Total simulated seconds since the game started. */
  elapsedSeconds: number;
  restaurants: Restaurant[];
  marketEvents: MarketEvent[];
  weatherCondition: Weather;
  globalMarketTrends: MarketTrend[];
  difficulty: Difficulty;
}

export interface Restaurant {
  id: string;
  name: string;
  type: 'player' | 'ai';

  // Financial metrics
  revenue: number;
  expenses: number;
  cash: number;
  dailyProfit: number;

  // Performance metrics
  customerCount: number;
  satisfaction: number;
  marketShare: number;
  efficiency: number;

  // Live operational metrics (per simulated second)
  buzz: number;
  lastServed: number;
  lastLost: number;
  utilization: number;
  menuChanges: number;

  // Resources
  staff: Staff[];
  menu: MenuItem[];
  equipment: Equipment[];

  // AI specific
  strategyType?: StrategyType;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  cost: number;
  cookTime: number;
  popularity: number;
  profitMargin: number;
  customerRating: number;
}

export interface Staff {
  id: string;
  name: string;
  type: StaffType;
  salary: number;
  efficiency: number;
  experience: number;
}

export interface Equipment {
  id: string;
  name: string;
  type: 'kitchen' | 'dining' | 'delivery';
  level: number;
  efficiencyBoost: number;
  maintenanceCost: number;
}

export interface MarketEventEffect {
  customerMultiplier?: number;
  costMultiplier?: number;
  satisfactionBonus?: number;
}

export interface MarketEvent {
  id: string;
  name: string;
  description: string;
  effect: MarketEventEffect;
  /** Remaining duration in in-game days. */
  duration: number;
  probability: number;
  /** `player` events only affect the player's restaurant. */
  scope: 'market' | 'player';
}

export interface MarketTrend {
  id: string;
  name: string;
  affectedItems: string[];
  popularityModifier: number;
  duration: number;
}

export interface MenuItemDraft {
  name: string;
  price: number;
  cost: number;
  cookTime: number;
}

export type PlayerAction =
  | { type: 'menu'; action: 'add_item'; parameters: MenuItemDraft }
  | { type: 'menu'; action: 'remove_item'; parameters: { itemId: string } }
  | { type: 'menu'; action: 'update_price'; parameters: { itemId: string; price: number } }
  | {
      type: 'marketing';
      action: 'launch_campaign';
      parameters: { campaignType: CampaignType | string; budget: number };
    }
  | { type: 'operations'; action: 'hire_staff'; parameters: { staffType: StaffType } }
  | { type: 'operations'; action: 'upgrade_equipment'; parameters: { equipmentType: 'kitchen' } };

/** Outcome of executing an action; `reason` is a localization key on failure. */
export interface ActionResult {
  ok: boolean;
  reason?: string;
}

export interface FinalResult {
  id: string;
  name: string;
  type: 'player' | 'ai';
  strategyType?: StrategyType;
  score: number;
  marketShare: number;
  revenue: number;
  satisfaction: number;
  efficiency: number;
  menuChanges: number;
}

export interface Awards {
  revenue: string;
  satisfaction: string;
  efficiency: string;
  innovation: string;
}

export interface GameConfig {
  startingCash: number;
  startingMenu: number;
  startingStaff: number;
  rentCost: number;
  utilityCost: number;
  staffCostPerDay: number;
  maxDailyCustomers: number;
  baseCustomerArrival: number;
  satisfactionDecayRate: number;
  eventChance: number;
  aiEfficiency: Record<Difficulty, number>;
  events: MarketEvent[];
}

/** Events emitted by the engine so views can react (sound, 3D effects, toasts). */
export type GameEvent =
  | { type: 'tick'; state: GameState }
  | { type: 'day-start'; day: number; weather: Weather }
  | { type: 'market-event'; event: MarketEvent }
  | { type: 'action'; restaurantId: string; action: PlayerAction; result: ActionResult }
  | { type: 'game-over'; results: FinalResult[]; awards: Awards };
