import { describe, it, expect } from 'vitest';
import { GAME_CONFIG, GAME_CONSTANTS, AI_RESTAURANT_NAMES, STARTING_MENU_ITEMS } from './Constants';

describe('Constants', () => {
  describe('GAME_CONFIG', () => {
    it('should have valid starting conditions', () => {
      expect(GAME_CONFIG.startingCash).toBe(50000);
      expect(GAME_CONFIG.startingMenu).toBe(3);
      expect(GAME_CONFIG.startingStaff).toBe(2);
      
      expect(GAME_CONFIG.startingCash).toBeGreaterThan(0);
      expect(GAME_CONFIG.startingMenu).toBeGreaterThan(0);
      expect(GAME_CONFIG.startingStaff).toBeGreaterThan(0);
    });

    it('should have valid daily costs', () => {
      expect(GAME_CONFIG.rentCost).toBe(2000);
      expect(GAME_CONFIG.utilityCost).toBe(500);
      expect(GAME_CONFIG.staffCostPerDay).toBe(1000);
      
      expect(GAME_CONFIG.rentCost).toBeGreaterThan(0);
      expect(GAME_CONFIG.utilityCost).toBeGreaterThan(0);
      expect(GAME_CONFIG.staffCostPerDay).toBeGreaterThan(0);
    });

    it('should have valid market parameters', () => {
      expect(GAME_CONFIG.maxDailyCustomers).toBe(200);
      expect(GAME_CONFIG.baseCustomerArrival).toBe(50);
      expect(GAME_CONFIG.satisfactionDecayRate).toBe(0.05);
      
      expect(GAME_CONFIG.maxDailyCustomers).toBeGreaterThan(GAME_CONFIG.baseCustomerArrival);
      expect(GAME_CONFIG.satisfactionDecayRate).toBeGreaterThan(0);
      expect(GAME_CONFIG.satisfactionDecayRate).toBeLessThan(1);
    });

    it('should have valid AI efficiency settings', () => {
      expect(GAME_CONFIG.aiEfficiency.easy).toBe(0.8);
      expect(GAME_CONFIG.aiEfficiency.normal).toBe(1.0);
      expect(GAME_CONFIG.aiEfficiency.hard).toBe(1.2);
      
      expect(GAME_CONFIG.aiEfficiency.easy).toBeLessThan(GAME_CONFIG.aiEfficiency.normal);
      expect(GAME_CONFIG.aiEfficiency.normal).toBeLessThan(GAME_CONFIG.aiEfficiency.hard);
    });

    it('should have valid market events', () => {
      expect(GAME_CONFIG.events).toHaveLength(4);
      
      GAME_CONFIG.events.forEach(event => {
        expect(event.id).toBeDefined();
        expect(event.name).toBeDefined();
        expect(event.description).toBeDefined();
        expect(event.effect).toBeDefined();
        expect(event.duration).toBeGreaterThan(0);
        expect(event.probability).toBeGreaterThan(0);
        expect(event.probability).toBeLessThanOrEqual(1);
      });
    });

    it('should have market events with valid effects', () => {
      const rainyDay = GAME_CONFIG.events.find(e => e.id === 'rainy-day');
      expect(rainyDay?.effect.customerMultiplier).toBe(0.7);
      
      const festival = GAME_CONFIG.events.find(e => e.id === 'local-festival');
      expect(festival?.effect.customerMultiplier).toBe(1.5);
      
      const tvFeature = GAME_CONFIG.events.find(e => e.id === 'tv-feature');
      expect(tvFeature?.effect.satisfactionBonus).toBe(0.3);
      
      const priceSpike = GAME_CONFIG.events.find(e => e.id === 'price-spike');
      expect(priceSpike?.effect.costMultiplier).toBe(1.3);
    });
  });

  describe('GAME_CONSTANTS', () => {
    it('should have valid game duration settings', () => {
      expect(GAME_CONSTANTS.GAME_DURATION_SECONDS).toBe(420);
      expect(GAME_CONSTANTS.SECONDS_PER_DAY).toBe(60);
      expect(GAME_CONSTANTS.DAYS_PER_GAME).toBe(7);
      
      expect(GAME_CONSTANTS.GAME_DURATION_SECONDS).toBe(
        GAME_CONSTANTS.SECONDS_PER_DAY * GAME_CONSTANTS.DAYS_PER_GAME
      );
    });

    it('should have valid technical settings', () => {
      expect(GAME_CONSTANTS.UPDATE_INTERVAL_MS).toBe(1000);
      expect(GAME_CONSTANTS.RENDER_FPS).toBe(60);
      expect(GAME_CONSTANTS.AUTOSAVE_INTERVAL_MS).toBe(30000);
      
      expect(GAME_CONSTANTS.UPDATE_INTERVAL_MS).toBeGreaterThan(0);
      expect(GAME_CONSTANTS.RENDER_FPS).toBeGreaterThan(0);
      expect(GAME_CONSTANTS.AUTOSAVE_INTERVAL_MS).toBeGreaterThan(GAME_CONSTANTS.UPDATE_INTERVAL_MS);
    });

    it('should have valid game limits', () => {
      expect(GAME_CONSTANTS.MAX_MENU_ITEMS).toBe(10);
      expect(GAME_CONSTANTS.MAX_STAFF_PER_TYPE).toBe(5);
      expect(GAME_CONSTANTS.MIN_SATISFACTION).toBe(0);
      expect(GAME_CONSTANTS.MAX_SATISFACTION).toBe(100);
      
      expect(GAME_CONSTANTS.MAX_MENU_ITEMS).toBeGreaterThan(0);
      expect(GAME_CONSTANTS.MAX_STAFF_PER_TYPE).toBeGreaterThan(0);
      expect(GAME_CONSTANTS.MIN_SATISFACTION).toBeLessThan(GAME_CONSTANTS.MAX_SATISFACTION);
    });
  });

  describe('AI_RESTAURANT_NAMES', () => {
    it('should have names for all AI strategies', () => {
      expect(AI_RESTAURANT_NAMES.aggressive).toBe('Fire Grill');
      expect(AI_RESTAURANT_NAMES.strategic).toBe('Wisdom Table');
      expect(AI_RESTAURANT_NAMES.emotional).toBe('Hospitality House');
      expect(AI_RESTAURANT_NAMES.speed).toBe('Lightning Kitchen');
      expect(AI_RESTAURANT_NAMES.balanced).toBe('Harmony Restaurant');
    });

    it('should have unique names', () => {
      const names = Object.values(AI_RESTAURANT_NAMES);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(names.length);
    });

    it('should have non-empty names', () => {
      Object.values(AI_RESTAURANT_NAMES).forEach(name => {
        expect(name).toBeDefined();
        expect(name.length).toBeGreaterThan(0);
        expect(typeof name).toBe('string');
      });
    });
  });

  describe('STARTING_MENU_ITEMS', () => {
    it('should have correct number of items', () => {
      expect(STARTING_MENU_ITEMS).toHaveLength(3);
    });

    it('should have valid menu item structure', () => {
      STARTING_MENU_ITEMS.forEach(item => {
        expect(item.name).toBeDefined();
        expect(item.price).toBeGreaterThan(0);
        expect(item.cost).toBeGreaterThan(0);
        expect(item.cookTime).toBeGreaterThan(0);
        expect(item.price).toBeGreaterThan(item.cost); // Should be profitable
      });
    });

    it('should have reasonable pricing', () => {
      STARTING_MENU_ITEMS.forEach(item => {
        expect(item.price).toBeLessThan(100); // Reasonable restaurant prices
        expect(item.cost).toBeLessThan(item.price); // Profitable
        expect(item.cookTime).toBeLessThan(60); // Reasonable cooking time
      });
    });

    it('should have specific expected items', () => {
      const burger = STARTING_MENU_ITEMS.find(item => item.name === 'Classic Burger');
      expect(burger).toBeDefined();
      expect(burger?.price).toBe(12.99);
      expect(burger?.cost).toBe(4.50);
      expect(burger?.cookTime).toBe(15);

      const salad = STARTING_MENU_ITEMS.find(item => item.name === 'Caesar Salad');
      expect(salad).toBeDefined();
      expect(salad?.price).toBe(8.99);
      expect(salad?.cost).toBe(2.50);
      expect(salad?.cookTime).toBe(5);

      const chicken = STARTING_MENU_ITEMS.find(item => item.name === 'Grilled Chicken');
      expect(chicken).toBeDefined();
      expect(chicken?.price).toBe(15.99);
      expect(chicken?.cost).toBe(6.00);
      expect(chicken?.cookTime).toBe(20);
    });
  });
});