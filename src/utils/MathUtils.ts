/** Random source signature; injectable for deterministic tests. */
export type Rng = () => number;

export class MathUtils {
  /**
   * Clamps a value to the inclusive range [min, max].
   * @param value - Input value.
   * @param min - Lower bound.
   * @param max - Upper bound.
   */
  static clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * Linear interpolation between two numbers.
   * @param start - Value at t = 0.
   * @param end - Value at t = 1.
   * @param t - Interpolation factor.
   */
  static lerp(start: number, end: number, t: number): number {
    return start + (end - start) * t;
  }

  /**
   * Uniform random float in [min, max).
   * @param rng - Random source.
   */
  static random_range(min: number, max: number, rng: Rng = Math.random): number {
    return rng() * (max - min) + min;
  }

  /**
   * Uniform random integer in [min, max].
   * @param rng - Random source.
   */
  static random_int(min: number, max: number, rng: Rng = Math.random): number {
    return Math.floor(rng() * (max - min + 1)) + min;
  }

  /**
   * Profit margin as a percentage of price.
   * @param price - Selling price.
   * @param cost - Ingredient cost.
   */
  static calculate_profit_margin(price: number, cost: number): number {
    if (price === 0) return 0;
    return ((price - cost) / price) * 100;
  }

  /**
   * Market share (percent) of each entry, based on cumulative customers.
   * Returns an even split when nobody has customers yet.
   * @param restaurants - Entries with a customer count.
   */
  static calculate_market_share(restaurants: Array<{ customerCount: number }>): number[] {
    const totalCustomers = restaurants.reduce((sum, r) => sum + r.customerCount, 0);
    if (totalCustomers === 0) {
      return restaurants.map(() => 100 / restaurants.length);
    }
    return restaurants.map(r => (r.customerCount / totalCustomers) * 100);
  }

  /**
   * Picks an item using the given weights.
   * @param items - Candidates.
   * @param weights - Non-negative weights, same length as items.
   * @param rng - Random source.
   */
  static weighted_random<T>(items: T[], weights: number[], rng: Rng = Math.random): T {
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let random = rng() * totalWeight;

    for (let i = 0; i < items.length; i++) {
      random -= weights[i];
      if (random < 0) {
        return items[i];
      }
    }

    return items[items.length - 1];
  }

  /**
   * Hermite smooth step between two edges.
   * @param edge0 - Lower edge.
   * @param edge1 - Upper edge.
   * @param x - Input.
   */
  static smooth_step(edge0: number, edge1: number, x: number): number {
    const t = this.clamp((x - edge0) / (edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
  }

  /**
   * Rounds to cents to avoid floating point noise in prices.
   * @param value - Monetary amount.
   */
  static round_money(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
