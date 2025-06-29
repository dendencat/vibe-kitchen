import { Restaurant, GameState, PlayerAction } from '../types/GameTypes';
import { AIStrategy } from '../types/AITypes';
import { create_ai_strategy } from './AIStrategies';

export class AIController {
  private restaurant: Restaurant;
  private strategy: AIStrategy;
  private lastActionTime: number = 0;
  private actionCooldown: number = 5000; // 5 seconds between major actions
  
  constructor(restaurant: Restaurant) {
    this.restaurant = restaurant;
    this.strategy = create_ai_strategy(restaurant.strategyType || 'balanced');
  }
  
  make_decisions(gameState: GameState): PlayerAction[] {
    const currentTime = Date.now();
    
    // Don't make decisions too frequently
    if (currentTime - this.lastActionTime < this.actionCooldown) {
      return [];
    }
    
    // Get strategy-specific actions
    const actions = this.strategy.execute_strategy(gameState, this.restaurant);
    
    // Filter actions based on restaurant state
    const validActions = this.filter_valid_actions(actions);
    
    if (validActions.length > 0) {
      this.lastActionTime = currentTime;
    }
    
    return validActions;
  }
  
  private filter_valid_actions(actions: PlayerAction[]): PlayerAction[] {
    return actions.filter(action => {
      // Check if restaurant has enough cash for the action
      if (action.type === 'marketing' && action.parameters.budget) {
        return this.restaurant.cash >= action.parameters.budget;
      }
      
      // Check menu limits
      if (action.type === 'menu' && action.action === 'add_item') {
        return this.restaurant.menu.length < 10;
      }
      
      // Check staff limits
      if (action.type === 'operations' && action.action === 'hire_staff') {
        const staffType = action.parameters.staffType;
        const currentStaffOfType = this.restaurant.staff.filter(s => s.type === staffType).length;
        return currentStaffOfType < 5;
      }
      
      return true;
    });
  }
  
  get_restaurant_id(): string {
    return this.restaurant.id;
  }
  
  update_restaurant_reference(restaurant: Restaurant): void {
    this.restaurant = restaurant;
  }
}