import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AIController } from './AIController';
import { Restaurant, GameState } from '../types/GameTypes';
import { AggressiveAI } from './AIStrategies';

describe('AIController', () => {
  let mockRestaurant: Restaurant;
  let mockGameState: GameState;
  let aiController: AIController;

  beforeEach(() => {
    mockRestaurant = {
      id: 'ai-aggressive',
      name: 'Fire Grill',
      type: 'ai',
      revenue: 5000,
      expenses: 2000,
      cash: 45000,
      dailyProfit: 500,
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
      equipment: [
        { id: 'equip1', name: 'Kitchen', type: 'kitchen', level: 1, efficiencyBoost: 1.0, maintenanceCost: 100 }
      ],
      strategyType: 'aggressive'
    };

    mockGameState = {
      currentDay: 2,
      timeRemaining: 30,
      restaurants: [
        mockRestaurant,
        {
          id: 'competitor',
          name: 'Competitor',
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
          equipment: [],
          strategyType: 'balanced'
        }
      ],
      marketEvents: [],
      weatherCondition: 'sunny',
      globalMarketTrends: []
    };

    aiController = new AIController(mockRestaurant);
  });

  describe('initialization', () => {
    it('should initialize with restaurant and strategy', () => {
      expect(aiController.get_restaurant_id()).toBe('ai-aggressive');
      expect(aiController['strategy']).toBeInstanceOf(AggressiveAI);
    });

    it('should default to balanced strategy for unknown types', () => {
      const unknownRestaurant = { ...mockRestaurant, strategyType: 'unknown' as any };
      const controller = new AIController(unknownRestaurant);
      expect(controller['strategy'].name).toBe('Harmony Restaurant');
    });

    it('should handle missing strategy type', () => {
      const noStrategyRestaurant = { ...mockRestaurant };
      delete noStrategyRestaurant.strategyType;
      const controller = new AIController(noStrategyRestaurant);
      expect(controller['strategy'].name).toBe('Harmony Restaurant');
    });
  });

  describe('decision making', () => {
    it('should make decisions when cooldown period has passed', () => {
      // Mock strategy to return actions
      const mockActions = [
        {
          type: 'menu' as const,
          action: 'update_price',
          parameters: { itemId: 'item1', price: 12 },
          timestamp: Date.now()
        }
      ];

      vi.spyOn(aiController['strategy'], 'execute_strategy').mockReturnValue(mockActions);

      const decisions = aiController.make_decisions(mockGameState);
      expect(decisions).toEqual(mockActions);
    });

    it('should not make decisions during cooldown period', () => {
      // Make first decision
      const mockActions = [
        {
          type: 'menu' as const,
          action: 'update_price',
          parameters: { itemId: 'item1', price: 12 },
          timestamp: Date.now()
        }
      ];

      vi.spyOn(aiController['strategy'], 'execute_strategy').mockReturnValue(mockActions);
      
      const firstDecisions = aiController.make_decisions(mockGameState);
      expect(firstDecisions).toEqual(mockActions);

      // Immediately try to make another decision (should be blocked by cooldown)
      const secondDecisions = aiController.make_decisions(mockGameState);
      expect(secondDecisions).toEqual([]);
    });

    it('should handle strategy errors gracefully', () => {
      vi.spyOn(aiController['strategy'], 'execute_strategy').mockImplementation(() => {
        throw new Error('Strategy error');
      });

      expect(() => aiController.make_decisions(mockGameState)).not.toThrow();
      const decisions = aiController.make_decisions(mockGameState);
      expect(decisions).toEqual([]);
    });

    it('should filter invalid actions', () => {
      const invalidActions = [
        // Valid marketing action
        {
          type: 'marketing' as const,
          action: 'launch_campaign',
          parameters: { budget: 1000 },
          timestamp: Date.now()
        },
        // Invalid marketing action (insufficient funds)
        {
          type: 'marketing' as const,
          action: 'launch_campaign',
          parameters: { budget: 100000 },
          timestamp: Date.now()
        },
        // Valid menu action
        {
          type: 'menu' as const,
          action: 'add_item',
          parameters: { name: 'New Item', price: 10, cost: 5, cookTime: 15 },
          timestamp: Date.now()
        }
      ];

      vi.spyOn(aiController['strategy'], 'execute_strategy').mockReturnValue(invalidActions);

      const filteredActions = aiController.make_decisions(mockGameState);
      
      // Should filter out the invalid marketing action
      expect(filteredActions).toHaveLength(2);
      expect(filteredActions[0].type).toBe('marketing');
      expect(filteredActions[0].parameters.budget).toBe(1000);
      expect(filteredActions[1].type).toBe('menu');
    });
  });

  describe('action filtering', () => {
    it('should filter marketing actions based on available cash', () => {
      const actions = [
        {
          type: 'marketing' as const,
          action: 'launch_campaign',
          parameters: { budget: 10000 }, // Valid
          timestamp: Date.now()
        },
        {
          type: 'marketing' as const,
          action: 'launch_campaign',
          parameters: { budget: 100000 }, // Invalid - exceeds cash
          timestamp: Date.now()
        }
      ];

      vi.spyOn(aiController['strategy'], 'execute_strategy').mockReturnValue(actions);
      const filteredActions = aiController.make_decisions(mockGameState);

      expect(filteredActions).toHaveLength(1);
      expect(filteredActions[0].parameters.budget).toBe(10000);
    });

    it('should filter menu actions based on menu limits', () => {
      // Fill up menu to near capacity
      mockRestaurant.menu = Array.from({ length: 10 }, (_, i) => ({
        id: `item${i}`,
        name: `Item ${i}`,
        price: 10,
        cost: 5,
        cookTime: 10,
        popularity: 50,
        profitMargin: 50,
        customerRating: 4.0
      }));

      const actions = [
        {
          type: 'menu' as const,
          action: 'add_item',
          parameters: { name: 'New Item', price: 10, cost: 5, cookTime: 15 },
          timestamp: Date.now()
        }
      ];

      vi.spyOn(aiController['strategy'], 'execute_strategy').mockReturnValue(actions);
      const filteredActions = aiController.make_decisions(mockGameState);

      expect(filteredActions).toHaveLength(0); // Should be filtered out
    });

    it('should filter staff hiring based on staff limits', () => {
      // Fill up staff to capacity
      mockRestaurant.staff = Array.from({ length: 5 }, (_, i) => ({
        id: `staff${i}`,
        name: `Chef ${i}`,
        type: 'chef' as const,
        salary: 500,
        efficiency: 1.0,
        experience: 50
      }));

      const actions = [
        {
          type: 'operations' as const,
          action: 'hire_staff',
          parameters: { staffType: 'chef' },
          timestamp: Date.now()
        }
      ];

      vi.spyOn(aiController['strategy'], 'execute_strategy').mockReturnValue(actions);
      const filteredActions = aiController.make_decisions(mockGameState);

      expect(filteredActions).toHaveLength(0); // Should be filtered out
    });

    it('should allow valid staff hiring', () => {
      mockRestaurant.staff = []; // Empty staff

      const actions = [
        {
          type: 'operations' as const,
          action: 'hire_staff',
          parameters: { staffType: 'chef' },
          timestamp: Date.now()
        }
      ];

      vi.spyOn(aiController['strategy'], 'execute_strategy').mockReturnValue(actions);
      const filteredActions = aiController.make_decisions(mockGameState);

      expect(filteredActions).toHaveLength(1);
    });

    it('should handle unknown action types', () => {
      const actions = [
        {
          type: 'unknown' as any,
          action: 'unknown_action',
          parameters: {},
          timestamp: Date.now()
        }
      ];

      vi.spyOn(aiController['strategy'], 'execute_strategy').mockReturnValue(actions);
      const filteredActions = aiController.make_decisions(mockGameState);

      expect(filteredActions).toHaveLength(1); // Unknown actions pass through
    });
  });

  describe('restaurant reference updates', () => {
    it('should update restaurant reference', () => {
      const newRestaurant = { ...mockRestaurant, id: 'new-id' };
      aiController.update_restaurant_reference(newRestaurant);
      expect(aiController.get_restaurant_id()).toBe('new-id');
    });
  });

  describe('cooldown management', () => {
    it('should respect action cooldown period', async () => {
      const mockActions = [
        {
          type: 'menu' as const,
          action: 'update_price',
          parameters: { itemId: 'item1', price: 12 },
          timestamp: Date.now()
        }
      ];

      vi.spyOn(aiController['strategy'], 'execute_strategy').mockReturnValue(mockActions);

      // First call should return actions
      const firstCall = aiController.make_decisions(mockGameState);
      expect(firstCall).toEqual(mockActions);

      // Second call immediately should return empty (cooldown)
      const secondCall = aiController.make_decisions(mockGameState);
      expect(secondCall).toEqual([]);

      // Mock time passing
      const originalDate = Date.now;
      Date.now = vi.fn(() => originalDate() + 6000); // 6 seconds later

      try {
        // Third call after cooldown should return actions again
        const thirdCall = aiController.make_decisions(mockGameState);
        expect(thirdCall).toEqual(mockActions);
      } finally {
        Date.now = originalDate;
      }
    });
  });
});