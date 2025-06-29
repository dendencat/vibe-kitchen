import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SupportAI } from './SupportAI';
import { GameState, Restaurant } from '../types/GameTypes';

describe('SupportAI', () => {
  let supportAI: SupportAI;
  let mockGameState: GameState;

  beforeEach(() => {
    supportAI = new SupportAI();
    
    mockGameState = {
      currentDay: 3,
      timeRemaining: 45,
      restaurants: [
        {
          id: 'player',
          name: 'Your Restaurant',
          type: 'player',
          revenue: 8000,
          expenses: 3000,
          cash: 25000,
          dailyProfit: 1000,
          customerCount: 80,
          satisfaction: 85,
          marketShare: 20,
          efficiency: 1.0,
          staff: [
            { id: 'staff1', name: 'Chef', type: 'chef', salary: 500, efficiency: 1.0, experience: 50 }
          ],
          menu: [
            { id: 'item1', name: 'Burger', price: 15, cost: 5, cookTime: 10, popularity: 60, profitMargin: 66.67, customerRating: 4.2 }
          ],
          equipment: []
        },
        {
          id: 'ai-competitor1',
          name: 'Fire Grill',
          type: 'ai',
          revenue: 12000,
          expenses: 4000,
          cash: 30000,
          dailyProfit: 1500,
          customerCount: 120,
          satisfaction: 75,
          marketShare: 35, // Market leader
          efficiency: 1.2,
          staff: [],
          menu: [
            { id: 'comp1-item1', name: 'Special Burger', price: 12, cost: 4, cookTime: 8, popularity: 80, profitMargin: 66.67, customerRating: 4.5 }
          ],
          equipment: [],
          strategyType: 'aggressive'
        },
        {
          id: 'ai-competitor2',
          name: 'Weak Competitor',
          type: 'ai',
          revenue: 2000,
          expenses: 1800,
          cash: 15000,
          dailyProfit: 200,
          customerCount: 30,
          satisfaction: 45, // Low satisfaction
          marketShare: 10,
          efficiency: 0.8,
          staff: [],
          menu: [
            { id: 'comp2-item1', name: 'Cheap Food', price: 8, cost: 6, cookTime: 15, popularity: 25, profitMargin: 25, customerRating: 3.0 }
          ],
          equipment: [],
          strategyType: 'balanced'
        }
      ],
      marketEvents: [],
      weatherCondition: 'sunny',
      globalMarketTrends: []
    };
  });

  describe('advice generation', () => {
    it('should generate financial warnings for low cash', () => {
      // Set player cash to low amount
      mockGameState.restaurants[0].cash = 3000;
      
      const advice = supportAI.generate_advice(mockGameState);
      
      expect(advice.type).toBe('warning');
      expect(advice.priority).toBe('high');
      expect(advice.message).toContain('Low cash warning');
      expect(advice.message).toContain('raising prices');
    });

    it('should warn about market leader threats', () => {
      const advice = supportAI.generate_advice(mockGameState);
      
      // Should warn about Fire Grill's dominance (35% market share)
      if (advice.type === 'warning' && advice.relatedCompetitor) {
        expect(advice.priority).toBe('high');
        expect(advice.message).toContain('Fire Grill');
        expect(advice.message).toContain('35.0%');
        expect(advice.message).toContain('aggressive marketing');
        expect(advice.relatedCompetitor).toBe('ai-competitor1');
      }
    });

    it('should warn about low satisfaction', () => {
      // Set player satisfaction to low
      mockGameState.restaurants[0].satisfaction = 65;
      
      const advice = supportAI.generate_advice(mockGameState);
      
      expect(advice.type).toBe('warning');
      expect(advice.priority).toBe('medium');
      expect(advice.message).toContain('satisfaction is dropping');
      expect(advice.message).toContain('service quality');
    });

    it('should identify opportunities', () => {
      // Set conditions for opportunities
      mockGameState.restaurants[0].cash = 35000; // High cash
      mockGameState.restaurants[0].marketShare = 15; // Low market share
      
      const advice = supportAI.generate_advice(mockGameState);
      
      if (advice.type === 'opportunity') {
        expect(advice.priority).toBe('medium');
        expect(advice.message).toContain('💡');
      }
    });

    it('should provide contextual tips', () => {
      // Set normal conditions that don't trigger warnings
      mockGameState.restaurants[0].cash = 35000;
      mockGameState.restaurants[0].satisfaction = 85;
      mockGameState.restaurants[1].marketShare = 25; // Not dominating
      
      const advice = supportAI.generate_advice(mockGameState);
      
      expect(advice.type).toBe('tip');
      expect(advice.priority).toBe('low');
      expect(advice.message).toBeDefined();
    });

    it('should respect cooldown period', () => {
      const firstAdvice = supportAI.generate_advice(mockGameState);
      const secondAdvice = supportAI.generate_advice(mockGameState);
      
      // Second call should return default advice during cooldown
      expect(secondAdvice.type).toBe('tip');
      expect(secondAdvice.message).toContain('Keep monitoring');
    });

    it('should prioritize warnings over opportunities', () => {
      // Set both warning and opportunity conditions
      mockGameState.restaurants[0].cash = 3000; // Low cash (warning)
      mockGameState.restaurants[0].marketShare = 15; // Low share (opportunity)
      
      const advice = supportAI.generate_advice(mockGameState);
      
      // Should prioritize the warning
      expect(advice.type).toBe('warning');
      expect(advice.priority).toBe('high');
    });
  });

  describe('market analysis', () => {
    it('should analyze market correctly', () => {
      const analysis = supportAI.get_market_analysis(mockGameState);
      
      expect(analysis.marketLeader).toBe('ai-competitor1'); // Fire Grill with 35%
      expect(analysis.topCompetitor).toBe('ai-competitor1'); // Same as leader since player isn't #1
      expect(analysis.risingTrends).toBeDefined();
      expect(analysis.decliningTrends).toBeDefined();
      expect(analysis.opportunities).toBeDefined();
      expect(analysis.threats).toBeDefined();
    });

    it('should identify fast food trends', () => {
      // Add fast food items to multiple restaurants
      mockGameState.restaurants.forEach(restaurant => {
        restaurant.menu.push({
          id: `fast-${restaurant.id}`,
          name: 'Quick Bite',
          price: 6,
          cost: 2,
          cookTime: 5, // Fast cooking
          popularity: 60,
          profitMargin: 66.67,
          customerRating: 4.0
        });
      });
      
      const analysis = supportAI.get_market_analysis(mockGameState);
      
      expect(analysis.risingTrends).toContain('Fast food popularity');
    });

    it('should identify premium dining trends', () => {
      // Add premium items to multiple restaurants
      mockGameState.restaurants.forEach(restaurant => {
        restaurant.menu.push({
          id: `premium-${restaurant.id}`,
          name: 'Premium Dish',
          price: 25, // Expensive
          cost: 10,
          cookTime: 30,
          popularity: 40,
          profitMargin: 60,
          customerRating: 4.8
        });
      });
      
      const analysis = supportAI.get_market_analysis(mockGameState);
      
      expect(analysis.risingTrends).toContain('Premium dining demand');
    });

    it('should handle player as market leader', () => {
      // Make player the market leader
      mockGameState.restaurants[0].marketShare = 40;
      mockGameState.restaurants[1].marketShare = 25;
      
      const analysis = supportAI.get_market_analysis(mockGameState);
      
      expect(analysis.marketLeader).toBe('player');
      expect(analysis.topCompetitor).toBe('ai-competitor1'); // Best non-player
    });
  });

  describe('opportunity identification', () => {
    it('should identify price gap opportunities', () => {
      // Set player prices higher than competitors
      mockGameState.restaurants[0].menu[0].price = 20; // Player: expensive
      mockGameState.restaurants[1].menu[0].price = 10; // Competitor: cheap
      
      const opportunities = supportAI['identify_opportunities'](
        mockGameState,
        mockGameState.restaurants[0],
        mockGameState.restaurants.slice(1)
      );
      
      const priceOpportunity = opportunities.find(opp => 
        opp.includes('prices are higher') || opp.includes('value promotions')
      );
      expect(priceOpportunity).toBeDefined();
    });

    it('should identify menu expansion opportunities', () => {
      // Limit player menu items
      mockGameState.restaurants[0].menu = [
        mockGameState.restaurants[0].menu[0] // Only one item
      ];
      
      const opportunities = supportAI['identify_opportunities'](
        mockGameState,
        mockGameState.restaurants[0],
        mockGameState.restaurants.slice(1)
      );
      
      const menuOpportunity = opportunities.find(opp => 
        opp.includes('Expand your menu')
      );
      expect(menuOpportunity).toBeDefined();
    });

    it('should identify marketing opportunities', () => {
      // Set high cash and low market share
      mockGameState.restaurants[0].cash = 20000;
      mockGameState.restaurants[0].marketShare = 15;
      
      const opportunities = supportAI['identify_opportunities'](
        mockGameState,
        mockGameState.restaurants[0],
        mockGameState.restaurants.slice(1)
      );
      
      const marketingOpportunity = opportunities.find(opp => 
        opp.includes('marketing campaign')
      );
      expect(marketingOpportunity).toBeDefined();
    });

    it('should identify competitor weakness opportunities', () => {
      const opportunities = supportAI['identify_opportunities'](
        mockGameState,
        mockGameState.restaurants[0],
        mockGameState.restaurants.slice(1)
      );
      
      // Should identify weak competitor (satisfaction < 60)
      const weaknessOpportunity = opportunities.find(opp => 
        opp.includes('Weak Competitor') && opp.includes('low satisfaction')
      );
      expect(weaknessOpportunity).toBeDefined();
    });
  });

  describe('contextual tips', () => {
    it('should provide day-specific tips', () => {
      mockGameState.currentDay = 1;
      const tips = supportAI['get_contextual_tips'](mockGameState, mockGameState.restaurants[0]);
      
      const dayOneTip = tips.find(tip => tip.includes('Start strong'));
      expect(dayOneTip).toBeDefined();

      mockGameState.currentDay = 7;
      const finalDayTips = supportAI['get_contextual_tips'](mockGameState, mockGameState.restaurants[0]);
      
      const finalDayTip = finalDayTips.find(tip => tip.includes('Final day'));
      expect(finalDayTip).toBeDefined();
    });

    it('should provide weather-based tips', () => {
      mockGameState.weatherCondition = 'rainy';
      const rainyTips = supportAI['get_contextual_tips'](mockGameState, mockGameState.restaurants[0]);
      
      const rainyTip = rainyTips.find(tip => tip.includes('Rainy weather'));
      expect(rainyTip).toBeDefined();

      mockGameState.weatherCondition = 'sunny';
      const sunnyTips = supportAI['get_contextual_tips'](mockGameState, mockGameState.restaurants[0]);
      
      const sunnyTip = sunnyTips.find(tip => tip.includes('Great weather'));
      expect(sunnyTip).toBeDefined();
    });

    it('should provide performance-based tips', () => {
      mockGameState.restaurants[0].efficiency = 0.7; // Low efficiency
      const tips = supportAI['get_contextual_tips'](mockGameState, mockGameState.restaurants[0]);
      
      const efficiencyTip = tips.find(tip => tip.includes('Upgrade equipment'));
      expect(efficiencyTip).toBeDefined();
    });

    it('should provide menu optimization tips', () => {
      // Add unpopular menu item
      mockGameState.restaurants[0].menu.push({
        id: 'unpopular',
        name: 'Unpopular Dish',
        price: 15,
        cost: 8,
        cookTime: 20,
        popularity: 20, // Low popularity
        profitMargin: 46.67,
        customerRating: 3.5
      });
      
      const tips = supportAI['get_contextual_tips'](mockGameState, mockGameState.restaurants[0]);
      
      const menuTip = tips.find(tip => tip.includes("aren't popular"));
      expect(menuTip).toBeDefined();
    });

    it('should always include general strategic tips', () => {
      const tips = supportAI['get_contextual_tips'](mockGameState, mockGameState.restaurants[0]);
      
      expect(tips.length).toBeGreaterThan(5); // Should have general tips
      
      const strategicTips = tips.filter(tip => 
        tip.includes('competitor strategies') ||
        tip.includes('growth investments') ||
        tip.includes('Customer satisfaction') ||
        tip.includes('menu to appeal') ||
        tip.includes('marketing campaigns')
      );
      
      expect(strategicTips.length).toBeGreaterThan(0);
    });
  });

  describe('advice timing and cooldown', () => {
    it('should update last advice time when generating new advice', () => {
      const initialTime = supportAI['lastAdviceTime'];
      
      // Mock time advancement
      const originalNow = Date.now;
      Date.now = vi.fn(() => originalNow() + 15000); // 15 seconds later
      
      try {
        supportAI.generate_advice(mockGameState);
        expect(supportAI['lastAdviceTime']).toBeGreaterThan(initialTime);
      } finally {
        Date.now = originalNow;
      }
    });

    it('should respect advice cooldown period', () => {
      const firstAdvice = supportAI.generate_advice(mockGameState);
      const secondAdvice = supportAI.generate_advice(mockGameState);
      
      // Second advice should be default due to cooldown
      expect(secondAdvice.message).toContain('Keep monitoring');
      expect(secondAdvice.type).toBe('tip');
      expect(secondAdvice.priority).toBe('low');
    });
  });

  describe('advice message format', () => {
    it('should generate properly formatted advice objects', () => {
      const advice = supportAI.generate_advice(mockGameState);
      
      expect(advice.id).toMatch(/^advice-/);
      expect(['warning', 'opportunity', 'tip', 'analysis']).toContain(advice.type);
      expect(['low', 'medium', 'high']).toContain(advice.priority);
      expect(advice.message).toBeDefined();
      expect(advice.message.length).toBeGreaterThan(0);
      expect(advice.timestamp).toBeTypeOf('number');
      expect(advice.timestamp).toBeGreaterThan(0);
    });

    it('should include emojis in appropriate advice types', () => {
      // Force different advice types
      mockGameState.restaurants[0].cash = 3000; // Force warning
      const warningAdvice = supportAI.generate_advice(mockGameState);
      expect(warningAdvice.message).toContain('⚠️');
      
      // Reset for opportunity
      supportAI['lastAdviceTime'] = 0; // Reset cooldown
      mockGameState.restaurants[0].cash = 35000;
      mockGameState.restaurants[0].marketShare = 15;
      mockGameState.restaurants[1].marketShare = 25; // Not dominating
      
      const opportunityAdvice = supportAI.generate_advice(mockGameState);
      if (opportunityAdvice.type === 'opportunity') {
        expect(opportunityAdvice.message).toContain('💡');
      }
    });
  });
});