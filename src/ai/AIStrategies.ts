import type { AIStrategy } from '../types/AITypes';
import type { GameState, PlayerAction, Restaurant } from '../types/GameTypes';
import { CAMPAIGNS, GAME_CONSTANTS, STAFF_SPECS, upgrade_cost } from '../utils/Constants';
import { MathUtils, type Rng } from '../utils/MathUtils';
import { kitchen_level, market_average_price } from '../game/Simulation';

/** Price update action helper (rounded to cents). */
function price_action(itemId: string, price: number): PlayerAction {
  return {
    type: 'menu',
    action: 'update_price',
    parameters: { itemId, price: MathUtils.round_money(price) },
  };
}

/** Number of staff of a role. */
function staff_count(restaurant: Restaurant, type: 'chef' | 'waiter'): number {
  return restaurant.staff.filter(s => s.type === type).length;
}

/** Average price of all *other* restaurants. */
function competitor_average(gameState: GameState, restaurant: Restaurant): number {
  return market_average_price(gameState.restaurants.filter(r => r.id !== restaurant.id));
}

/**
 * "Fire Grill": undercuts the market by 20%, burns cash on ads, rotates specials.
 */
export class AggressiveAI implements AIStrategy {
  name = 'Fire Grill';
  description = 'Aggressive pricing and marketing strategy';
  riskLevel = 'high' as const;

  constructor(private readonly rng: Rng = Math.random) {}

  /** @inheritdoc */
  execute_strategy(gameState: GameState, restaurant: Restaurant): PlayerAction[] {
    const actions: PlayerAction[] = [];
    const targetPrice = competitor_average(gameState, restaurant) * 0.8;

    restaurant.menu.forEach(item => {
      const price = Math.max(targetPrice, item.cost * 1.3);
      if (item.price - price > 0.25) {
        actions.push(price_action(item.id, price));
      }
    });

    // Heavy advertising: 30% of cash when flush
    if (restaurant.cash > 8000 && this.rng() < 0.3) {
      actions.push({
        type: 'marketing',
        action: 'launch_campaign',
        parameters: { campaignType: 'aggressive', budget: Math.round(restaurant.cash * 0.3) },
      });
    }

    // New dish every 2 days
    if (gameState.currentDay % 2 === 0 && restaurant.menu.length < 8 && this.rng() < 0.2) {
      actions.push({
        type: 'menu',
        action: 'add_item',
        parameters: {
          name: `Special Deal ${gameState.currentDay}`,
          price: 9.99,
          cost: 4,
          cookTime: 10,
        },
      });
    }

    return actions;
  }
}

/**
 * "Wisdom Table": demand-based pricing, prunes weak dishes, targeted marketing.
 */
export class StrategicAI implements AIStrategy {
  name = 'Wisdom Table';
  description = 'Data-driven optimal pricing and efficiency';
  riskLevel = 'low' as const;

  /** @inheritdoc */
  execute_strategy(gameState: GameState, restaurant: Restaurant): PlayerAction[] {
    const actions: PlayerAction[] = [];
    const marketAvg = market_average_price(gameState.restaurants);

    restaurant.menu.forEach(item => {
      const optimal = this.calculate_optimal_price(item, marketAvg);
      if (Math.abs(item.price - optimal) > 0.5) {
        actions.push(price_action(item.id, optimal));
      }
    });

    if (restaurant.cash > 15000 && restaurant.buzz < 0.2) {
      actions.push({
        type: 'marketing',
        action: 'launch_campaign',
        parameters: { campaignType: 'radio', budget: CAMPAIGNS.radio.budget },
      });
    }

    // Add capacity when guests are being turned away
    if (
      restaurant.lastLost > 0.5 &&
      restaurant.cash > 10000 &&
      staff_count(restaurant, 'chef') < 4
    ) {
      actions.push({ type: 'operations', action: 'hire_staff', parameters: { staffType: 'chef' } });
    }

    if (restaurant.menu.length > 3) {
      const worstItem = restaurant.menu.reduce((worst, item) =>
        item.popularity < worst.popularity ? item : worst
      );
      if (worstItem.popularity < 30) {
        actions.push({ type: 'menu', action: 'remove_item', parameters: { itemId: worstItem.id } });
      }
    }

    return actions;
  }

  /**
   * Demand-adjusted markup, kept within ±15% of the market average.
   * @param item - Dish to price.
   * @param marketAvg - Market average price.
   */
  calculate_optimal_price(
    item: { cost: number; popularity: number; customerRating: number },
    marketAvg: number
  ): number {
    const demandFactor = item.popularity / 50;
    const ratingFactor = 1 + (item.customerRating - 4) * 0.1;
    const raw = item.cost * (2.2 + demandFactor * 0.4) * ratingFactor;
    if (marketAvg <= 0) return MathUtils.round_money(raw);
    return MathUtils.round_money(MathUtils.clamp(raw, marketAvg * 0.85, marketAvg * 1.15));
  }
}

/**
 * "Hospitality House": premium prices, lots of waiters, word-of-mouth marketing.
 */
export class EmotionalAI implements AIStrategy {
  name = 'Hospitality House';
  description = 'Customer satisfaction and loyalty focus';
  riskLevel = 'medium' as const;

