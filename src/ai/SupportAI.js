import { MathUtils } from '../utils/MathUtils.js';
import { AdviceTemplates } from './AdviceTemplates.js';

export class SupportAI {
  lastAdviceTime = 0;
  adviceCooldown = 10000; // 10 seconds between advice
  
  generate_advice(gameState){
    const currentTime = Date.now();
    const playerRestaurant = gameState.restaurants.find(r => r.type === 'player');
    
    if (!playerRestaurant) {
      return this.get_default_advice();
    }
    
    // Don't give advice too frequently
    if (currentTime - this.lastAdviceTime < this.adviceCooldown) {
      return this.get_default_advice();
    }
    
    this.lastAdviceTime = currentTime;
    
    // Use the new localized advice system
    const message = AdviceTemplates.getAdviceForGameState(gameState);
    const type = AdviceTemplates.getAdviceType(gameState);
    const priority = AdviceTemplates.getAdvicePriority(gameState);
    
    return {
      id: `advice-${Date.now()}`,
      type: type,
      priority: priority,
      message: message,
      timestamp: currentTime
    };
  }
  
  analyze_market(gameState){
    const restaurants = gameState.restaurants;
    const sortedByMarketShare = [...restaurants].sort((a, b) => b.marketShare - a.marketShare);
    const sortedByRevenue = [...restaurants].sort((a, b) => b.revenue - a.revenue);
    
    // Identify trends
    const risingTrends = [];
    const decliningTrends = [];
    
    // Check for fast food trend
    const fastFoodRestaurants = restaurants.filter(r => 
      r.menu.some(item => item.cookTime < 10)
    );
    if (fastFoodRestaurants.length > restaurants.length / 2) {
      risingTrends.push('Fast food popularity');
    }
    
    // Check for premium dining trend
    const premiumRestaurants = restaurants.filter(r =>
      r.menu.some(item => item.price > 20)
    );
    if (premiumRestaurants.length > 2) {
      risingTrends.push('Premium dining demand');
    }
    
    const opportunities = this.identify_opportunities(
      gameState, 
      gameState.restaurants.find(r => r.type === 'player'), 
      restaurants.filter(r => r.type === 'ai')
    );
    
    return {
      topCompetitor: sortedByMarketShare[0].id === 'player' ? sortedByMarketShare[1].id : sortedByMarketShare[0].id,
      marketLeader: sortedByMarketShare[0].id,
      risingTrends,
      decliningTrends,
      opportunities,
      threats: []
    };
  }
  
  find_market_leader(gameState) {
    return gameState.restaurants.reduce((leader, restaurant) => 
      restaurant.marketShare > leader.marketShare ? restaurant : leader
    );
  }
  
  identify_opportunities(gameState, player, competitors){
    if (!player) return [];
    
    const opportunities = [];
    
    // Check for price gaps
    const avgCompetitorPrice = competitors.reduce((sum, c) => {
      const avgPrice = c.menu.reduce((s, item) => s + item.price, 0) / c.menu.length;
      return sum + avgPrice;
    }, 0) / competitors.length;
    
    const playerAvgPrice = player.menu.reduce((sum, item) => sum + item.price, 0) / player.menu.length;
    
    if (playerAvgPrice > avgCompetitorPrice * 1.2) {
      opportunities.push('Your prices are higher than competitors. Consider value promotions.');
    } else if (playerAvgPrice < avgCompetitorPrice * 0.8) {
      opportunities.push('Your prices are lower than competitors. Consider premium positioning.');
    }
    
    // Check for market share opportunities
    if (player.marketShare < 15) {
      opportunities.push('Market share is low. Focus on customer acquisition campaigns.');
    }
    
    // Check for cash opportunities
    if (player.cash > 15000 && player.marketShare < 20) {
      opportunities.push('You have excess cash. Consider aggressive expansion or marketing.');
    }
    
    return opportunities;
  }
  
  get_contextual_tips(gameState, player){
    if (!player) return ['Keep monitoring your competitors and market trends.'];
    
    const tips = [];
    
    // Day-specific tips
    if (gameState.currentDay <= 2) {
      tips.push('🚀 Early game: Focus on establishing your menu and building customer base.');
    } else if (gameState.currentDay >= 6) {
      tips.push('⏰ Final stretch: Make bold moves to secure your position!');
    }
    
    // Cash-specific tips
    if (player.cash > 20000) {
      tips.push('💰 You have plenty of cash. Consider expansion or premium upgrades.');
    }
    
    // Menu-specific tips
    if (player.menu.some(item => item.popularity < 30)) {
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
    const message = AdviceTemplates.getRandomMessage('marketingTiming');
    return {
      id: `advice-default-${Date.now()}`,
      type: 'tip',
      priority: 'low',
      message: message,
      timestamp: Date.now()
    };
  }
  
  get_market_analysis(gameState){
    return this.analyze_market(gameState);
  }
}