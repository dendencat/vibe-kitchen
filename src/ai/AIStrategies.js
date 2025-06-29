import { MathUtils } from '../utils/MathUtils.js';

export class AggressiveAI {
  name = 'Fire Grill';
  description = 'Aggressive pricing and marketing strategy';
  riskLevel = 'high';
  
  execute_strategy(gameState, restaurant){
    const actions = [];
    
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
      const budget = Math.floor(restaurant.cash * 0.3);
      actions.push({
        type: 'marketing',
        action: 'launch_campaign',
        parameters: {
          campaignType: 'aggressive',
          budget,
          duration: 2
        },
        timestamp: Date.now()
      });
    }
    
    return actions;
  }
}

export class StrategicAI {
  name = 'Wisdom Table';
  description = 'Data-driven pricing and strategic decisions';
  riskLevel = 'low';
  
  execute_strategy(gameState, restaurant){
    const actions = [];
    
    // Strategic price optimization
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
      const budget = Math.floor(restaurant.cash * 0.15);
      actions.push({
        type: 'marketing',
        action: 'launch_campaign',
        parameters: {
          campaignType: 'strategic',
          budget,
          duration: 3
        },
        timestamp: Date.now()
      });
    }
    
    // Remove unpopular items
    const worstItem = restaurant.menu.find(item => item.popularity < 30);
    if (worstItem && restaurant.menu.length > 3) {
      actions.push({
        type: 'menu',
        action: 'remove_item',
        parameters: { itemId: worstItem.id },
        timestamp: Date.now()
      });
    }
    
    return actions;
  }
  
  calculate_optimal_price(item, gameState){
    // Simple demand-based pricing
    const demandFactor = item.popularity / 50; // Normalize to 0-2
    const competitionFactor = 1 / (gameState.restaurants.length - 1);
    const basePriceMultiplier = 1 + (item.customerRating - 3) * 0.1;
    
    return item.cost * 2.5 * demandFactor * competitionFactor * basePriceMultiplier;
  }
}

export class EmotionalAI {
  name = 'Hospitality House';
  description = 'Customer satisfaction and loyalty focus';
  riskLevel = 'medium';
  
  execute_strategy(gameState, restaurant){
    const actions = [];
    
    // Premium pricing for quality
    restaurant.menu.forEach(item => {
      if (item.customerRating > 4.5 && item.price < 20) {
        actions.push({
          type: 'menu',
          action: 'update_price',
          parameters: { itemId: item.id, price: item.price * 1.2 },
          timestamp: Date.now()
        });
      }
    });
    
    // Staff hiring for better service
    if (restaurant.cash > 15000 && restaurant.staff.length < 6) {
      actions.push({
        type: 'operations',
        action: 'hire_staff',
        parameters: { staffType: 'waiter' },
        timestamp: Date.now()
      });
    }
    
    // Customer satisfaction focused marketing
    if (restaurant.satisfaction > 85 && restaurant.cash > 8000) {
      const budget = Math.floor(restaurant.cash * 0.1);
      actions.push({
        type: 'marketing',
        action: 'launch_campaign',
        parameters: {
          campaignType: 'referral',
          budget,
          duration: 5
        },
        timestamp: Date.now()
      });
    }
    
    return actions;
  }
}

export class SpeedAI {
  name = 'Lightning Kitchen';
  description = 'Fast service and high turnover';
  riskLevel = 'medium';
  
  execute_strategy(gameState, restaurant){
    const actions = [];
    
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
    if (restaurant.menu.length < 8) {
      actions.push({
        type: 'menu',
        action: 'add_item',
        parameters: {
          name: 'Quick Snack',
          price: 6.99,
          cost: 2.50,
          cookTime: 3
        },
        timestamp: Date.now()
      });
    }
    
    // Equipment upgrades for speed
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
      const budget = Math.floor(restaurant.cash * 0.12);
      actions.push({
        type: 'marketing',
        action: 'launch_campaign',
        parameters: {
          campaignType: 'speed',
          budget,
          duration: 2
        },
        timestamp: Date.now()
      });
    }
    
    return actions;
  }
}

export class BalancedAI {
  name = 'Harmony Restaurant';
  description = 'Balanced approach to all aspects';
  riskLevel = 'medium';
  
  execute_strategy(gameState, restaurant){
    const actions = [];
    
    // Balanced pricing strategy
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
      const budget = Math.floor(restaurant.cash * 0.08);
      actions.push({
        type: 'marketing',
        action: 'launch_campaign',
        parameters: {
          campaignType: 'balanced',
          budget,
          duration: 3
        },
        timestamp: Date.now()
      });
    }
    
    // Regular menu updates
    if (gameState.currentDay % 3 === 0 && restaurant.menu.length < 8) {
      actions.push({
        type: 'menu',
        action: 'add_item',
        parameters: {
          name: 'Daily Special',
          price: 14.99,
          cost: 5.50,
          cookTime: 12
        },
        timestamp: Date.now()
      });
    }
    
    // Staff management
    if (restaurant.cash > 10000 && restaurant.staff.length < 5) {
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

export function create_ai_strategy(type){
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