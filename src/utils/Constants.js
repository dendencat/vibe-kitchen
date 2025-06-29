export const GAME_CONFIG = {
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
  baseCustomerArrival: 15,
  satisfactionDecayRate: 0.05,
  eventChance: 0.1, // 10% chance per update for market events
  
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
      duration: 0.5, // Half day
      probability: 0.2
    },
    {
      id: 'local-festival',
      name: "Local Festival",
      description: "A nearby festival brings more customers",
      effect: { customerMultiplier: 1.5 },
      duration: 1, // 1 day
      probability: 0.1
    },
    {
      id: 'tv-feature',
      name: "TV Food Show Feature",
      description: "Your restaurant was featured on TV!",
      effect: { satisfactionBonus: 0.3 },
      duration: 2, // 2 days
      probability: 0.05
    },
    {
      id: 'price-spike',
      name: "Ingredient Price Spike",
      description: "Supply chain issues increase costs",
      effect: { costMultiplier: 1.3 },
      duration: 1, // 1 day
      probability: 0.15
    },
    {
      id: 'food-critic',
      name: "Food Critic Visit",
      description: "A famous food critic is visiting restaurants",
      effect: { satisfactionBonus: 0.2, customerMultiplier: 1.3 },
      duration: 0.5, // Half day
      probability: 0.08
    }
  ]
};

export const GAME_CONSTANTS = {
  GAME_DURATION_SECONDS: 420, // 7 minutes
  SECONDS_PER_DAY: 60, // 1 minute per day
  DAYS_PER_GAME: 7,
  UPDATE_INTERVAL_MS: 1000, // Update every second
  RENDER_FPS: 60,
  MAX_MENU_ITEMS: 10,
  MAX_STAFF_PER_TYPE: 5,
  MIN_SATISFACTION: 0,
  MAX_SATISFACTION: 100,
  AUTOSAVE_INTERVAL_MS: 30000 // 30 seconds
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
    localizedKey: "startingMenuItems.burger",
    price: 12.99,
    cost: 4.50,
    cookTime: 15,
    popularity: 75
  },
  {
    name: "Caesar Salad",
    localizedKey: "startingMenuItems.salad", 
    price: 8.99,
    cost: 2.50,
    cookTime: 5,
    popularity: 60
  },
  {
    name: "Grilled Chicken",
    localizedKey: "startingMenuItems.chicken",
    price: 15.99,
    cost: 6.00,
    cookTime: 20,
    popularity: 80
  }
];

export const STAFF_TYPES = {
  chef: {
    baseSalary: 3000,
    efficiencyBoost: 1.2,
    description: "Improves cooking speed and food quality"
  },
  waiter: {
    baseSalary: 2000,
    efficiencyBoost: 1.1,
    description: "Improves customer service and satisfaction"
  },
  manager: {
    baseSalary: 4000,
    efficiencyBoost: 1.15,
    description: "Improves overall restaurant efficiency"
  }
};

export const EQUIPMENT_TYPES = {
  kitchen: {
    baseCost: 5000,
    efficiencyBoost: 1.3,
    description: "Basic kitchen equipment upgrade"
  },
  oven: {
    baseCost: 8000,
    efficiencyBoost: 1.4,
    description: "Professional-grade oven for faster cooking"
  },
  grill: {
    baseCost: 6000,
    efficiencyBoost: 1.35,
    description: "High-quality grill for better meat dishes"
  },
  fryer: {
    baseCost: 4000,
    efficiencyBoost: 1.25,
    description: "Commercial fryer for crispy foods"
  },
  dishwasher: {
    baseCost: 3000,
    efficiencyBoost: 1.2,
    description: "Automated dishwashing system"
  }
};