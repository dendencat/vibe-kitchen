import { create_ai_strategy } from './AIStrategies.js';

export class AIController {
  restaurant;
  strategy;
  lastActionTime= 0;
  actionCooldown= 5000; // 5 seconds between major actions
  
  constructor(restaurant) {
    this.restaurant = restaurant;
    this.strategy = create_ai_strategy(restaurant.strategyType || 'balanced');
  }
  
  make_decisions(gameState): PlayerAction[] {
    const currentTime = Date.now();
    
    // Don't make decisions too frequently
    if (currentTime - this.lastActionTime  0) {
      this.lastActionTime = currentTime;
    }
    
    return validActions;
  }
  
  filter_valid_actions(actions): PlayerAction[] {
    return actions.filter(action => {
      // Check if restaurant h cash for the action
      if (action.type === 'marketing' && action.parameters.budget) {
        return this.restaurant.cash >= action.parameters.budget;
      }
      
      // Check menu limits
      if (action.type === 'menu' && action.action === 'add_item') {
        return this.restaurant.menu.length  s.type === staffType).length;
        return currentStaffOfType < 5;
      }
      
      return true;
    });
  }
  
  get_restaurant_id(): string {
    return this.restaurant.id;
  }
  
  update_restaurant_reference(restaurant): void {
    this.restaurant = restaurant;
  }
}