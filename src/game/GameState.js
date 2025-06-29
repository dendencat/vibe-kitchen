import { GAME_CONFIG, STARTING_MENU_ITEMS, AI_RESTAURANT_NAMES } from '../utils/Constants.js';
import { MathUtils } from '../utils/MathUtils.js';
import { localization } from '../localization/Localization.js';

export class GameStateManager {
  state;
  constructor() {
    this.state = this.initialize_game_state();
  }
  
  initialize_game_state(){
    const restaurants = [
      this.create_player_restaurant(),
      ...this.create_ai_restaurants()
    ];
    
    return {
      currentDay: 1,
      timeRemaining: GAME_CONFIG.SECONDS_PER_DAY || 60,
      restaurants,
      marketEvents: [],
      weatherCondition: 'sunny',
      globalMarketTrends: []
    };
  }
  
  create_player_restaurant(){
    return {
      id: 'player',
      name: 'Your Restaurant',
      type: 'player',
      revenue: 0,
      expenses: 0,
      cash: GAME_CONFIG.startingCash,
      dailyProfit: 0,
      customerCount: 0,
      satisfaction: 75,
      marketShare: 16.67, // Equal share among 6 restaurants
      efficiency: 1.0,
      staff: this.create_starting_staff(),
      menu: this.create_starting_menu(),
      equipment: this.create_starting_equipment()
    };
  }
  
  create_ai_restaurants(){
    const types = ['aggressive', 'strategic', 'emotional', 'speed', 'balanced'];
    
    return types.map(type => ({
      id: `ai-${type}`,
      name: AI_RESTAURANT_NAMES[type],
      type: 'ai',
      revenue: 0,
      expenses: 0,
      cash: GAME_CONFIG.startingCash,
      dailyProfit: 0,
      customerCount: 0,
      satisfaction: 75,
      marketShare: 16.67,
      efficiency: 1.0,
      staff: this.create_starting_staff(),
      menu: this.create_starting_menu(),
      equipment: this.create_starting_equipment(),
      strategyType: type
    }));
  }
  
  create_starting_staff() {
    return [
      {
        id: 'staff-1',
        name: 'Head Chef',
        type: 'chef',
        salary: 3000,
        efficiency: 1.0,
        experience: 50
      },
      {
        id: 'staff-2',
        name: 'Server',
        type: 'waiter',
        salary: 2500,
        efficiency: 1.0,
        experience: 30
      }
    ];
  }
  
  create_starting_menu(){
    return STARTING_MENU_ITEMS.map((item, index) => {
      const localizedName = item.localizedKey ? localization.getText(item.localizedKey) : item.name;
      return {
        id: `menu-${index}`,
        name: localizedName,
        price: item.price,
        cost: item.cost,
        cookTime: item.cookTime,
        popularity: item.popularity || 60,
        profitMargin: MathUtils.calculate_profit_margin(item.price, item.cost),
        customerRating: 4.0
      };
    });
  }
  
  create_starting_equipment() {
    return [
      {
        id: 'equip-1',
        name: 'Basic Kitchen',
        type: 'kitchen',
        level: 1,
        efficiencyBoost: 1.0,
        maintenanceCost: 100
      }
    ];
  }
  
  get_state(){
    return this.state;
  }
  
  update_state(updates){
    this.state = { ...this.state, ...updates };
  }
  
  get_restaurant(id) {
    return this.state.restaurants.find(r => r.id === id);
  }
  
  update_restaurant(id, updates){
    const index = this.state.restaurants.findIndex(r => r.id === id);
    if (index !== -1) {
      this.state.restaurants[index] = {
        ...this.state.restaurants[index],
        ...updates
      };
    }
  }
  
  add_market_event(event){
    this.state.marketEvents.push(event);
  }
  
  remove_expired_events(){
    this.state.marketEvents = this.state.marketEvents.filter(e => e.duration > 0);
  }
  
  calculate_market_shares(){
    const shares = MathUtils.calculate_market_share(this.state.restaurants);
    this.state.restaurants.forEach((restaurant, index) => {
      restaurant.marketShare = shares[index];
    });
  }
}