import { GameStateManager } from './GameState.js';
import { GameState, Restaurant, PlayerAction } from '../types/GameTypes.js';
import { AIController } from '../ai/AIController.js';
import { GameRenderer } from '../ui/GameRenderer.js';
import { InputHandler } from '../ui/InputHandler.js';
import { SecurityValidator } from '../utils/SecurityValidator.js';
import { GAME_CONSTANTS, GAME_CONFIG } from '../utils/Constants.js';
import { MarketEventManager } from './MarketEvents.js';
import { SupportAI } from '../ai/SupportAI.js';
import { MathUtils } from '../utils/MathUtils.js';

export class GameEngine {
  private gameStateManager: GameStateManager;
  private aiControllers: AIController[] = [];
  private renderer: GameRenderer;
  private inputHandler: InputHandler;
  private marketEventManager: MarketEventManager;
  private supportAI: SupportAI;
  
  private lastUpdateTime: number = 0;
  private accumulatedTime: number = 0;
  private gameStartTime: number = 0;
  private isPaused: boolean = false;
  private isGameOver: boolean = false;
  private gameTimer: number = 0; // Add explicit game timer
  
  constructor() {
    this.gameStateManager = new GameStateManager();
    this.renderer = new GameRenderer();
    this.inputHandler = new InputHandler(this);
    this.marketEventManager = new MarketEventManager();
    this.supportAI = new SupportAI();
    
    this.initialize_game();
  }
  
  private initialize_game(): void {
    // Initialize AI controllers
    const state = this.gameStateManager.get_state();
    const aiRestaurants = state.restaurants.filter(r => r.type === 'ai');
    
    aiRestaurants.forEach(restaurant => {
      this.aiControllers.push(new AIController(restaurant));
    });
    
    // Set up event listeners
    this.setup_event_listeners();
    
    // Initialize timer properly
    this.gameTimer = 0;
    this.gameStartTime = Date.now();
    
    // Start the game loop
    this.start_game_loop();
    
    // Set up autosave
    setInterval(() => this.auto_save(), GAME_CONSTANTS.AUTOSAVE_INTERVAL_MS);
  }
  
  private setup_event_listeners(): void {
    this.inputHandler.initialize();
  }
  
