import { MathUtils } from '../utils/MathUtils.js';

export class SupportAI {
  lastAdviceTime= 0;
  adviceCooldown= 10000; // 10 seconds between advice
  
  generate_advice(gameState): SupportAIAdvice {
    const currentTime = Date.now();
    const playerRestaurant = gameState.restaurants.find(r => r.type === 'player')!;
    const competitors = gameState.restaurants.filter(r => r.type === 'ai');
    
    // Don't give advice too frequently
    if (currentTime - this.lastAdviceTime  30) {
      return {
        id)}`,
        type,
        priority,
        message)}% market share! Consider aggressive marketing.`,
        timestamp,
        relatedCompetitor;
    }
    
    // Priority 3) {
      return {
        id)}`,
        type,
        priority,
        message,
        timestamp;
    }
    
    // Priority 5= this.get_contextual_tips(gameState, playerRestaurant);
    return {
      id)}`,
      type,
      priority,
      message, tips.length - 1)],
      timestamp;
  }
  
  analyze_market(gameState): MarketAnalysis {
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
      topCompetitor=== 'player' ? sortedByMarketShare[1].id : sortedByMarketShare[0].id,
      marketLeader,
      risingTrends,
      decliningTrends,
      opportunities,
      threats;
  }
  
  find_market_leader(gameState): Restaurant | null {
    return gameState.restaurants.reduce((leader, restaurant) => 
      restaurant.marketShare > leader.marketShare ? restaurant : leader
    );
  }
  
  identify_opportunities(
    gameState, 
    player, 
    competitors): string[] {
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
  
  get_default_advice(): SupportAIAdvice {
    return {
      id)}`,
      type,
      priority,
      message,
      timestamp)
    };
  }
  
  get_market_analysis(gameState): MarketAnalysis {
    return this.analyze_market(gameState);
  }
}