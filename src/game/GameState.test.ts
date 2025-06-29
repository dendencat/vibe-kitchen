import { describe, it, expect, beforeEach } from 'vitest';
import { GameStateManager } from './GameState';
import { GAME_CONFIG, AI_RESTAURANT_NAMES } from '../utils/Constants';

describe('GameStateManager', () => {
  let gameStateManager: GameStateManager;

  beforeEach(() => {
    gameStateManager = new GameStateManager();
  });

  describe('initialization', () => {
    it('should initialize with correct game state', () => {
      const state = gameStateManager.get_state();
      
      expect(state.currentDay).toBe(1);
      expect(state.timeRemaining).toBe(60);
      expect(state.restaurants).toHaveLength(6); // 1 player + 5 AI
      expect(state.marketEvents).toEqual([]);
      expect(state.weatherCondition).toBe('sunny');
      expect(state.globalMarketTrends).toEqual([]);
    });

    it('should create player restaurant correctly', () => {
      const state = gameStateManager.get_state();
      const player = state.restaurants.find(r => r.type === 'player');
      
      expect(player).toBeDefined();
      expect(player?.id).toBe('player');
      expect(player?.name).toBe('Your Restaurant');
      expect(player?.cash).toBe(GAME_CONFIG.startingCash);
      expect(player?.satisfaction).toBe(100);
      expect(player?.marketShare).toBe(16.67); // 100/6 restaurants
      expect(player?.menu).toHaveLength(3);
      expect(player?.staff).toHaveLength(2);
    });

    it('should create AI restaurants correctly', () => {
      const state = gameStateManager.get_state();
      const aiRestaurants = state.restaurants.filter(r => r.type === 'ai');
      
      expect(aiRestaurants).toHaveLength(5);
      
      const expectedTypes = ['aggressive', 'strategic', 'emotional', 'speed', 'balanced'];
      expectedTypes.forEach(type => {
        const aiRestaurant = aiRestaurants.find(r => r.strategyType === type);
        expect(aiRestaurant).toBeDefined();
        expect(aiRestaurant?.name).toBe(AI_RESTAURANT_NAMES[type as keyof typeof AI_RESTAURANT_NAMES]);
        expect(aiRestaurant?.cash).toBe(GAME_CONFIG.startingCash);
        expect(aiRestaurant?.satisfaction).toBe(100);
      });
    });

    it('should create starting menu items correctly', () => {
      const state = gameStateManager.get_state();
      const player = state.restaurants.find(r => r.type === 'player')!;
      
      expect(player.menu).toHaveLength(3);
      
      const burger = player.menu.find(item => item.name === 'Classic Burger');
      expect(burger).toBeDefined();
      expect(burger?.price).toBe(12.99);
      expect(burger?.cost).toBe(4.50);
      expect(burger?.cookTime).toBe(15);
      expect(burger?.popularity).toBe(50);
      expect(burger?.customerRating).toBe(4.0);
    });

    it('should create starting staff correctly', () => {
      const state = gameStateManager.get_state();
      const player = state.restaurants.find(r => r.type === 'player')!;
      
      expect(player.staff).toHaveLength(2);
      
      const chef = player.staff.find(s => s.type === 'chef');
      expect(chef).toBeDefined();
      expect(chef?.name).toBe('Head Chef');
      expect(chef?.salary).toBe(500);
      
      const waiter = player.staff.find(s => s.type === 'waiter');
      expect(waiter).toBeDefined();
      expect(waiter?.name).toBe('Server');
      expect(waiter?.salary).toBe(300);
    });
  });

  describe('state management', () => {
    it('should update state correctly', () => {
      const updates = {
        currentDay: 2,
        timeRemaining: 30,
        weatherCondition: 'rainy' as const
      };
      
      gameStateManager.update_state(updates);
      const state = gameStateManager.get_state();
      
      expect(state.currentDay).toBe(2);
      expect(state.timeRemaining).toBe(30);
      expect(state.weatherCondition).toBe('rainy');
    });

    it('should get restaurant by id', () => {
      const player = gameStateManager.get_restaurant('player');
      expect(player).toBeDefined();
      expect(player?.type).toBe('player');
      
      const nonExistent = gameStateManager.get_restaurant('non-existent');
      expect(nonExistent).toBeUndefined();
    });

    it('should update restaurant correctly', () => {
      const updates = {
        cash: 60000,
        satisfaction: 95,
        customerCount: 50
      };
      
      gameStateManager.update_restaurant('player', updates);
      const player = gameStateManager.get_restaurant('player');
      
      expect(player?.cash).toBe(60000);
      expect(player?.satisfaction).toBe(95);
      expect(player?.customerCount).toBe(50);
    });

    it('should not update non-existent restaurant', () => {
      gameStateManager.update_restaurant('non-existent', { cash: 1000 });
      const restaurant = gameStateManager.get_restaurant('non-existent');
      expect(restaurant).toBeUndefined();
    });
  });

  describe('market events', () => {
    it('should add market event', () => {
      const event = {
        id: 'test-event',
        name: 'Test Event',
        description: 'Test description',
        effect: { customerMultiplier: 1.5 },
        duration: 2,
        probability: 0.1
      };
      
      gameStateManager.add_market_event(event);
      const state = gameStateManager.get_state();
      
      expect(state.marketEvents).toHaveLength(1);
      expect(state.marketEvents[0]).toEqual(event);
    });

    it('should remove expired events', () => {
      const expiredEvent = {
        id: 'expired',
        name: 'Expired Event',
        description: 'Expired',
        effect: {},
        duration: 0,
        probability: 0.1
      };
      
      const activeEvent = {
        id: 'active',
        name: 'Active Event',
        description: 'Active',
        effect: {},
        duration: 1,
        probability: 0.1
      };
      
      gameStateManager.add_market_event(expiredEvent);
      gameStateManager.add_market_event(activeEvent);
      gameStateManager.remove_expired_events();
      
      const state = gameStateManager.get_state();
      expect(state.marketEvents).toHaveLength(1);
      expect(state.marketEvents[0].id).toBe('active');
    });
  });

  describe('market share calculation', () => {
    it('should calculate market shares correctly', () => {
      // Set different customer counts
      gameStateManager.update_restaurant('player', { customerCount: 100 });
      
      const state = gameStateManager.get_state();
      const aiRestaurants = state.restaurants.filter(r => r.type === 'ai');
      aiRestaurants.forEach((restaurant, index) => {
        gameStateManager.update_restaurant(restaurant.id, { customerCount: 50 + (index * 10) });
      });
      
      gameStateManager.calculate_market_shares();
      const updatedState = gameStateManager.get_state();
      
      const totalCustomers = updatedState.restaurants.reduce((sum, r) => sum + r.customerCount, 0);
      const playerShare = updatedState.restaurants.find(r => r.type === 'player')?.marketShare;
      
      expect(playerShare).toBeCloseTo((100 / totalCustomers) * 100, 1);
      
      // Verify all shares sum to 100%
      const totalShares = updatedState.restaurants.reduce((sum, r) => sum + r.marketShare, 0);
      expect(totalShares).toBeCloseTo(100, 1);
    });

    it('should handle zero customers scenario', () => {
      // All restaurants have 0 customers
      const state = gameStateManager.get_state();
      state.restaurants.forEach(restaurant => {
        gameStateManager.update_restaurant(restaurant.id, { customerCount: 0 });
      });
      
      gameStateManager.calculate_market_shares();
      const updatedState = gameStateManager.get_state();
      
      // Each restaurant should have equal share
      updatedState.restaurants.forEach(restaurant => {
        expect(restaurant.marketShare).toBeCloseTo(16.67, 1);
      });
    });
  });

  describe('profit margin calculation', () => {
    it('should calculate profit margins for menu items', () => {
      const state = gameStateManager.get_state();
      const player = state.restaurants.find(r => r.type === 'player')!;
      
      player.menu.forEach(item => {
        const expectedMargin = ((item.price - item.cost) / item.price) * 100;
        expect(item.profitMargin).toBeCloseTo(expectedMargin, 2);
      });
    });
  });
});