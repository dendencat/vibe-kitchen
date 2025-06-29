import { GameConfig, MarketEvent } from '../types/GameTypes';

export const GAME_CONFIG: GameConfig = {
  // Starting conditions
  startingCash: 50000,
  startingMenu: 3,
  startingStaff: 2,
  
  // Daily costs
  rentCost: 2000,
  utilityCost: 500,
  staffCostPerDay: 1000,
  
  // Market parameters
  maxDailyCustomers: 200,
  baseCustomerArrival: 50,
  satisfactionDecayRate: 0.05,
  
  // AI difficulty scaling
  aiEfficiency: {
    easy: 0.8,
    normal: 1.0,
    hard: 1.2
  },
  
  // Market events
  events: [
    {
      id: 'rainy-day',
      name: "Rainy Day",
      description: "Bad weather reduces customer traffic",
      effect: { customerMultiplier: 0.7 },
      duration: 1,
      probability: 0.2
    },
    {
      id: 'local-festival',
      name: "Local Festival",
      description: "A nearby festival brings more customers",
      effect: { customerMultiplier: 1.5 },
      duration: 1,
      probability: 0.1
    },
    {
      id: 'tv-feature',
      name: "TV Food Show Feature",
      description: "Your restaurant was featured on TV!",
      effect: { satisfactionBonus: 0.3 },
      duration: 2,
      probability: 0.05
    },
    {
      id: 'price-spike',
      name: "Ingredient Price Spike",
      description: "Supply chain issues increase costs",
      effect: { costMultiplier: 1.3 },
      duration: 2,
      probability: 0.15
    }
  ]
};

export const GAME_CONSTANTS = {
  GAME_DURATION_SECONDS: 420, // 7 minutes
  SECONDS_PER_DAY: 60,
  DAYS_PER_GAME: 7,
  UPDATE_INTERVAL_MS: 1000,
  RENDER_FPS: 60,
  MAX_MENU_ITEMS: 10,
  MAX_STAFF_PER_TYPE: 5,
  MIN_SATISFACTION: 0,
  MAX_SATISFACTION: 100,
  AUTOSAVE_INTERVAL_MS: 30000
};

export const AI_RESTAURANT_NAMES = {
  aggressive: "Fire Grill",
  strategic: "Wisdom Table",
  emotional: "Hospitality House",
  speed: "Lightning Kitchen",
  balanced: "Harmony Restaurant"
};

export const STARTING_MENU_ITEMS = [
  {
    name: "Classic Burger",
    price: 12.99,
    cost: 4.50,
    cookTime: 15
  },
  {
    name: "Caesar Salad",
    price: 8.99,
    cost: 2.50,
    cookTime: 5
  },
  {
    name: "Grilled Chicken",
    price: 15.99,
    cost: 6.00,
    cookTime: 20
  }
];