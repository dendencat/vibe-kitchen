import { AIStrategy } from '../types/AITypes';
import { GameState, Restaurant, PlayerAction } from '../types/GameTypes';
import { MathUtils } from '../utils/MathUtils';

export class AggressiveAI implements AIStrategy {
  name = 'Fire Grill';
  description = 'Aggressive pricing and marketing strategy';
  riskLevel = 'high' as const;
  
  execute_strategy(gameState: GameState, restaurant: Restaurant): PlayerAction[] {
    const actions: PlayerAction[] = [];
    
    // Undercut competitor prices by 20%
    const competitorPrices = gameState.restaurants
      .filter(r => r.id !== restaurant.id)
      .flatMap(r => r.menu.map(item => item.price));
    
    if (competitorPrices.length > 0) {
      const avgCompetitorPrice = competitorPrices.reduce((a, b) => a + b, 0) / competitorPrices.length;
      const targetPrice = avgCompetitorPrice * 0.8;
      
      restaurant.menu.forEach(item => {
        if (item.price > targetPrice) {
          actions.push({
            type: 'menu',
            action: 'update_price',
            parameters: { itemId: item.id, price: targetPrice },
            timestamp: Date.now()
          });
        }
      });
    }
    
    // Heavy advertising spending (30% of available cash)
    if (restaurant.cash > 5000 && Math.random() < 0.3) {
      const marketingBudget = restaurant.cash * 0.3;
      actions.push({
        type: 'marketing',
        action: 'launch_campaign',
        parameters: { 
          campaignType: 'aggressive',
          budget: marketingBudget,
          duration: 2
        },
        timestamp: Date.now()
      });
    }
    
    // Frequent menu changes (every 2 days)
    if (gameState.currentDay % 2 === 0 && restaurant.menu.length < 8) {
      actions.push({
        type: 'menu',
        action: 'add_item',
        parameters: {
          name: `Special Deal ${gameState.currentDay}`,
          price: 9.99,
          cost: 4.00,
          cookTime: 10
        },
        timestamp: Date.now()
      });
    }
    
    return actions;
  }
}

export class StrategicAI implements AIStrategy {
  name = 'Wisdom Table';
  description = 'Data-driven optimal pricing and efficiency';
  riskLevel = 'low' as const;
  
  execute_strategy(gameState: GameState, restaurant: Restaurant): PlayerAction[] {
    const actions: PlayerAction[] = [];
    
    // Analyze historical data for optimal pricing
    restaurant.menu.forEach(item => {
      const optimalPrice = this.calculate_optimal_price(item, gameState);
      if (Math.abs(item.price - optimalPrice) > 0.5) {
        actions.push({
          type: 'menu',
          action: 'update_price',
          parameters: { itemId: item.id, price: optimalPrice },
          timestamp: Date.now()
        });
      }
    });
    
    // Targeted marketing to specific customer segments
    if (restaurant.cash > 10000 && restaurant.satisfaction < 80) {
      actions.push({
        type: 'marketing',
        action: 'launch_campaign',
        parameters: {
          campaignType: 'targeted',
          budget: 5000,
          duration: 3,
          target: 'quality-conscious'
        },
        timestamp: Date.now()
      });
    }
    
    // Remove underperforming menu items
    const worstItem = restaurant.menu.reduce((worst, item) => 
      item.popularity < worst.popularity ? item : worst
    );
    
    if (worstItem && worstItem.popularity < 30 && restaurant.menu.length > 3) {
      actions.push({
        type: 'menu',
        action: 'remove_item',
        parameters: { itemId: worstItem.id },
        timestamp: Date.now()
      });
    }
    
    return actions;
  }
  
  private calculate_optimal_price(item: any, gameState: GameState): number {
    // Simple demand-based pricing
    const demandFactor = item.popularity / 50; // Normalize to 0-2
    const competitionFactor = 1 / (gameState.restaurants.length - 1);
    const basePriceMultiplier = 1 + (item.customerRating - 3) * 0.1;
    
    return item.cost * 2.5 * demandFactor * competitionFactor * basePriceMultiplier;
  }
}

export class EmotionalAI implements AIStrategy {
  name = 'Hospitality House';
  description = 'Customer satisfaction and loyalty focus';
  riskLevel = 'medium' as const;
  
