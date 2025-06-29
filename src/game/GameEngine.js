import { GameStateManager } from './GameState.js';
import { AIController } from '../ai/AIController.js';
import { GameRenderer } from '../ui/GameRenderer.js';
import { InputHandler } from '../ui/InputHandler.js';
import { SecurityValidator } from '../utils/SecurityValidator.js';
import { GAME_CONSTANTS, GAME_CONFIG } from '../utils/Constants.js';
import { MarketEventManager } from './MarketEvents.js';
import { SupportAI } from '../ai/SupportAI.js';
import { MathUtils } from '../utils/MathUtils.js';

export class GameEngine {
  constructor() {
    this.aiControllers = [];
    this.lastUpdateTime = 0;
    this.accumulatedTime = 0;
    this.gameStartTime = 0;
    this.isPaused = false;
    this.isGameOver = false;
    
    this.gameStateManager = new GameStateManager();
    this.renderer = new GameRenderer();
    this.inputHandler = new InputHandler(this);
    this.marketEventManager = new MarketEventManager();
    this.supportAI = new SupportAI();
    
    this.initialize_game();
  }
  
  initialize_game() {
    // Initialize AI controllers
    const state = this.gameStateManager.get_state();
    const aiRestaurants = state.restaurants.filter(r => r.type === 'ai');
    
    aiRestaurants.forEach(restaurant => {
      this.aiControllers.push(new AIController(restaurant));
    });
    
    // Set up event listeners
    this.setup_event_listeners();
    
    // Start the game loop
    this.gameStartTime = Date.now();
    this.start_game_loop();
    
    // Set up autosave
    setInterval(() => this.auto_save(), GAME_CONSTANTS.AUTOSAVE_INTERVAL_MS);
  }
  
  setup_event_listeners() {
    this.inputHandler.initialize();
  }
  
  start_game_loop() {
    const loop = (currentTime) => {
      if (this.isGameOver) return;
      
      const deltaTime = currentTime - this.lastUpdateTime;
      this.lastUpdateTime = currentTime;
      
      if (!this.isPaused) {
        this.accumulatedTime += deltaTime;
        
        // Update game state at fixed intervals
        while (this.accumulatedTime >= GAME_CONSTANTS.UPDATE_INTERVAL_MS) {
          this.update_game_state();
          this.accumulatedTime -= GAME_CONSTANTS.UPDATE_INTERVAL_MS;
        }
      }
      
      // Render at 60 FPS
      this.renderer.render(this.gameStateManager.get_state());
      
      requestAnimationFrame(loop);
    };
    
    requestAnimationFrame(loop);
  }
  
  update_game_state() {
    const state = this.gameStateManager.get_state();
    
    // Update time
    const newTimeRemaining = state.timeRemaining - 1;
    
    if (newTimeRemaining <= 0) {
      // Move to next day
      if (state.currentDay > GAME_CONSTANTS.DAYS_PER_GAME) {
        this.end_game();
        return;
      }
      
      this.advance_to_next_day();
    } else {
      this.gameStateManager.update_state({ timeRemaining: newTimeRemaining });
    }
    
    // Process AI decisions
    this.process_ai_actions();
    
    // Update restaurant operations
    this.update_restaurant_operations();
    
    // Handle market events
    this.process_market_events();
    
    // Update market shares
    this.gameStateManager.calculate_market_shares();
    
    // Get advice from Support AI
    const advice = this.supportAI.generate_advice(state);
    this.renderer.update_advice(advice);
  }
  
  process_ai_actions() {
    const state = this.gameStateManager.get_state();
    
    this.aiControllers.forEach(controller => {
      const actions = controller.make_decisions(state);
      actions.forEach(action => this.execute_action(controller.get_restaurant_id(), action));
    });
  }
  
  update_restaurant_operations() {
    const state = this.gameStateManager.get_state();
    
    state.restaurants.forEach(restaurant => {
      // Calculate customer arrivals
      const baseCustomers = GAME_CONFIG.baseCustomerArrival;
      const marketEventMultiplier = this.calculate_event_multiplier('customerMultiplier');
      const satisfactionMultiplier = restaurant.satisfaction / 100;
      const weatherMultiplier = state.weatherCondition === 'rainy' ? 0.8 : 1.0;
      
      const newCustomers = Math.floor(
        baseCustomers * marketEventMultiplier * satisfactionMultiplier * weatherMultiplier * restaurant.efficiency
      );
      
      // Calculate revenue
      const averageOrderValue = this.calculate_average_order_value(restaurant);
      const revenue = newCustomers * averageOrderValue;
      
      // Calculate expenses
      const staffCosts = restaurant.staff.reduce((sum, s) => sum + s.salary, 0) / GAME_CONSTANTS.SECONDS_PER_DAY;
      const operatingCosts = (GAME_CONFIG.rentCost + GAME_CONFIG.utilityCost) / GAME_CONSTANTS.SECONDS_PER_DAY;
      const expenses = staffCosts + operatingCosts;
      
      // Update restaurant
      this.gameStateManager.update_restaurant(restaurant.id, {
        customerCount: restaurant.customerCount + newCustomers,
        revenue: restaurant.revenue + revenue,
        expenses: restaurant.expenses + expenses,
        cash: restaurant.cash + revenue - expenses,
        dailyProfit: revenue - expenses
      });
      
      // Update satisfaction (slowly decays)
      const newSatisfaction = Math.max(
        0,
        restaurant.satisfaction - GAME_CONFIG.satisfactionDecayRate
      );
      this.gameStateManager.update_restaurant(restaurant.id, {
        satisfaction: newSatisfaction
      });
    });
  }
  
