import { MathUtils } from '../utils/MathUtils.js';

export class AggressiveAI implements AIStrategy {
  name = 'Fire Grill';
  description = 'Aggressive pricing and marketing strategy';
  riskLevel = 'high' ;
  
  execute_strategy(gameState, restaurant): PlayerAction[] {
    const actions= [];
    
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
            type,
            action,
            parameters, price,
            timestamp)
          });
        }
      });
    }
    
    // Heavy advertising spending (30% of available cash)
    if (restaurant.cash > 5000 && Math.random()  {
      const optimalPrice = this.calculate_optimal_price(item, gameState);
      if (Math.abs(item.price - optimalPrice) > 0.5) {
        actions.push({
          type,
          action,
          parameters, price,
          timestamp)
        });
      }
    });
    
    // Targeted marketing to specific customer segments
    if (restaurant.cash > 10000 && restaurant.satisfaction  
      item.popularity  3) {
      actions.push({
        type,
        action,
        parameters,
        timestamp)
      });
    }
    
    return actions;
  }
  
  calculate_optimal_price(item, gameState): number {
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
  riskLevel = 'medium' ;
  
  execute_strategy(gameState, restaurant): PlayerAction[] {
    const actions= [];
    
    // Premium pricing for quality
    restaurant.menu.forEach(item => {
      if (item.customerRating > 4.5 && item.price  15000 && restaurant.staff.length  85 && restaurant.cash > 8000) {
      actions.push({
        type,
        action,
        parameters,
          budget,
          duration,
        timestamp)
      });
    }
    
    return actions;
  }
}

export class SpeedAI implements AIStrategy {
  name = 'Lightning Kitchen';
  description = 'Fast service and high turnover';
  riskLevel = 'medium' ;
  
  execute_strategy(gameState, restaurant): PlayerAction[] {
    const actions= [];
    
    // Focus on fast-cook items
    const slowItems = restaurant.menu.filter(item => item.cookTime > 15);
    if (slowItems.length > 0 && restaurant.menu.length > 4) {
      actions.push({
        type,
        action,
        parameters,
        timestamp)
      });
    }
    
    // Add quick menu items
    if (restaurant.menu.length  20000) {
      actions.push({
        type,
        action,
        parameters,
          focus,
        timestamp)
      });
    }
    
    // Speed-focused marketing
    if (restaurant.cash > 5000 && Math.random()  r.menu.map(item => item.price));
    const marketAverage = allPrices.reduce((a, b) => a + b, 0) / allPrices.length;
    
    restaurant.menu.forEach(item => {
      const targetPrice = (marketAverage + item.cost * 2.5) / 2;
      if (Math.abs(item.price - targetPrice) > 1) {
        actions.push({
          type,
          action,
          parameters, price,
          timestamp)
        });
      }
    });
    
    // Balanced marketing investment
    if (restaurant.cash > 12000 && gameState.currentDay % 2 === 0) {
      actions.push({
        type,
        action,
        parameters,
          budget,
          duration,
        timestamp)
      });
    }
    
    // Regular menu updates
    if (gameState.currentDay % 3 === 0 && restaurant.menu.length  10000) {
      actions.push({
        type,
        action,
        parameters) < 0.5 ? 'chef' : 'waiter'
        },
        timestamp)
      });
    }
    
    return actions;
  }
}

export function create_ai_strategy(type): AIStrategy {
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
    default);
  }
}