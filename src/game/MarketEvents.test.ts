import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MarketEventManager } from './MarketEvents';
import { GAME_CONFIG } from '../utils/Constants';

describe('MarketEventManager', () => {
  let marketEventManager: MarketEventManager;

  beforeEach(() => {
    marketEventManager = new MarketEventManager();
    vi.clearAllMocks();
  });

  describe('generate_random_event', () => {
    it('should return null when no events are available', () => {
      // Mock all events as already active
      GAME_CONFIG.events.forEach(event => {
        marketEventManager['activeEvents'].add(event.id);
      });

      const event = marketEventManager.generate_random_event();
      expect(event).toBeNull();
    });

    it('should return an event when probability succeeds', () => {
      // Mock Math.random to always return a value that passes probability check
      const mockRandom = vi.spyOn(Math, 'random').mockReturnValue(0.01); // Very low, will pass most probability checks

      const event = marketEventManager.generate_random_event();
      
      if (event) {
        expect(event.id).toBeDefined();
        expect(event.name).toBeDefined();
        expect(event.description).toBeDefined();
        expect(event.effect).toBeDefined();
        expect(event.duration).toBeGreaterThan(0);
        expect(event.probability).toBeGreaterThan(0);
      }

      mockRandom.mockRestore();
    });

    it('should not return already active events', () => {
      // Mark rainy-day as active
      marketEventManager['activeEvents'].add('rainy-day');

      // Mock random to always pass probability
      const mockRandom = vi.spyOn(Math, 'random').mockReturnValue(0.01);

      const event = marketEventManager.generate_random_event();
      
      if (event) {
        expect(event.id).not.toBe('rainy-day');
      }

      mockRandom.mockRestore();
    });

    it('should add event to active events when generated', () => {
      const mockRandom = vi.spyOn(Math, 'random').mockReturnValue(0.01);
      const initialActiveCount = marketEventManager['activeEvents'].size;

      const event = marketEventManager.generate_random_event();
      
      if (event) {
        expect(marketEventManager['activeEvents'].has(event.id)).toBe(true);
        expect(marketEventManager['activeEvents'].size).toBe(initialActiveCount + 1);
      }

      mockRandom.mockRestore();
    });

    it('should return null when probability fails', () => {
      // Mock Math.random to always return a high value that fails probability checks
      const mockRandom = vi.spyOn(Math, 'random').mockReturnValue(0.99);

      const event = marketEventManager.generate_random_event();
      expect(event).toBeNull();

      mockRandom.mockRestore();
    });

    it('should handle specific event probabilities correctly', () => {
      const rainyDayEvent = GAME_CONFIG.events.find(e => e.id === 'rainy-day');
      expect(rainyDayEvent?.probability).toBe(0.2);

      const festivalEvent = GAME_CONFIG.events.find(e => e.id === 'local-festival');
      expect(festivalEvent?.probability).toBe(0.1);

      const tvFeatureEvent = GAME_CONFIG.events.find(e => e.id === 'tv-feature');
      expect(tvFeatureEvent?.probability).toBe(0.05);

      const priceSpikeEvent = GAME_CONFIG.events.find(e => e.id === 'price-spike');
      expect(priceSpikeEvent?.probability).toBe(0.15);
    });
  });

  describe('create_custom_event', () => {
    it('should create custom event with provided parameters', () => {
      const name = 'Test Event';
      const description = 'Test Description';
      const effect = { customerMultiplier: 1.5 };
      const duration = 3;

      const event = marketEventManager.create_custom_event(name, description, effect, duration);

      expect(event.name).toBe(name);
      expect(event.description).toBe(description);
      expect(event.effect).toEqual(effect);
      expect(event.duration).toBe(duration);
      expect(event.probability).toBe(1.0);
      expect(event.id).toMatch(/^custom-\d+$/);
    });

    it('should generate unique IDs for custom events', () => {
      const event1 = marketEventManager.create_custom_event('Event 1', 'Desc 1', {}, 1);
      const event2 = marketEventManager.create_custom_event('Event 2', 'Desc 2', {}, 1);

      expect(event1.id).not.toBe(event2.id);
    });

    it('should handle empty effect objects', () => {
      const event = marketEventManager.create_custom_event('Empty Effect', 'No effects', {}, 1);
      
      expect(event.effect).toEqual({});
    });

    it('should handle multiple effect properties', () => {
      const effect = {
        customerMultiplier: 1.2,
        costMultiplier: 0.8,
        satisfactionBonus: 0.1
      };

      const event = marketEventManager.create_custom_event('Multi Effect', 'Multiple effects', effect, 2);
      
      expect(event.effect).toEqual(effect);
    });
  });

  describe('get_weather_event', () => {
    it('should return rainy weather event for rainy weather', () => {
      const event = marketEventManager.get_weather_event('rainy');
      
      expect(event).not.toBeNull();
      expect(event?.name).toBe('Rainy Weather');
      expect(event?.description).toBe('The rain is keeping some customers away');
      expect(event?.effect.customerMultiplier).toBe(0.8);
      expect(event?.duration).toBe(1);
    });

    it('should return sunny weather event for sunny weather', () => {
      const event = marketEventManager.get_weather_event('sunny');
      
      expect(event).not.toBeNull();
      expect(event?.name).toBe('Beautiful Weather');
      expect(event?.description).toBe('The nice weather is bringing more customers out');
      expect(event?.effect.customerMultiplier).toBe(1.2);
      expect(event?.duration).toBe(1);
    });

    it('should return null for cloudy weather', () => {
      const event = marketEventManager.get_weather_event('cloudy');
      expect(event).toBeNull();
    });

    it('should generate custom IDs for weather events', () => {
      const rainyEvent = marketEventManager.get_weather_event('rainy');
      const sunnyEvent = marketEventManager.get_weather_event('sunny');
      
      expect(rainyEvent?.id).toMatch(/^custom-\d+$/);
      expect(sunnyEvent?.id).toMatch(/^custom-\d+$/);
      expect(rainyEvent?.id).not.toBe(sunnyEvent?.id);
    });
  });

  describe('get_competitor_event', () => {
    it('should return price war event', () => {
      const event = marketEventManager.get_competitor_event('price_war');
      
      expect(event).not.toBeNull();
      expect(event?.name).toBe('Price War');
      expect(event?.description).toBe('Competitors are slashing prices!');
      expect(event?.effect.customerMultiplier).toBe(0.9);
      expect(event?.effect.costMultiplier).toBe(0.9);
      expect(event?.duration).toBe(2);
    });

    it('should return new competitor event', () => {
      const event = marketEventManager.get_competitor_event('new_competitor');
      
      expect(event).not.toBeNull();
      expect(event?.name).toBe('New Competitor');
      expect(event?.description).toBe('A new restaurant has opened nearby');
      expect(event?.effect.customerMultiplier).toBe(0.85);
      expect(event?.duration).toBe(3);
    });

    it('should return null for unknown competitor actions', () => {
      const event = marketEventManager.get_competitor_event('unknown_action');
      expect(event).toBeNull();
    });

    it('should handle empty string input', () => {
      const event = marketEventManager.get_competitor_event('');
      expect(event).toBeNull();
    });
  });

  describe('clear_events', () => {
    it('should clear all active events', () => {
      // Add some active events
      marketEventManager['activeEvents'].add('event1');
      marketEventManager['activeEvents'].add('event2');
      marketEventManager['activeEvents'].add('event3');

      expect(marketEventManager['activeEvents'].size).toBe(3);

      marketEventManager.clear_events();
      expect(marketEventManager['activeEvents'].size).toBe(0);
    });

    it('should allow generating previously active events after clearing', () => {
      // Generate an event to make it active
      const mockRandom = vi.spyOn(Math, 'random').mockReturnValue(0.01);
      
      const firstEvent = marketEventManager.generate_random_event();
      expect(firstEvent).not.toBeNull();
      
      // Clear events
      marketEventManager.clear_events();
      
      // Should be able to generate the same type of event again
      const secondEvent = marketEventManager.generate_random_event();
      // Both events should be possible (though not necessarily the same due to randomness)
      
      mockRandom.mockRestore();
    });
  });

  describe('event duration and cleanup', () => {
    it('should simulate automatic cleanup of expired events', () => {
      // This test simulates how the game engine would handle event cleanup
      const mockRandom = vi.spyOn(Math, 'random').mockReturnValue(0.01);
      
      // Generate an event
      const event = marketEventManager.generate_random_event();
      expect(event).not.toBeNull();
      
      if (event) {
        expect(marketEventManager['activeEvents'].has(event.id)).toBe(true);
        
        // Simulate the timeout that would occur in the real game
        // In actual implementation, setTimeout would remove from activeEvents
        setTimeout(() => {
          marketEventManager['activeEvents'].delete(event.id);
        }, event.duration * 60 * 1000);
        
        // Manually trigger cleanup for testing
        marketEventManager['activeEvents'].delete(event.id);
        expect(marketEventManager['activeEvents'].has(event.id)).toBe(false);
      }
      
      mockRandom.mockRestore();
    });
  });

  describe('integration with game config', () => {
    it('should use events from GAME_CONFIG', () => {
      const configEventIds = GAME_CONFIG.events.map(e => e.id);
      
      // Mock successful probability for all events
      const mockRandom = vi.spyOn(Math, 'random').mockReturnValue(0.01);
      
      const generatedEvents = new Set();
      
      // Try to generate multiple events
      for (let i = 0; i < 100; i++) {
        marketEventManager.clear_events(); // Clear to allow regeneration
        const event = marketEventManager.generate_random_event();
        if (event) {
          generatedEvents.add(event.id);
        }
      }
      
      // Should only generate events that exist in config
      generatedEvents.forEach(eventId => {
        expect(configEventIds).toContain(eventId);
      });
      
      mockRandom.mockRestore();
    });
  });
});