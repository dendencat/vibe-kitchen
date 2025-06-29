import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { GameEngine } from './GameEngine';

// Mock DOM elements needed for GameEngine
function setupMockDOM() {
  // Mock required DOM elements
  const mockElements = [
    'revenue-chart-canvas',
    'restaurant-canvas', 
    'day-counter',
    'time-remaining',
    'ranking-list',
    'cash-display',
    'customer-count',
    'satisfaction-display',
    'competitor-grid',
    'menu-items',
    'advice-content',
    'market-analysis-content'
  ];
  
  mockElements.forEach(id => {
    const element = document.createElement(id.includes('canvas') ? 'canvas' : 'div');
    element.id = id;
    if (id.includes('canvas')) {
      (element as HTMLCanvasElement).width = 600;
      (element as HTMLCanvasElement).height = 400;
    }
    document.body.appendChild(element);
  });
  
  // Mock form elements
  const formElements = [
    'add-menu-item',
    'menu-item-form',
    'item-name',
    'item-price', 
    'item-cost',
    'item-cooktime',
    'cancel-menu',
    'launch-campaign',
    'hire-staff',
    'upgrade-equipment',
    'restart-game',
    'menu-modal',
    'game-over',
    'final-results'
  ];
  
  formElements.forEach(id => {
    let element;
    if (id.includes('form')) {
      element = document.createElement('form');
    } else if (id.includes('item-') || id === 'item-name') {
      element = document.createElement('input');
    } else if (id.includes('modal') || id.includes('game-over')) {
      element = document.createElement('div');
      element.classList.add('hidden');
    } else {
      element = document.createElement('button');
    }
    element.id = id;
    document.body.appendChild(element);
  });
}

function cleanupMockDOM() {
  document.body.innerHTML = '';
}

