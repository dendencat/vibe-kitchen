import { GameState, Restaurant } from '../types/GameTypes.js';
import { SupportAIAdvice, MarketAnalysis } from '../types/AITypes.js';
import { MathUtils } from '../utils/MathUtils.js';

export class SupportAI {
  lastAdviceTime 0;
  adviceCooldown 10000; // 10 seconds between advice
  
  generate_advice(gameState){
    const currentTime = Date.now();
    const playerRestaurant = gameState.restaurants.find(r => r.type === 'player')!;
    const competitors = gameState.restaurants.filter(r => r.type === 'ai');
    
    // Don't give advice too frequently
    if (currentTime - this.lastAdviceTime  30) {
      return {
        id: `advice-${Date.now()}`,
        type: 'warning',
        priority: 'high',
        message: `🎯 ${marketLeader.name} is dominating with ${marketLeader.marketShare.toFixed(1)}% market share! Consider aggressive marketing.`,
        timestamp,
        relatedCompetitor: marketLeader.id
      };
    }
    
    // Priority 3: Satisfaction issues
    if (playerRestaurant.satisfaction  0) {
      return {
        id: `advice-${Date.now()}`,
        type: 'opportunity',
        priority: 'medium',
        message: `💡 ${opportunities[0]}`,
        timestamp: currentTime
      };
    }
    
    // Priority 5: General tips
    const tips = this.get_contextual_tips(gameState, playerRestaurant);
    return {
      id: `advice-${Date.now()}`,
      type: 'tip',
      priority: 'low',
      message: tips[MathUtils.random_int(0, tips.length - 1)],
      timestamp: currentTime
    };
  }
  
  analyze_market(gameState){
    const restaurants = gameState.restaurants;
    const sortedByMarketShare = [...restaurants].sort((a, b) => b.marketShare - a.marketShare);
    const sortedByRevenue = [...restaurants].sort((a, b) => b.revenue - a.revenue);
    
    // Identify trends
    const risingTrends= [];
    const decliningTrends= [];
    
    // Check for fast food trend
    const fastFoodRestaurants = restaurants.filter(r => 
      r.menu.some(item => item.cookTime  restaurants.length / 2) {
      risingTrends.push('Fast food popularity');
    }
    
    // Check for premium dining trend
    const premiumRestaurants = restaurants.filter(r =>
      r.menu.some(item => item.price > 20)
    );
    if (premiumRestaurants.length > 2) {
      risingTrends.push('Premium dining demand');
    }
    
    return {
      topCompetitor: sortedByMarketShare[0].id === 'player' ? sortedByMarketShare[1].id : sortedByMarketShare[0].id,
      marketLeader: sortedByMarketShare[0].id,
      risingTrends,
      decliningTrends,
      opportunities,
      threats: []
    };
  }
  
  find_market_leader(gameState): Restaurant | null {
    return gameState.restaurants.reduce((leader, restaurant) => 
      restaurant.marketShare > leader.marketShare ? restaurant);
  }
  
  identify_opportunities(
    gameState, 
    player, 
    competitors){
    const opportunities= [];
    
    // Check for price gaps
    const avgCompetitorPrice = competitors.reduce((sum, c) => {
      const avgPrice = c.menu.reduce((s, item) => s + item.price, 0) / c.menu.length;
      return sum + avgPrice;
    }, 0) / competitors.length;
    
    const playerAvgPrice = player.menu.reduce((sum, item) => sum + item.price, 0) / player.menu.length;
    
    if (playerAvgPrice > avgCompetitorPrice * 1.2) {
      opportunities.push('Your prices are higher than competitors. Consider value promotions.');
    } else if (playerAvgPrice  15000 && player.marketShare  c.satisfaction  item.popularity < 30)) {
      tips.push('📊 Some menu items aren\'t popular. Consider removing or repricing them.');
    }
    
    // General strategic tips
    tips.push('🎯 Watch competitor strategies and adapt accordingly.');
    tips.push('💰 Balance growth investments with cash reserves.');
    tips.push('👥 Customer satisfaction drives long-term success.');
    tips.push('📈 Diversify your menu to appeal to different customer segments.');
    tips.push('🚀 Time your marketing campaigns for maximum impact.');
    
    return tips;
  }
  
  get_default_advice(){
    return {
      id: `advice-default-${Date.now()}`,
      type: 'tip',
      priority: 'low',
      message: '💡 Keep monitoring your competitors and market trends.',
      timestamp: Date.now()
    };
  }
  
  get_market_analysis(gameState){
    return this.analyze_market(gameState);
  }
}