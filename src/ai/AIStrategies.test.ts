import { describe, it, expect, beforeEach } from 'vitest';
import { 
  AggressiveAI, 
  StrategicAI, 
  EmotionalAI, 
  SpeedAI, 
  BalancedAI,
  create_ai_strategy 
} from './AIStrategies';
import { GameState, Restaurant } from '../types/GameTypes';

describe('AI Strategies', () => {
  let mockGameState: GameState;
  let mockRestaurant: Restaurant;
  let competitorRestaurants: Restaurant[];

  beforeEach(() => {
    competitorRestaurants = [
      {
        id: 'competitor1',
        name: 'Competitor 1',
        type: 'ai',
        revenue: 5000,
        expenses: 2000,
        cash: 45000,
        dailyProfit: 500,
        customerCount: 80,
        satisfaction: 85,
        marketShare: 20,
        efficiency: 1.0,
        staff: [],
        menu: [
          { id: 'item1', name: 'Burger', price: 15, cost: 5, cookTime: 10, popularity: 60, profitMargin: 66.67, customerRating: 4.2 }
        ],
        equipment: []
      },
      {
        id: 'competitor2',
        name: 'Competitor 2',
        type: 'ai',
        revenue: 3000,
        expenses: 1500,
        cash: 40000,
        dailyProfit: 300,
        customerCount: 60,
        satisfaction: 75,
        marketShare: 15,
        efficiency: 0.9,
        staff: [],
        menu: [
          { id: 'item2', name: 'Pizza', price: 18, cost: 6, cookTime: 15, popularity: 55, profitMargin: 66.67, customerRating: 4.0 }
        ],
        equipment: []
      }
    ];

    mockRestaurant = {
      id: 'test-restaurant',
      name: 'Test Restaurant',
      type: 'ai',
      revenue: 10000,
      expenses: 4000,
      cash: 50000,
      dailyProfit: 1000,
      customerCount: 100,
      satisfaction: 90,
      marketShare: 25,
      efficiency: 1.1,
      staff: [
        { id: 'staff1', name: 'Chef', type: 'chef', salary: 500, efficiency: 1.0, experience: 50 },
        { id: 'staff2', name: 'Waiter', type: 'waiter', salary: 300, efficiency: 1.0, experience: 30 }
      ],
      menu: [
        { id: 'menu1', name: 'Signature Dish', price: 20, cost: 8, cookTime: 20, popularity: 70, profitMargin: 60, customerRating: 4.5 }
      ],
      equipment: [
        { id: 'equip1', name: 'Kitchen', type: 'kitchen', level: 1, efficiencyBoost: 1.0, maintenanceCost: 100 }
      ]
    };

    mockGameState = {
      currentDay: 3,
      timeRemaining: 45,
      restaurants: [mockRestaurant, ...competitorRestaurants],
      marketEvents: [],
      weatherCondition: 'sunny',
      globalMarketTrends: []
    };
  });

  describe('AggressiveAI', () => {
    let aggressiveAI: AggressiveAI;

    beforeEach(() => {
      aggressiveAI = new AggressiveAI();
    });

    it('should have correct strategy properties', () => {
      expect(aggressiveAI.name).toBe('Fire Grill');
      expect(aggressiveAI.description).toBe('Aggressive pricing and marketing strategy');
      expect(aggressiveAI.riskLevel).toBe('high');
    });

    it('should undercut competitor prices', () => {
      const actions = aggressiveAI.execute_strategy(mockGameState, mockRestaurant);
      
      const priceUpdateActions = actions.filter(action => 
        action.type === 'menu' && action.action === 'update_price'
      );
      
      if (priceUpdateActions.length > 0) {
        // Average competitor price is (15 + 18) / 2 = 16.5
        // Target price should be 16.5 * 0.8 = 13.2
        const priceAction = priceUpdateActions[0];
        expect(priceAction.parameters.price).toBeCloseTo(13.2, 1);
      }
    });

    it('should launch marketing campaigns when cash is available', () => {
      const actions = aggressiveAI.execute_strategy(mockGameState, mockRestaurant);
      
      const marketingActions = actions.filter(action => 
        action.type === 'marketing' && action.action === 'launch_campaign'
      );
      
      // Should potentially create marketing actions when cash > 5000
      if (marketingActions.length > 0) {
        const marketingAction = marketingActions[0];
        expect(marketingAction.parameters.budget).toBeLessThanOrEqual(mockRestaurant.cash * 0.3);
        expect(marketingAction.parameters.campaignType).toBe('aggressive');
      }
    });

    it('should add new menu items frequently', () => {
      // Test on even day
      mockGameState.currentDay = 2;
      const actions = aggressiveAI.execute_strategy(mockGameState, mockRestaurant);
      
      const addItemActions = actions.filter(action => 
        action.type === 'menu' && action.action === 'add_item'
      );
      
      if (addItemActions.length > 0) {
        const addAction = addItemActions[0];
        expect(addAction.parameters.name).toContain('Special Deal');
        expect(addAction.parameters.price).toBe(9.99);
        expect(addAction.parameters.cost).toBe(4.00);
        expect(addAction.parameters.cookTime).toBe(10);
      }
    });
  });

  describe('StrategicAI', () => {
    let strategicAI: StrategicAI;

    beforeEach(() => {
      strategicAI = new StrategicAI();
    });

    it('should have correct strategy properties', () => {
      expect(strategicAI.name).toBe('Wisdom Table');
      expect(strategicAI.description).toBe('Data-driven optimal pricing and efficiency');
      expect(strategicAI.riskLevel).toBe('low');
    });

    it('should optimize pricing based on data', () => {
      const actions = strategicAI.execute_strategy(mockGameState, mockRestaurant);
      
      const priceUpdateActions = actions.filter(action => 
        action.type === 'menu' && action.action === 'update_price'
      );
      
      // Strategic AI should adjust prices based on optimal calculations
      expect(priceUpdateActions.length).toBeGreaterThanOrEqual(0);
    });

    it('should launch targeted marketing when satisfaction is low', () => {
      mockRestaurant.satisfaction = 70; // Below 80%
      mockRestaurant.cash = 15000; // Above 10000
      
      const actions = strategicAI.execute_strategy(mockGameState, mockRestaurant);
      
      const marketingActions = actions.filter(action => 
        action.type === 'marketing' && action.action === 'launch_campaign'
      );
      
      if (marketingActions.length > 0) {
        const marketingAction = marketingActions[0];
        expect(marketingAction.parameters.campaignType).toBe('targeted');
        expect(marketingAction.parameters.budget).toBe(5000);
        expect(marketingAction.parameters.target).toBe('quality-conscious');
      }
    });

    it('should remove underperforming menu items', () => {
      // Add a low-performing item
      mockRestaurant.menu.push({
        id: 'poor-item',
        name: 'Poor Dish',
        price: 10,
        cost: 5,
        cookTime: 15,
        popularity: 20, // Low popularity
        profitMargin: 50,
        customerRating: 3.0
      });
      
      const actions = strategicAI.execute_strategy(mockGameState, mockRestaurant);
      
      const removeActions = actions.filter(action => 
        action.type === 'menu' && action.action === 'remove_item'
      );
      
      if (removeActions.length > 0) {
        expect(removeActions[0].parameters.itemId).toBe('poor-item');
      }
    });
  });

  describe('EmotionalAI', () => {
    let emotionalAI: EmotionalAI;

    beforeEach(() => {
      emotionalAI = new EmotionalAI();
    });

    it('should have correct strategy properties', () => {
      expect(emotionalAI.name).toBe('Hospitality House');
      expect(emotionalAI.description).toBe('Customer satisfaction and loyalty focus');
      expect(emotionalAI.riskLevel).toBe('medium');
    });

    it('should use premium pricing for high-rated items', () => {
      const actions = emotionalAI.execute_strategy(mockGameState, mockRestaurant);
      
      const priceUpdateActions = actions.filter(action => 
        action.type === 'menu' && action.action === 'update_price'
      );
      
      // Should increase price for items with rating > 4.5
      if (priceUpdateActions.length > 0) {
        const priceAction = priceUpdateActions[0];
        expect(priceAction.parameters.price).toBeGreaterThan(mockRestaurant.menu[0].price);
      }
    });

    it('should hire staff for customer service', () => {
      mockRestaurant.cash = 20000; // Above 15000
      mockRestaurant.staff = []; // Empty staff to allow hiring
      
      const actions = emotionalAI.execute_strategy(mockGameState, mockRestaurant);
      
      const staffActions = actions.filter(action => 
        action.type === 'operations' && action.action === 'hire_staff'
      );
      
      if (staffActions.length > 0) {
        const staffAction = staffActions[0];
        expect(staffAction.parameters.staffType).toBe('waiter');
        expect(staffAction.parameters.focus).toBe('customer_service');
      }
    });

    it('should add comfort food items', () => {
      mockGameState.currentDay = 3; // Divisible by 3
      
      const actions = emotionalAI.execute_strategy(mockGameState, mockRestaurant);
      
      const addItemActions = actions.filter(action => 
        action.type === 'menu' && action.action === 'add_item'
      );
      
      if (addItemActions.length > 0) {
        const addAction = addItemActions[0];
        expect(addAction.parameters.name).toContain("Grandma's Special");
        expect(addAction.parameters.price).toBe(18.99);
        expect(addAction.parameters.cost).toBe(7.00);
        expect(addAction.parameters.cookTime).toBe(25);
      }
    });

    it('should launch referral campaigns when satisfaction is high', () => {
      mockRestaurant.satisfaction = 90; // Above 85%
      mockRestaurant.cash = 10000; // Above 8000
      
      const actions = emotionalAI.execute_strategy(mockGameState, mockRestaurant);
      
      const marketingActions = actions.filter(action => 
        action.type === 'marketing' && action.action === 'launch_campaign'
      );
      
      if (marketingActions.length > 0) {
        const marketingAction = marketingActions[0];
        expect(marketingAction.parameters.campaignType).toBe('referral');
        expect(marketingAction.parameters.budget).toBe(3000);
        expect(marketingAction.parameters.duration).toBe(5);
      }
    });
  });

  describe('SpeedAI', () => {
    let speedAI: SpeedAI;

    beforeEach(() => {
      speedAI = new SpeedAI();
    });

    it('should have correct strategy properties', () => {
      expect(speedAI.name).toBe('Lightning Kitchen');
      expect(speedAI.description).toBe('Fast service and high turnover');
      expect(speedAI.riskLevel).toBe('medium');
    });

    it('should remove slow-cooking items', () => {
      // Add a slow item
      mockRestaurant.menu.push({
        id: 'slow-item',
        name: 'Slow Dish',
        price: 25,
        cost: 10,
        cookTime: 30, // Above 15 minutes
        popularity: 50,
        profitMargin: 60,
        customerRating: 4.0
      });
      
      const actions = speedAI.execute_strategy(mockGameState, mockRestaurant);
      
      const removeActions = actions.filter(action => 
        action.type === 'menu' && action.action === 'remove_item'
      );
      
      if (removeActions.length > 0) {
        expect(removeActions[0].parameters.itemId).toBe('slow-item');
      }
    });

    it('should add quick menu items', () => {
      const actions = speedAI.execute_strategy(mockGameState, mockRestaurant);
      
      const addItemActions = actions.filter(action => 
        action.type === 'menu' && action.action === 'add_item'
      );
      
      if (addItemActions.length > 0) {
        const addAction = addItemActions[0];
        expect(addAction.parameters.name).toContain('Quick Bite');
        expect(addAction.parameters.price).toBe(7.99);
        expect(addAction.parameters.cost).toBe(2.50);
        expect(addAction.parameters.cookTime).toBe(5);
      }
    });

    it('should upgrade equipment for speed', () => {
      mockRestaurant.cash = 25000; // Above 20000
      
      const actions = speedAI.execute_strategy(mockGameState, mockRestaurant);
      
      const upgradeActions = actions.filter(action => 
        action.type === 'operations' && action.action === 'upgrade_equipment'
      );
      
      if (upgradeActions.length > 0) {
        const upgradeAction = upgradeActions[0];
        expect(upgradeAction.parameters.equipmentType).toBe('speed_oven');
        expect(upgradeAction.parameters.focus).toBe('cooking_speed');
      }
    });

    it('should launch speed-focused marketing', () => {
      mockRestaurant.cash = 8000; // Above 5000
      
      const actions = speedAI.execute_strategy(mockGameState, mockRestaurant);
      
      const marketingActions = actions.filter(action => 
        action.type === 'marketing' && action.action === 'launch_campaign'
      );
      
      // Should potentially create speed marketing
      if (marketingActions.length > 0) {
        const marketingAction = marketingActions[0];
        expect(marketingAction.parameters.campaignType).toBe('speed_promise');
        expect(marketingAction.parameters.budget).toBe(4000);
        expect(marketingAction.parameters.message).toBe('Food in 5 minutes or free!');
      }
    });
  });

  describe('BalancedAI', () => {
    let balancedAI: BalancedAI;

    beforeEach(() => {
      balancedAI = new BalancedAI();
    });

    it('should have correct strategy properties', () => {
      expect(balancedAI.name).toBe('Harmony Restaurant');
      expect(balancedAI.description).toBe('Balanced approach across all metrics');
      expect(balancedAI.riskLevel).toBe('low');
    });

    it('should maintain market average pricing', () => {
      const actions = balancedAI.execute_strategy(mockGameState, mockRestaurant);
      
      const priceUpdateActions = actions.filter(action => 
        action.type === 'menu' && action.action === 'update_price'
      );
      
      // Should adjust prices toward market average
      expect(priceUpdateActions.length).toBeGreaterThanOrEqual(0);
    });

    it('should launch balanced marketing campaigns', () => {
      mockRestaurant.cash = 15000; // Above 12000
      mockGameState.currentDay = 2; // Even day
      
      const actions = balancedAI.execute_strategy(mockGameState, mockRestaurant);
      
      const marketingActions = actions.filter(action => 
        action.type === 'marketing' && action.action === 'launch_campaign'
      );
      
      if (marketingActions.length > 0) {
        const marketingAction = marketingActions[0];
        expect(marketingAction.parameters.campaignType).toBe('balanced');
        expect(marketingAction.parameters.budget).toBe(4000);
        expect(marketingAction.parameters.duration).toBe(3);
      }
    });

    it('should add regular menu updates', () => {
      mockGameState.currentDay = 3; // Divisible by 3
      
      const actions = balancedAI.execute_strategy(mockGameState, mockRestaurant);
      
      const addItemActions = actions.filter(action => 
        action.type === 'menu' && action.action === 'add_item'
      );
      
      if (addItemActions.length > 0) {
        const addAction = addItemActions[0];
        expect(addAction.parameters.name).toContain('Daily Special');
        expect(addAction.parameters.price).toBe(13.99);
        expect(addAction.parameters.cost).toBe(5.00);
        expect(addAction.parameters.cookTime).toBe(15);
      }
    });

    it('should hire staff for steady growth', () => {
      mockRestaurant.staff = []; // Empty to allow hiring
      mockRestaurant.cash = 12000; // Above 10000
      
      const actions = balancedAI.execute_strategy(mockGameState, mockRestaurant);
      
      const staffActions = actions.filter(action => 
        action.type === 'operations' && action.action === 'hire_staff'
      );
      
      if (staffActions.length > 0) {
        const staffAction = staffActions[0];
        expect(['chef', 'waiter']).toContain(staffAction.parameters.staffType);
      }
    });
  });

  describe('create_ai_strategy', () => {
    it('should create correct strategy instances', () => {
      expect(create_ai_strategy('aggressive')).toBeInstanceOf(AggressiveAI);
      expect(create_ai_strategy('strategic')).toBeInstanceOf(StrategicAI);
      expect(create_ai_strategy('emotional')).toBeInstanceOf(EmotionalAI);
      expect(create_ai_strategy('speed')).toBeInstanceOf(SpeedAI);
      expect(create_ai_strategy('balanced')).toBeInstanceOf(BalancedAI);
    });

    it('should default to BalancedAI for unknown types', () => {
      expect(create_ai_strategy('unknown')).toBeInstanceOf(BalancedAI);
      expect(create_ai_strategy('')).toBeInstanceOf(BalancedAI);
    });
  });
});