import { GameState, Restaurant } from '../types/GameTypes';
import { SupportAIAdvice, MarketAnalysis } from '../types/AITypes';
import { MathUtils } from '../utils/MathUtils';

export class SupportAI {
  private lastAdviceTime: number = 0;
  private adviceCooldown: number = 10000; // 10 seconds between advice
  
  generate_advice(gameState: GameState): SupportAIAdvice {
    const currentTime = Date.now();
    const playerRestaurant = gameState.restaurants.find(r => r.type === 'player')!;
    const competitors = gameState.restaurants.filter(r => r.type === 'ai');
    
    // Don't give advice too frequently
    if (currentTime - this.lastAdviceTime < this.adviceCooldown) {
      return this.get_default_advice();
    }
    
    this.lastAdviceTime = currentTime;
    
    // Analyze current situation
    const analysis = this.analyze_market(gameState);
    
    // Priority 1: Financial warnings
    if (playerRestaurant.cash < 5000) {
      return {
        id: `advice-${Date.now()}`,
        type: 'warning',
        priority: 'high',
        message: '⚠️ Low cash warning! Consider raising prices or reducing expenses.',
        timestamp: currentTime
      };
    }
    
    // Priority 2: Market share threats
    const marketLeader = this.find_market_leader(gameState);
    if (marketLeader && marketLeader.id !== 'player' && marketLeader.marketShare > 30) {
      return {
        id: `advice-${Date.now()}`,
        type: 'warning',
        priority: 'high',
        message: `🎯 ${marketLeader.name} is dominating with ${marketLeader.marketShare.toFixed(1)}% market share! Consider aggressive marketing.`,
        timestamp: currentTime,
        relatedCompetitor: marketLeader.id
      };
    }
    
    // Priority 3: Satisfaction issues
    if (playerRestaurant.satisfaction < 70) {
      return {
        id: `advice-${Date.now()}`,
        type: 'warning',
        priority: 'medium',
        message: '😟 Customer satisfaction is dropping. Improve service quality or menu variety.',
        timestamp: currentTime
      };
    }
    
    // Priority 4: Opportunities
    const opportunities = this.identify_opportunities(gameState, playerRestaurant, competitors);
    if (opportunities.length > 0) {
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
  
  private analyze_market(gameState: GameState): MarketAnalysis {
    const restaurants = gameState.restaurants;
    const sortedByMarketShare = [...restaurants].sort((a, b) => b.marketShare - a.marketShare);
    const sortedByRevenue = [...restaurants].sort((a, b) => b.revenue - a.revenue);
    
    // Identify trends
    const risingTrends: string[] = [];
    const decliningTrends: string[] = [];
    
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
    
    return {
      topCompetitor: sortedByMarketShare[0].id === 'player' ? sortedByMarketShare[1].id : sortedByMarketShare[0].id,
      marketLeader: sortedByMarketShare[0].id,
      risingTrends,
      decliningTrends,
      opportunities: [],
      threats: []
    };
  }
  
  private find_market_leader(gameState: GameState): Restaurant | null {
    return gameState.restaurants.reduce((leader, restaurant) => 
      restaurant.marketShare > leader.marketShare ? restaurant : leader
    );
  }
  
  private identify_opportunities(
    gameState: GameState, 
    player: Restaurant, 
    competitors: Restaurant[]
  ): string[] {
    const opportunities: string[] = [];
    
    // Check for price gaps
    const avgCompetitorPrice = competitors.reduce((sum, c) => {
      const avgPrice = c.menu.reduce((s, item) => s + item.price, 0) / c.menu.length;
      return sum + avgPrice;
    }, 0) / competitors.length;
    
    const playerAvgPrice = player.menu.reduce((sum, item) => sum + item.price, 0) / player.menu.length;
    
    if (playerAvgPrice > avgCompetitorPrice * 1.2) {
      opportunities.push('Your prices are higher than competitors. Consider value promotions.');
    } else if (playerAvgPrice < avgCompetitorPrice * 0.8) {
      opportunities.push('You have room to increase prices without losing competitiveness.');
    }
    
    // Check for menu diversity
    if (player.menu.length < 5) {
      opportunities.push('Expand your menu to attract more customer segments.');
    }
    
    // Check for marketing opportunities
    if (player.cash > 15000 && player.marketShare < 20) {
      opportunities.push('You have budget for a major marketing campaign!');
    }
    
    // Check competitor weaknesses
    const weakCompetitor = competitors.find(c => c.satisfaction < 60);
    if (weakCompetitor) {
      opportunities.push(`${weakCompetitor.name} has low satisfaction. Target their customers!`);
    }
    
    return opportunities;
  }
  
  private get_contextual_tips(gameState: GameState, player: Restaurant): string[] {
    const tips: string[] = [];
    
    // Day-specific tips
    if (gameState.currentDay === 1) {
      tips.push('🌟 Start strong! Build a solid menu foundation in the early days.');
    } else if (gameState.currentDay === 7) {
      tips.push('🏁 Final day! Focus on maximizing revenue and market share.');
    }
    
    // Weather-based tips
    if (gameState.weatherCondition === 'rainy') {
      tips.push('🌧️ Rainy weather reduces foot traffic. Consider delivery promotions.');
    } else if (gameState.weatherCondition === 'sunny') {
      tips.push('☀️ Great weather! Perfect time for outdoor dining promotions.');
    }
    
    // Performance-based tips
    if (player.efficiency < 0.8) {
      tips.push('⚡ Upgrade equipment or hire staff to improve efficiency.');
    }
    
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
  
  private get_default_advice(): SupportAIAdvice {
    return {
      id: `advice-default-${Date.now()}`,
      type: 'tip',
      priority: 'low',
      message: '💡 Keep monitoring your competitors and market trends.',
      timestamp: Date.now()
    };
  }
  
  get_market_analysis(gameState: GameState): MarketAnalysis {
    return this.analyze_market(gameState);
  }
}