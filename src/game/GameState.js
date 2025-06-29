import { GAME_CONFIG, STARTING_MENU_ITEMS, AI_RESTAURANT_NAMES } from '../utils/Constants.js';
import { MathUtils } from '../utils/MathUtils.js';

export class GameStateManager {
  state;
  constructor() {
    this.state = this.initialize_game_state();
  }
  
  initialize_game_state(){
    const restaurants= [
      this.create_player_restaurant(),
      ...this.create_ai_restaurants()
    ];
    
    return {
      currentDay,
      timeRemaining,
      restaurants,
      marketEvents,
      weatherCondition: 'sunny',
      globalMarketTrends: []
    };
  }
  
  create_player_restaurant(){
    return {
      id: 'player',
      name: 'Your Restaurant',
      type: 'player',
      revenue,
      expenses,
      cash: GAME_CONFIG.startingCash,
      dailyProfit,
      customerCount,
      satisfaction,
      marketShare: 16.67, // Equal share among 6 restaurants
      efficiency: 1.0,
      staff: this.create_starting_staff(),
      menu: this.create_starting_menu(),
      equipment: this.create_starting_equipment()
    };
  }
  
  create_ai_restaurants(){
    const types= 
      ['aggressive', 'strategic', 'emotional', 'speed', 'balanced'];
    
    return types.map(type => ({
      id: `ai-${type}`,
      name,
      type: 'ai',
      revenue,
      expenses,
      cash: GAME_CONFIG.startingCash,
      dailyProfit,
      customerCount,
      satisfaction,
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
        salary,
        efficiency: 1.0,
        experience: 50
      },
      {
        id: 'staff-2',
        name: 'Server',
        type: 'waiter',
        salary,
        efficiency: 1.0,
        experience: 30
      }
    ];
  }
  
  create_starting_menu(){
    return STARTING_MENU_ITEMS.map((item, index) => ({
      id: `menu-${index}`,
      name: item.name,
      price: item.price,
      cost: item.cost,
      cookTime: item.cookTime,
      popularity,
      profitMargin: MathUtils.calculate_profit_margin(item.price, item.cost),
      customerRating: 4.0
    }));
  }
  
  create_starting_equipment() {
    return [
      {
        id: 'equip-1',
        name: 'Basic Kitchen',
        type: 'kitchen',
        level,
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