  /** @inheritdoc */
  execute_strategy(gameState: GameState, restaurant: Restaurant): PlayerAction[] {
    const actions: PlayerAction[] = [];

    restaurant.menu.forEach(item => {
      if (item.customerRating >= 4.5 && item.price < item.cost * 3) {
        actions.push(price_action(item.id, item.cost * 3.2));
      }
    });

    if (restaurant.cash > 15000 && staff_count(restaurant, 'waiter') < 4) {
      actions.push({
        type: 'operations',
        action: 'hire_staff',
        parameters: { staffType: 'waiter' },
      });
    }

    if (gameState.currentDay % 3 === 0 && restaurant.menu.length < 7) {
      actions.push({
        type: 'menu',
        action: 'add_item',
        parameters: {
          name: `Grandma's Special ${gameState.currentDay}`,
          price: 18.99,
          cost: 6,
          cookTime: 28,
        },
      });
    }

    if (restaurant.satisfaction > 80 && restaurant.cash > 8000 && restaurant.buzz < 0.3) {
      actions.push({
        type: 'marketing',
        action: 'launch_campaign',
        parameters: { campaignType: 'social', budget: CAMPAIGNS.social.budget },
      });
    }

    return actions;
  }
}

/**
 * "Lightning Kitchen": fast dishes, high turnover, invests in kitchen tech.
 */
export class SpeedAI implements AIStrategy {
  name = 'Lightning Kitchen';
  description = 'Fast service and high turnover';
  riskLevel = 'medium' as const;

  constructor(private readonly rng: Rng = Math.random) {}

  /** @inheritdoc */
  execute_strategy(_gameState: GameState, restaurant: Restaurant): PlayerAction[] {
    const actions: PlayerAction[] = [];

    const slowItems = restaurant.menu.filter(item => item.cookTime > 15);
    if (slowItems.length > 0 && restaurant.menu.length > 4) {
      actions.push({
        type: 'menu',
        action: 'remove_item',
        parameters: { itemId: slowItems[0].id },
      });
    }

    if (restaurant.menu.length < 6) {
      actions.push({
        type: 'menu',
        action: 'add_item',
        parameters: {
          name: `Quick Bite ${MathUtils.random_int(1, 99, this.rng)}`,
          price: 7.99,
          cost: 2.5,
          cookTime: 5,
        },
      });
    }

    const level = kitchen_level(restaurant);
    if (
      level < GAME_CONSTANTS.MAX_EQUIPMENT_LEVEL &&
      restaurant.cash > upgrade_cost(level) + 15000
    ) {
      actions.push({
        type: 'operations',
        action: 'upgrade_equipment',
        parameters: { equipmentType: 'kitchen' },
      });
    }

    if (restaurant.cash > 6000 && restaurant.buzz < 0.3 && this.rng() < 0.5) {
      actions.push({
        type: 'marketing',
        action: 'launch_campaign',
        parameters: { campaignType: 'social', budget: CAMPAIGNS.social.budget },
      });
    }

    return actions;
  }
}

/**
 * "Harmony Restaurant": market-average pricing and steady, diversified investment.
 */
export class BalancedAI implements AIStrategy {
  name = 'Harmony Restaurant';
  description = 'Balanced approach across all metrics';
  riskLevel = 'low' as const;

  constructor(private readonly rng: Rng = Math.random) {}

  /** @inheritdoc */
  execute_strategy(gameState: GameState, restaurant: Restaurant): PlayerAction[] {
    const actions: PlayerAction[] = [];
    const marketAverage = market_average_price(gameState.restaurants);

    restaurant.menu.forEach(item => {
      const targetPrice = (marketAverage + item.cost * 2.5) / 2;
      if (Math.abs(item.price - targetPrice) > 1) {
        actions.push(price_action(item.id, targetPrice));
      }
    });

    if (restaurant.cash > 12000 && gameState.currentDay % 2 === 0 && restaurant.buzz < 0.25) {
      actions.push({
        type: 'marketing',
        action: 'launch_campaign',
        parameters: { campaignType: 'radio', budget: CAMPAIGNS.radio.budget },
      });
    }

    if (gameState.currentDay % 3 === 0 && restaurant.menu.length < 6) {
      actions.push({
        type: 'menu',
        action: 'add_item',
        parameters: {
          name: `Daily Special ${gameState.currentDay}`,
          price: 13.99,
          cost: 5,
          cookTime: 15,
        },
      });
    }

    const hireCost = Math.max(STAFF_SPECS.chef.hireCost, STAFF_SPECS.waiter.hireCost);
    if (restaurant.staff.length < 4 && restaurant.cash > 10000 + hireCost) {
      actions.push({
        type: 'operations',
        action: 'hire_staff',
        parameters: { staffType: this.rng() < 0.5 ? 'chef' : 'waiter' },
      });
    }

    return actions;
  }
}

/**
 * Factory for a strategy by archetype name (unknown names fall back to balanced).
 * @param type - Strategy archetype.
 * @param rng - Random source passed to stochastic strategies.
 */
export function create_ai_strategy(type: string, rng: Rng = Math.random): AIStrategy {
  switch (type) {
    case 'aggressive':
      return new AggressiveAI(rng);
    case 'strategic':
      return new StrategicAI();
    case 'emotional':
      return new EmotionalAI();
    case 'speed':
      return new SpeedAI(rng);
    default:
      return new BalancedAI(rng);
  }
}
