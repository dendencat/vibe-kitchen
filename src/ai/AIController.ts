import type { AIStrategy } from '../types/AITypes';
import type { GameState, PlayerAction, Restaurant } from '../types/GameTypes';
import { GAME_CONSTANTS, STAFF_SPECS } from '../utils/Constants';
import type { Rng } from '../utils/MathUtils';
import { create_ai_strategy } from './AIStrategies';

/** Simulated seconds between AI decision rounds. */
export const AI_DECISION_INTERVAL = 5;

/**
 * Drives one AI restaurant: throttles decisions and filters out unaffordable actions.
 */
export class AIController {
  private readonly strategy: AIStrategy;
  private nextDecisionAt: number;

  /**
   * @param restaurantId - Restaurant this controller owns.
   * @param strategyType - Strategy archetype.
   * @param offset - Initial delay (seconds) so rivals do not all act on the same tick.
   * @param rng - Random source.
   */
  constructor(
    private readonly restaurantId: string,
    strategyType: string,
    offset = 0,
    rng: Rng = Math.random
  ) {
    this.strategy = create_ai_strategy(strategyType, rng);
    this.nextDecisionAt = offset;
  }

  /**
   * Returns actions to execute this tick (empty while cooling down).
   * @param gameState - Current state.
   */
  make_decisions(gameState: GameState): PlayerAction[] {
    if (gameState.elapsedSeconds < this.nextDecisionAt) return [];
    const restaurant = gameState.restaurants.find(r => r.id === this.restaurantId);
    if (!restaurant) return [];

    this.nextDecisionAt = gameState.elapsedSeconds + AI_DECISION_INTERVAL;
    try {
      return this.filter_valid_actions(
        this.strategy.execute_strategy(gameState, restaurant),
        restaurant
      );
    } catch (error) {
      console.error(`AI ${this.restaurantId} failed to decide`, error);
      return [];
    }
  }

  /** Id of the controlled restaurant. */
  get_restaurant_id(): string {
    return this.restaurantId;
  }

  /** The underlying strategy (for display/testing). */
  get_strategy(): AIStrategy {
    return this.strategy;
  }

  private filter_valid_actions(actions: PlayerAction[], restaurant: Restaurant): PlayerAction[] {
    return actions.filter(action => {
      if (action.type === 'marketing') {
        return restaurant.cash >= action.parameters.budget;
      }
      if (action.type === 'menu' && action.action === 'add_item') {
        return restaurant.menu.length < GAME_CONSTANTS.MAX_MENU_ITEMS;
      }
      if (action.type === 'operations' && action.action === 'hire_staff') {
        const { staffType } = action.parameters;
        const current = restaurant.staff.filter(s => s.type === staffType).length;
        return (
          current < GAME_CONSTANTS.MAX_STAFF_PER_TYPE &&
          restaurant.cash >= STAFF_SPECS[staffType].hireCost
        );
      }
      return true;
    });
  }
}
