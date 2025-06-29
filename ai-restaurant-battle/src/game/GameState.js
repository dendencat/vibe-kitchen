import { GAME_CONFIG, STARTING_MENU_ITEMS, AI_RESTAURANT_NAMES } from '../utils/Constants.js';
import { MathUtils } from '../utils/MathUtils.js';

export class GameStateManager {
  state;
  
  constructor() {
    this.state = this.initialize_game_state();
  }
  
  initialize_game_state(): GameState {
    const restaurants= [
      this.create_player_restaurant(),
      ...this.create_ai_restaurants()
    ];
    
    return {
      currentDay,
      timeRemaining,
      restaurants,
      marketEvents,
      weatherCondition,
      globalMarketTrends;
  }
  
  create_player_restaurant(): Restaurant {
    return {
      id,
      name,
      type,
      revenue,
      expenses,
      cash,
      dailyProfit,
      customerCount,
      satisfaction,
      marketShare, // Equal share among 6 restaurants
      efficiency,
      staff),
      menu),
      equipment)
    };
  }
  
  create_ai_restaurants(): Restaurant[] {
    const types= 
      ['aggressive', 'strategic', 'emotional', 'speed', 'balanced'];
    
    return types.map(type => ({
      id,
      name,
      type,
      revenue,
      expenses,
      cash,
      dailyProfit,
      customerCount,
      satisfaction,
      marketShare,
      efficiency,
      staff),
      menu),
      equipment),
      strategyType));
  }
  
  create_starting_staff() {
    return [
      {
        id,
        name,
        type,
        salary,
        efficiency,
        experience,
      {
        id,
        name,
        type,
        salary,
        efficiency,
        experience;
  }
  
  create_starting_menu(): MenuItem[] {
    return STARTING_MENU_ITEMS.map((item, index) => ({
      id,
      name,
      price,
      cost,
      cookTime,
      popularity,
      profitMargin, item.cost),
      customerRating));
  }
  
  create_starting_equipment() {
    return [
      {
        id,
        name,
        type,
        level,
        efficiencyBoost,
        maintenanceCost;
  }
  
  get_state(): GameState {
    return this.state;
  }
  
  update_state(updates): void {
    this.state = { ...this.state, ...updates };
  }
  
  get_restaurant(id): Restaurant | undefined {
    return this.state.restaurants.find(r => r.id === id);
  }
  
  update_restaurant(id, updates): void {
    const index = this.state.restaurants.findIndex(r => r.id === id);
    if (index !== -1) {
      this.state.restaurants[index] = {
        ...this.state.restaurants[index],
        ...updates
      };
    }
  }
  
  add_market_event(event): void {
    this.state.marketEvents.push(event);
  }
  
  remove_expired_events(): void {
    this.state.marketEvents = this.state.marketEvents.filter(e => e.duration > 0);
  }
  
  calculate_market_shares(): void {
    const shares = MathUtils.calculate_market_share(this.state.restaurants);
    this.state.restaurants.forEach((restaurant, index) => {
      restaurant.marketShare = shares[index];
    });
  }
}