  execute_strategy(gameState: GameState, restaurant: Restaurant): PlayerAction[] {
    const actions: PlayerAction[] = [];
    
    // Premium pricing for quality
    restaurant.menu.forEach(item => {
      if (item.customerRating > 4.5 && item.price < item.cost * 3) {
        actions.push({
          type: 'menu',
          action: 'update_price',
          parameters: { itemId: item.id, price: item.cost * 3.2 },
          timestamp: Date.now()
        });
      }
    });
    
    // Invest in service quality
    if (restaurant.cash > 15000 && restaurant.staff.length < 6) {
      actions.push({
        type: 'operations',
        action: 'hire_staff',
        parameters: { 
          staffType: 'waiter',
          focus: 'customer_service'
        },
        timestamp: Date.now()
      });
    }
    
    // Customer feedback-driven menu updates
    if (gameState.currentDay % 3 === 0) {
      // Add comfort food items
      actions.push({
        type: 'menu',
        action: 'add_item',
        parameters: {
          name: `Grandma's Special ${gameState.currentDay}`,
          price: 18.99,
          cost: 7.00,
          cookTime: 25
        },
        timestamp: Date.now()
      });
    }
    
    // Word-of-mouth marketing
    if (restaurant.satisfaction > 85 && restaurant.cash > 8000) {
      actions.push({
        type: 'marketing',
        action: 'launch_campaign',
        parameters: {
          campaignType: 'referral',
          budget: 3000,
          duration: 5
        },
        timestamp: Date.now()
      });
    }
    
    return actions;
  }
}

export class SpeedAI implements AIStrategy {
  name = 'Lightning Kitchen';
  description = 'Fast service and high turnover';
  riskLevel = 'medium' as const;
  
  execute_strategy(gameState: GameState, restaurant: Restaurant): PlayerAction[] {
    const actions: PlayerAction[] = [];
    
    // Focus on fast-cook items
    const slowItems = restaurant.menu.filter(item => item.cookTime > 15);
    if (slowItems.length > 0 && restaurant.menu.length > 4) {
      actions.push({
        type: 'menu',
        action: 'remove_item',
        parameters: { itemId: slowItems[0].id },
        timestamp: Date.now()
      });
    }
    
    // Add quick menu items
    if (restaurant.menu.length < 7) {
      actions.push({
        type: 'menu',
        action: 'add_item',
        parameters: {
          name: `Quick Bite ${MathUtils.random_int(1, 99)}`,
          price: 7.99,
          cost: 2.50,
          cookTime: 5
        },
        timestamp: Date.now()
      });
    }
    
    // Technology-focused operations
    if (restaurant.cash > 20000) {
      actions.push({
        type: 'operations',
        action: 'upgrade_equipment',
        parameters: {
          equipmentType: 'speed_oven',
          focus: 'cooking_speed'
        },
        timestamp: Date.now()
      });
    }
    
    // Speed-focused marketing
    if (restaurant.cash > 5000 && Math.random() < 0.2) {
      actions.push({
        type: 'marketing',
        action: 'launch_campaign',
        parameters: {
          campaignType: 'speed_promise',
          budget: 4000,
          duration: 2,
          message: 'Food in 5 minutes or free!'
        },
        timestamp: Date.now()
      });
    }
    
    return actions;
  }
}

export class BalancedAI implements AIStrategy {
  name = 'Harmony Restaurant';
  description = 'Balanced approach across all metrics';
  riskLevel = 'low' as const;
  
  execute_strategy(gameState: GameState, restaurant: Restaurant): PlayerAction[] {
    const actions: PlayerAction[] = [];
    
    // Maintain market average pricing
    const allPrices = gameState.restaurants.flatMap(r => r.menu.map(item => item.price));
    const marketAverage = allPrices.reduce((a, b) => a + b, 0) / allPrices.length;
    
    restaurant.menu.forEach(item => {
      const targetPrice = (marketAverage + item.cost * 2.5) / 2;
      if (Math.abs(item.price - targetPrice) > 1) {
        actions.push({
          type: 'menu',
          action: 'update_price',
          parameters: { itemId: item.id, price: targetPrice },
          timestamp: Date.now()
        });
      }
    });
    
    // Balanced marketing investment
    if (restaurant.cash > 12000 && gameState.currentDay % 2 === 0) {
      actions.push({
        type: 'marketing',
        action: 'launch_campaign',
        parameters: {
          campaignType: 'balanced',
          budget: 4000,
          duration: 3
        },
        timestamp: Date.now()
      });
    }
    
    // Regular menu updates
    if (gameState.currentDay % 3 === 0 && restaurant.menu.length < 6) {
      actions.push({
        type: 'menu',
        action: 'add_item',
        parameters: {
          name: `Daily Special ${gameState.currentDay}`,
          price: 13.99,
          cost: 5.00,
          cookTime: 15
        },
        timestamp: Date.now()
      });
    }
    
    // Steady growth strategy
    if (restaurant.staff.length < 4 && restaurant.cash > 10000) {
      actions.push({
        type: 'operations',
        action: 'hire_staff',
        parameters: {
          staffType: Math.random() < 0.5 ? 'chef' : 'waiter'
        },
        timestamp: Date.now()
      });
    }
    
    return actions;
  }
}

export function create_ai_strategy(type: string): AIStrategy {
  switch (type) {
    case 'aggressive':
      return new AggressiveAI();
    case 'strategic':
      return new StrategicAI();
    case 'emotional':
      return new EmotionalAI();
    case 'speed':
      return new SpeedAI();
    case 'balanced':
      return new BalancedAI();
    default:
      return new BalancedAI();
  }
}