  calculate_event_multiplier(effectType) {
    const state = this.gameStateManager.get_state();
    let multiplier = 1.0;
    
    state.marketEvents.forEach(event => {
      if (event.effect[effectType]) {
        multiplier *= event.effect[effectType];
      }
    });
    
    return multiplier;
  }
  
  calculate_average_order_value(restaurant) {
    if (restaurant.menu.length === 0) return 0;
    
    const totalValue = restaurant.menu.reduce((sum, item) => {
      const popularity = item.popularity / 100;
      return sum + (item.price * popularity);
    }, 0);
    
    return totalValue / restaurant.menu.length;
  }
  
  process_market_events() {
    const state = this.gameStateManager.get_state();
    
    // Random chance for new events
    if (Math.random() < 0.1) { // 10% chance per second
      const newEvent = this.marketEventManager.generate_random_event();
      if (newEvent) {
        this.gameStateManager.add_market_event(newEvent);
      }
    }
    
    // Update event durations
    state.marketEvents.forEach(event => {
      event.duration -= 1 / GAME_CONSTANTS.SECONDS_PER_DAY;
    });
    
    // Remove expired events
    this.gameStateManager.remove_expired_events();
  }
  
  advance_to_next_day() {
    const state = this.gameStateManager.get_state();
    
    // Reset daily values
    state.restaurants.forEach(restaurant => {
      this.gameStateManager.update_restaurant(restaurant.id, {
        dailyProfit: 0
      });
    });
    
    // Move to next day
    this.gameStateManager.update_state({
      currentDay: state.currentDay + 1,
      timeRemaining: GAME_CONSTANTS.SECONDS_PER_DAY
    });
    
    // Change weather randomly
    const weathers = ['sunny', 'rainy', 'cloudy'];
    const newWeather = weathers[MathUtils.random_int(0, 2)];
    this.gameStateManager.update_state({ weatherCondition: newWeather });
  }
  
  execute_action(restaurantId, action) {
    try {
      const restaurant = this.gameStateManager.get_restaurant(restaurantId);
      if (!restaurant) return;
      
      switch (action.type) {
        case 'menu':
          this.handle_menu_action(restaurant, action);
          break;
        case 'marketing':
          this.handle_marketing_action(restaurant, action);
          break;
        case 'operations':
          this.handle_operations_action(restaurant, action);
          break;
      }
    } catch (error) {
      console.error('Error executing action:', error);
    }
  }
  
  handle_menu_action(restaurant, action) {
    // Implementation for menu actions
    switch (action.action) {
      case 'add_item':
        const validatedItem = SecurityValidator.validate_menu_item_input(action.parameters);
        const newItem = {
          id: `menu-${Date.now()}`,
          ...validatedItem,
          popularity: 50,
          profitMargin: MathUtils.calculate_profit_margin(validatedItem.price, validatedItem.cost),
          customerRating: 4.0
        };
        restaurant.menu.push(newItem);
        break;
      
      case 'remove_item':
        restaurant.menu = restaurant.menu.filter(item => item.id !== action.parameters.itemId);
        break;
      
      case 'update_price':
        const item = restaurant.menu.find(i => i.id === action.parameters.itemId);
        if (item) {
          item.price = SecurityValidator.validate_number(action.parameters.price, 1, 1000);
          item.profitMargin = MathUtils.calculate_profit_margin(item.price, item.cost);
        }
        break;
    }
  }
  
  handle_marketing_action(restaurant, action) {
    // Implementation for marketing actions
    const cost = SecurityValidator.validate_number(action.parameters.budget, 0, restaurant.cash);
    restaurant.cash -= cost;
    restaurant.expenses += cost;
    
    // Boost satisfaction based on campaign
    const boost = cost / 1000; // $1000 = 1% boost
    restaurant.satisfaction = Math.min(100, restaurant.satisfaction + boost);
  }
  
  handle_operations_action(restaurant, action) {
    // Implementation for operations actions
    switch (action.action) {
      case 'hire_staff':
        // Add new staff member
        break;
      case 'upgrade_equipment':
        // Upgrade equipment
        break;
    }
  }
  
  end_game() {
    this.isGameOver = true;
    const state = this.gameStateManager.get_state();
    
    // Calculate final scores
    const results = state.restaurants.map(restaurant => ({
      name: restaurant.name,
      score: this.calculate_final_score(restaurant),
      marketShare: restaurant.marketShare,
      revenue: restaurant.revenue,
      satisfaction: restaurant.satisfaction
    }));
    
    // Sort by score
    results.sort((a, b) => b.score - a.score);
    
    // Display results
    this.renderer.show_game_over(results);
  }
  
  calculate_final_score(restaurant) {
    const marketSharePoints = restaurant.marketShare * 1000;
    const revenuePoints = restaurant.revenue * 0.1;
    const satisfactionPoints = restaurant.satisfaction * 100;
    const efficiencyPoints = (restaurant.revenue / Math.max(1, restaurant.expenses)) * 50;
    
    return Math.round(marketSharePoints + revenuePoints + satisfactionPoints + efficiencyPoints);
  }
  
  auto_save() {
    // Implement autosave functionality
    localStorage.setItem('ai-restaurant-battle-save', JSON.stringify(this.gameStateManager.get_state()));
  }
  
  pause_game() {
    this.isPaused = true;
  }
  
  resume_game() {
    this.isPaused = false;
  }
}