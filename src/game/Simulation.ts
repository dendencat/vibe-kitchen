import type { MenuItem, Restaurant, Weather } from '../types/GameTypes';
import { BASE_CAPACITY, GAME_CONSTANTS, STAFF_SPECS } from '../utils/Constants';
import { MathUtils } from '../utils/MathUtils';

/**
 * Pure economic formulas for the market simulation. Everything here is
 * deterministic so it can be unit tested and tuned in isolation.
 */

export type DayPhase = 'morning' | 'lunch' | 'afternoon' | 'dinner' | 'night';

const gaussian = (x: number, center: number, width: number): number =>
  Math.exp(-(((x - center) / width) ** 2));

/**
 * Foot-traffic multiplier over the day, with lunch and dinner peaks.
 * @param progress - Fraction of the day elapsed, 0..1.
 */
export function demand_curve(progress: number): number {
  return 0.6 + 0.9 * gaussian(progress, 0.35, 0.08) + 1.0 * gaussian(progress, 0.75, 0.09);
}

/**
 * Named phase of the day for HUD labels and lighting.
 * @param progress - Fraction of the day elapsed, 0..1.
 */
export function day_phase(progress: number): DayPhase {
  if (progress < 0.25) return 'morning';
  if (progress < 0.45) return 'lunch';
  if (progress < 0.64) return 'afternoon';
  if (progress < 0.88) return 'dinner';
  return 'night';
}

/** Foot-traffic multiplier for the weather. */
export function weather_multiplier(weather: Weather): number {
  return { sunny: 1.1, cloudy: 1, rainy: 0.8 }[weather];
}

/** Mean menu price of one restaurant (0 for an empty menu). */
export function average_price(menu: MenuItem[]): number {
  if (menu.length === 0) return 0;
  return menu.reduce((sum, item) => sum + item.price, 0) / menu.length;
}

/** Mean of all non-empty restaurants' average prices. */
export function market_average_price(restaurants: Restaurant[]): number {
  const prices = restaurants.map(r => average_price(r.menu)).filter(p => p > 0);
  if (prices.length === 0) return 0;
  return prices.reduce((a, b) => a + b, 0) / prices.length;
}

/** Popularity-weighted average price of one plate. */
export function average_order_value(menu: MenuItem[]): number {
  const weight = menu.reduce((sum, item) => sum + item.popularity, 0);
  if (weight === 0) return 0;
  return menu.reduce((sum, item) => sum + item.price * item.popularity, 0) / weight;
}

/** Popularity-weighted average ingredient cost of one plate. */
export function average_food_cost(menu: MenuItem[]): number {
  const weight = menu.reduce((sum, item) => sum + item.popularity, 0);
  if (weight === 0) return 0;
  return menu.reduce((sum, item) => sum + item.cost * item.popularity, 0) / weight;
}

/** Kitchen level (1 when no kitchen is installed). */
export function kitchen_level(restaurant: Restaurant): number {
  return restaurant.equipment.find(e => e.type === 'kitchen')?.level ?? 1;
}

/**
 * Guests per second the restaurant can serve, from staff, kitchen level and cook times.
 * @param restaurant - Restaurant to evaluate.
 */
export function restaurant_capacity(restaurant: Restaurant): number {
  const staffCapacity = restaurant.staff.reduce(
    (sum, member) => sum + STAFF_SPECS[member.type].capacity * member.efficiency,
    BASE_CAPACITY
  );
  const equipmentBoost = 1 + 0.15 * (kitchen_level(restaurant) - 1);
  const avgCook =
    restaurant.menu.length === 0
      ? 15
      : restaurant.menu.reduce((sum, item) => sum + item.cookTime, 0) / restaurant.menu.length;
  const speedFactor = 1 / (0.75 + avgCook / 40);
  return staffCapacity * equipmentBoost * speedFactor;
}

/**
 * Relative pull of a restaurant on the market's guests.
 * @param restaurant - Restaurant to evaluate.
 * @param marketAvg - Market average price.
 * @param skill - Difficulty multiplier (1 for the player).
 */