  private start_game_loop(): void {
    const loop = (currentTime: number) => {
      if (this.isGameOver) return;
      
      const deltaTime = currentTime - this.lastUpdateTime;
      this.lastUpdateTime = currentTime;
      
      if (!this.isPaused) {
        this.accumulatedTime += deltaTime;
        
        // Update game state at fixed intervals (every second)
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
  
  private update_game_state(): void {
    const state = this.gameStateManager.get_state();
    
    // Update time correctly
    let newTimeRemaining = state.timeRemaining - 1;
    
    if (newTimeRemaining <= 0) {
      // Move to next day
      if (state.currentDay >= GAME_CONSTANTS.DAYS_PER_GAME) {
        this.end_game();
        return;
      }
      
      this.advance_to_next_day();
    } else {
      this.gameStateManager.update_state({ timeRemaining: newTimeRemaining });
    }
    
    // Only process game logic if game hasn't ended
    if (!this.isGameOver) {
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
  }
  
  private process_ai_actions(): void {
    const state = this.gameStateManager.get_state();
    
    this.aiControllers.forEach(controller => {
      try {
        const actions = controller.make_decisions(state);
        actions.forEach(action => this.execute_action(controller.get_restaurant_id(), action));
      } catch (error) {
        console.warn('AI Controller error:', error);
      }
    });
  }
  
  private update_restaurant_operations(): void {
    const state = this.gameStateManager.get_state();
    
    state.restaurants.forEach(restaurant => {
      // Calculate customer arrivals
      const baseCustomers = GAME_CONFIG.baseCustomerArrival / 60; // Per second
      const marketEventMultiplier = this.calculate_event_multiplier('customerMultiplier');
      const satisfactionMultiplier = Math.max(0.1, restaurant.satisfaction / 100);
      const weatherMultiplier = state.weatherCondition === 'rainy' ? 0.8 : 1.0;
      
      const newCustomers = Math.max(0, Math.round(
        baseCustomers * marketEventMultiplier * satisfactionMultiplier * weatherMultiplier * restaurant.efficiency
      ));
      
      // Calculate revenue
      const averageOrderValue = this.calculate_average_order_value(restaurant);
      const revenue = newCustomers * averageOrderValue;
      
      // Calculate expenses (per second)
      const staffCosts = restaurant.staff.reduce((sum, s) => sum + s.salary, 0) / (GAME_CONSTANTS.SECONDS_PER_DAY * GAME_CONSTANTS.DAYS_PER_GAME);
      const operatingCosts = (GAME_CONFIG.rentCost + GAME_CONFIG.utilityCost) / (GAME_CONSTANTS.SECONDS_PER_DAY * GAME_CONSTANTS.DAYS_PER_GAME);
      const expenses = staffCosts + operatingCosts;
      
      // Update restaurant
      this.gameStateManager.update_restaurant(restaurant.id, {
        customerCount: restaurant.customerCount + newCustomers,
        revenue: restaurant.revenue + revenue,
        expenses: restaurant.expenses + expenses,
        cash: restaurant.cash + revenue - expenses,
        dailyProfit: restaurant.dailyProfit + revenue - expenses
      });
      
      // Update satisfaction (slowly decays)
      const newSatisfaction = Math.max(
        0,
        restaurant.satisfaction - (GAME_CONFIG.satisfactionDecayRate / 60) // Per second
      );
      this.gameStateManager.update_restaurant(restaurant.id, {
        satisfaction: newSatisfaction
      });
    });
  }
  
  private calculate_event_multiplier(effectType: string): number {
    const state = this.gameStateManager.get_state();
    let multiplier = 1.0;
    
    state.marketEvents.forEach(event => {
      if (event.effect[effectType]) {
        multiplier *= event.effect[effectType];
      }
    });
    
    return multiplier;
  }
  
  private calculate_average_order_value(restaurant: Restaurant): number {
    if (restaurant.menu.length === 0) return 10; // Default value
    
    const totalValue = restaurant.menu.reduce((sum, item) => {
      const popularity = Math.max(0.1, item.popularity / 100);
      return sum + (item.price * popularity);
    }, 0);
    
    return totalValue / restaurant.menu.length;
  }
  
  private process_market_events(): void {
    const state = this.gameStateManager.get_state();
    
    // Random chance for new events (much lower per second)
    if (Math.random() < 0.001) { // 0.1% chance per second
      const newEvent = this.marketEventManager.generate_random_event();
      if (newEvent) {
        this.gameStateManager.add_market_event(newEvent);
      }
    }
    
    // Update event durations (per second)
    state.marketEvents.forEach(event => {
      event.duration -= 1 / GAME_CONSTANTS.SECONDS_PER_DAY;
    });
    
    // Remove expired events
    this.gameStateManager.remove_expired_events();
  }
  
  private advance_to_next_day(): void {
    const state = this.gameStateManager.get_state();
    
    // Reset daily values for new day
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
    
    // Show day transition
    this.show_day_transition(state.currentDay);
  }
  
  private show_day_transition(day: number): void {
    const transition = document.createElement('div');
    transition.className = 'day-transition';
    transition.textContent = `Day ${day}`;
    document.body.appendChild(transition);
    
    setTimeout(() => {
      transition.remove();
    }, 2000);
  }
  
  public execute_action(restaurantId: string, action: PlayerAction): void {
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
  
  private handle_menu_action(restaurant: Restaurant, action: PlayerAction): void {
    switch (action.action) {
      case 'add_item':
        try {
          const validatedItem = SecurityValidator.validate_menu_item_input(action.parameters);
          const newItem = {
            id: `menu-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: validatedItem.name,
            price: validatedItem.price,
            cost: validatedItem.cost,
            cookTime: validatedItem.cookTime,
            popularity: 50,
            profitMargin: MathUtils.calculate_profit_margin(validatedItem.price, validatedItem.cost),
            customerRating: 4.0
          };
          restaurant.menu.push(newItem);
        } catch (error) {
          console.warn('Invalid menu item:', error);
        }
        break;
      
      case 'remove_item':
        restaurant.menu = restaurant.menu.filter(item => item.id !== action.parameters.itemId);
        break;
      
      case 'update_price':
        const item = restaurant.menu.find(i => i.id === action.parameters.itemId);
        if (item) {
          try {
            item.price = SecurityValidator.validate_number(action.parameters.price, 1, 1000);
            item.profitMargin = MathUtils.calculate_profit_margin(item.price, item.cost);
          } catch (error) {
            console.warn('Invalid price update:', error);
          }
        }
        break;
    }
  }
  
  private handle_marketing_action(restaurant: Restaurant, action: PlayerAction): void {
    try {
      const cost = SecurityValidator.validate_number(action.parameters.budget, 0, restaurant.cash);
      restaurant.cash -= cost;
      restaurant.expenses += cost;
      
      // Boost satisfaction based on campaign
      const boost = Math.min(20, cost / 1000); // $1000 = 1% boost, max 20%
      restaurant.satisfaction = Math.min(100, restaurant.satisfaction + boost);
    } catch (error) {
      console.warn('Invalid marketing action:', error);
    }
  }
  
  private handle_operations_action(restaurant: Restaurant, action: PlayerAction): void {
    switch (action.action) {
      case 'hire_staff':
        const staffCost = 10000; // Cost to hire staff
        if (restaurant.cash >= staffCost && restaurant.staff.length < 10) {
          restaurant.cash -= staffCost;
          restaurant.staff.push({
            id: `staff-${Date.now()}`,
            name: `${action.parameters.staffType} ${restaurant.staff.length + 1}`,
            type: action.parameters.staffType,
            salary: action.parameters.staffType === 'chef' ? 600 : 400,
            efficiency: 1.0,
            experience: 0
          });
          restaurant.efficiency = Math.min(2.0, restaurant.efficiency + 0.1);
        }
        break;
      case 'upgrade_equipment':
        const upgradeCost = 15000;
        if (restaurant.cash >= upgradeCost) {
          restaurant.cash -= upgradeCost;
          restaurant.efficiency = Math.min(2.0, restaurant.efficiency + 0.2);
        }
        break;
    }
  }
  
  private end_game(): void {
    this.isGameOver = true;
    const state = this.gameStateManager.get_state();
    
    // Calculate final scores
    const results = state.restaurants.map(restaurant => ({
      name: restaurant.name,
      score: this.calculate_final_score(restaurant),
      marketShare: restaurant.marketShare,
      revenue: restaurant.revenue,
      satisfaction: restaurant.satisfaction,
      isPlayer: restaurant.type === 'player'
    }));
    
    // Sort by score
    results.sort((a, b) => b.score - a.score);
    
    // Display results
    this.renderer.show_game_over(results);
  }
  
  private calculate_final_score(restaurant: Restaurant): number {
    const marketSharePoints = restaurant.marketShare * 1000;
    const revenuePoints = restaurant.revenue * 0.1;
    const satisfactionPoints = restaurant.satisfaction * 100;
    const efficiencyPoints = (restaurant.revenue / Math.max(1, restaurant.expenses)) * 50;
    
    return Math.round(marketSharePoints + revenuePoints + satisfactionPoints + efficiencyPoints);
  }
  
  private auto_save(): void {
    try {
      localStorage.setItem('ai-restaurant-battle-save', JSON.stringify(this.gameStateManager.get_state()));
    } catch (error) {
      console.warn('Autosave failed:', error);
    }
  }
  
  public pause_game(): void {
    this.isPaused = true;
  }
  
  public resume_game(): void {
    this.isPaused = false;
  }
}