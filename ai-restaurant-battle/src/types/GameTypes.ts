export interface GameState {
  currentDay: number;
  timeRemaining: number;
  restaurants: Restaurant[];
  marketEvents: MarketEvent[];
  weatherCondition: 'sunny' | 'rainy' | 'cloudy';
  globalMarketTrends: MarketTrend[];
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
  
  // Resources
  staff: Staff[];
  menu: MenuItem[];
  equipment: Equipment[];
  
  // AI specific
  aiStrategy?: AIStrategy;
  strategyType?: 'aggressive' | 'strategic' | 'emotional' | 'speed' | 'balanced';
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
  type: 'chef' | 'waiter' | 'delivery';
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

export interface MarketEvent {
  id: string;
  name: string;
  description: string;
  effect: {
    customerMultiplier?: number;
    costMultiplier?: number;
    satisfactionBonus?: number;
  };
  duration: number;
  probability: number;
}

export interface MarketTrend {
  id: string;
  name: string;
  affectedItems: string[];
  popularityModifier: number;
  duration: number;
}

export interface PlayerAction {
  type: 'menu' | 'marketing' | 'operations';
  action: string;
  parameters: any;
  timestamp: number;
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
  aiEfficiency: {
    easy: number;
    normal: number;
    hard: number;
  };
  events: MarketEvent[];
}

export interface AIStrategy {
  executeStrategy(gameState: GameState, restaurant: Restaurant): PlayerAction[];
}