export function attractiveness(restaurant: Restaurant, marketAvg: number, skill = 1): number {
  const ownAvg = average_price(restaurant.menu);
  if (ownAvg === 0) return 0;
  const satisfactionFactor = 0.2 + 1.2 * (restaurant.satisfaction / 100) ** 1.5;
  const priceFactor = MathUtils.clamp(marketAvg / ownAvg, 0.4, 2);
  const buzzFactor = 1 + restaurant.buzz;
  const varietyFactor = 0.85 + 0.05 * Math.min(restaurant.menu.length, 7);
  const avgPopularity =
    restaurant.menu.reduce((sum, item) => sum + item.popularity, 0) / restaurant.menu.length;
  const popularityFactor = 0.6 + avgPopularity / 125;
  return satisfactionFactor * priceFactor * buzzFactor * varietyFactor * popularityFactor * skill;
}

/**
 * Splits total demand proportionally to weights.
 * @param total - Guests arriving this second.
 * @param weights - Attractiveness per restaurant.
 */
export function distribute_demand(total: number, weights: number[]): number[] {
  const sum = weights.reduce((a, b) => a + b, 0);
  if (sum === 0) return weights.map(() => 0);
  return weights.map(w => (total * w) / sum);
}

/**
 * Buzz gained from a campaign budget (diminishing returns).
 * @param budget - Money spent.
 */
export function buzz_gain(budget: number): number {
  return 0.35 * Math.log2(1 + Math.max(0, budget) / 2000);
}

/**
 * Satisfaction the restaurant drifts towards.
 * @param restaurant - Restaurant to evaluate.
 * @param marketAvg - Market average price.
 * @param overload - Share of arriving guests turned away (0..1).
 */
export function target_satisfaction(
  restaurant: Restaurant,
  marketAvg: number,
  overload: number
): number {
  const ownAvg = average_price(restaurant.menu);
  const priceRatio = marketAvg > 0 && ownAvg > 0 ? ownAvg / marketAvg : 1;
  const avgRating =
    restaurant.menu.length === 0
      ? 3
      : restaurant.menu.reduce((sum, item) => sum + item.customerRating, 0) /
        restaurant.menu.length;
  const waiters = restaurant.staff.filter(s => s.type === 'waiter').length;
  const target =
    60 +
    (avgRating - 4) * 12 +
    MathUtils.clamp((1 - priceRatio) * 25, -12, 12) +
    Math.min(waiters, 4) * 3 +
    (kitchen_level(restaurant) - 1) * 2 -
    overload * 25;
  return MathUtils.clamp(target, GAME_CONSTANTS.MIN_SATISFACTION, GAME_CONSTANTS.MAX_SATISFACTION);
}

/**
 * Popularity a dish drifts towards, based on value for money and rating.
 * @param item - Menu item.
 * @param marketAvg - Market average price.
 */
export function target_popularity(item: MenuItem, marketAvg: number): number {
  const valueScore = marketAvg > 0 ? (marketAvg - item.price) / marketAvg : 0;
  return MathUtils.clamp(50 + valueScore * 80 + (item.customerRating - 4) * 15, 5, 98);
}

/**
 * Rating for a newly created dish: slower cooking reads as more crafted.
 * @param cookTime - Cook time in seconds.
 */
export function rating_for_cook_time(cookTime: number): number {
  return MathUtils.round_money(3.5 + (Math.min(cookTime, 30) / 30) * 1.2);
}

/** Daily fixed costs: salaries, rent, utilities and maintenance. */
export function daily_fixed_costs(restaurant: Restaurant, rent: number, utilities: number): number {
  const salaries = restaurant.staff.reduce((sum, s) => sum + s.salary, 0);
  const maintenance = restaurant.equipment.reduce((sum, e) => sum + e.maintenanceCost, 0);
  return salaries + rent + utilities + maintenance;
}

/**
 * Final score as specified in CLAUDE.md "Scoring System".
 * @param restaurant - Restaurant at game end.
 */
export function calculate_final_score(restaurant: Restaurant): number {
  const marketSharePoints = restaurant.marketShare * 1000;
  const revenuePoints = restaurant.revenue * 0.1;
  const satisfactionPoints = restaurant.satisfaction * 100;
  const efficiencyPoints = (restaurant.revenue / Math.max(1, restaurant.expenses)) * 50;
  return Math.round(marketSharePoints + revenuePoints + satisfactionPoints + efficiencyPoints);
}