describe('GameEngine Integration Tests', () => {
  let gameEngine: GameEngine;
  
  beforeEach(() => {
    vi.useFakeTimers();
    setupMockDOM();
  });
  
  afterEach(() => {
    cleanupMockDOM();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize game engine successfully', () => {
      expect(() => {
        gameEngine = new GameEngine();
      }).not.toThrow();
    });

    it('should create all necessary AI controllers', () => {
      gameEngine = new GameEngine();
      expect(gameEngine['aiControllers']).toHaveLength(5);
    });

    it('should initialize game state correctly', () => {
      gameEngine = new GameEngine();
      const state = gameEngine['gameStateManager'].get_state();
      
      expect(state.currentDay).toBe(1);
      expect(state.timeRemaining).toBe(60);
      expect(state.restaurants).toHaveLength(6); // 1 player + 5 AI
      expect(state.weatherCondition).toBe('sunny');
    });
  });

  describe('game loop execution', () => {
    it('should update game state every second', () => {
      gameEngine = new GameEngine();
      const initialTime = gameEngine['gameStateManager'].get_state().timeRemaining;
      
      // Advance time by 2 seconds
      vi.advanceTimersByTime(2000);
      
      const currentTime = gameEngine['gameStateManager'].get_state().timeRemaining;
      expect(currentTime).toBeLessThan(initialTime);
    });

    it('should advance to next day when time expires', () => {
      gameEngine = new GameEngine();
      
      // Fast forward through a full day
      vi.advanceTimersByTime(60000); // 60 seconds
      
      const state = gameEngine['gameStateManager'].get_state();
      expect(state.currentDay).toBe(2);
      expect(state.timeRemaining).toBe(60);
    });

    it('should end game after 7 days', () => {
      gameEngine = new GameEngine();
      
      // Fast forward through 7 full days
      vi.advanceTimersByTime(420000); // 7 minutes
      
      expect(gameEngine['isGameOver']).toBe(true);
    });
  });

  describe('AI decision making', () => {
    it('should process AI decisions during game loop', () => {
      gameEngine = new GameEngine();
      
      // Spy on AI decision making
      const makeDecisionsSpy = vi.spyOn(gameEngine['aiControllers'][0], 'make_decisions');
      
      // Advance time to trigger updates
      vi.advanceTimersByTime(1000);
      
      expect(makeDecisionsSpy).toHaveBeenCalled();
    });

    it('should handle AI errors gracefully', () => {
      gameEngine = new GameEngine();
      
      // Mock AI controller to throw error
      vi.spyOn(gameEngine['aiControllers'][0], 'make_decisions').mockImplementation(() => {
        throw new Error('AI Error');
      });
      
      // Should not crash the game
      expect(() => {
        vi.advanceTimersByTime(1000);
      }).not.toThrow();
    });
  });

  describe('player actions', () => {
    it('should execute menu actions successfully', () => {
      gameEngine = new GameEngine();
      
      const action = {
        type: 'menu' as const,
        action: 'add_item',
        parameters: {
          name: 'Test Item',
          price: 10,
          cost: 4,
          cookTime: 15
        },
        timestamp: Date.now()
      };
      
      expect(() => {
        gameEngine.execute_action('player', action);
      }).not.toThrow();
      
      const player = gameEngine['gameStateManager'].get_restaurant('player');
      expect(player?.menu.length).toBeGreaterThan(3); // Started with 3, now has more
    });

    it('should execute marketing actions successfully', () => {
      gameEngine = new GameEngine();
      
      const action = {
        type: 'marketing' as const,
        action: 'launch_campaign',
        parameters: {
          budget: 5000
        },
        timestamp: Date.now()
      };
      
      const initialCash = gameEngine['gameStateManager'].get_restaurant('player')?.cash || 0;
      
      gameEngine.execute_action('player', action);
      
      const finalCash = gameEngine['gameStateManager'].get_restaurant('player')?.cash || 0;
      expect(finalCash).toBe(initialCash - 5000);
    });

    it('should handle invalid actions gracefully', () => {
      gameEngine = new GameEngine();
      
      const invalidAction = {
        type: 'menu' as const,
        action: 'add_item',
        parameters: {
          name: '<script>evil</script>',
          price: -10, // Invalid price
          cost: 4,
          cookTime: 15
        },
        timestamp: Date.now()
      };
      
      expect(() => {
        gameEngine.execute_action('player', invalidAction);
      }).not.toThrow();
    });
  });

  describe('market events', () => {
    it('should process market events during game loop', () => {
      gameEngine = new GameEngine();
      
      // Mock random to ensure event generation
      const mockRandom = vi.spyOn(Math, 'random').mockReturnValue(0.05); // Low value to trigger events
      
      try {
        // Run for several seconds to allow event processing
        vi.advanceTimersByTime(10000);
        
        // Events might have been generated (depends on probability)
        const state = gameEngine['gameStateManager'].get_state();
        // Just verify the system runs without errors
        expect(state.marketEvents).toBeDefined();
      } finally {
        mockRandom.mockRestore();
      }
    });

    it('should handle weather changes during day transitions', () => {
      gameEngine = new GameEngine();
      
      const initialWeather = gameEngine['gameStateManager'].get_state().weatherCondition;
      
      // Advance to next day
      vi.advanceTimersByTime(60000);
      
      const newWeather = gameEngine['gameStateManager'].get_state().weatherCondition;
      // Weather should be one of the valid options
      expect(['sunny', 'rainy', 'cloudy']).toContain(newWeather);
    });
  });

  describe('restaurant operations', () => {
    it('should update customer counts and revenue', () => {
      gameEngine = new GameEngine();
      
      const initialState = gameEngine['gameStateManager'].get_state();
      const initialCustomers = initialState.restaurants[0].customerCount;
      const initialRevenue = initialState.restaurants[0].revenue;
      
      // Run for several seconds
      vi.advanceTimersByTime(5000);
      
      const finalState = gameEngine['gameStateManager'].get_state();
      const finalCustomers = finalState.restaurants[0].customerCount;
      const finalRevenue = finalState.restaurants[0].revenue;
      
      // Should have some customers and revenue (might be zero due to randomness)
      expect(finalCustomers).toBeGreaterThanOrEqual(initialCustomers);
      expect(finalRevenue).toBeGreaterThanOrEqual(initialRevenue);
    });

    it('should calculate market shares correctly', () => {
      gameEngine = new GameEngine();
      
      // Run the game for a bit
      vi.advanceTimersByTime(5000);
      
      const state = gameEngine['gameStateManager'].get_state();
      const totalShare = state.restaurants.reduce((sum, r) => sum + r.marketShare, 0);
      
      // Market shares should sum to approximately 100%
      expect(totalShare).toBeCloseTo(100, 0);
    });
  });

  describe('support AI integration', () => {
    it('should generate advice during game loop', () => {
      gameEngine = new GameEngine();
      
      // Spy on support AI advice generation
      const adviceSpy = vi.spyOn(gameEngine['supportAI'], 'generate_advice');
      
      // Run game loop
      vi.advanceTimersByTime(1000);
      
      expect(adviceSpy).toHaveBeenCalled();
    });

    it('should update advice display', () => {
      gameEngine = new GameEngine();
      
      // Spy on renderer advice update
      const updateAdviceSpy = vi.spyOn(gameEngine['renderer'], 'update_advice');
      
      // Run game loop
      vi.advanceTimersByTime(1000);
      
      expect(updateAdviceSpy).toHaveBeenCalled();
    });
  });

  describe('game completion', () => {
    it('should calculate final scores correctly', () => {
      gameEngine = new GameEngine();
      
      // Set up some game state
      const player = gameEngine['gameStateManager'].get_restaurant('player')!;
      player.marketShare = 30;
      player.revenue = 10000;
      player.satisfaction = 85;
      player.expenses = 5000;
      
      const score = gameEngine['calculate_final_score'](player);
      
      // Score should be calculated based on the formula
      const expectedScore = Math.round(
        30 * 1000 + // Market share points
        10000 * 0.1 + // Revenue points  
        85 * 100 + // Satisfaction points
        (10000 / 5000) * 50 // Efficiency points
      );
      
      expect(score).toBe(expectedScore);
    });

    it('should handle division by zero in score calculation', () => {
      gameEngine = new GameEngine();
      
      const restaurant = gameEngine['gameStateManager'].get_restaurant('player')!;
      restaurant.expenses = 0; // Zero expenses
      restaurant.revenue = 1000;
      
      expect(() => {
        gameEngine['calculate_final_score'](restaurant);
      }).not.toThrow();
    });

    it('should display game over screen when game ends', () => {
      gameEngine = new GameEngine();
      
      // Spy on renderer game over display
      const gameOverSpy = vi.spyOn(gameEngine['renderer'], 'show_game_over');
      
      // Fast forward to end of game
      vi.advanceTimersByTime(420000); // 7 minutes
      
      expect(gameOverSpy).toHaveBeenCalled();
    });
  });

  describe('autosave functionality', () => {
    it('should autosave game state periodically', () => {
      gameEngine = new GameEngine();
      
      // Spy on localStorage
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
      
      // Fast forward past autosave interval
      vi.advanceTimersByTime(30000); // 30 seconds
      
      expect(setItemSpy).toHaveBeenCalledWith(
        'ai-restaurant-battle-save',
        expect.any(String)
      );
    });

    it('should handle autosave errors gracefully', () => {
      gameEngine = new GameEngine();
      
      // Mock localStorage to throw error
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage full');
      });
      
      // Should not crash
      expect(() => {
        vi.advanceTimersByTime(30000);
      }).not.toThrow();
    });
  });

  describe('pause and resume functionality', () => {
    it('should pause and resume game correctly', () => {
      gameEngine = new GameEngine();
      
      const initialTime = gameEngine['gameStateManager'].get_state().timeRemaining;
      
      // Pause the game
      gameEngine.pause_game();
      expect(gameEngine['isPaused']).toBe(true);
      
      // Advance time while paused
      vi.advanceTimersByTime(5000);
      
      // Time should not have changed
      const pausedTime = gameEngine['gameStateManager'].get_state().timeRemaining;
      expect(pausedTime).toBe(initialTime);
      
      // Resume the game
      gameEngine.resume_game();
      expect(gameEngine['isPaused']).toBe(false);
      
      // Advance time while running
      vi.advanceTimersByTime(2000);
      
      // Time should now advance
      const resumedTime = gameEngine['gameStateManager'].get_state().timeRemaining;
      expect(resumedTime).toBeLessThan(initialTime);
    });
  });
});