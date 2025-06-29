import { GameState, Restaurant, MarketEvent, MenuItem } from '../types/GameTypes';
import { GAME_CONFIG, STARTING_MENU_ITEMS, AI_RESTAURANT_NAMES } from '../utils/Constants';
import { MathUtils } from '../utils/MathUtils';

export class GameStateManager {
  private state: GameState;
  
  constructor() {
    this.state = this.initialize_game_state();
  }
  
  private initialize_game_state(): GameState {
    const restaurants: Restaurant[] = [
      this.create_player_restaurant(),
      ...this.create_ai_restaurants()
    ];
    
    return {
      currentDay: 1,
      timeRemaining: 60,
      restaurants,
      marketEvents: [],
      weatherCondition: 'sunny',
      globalMarketTrends: []
    };
  }
  
  private create_player_restaurant(): Restaurant {
    return {
      id: 'player',
      name: 'Your Restaurant',
      type: 'player',
      revenue: 0,
      expenses: 0,
      cash: GAME_CONFIG.startingCash,
      dailyProfit: 0,
      customerCount: 0,
      satisfaction: 100,
      marketShare: 16.67, // Equal share among 6 restaurants
      efficiency: 1.0,
      staff: this.create_starting_staff(),
      menu: this.create_starting_menu(),
      equipment: this.create_starting_equipment()
    };
  }
  
  private create_ai_restaurants(): Restaurant[] {
    const types: Array<'aggressive' | 'strategic' | 'emotional' | 'speed' | 'balanced'> = 
      ['aggressive', 'strategic', 'emotional', 'speed', 'balanced'];
    
    return types.map(type => ({
      id: `ai-${type}`,
      name: AI_RESTAURANT_NAMES[type],
      type: 'ai' as const,
      revenue: 0,
      expenses: 0,
      cash: GAME_CONFIG.startingCash,
      dailyProfit: 0,
      customerCount: 0,
      satisfaction: 100,
      marketShare: 16.67,
      efficiency: 1.0,
      staff: this.create_starting_staff(),
      menu: this.create_starting_menu(),
      equipment: this.create_starting_equipment(),
      strategyType: type
    }));
  }
  
  private create_starting_staff() {
    return [
      {
        id: 'staff-1',
        name: 'Head Chef',
        type: 'chef' as const,
        salary: 500,
        efficiency: 1.0,
        experience: 50
      },
      {
        id: 'staff-2',
        name: 'Server',
        type: 'waiter' as const,
        salary: 300,
        efficiency: 1.0,
        experience: 30
      }
    ];
  }
  
  private create_starting_menu(): MenuItem[] {
    return STARTING_MENU_ITEMS.map((item, index) => ({
      id: `menu-${index}`,
      name: item.name,
      price: item.price,
      cost: item.cost,
      cookTime: item.cookTime,
      popularity: 50,
      profitMargin: MathUtils.calculate_profit_margin(item.price, item.cost),
      customerRating: 4.0
    }));
  }
  
  private create_starting_equipment() {
    return [
      {
        id: 'equip-1',
        name: 'Basic Kitchen',
        type: 'kitchen' as const,
        level: 1,
        efficiencyBoost: 1.0,
        maintenanceCost: 100
      }
    ];
  }
  
  get_state(): GameState {
    return this.state;
  }
  
  update_state(updates: Partial<GameState>): void {
    this.state = { ...this.state, ...updates };
  }
  
  get_restaurant(id: string): Restaurant | undefined {
    return this.state.restaurants.find(r => r.id === id);
  }
  
  update_restaurant(id: string, updates: Partial<Restaurant>): void {
    const index = this.state.restaurants.findIndex(r => r.id === id);
    if (index !== -1) {
      this.state.restaurants[index] = {
        ...this.state.restaurants[index],
        ...updates
      };
    }
  }
  
  add_market_event(event: MarketEvent): void {
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