export class MathUtils {
  static clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }
  
  static lerp(start: number, end: number, t: number): number {
    return start + (end - start) * t;
  }
  
  static random_range(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }
  
  static random_int(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  
  static calculate_profit_margin(price: number, cost: number): number {
    if (price === 0) return 0;
    return ((price - cost) / price) * 100;
  }
  
  static calculate_market_share(restaurants: Array<{customerCount: number}>): number[] {
    const totalCustomers = restaurants.reduce((sum, r) => sum + r.customerCount, 0);
    if (totalCustomers === 0) {
      return restaurants.map(() => 100 / restaurants.length);
    }
    return restaurants.map(r => (r.customerCount / totalCustomers) * 100);
  }
  
  static weighted_random<T>(items: T[], weights: number[]): T {
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < items.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return items[i];
      }
    }
    
    return items[items.length - 1];
  }
  
  static smooth_step(edge0: number, edge1: number, x: number): number {
    const t = this.clamp((x - edge0) / (edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
  }
}