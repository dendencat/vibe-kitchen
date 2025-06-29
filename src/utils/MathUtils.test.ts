import { describe, it, expect } from 'vitest';
import { MathUtils } from './MathUtils';

describe('MathUtils', () => {
  describe('clamp', () => {
    it('should return value when within bounds', () => {
      expect(MathUtils.clamp(5, 0, 10)).toBe(5);
      expect(MathUtils.clamp(0, 0, 10)).toBe(0);
      expect(MathUtils.clamp(10, 0, 10)).toBe(10);
    });

    it('should return min when value is below minimum', () => {
      expect(MathUtils.clamp(-5, 0, 10)).toBe(0);
      expect(MathUtils.clamp(-100, -50, 50)).toBe(-50);
    });

    it('should return max when value is above maximum', () => {
      expect(MathUtils.clamp(15, 0, 10)).toBe(10);
      expect(MathUtils.clamp(100, -50, 50)).toBe(50);
    });

    it('should handle edge cases with same min and max', () => {
      expect(MathUtils.clamp(5, 10, 10)).toBe(10);
      expect(MathUtils.clamp(15, 10, 10)).toBe(10);
    });
  });

  describe('lerp', () => {
    it('should interpolate between two values', () => {
      expect(MathUtils.lerp(0, 10, 0.5)).toBe(5);
      expect(MathUtils.lerp(0, 10, 0)).toBe(0);
      expect(MathUtils.lerp(0, 10, 1)).toBe(10);
    });

    it('should handle negative values', () => {
      expect(MathUtils.lerp(-10, 10, 0.5)).toBe(0);
      expect(MathUtils.lerp(-5, -1, 0.5)).toBe(-3);
    });

    it('should extrapolate when t is outside [0, 1]', () => {
      expect(MathUtils.lerp(0, 10, 2)).toBe(20);
      expect(MathUtils.lerp(0, 10, -1)).toBe(-10);
    });
  });

  describe('random_range', () => {
    it('should return values within specified range', () => {
      for (let i = 0; i < 100; i++) {
        const value = MathUtils.random_range(5, 10);
        expect(value).toBeGreaterThanOrEqual(5);
        expect(value).toBeLessThan(10);
      }
    });

    it('should handle negative ranges', () => {
      for (let i = 0; i < 100; i++) {
        const value = MathUtils.random_range(-10, -5);
        expect(value).toBeGreaterThanOrEqual(-10);
        expect(value).toBeLessThan(-5);
      }
    });

    it('should handle ranges crossing zero', () => {
      for (let i = 0; i < 100; i++) {
        const value = MathUtils.random_range(-5, 5);
        expect(value).toBeGreaterThanOrEqual(-5);
        expect(value).toBeLessThan(5);
      }
    });
  });

  describe('random_int', () => {
    it('should return integers within specified range', () => {
      for (let i = 0; i < 100; i++) {
        const value = MathUtils.random_int(1, 6);
        expect(Number.isInteger(value)).toBe(true);
        expect(value).toBeGreaterThanOrEqual(1);
        expect(value).toBeLessThanOrEqual(6);
      }
    });

    it('should include both endpoints', () => {
      const results = new Set();
      for (let i = 0; i < 1000; i++) {
        results.add(MathUtils.random_int(1, 3));
      }
      expect(results.has(1)).toBe(true);
      expect(results.has(2)).toBe(true);
      expect(results.has(3)).toBe(true);
      expect(results.size).toBe(3);
    });

    it('should handle single value range', () => {
      expect(MathUtils.random_int(5, 5)).toBe(5);
    });
  });

  describe('calculate_profit_margin', () => {
    it('should calculate profit margin correctly', () => {
      expect(MathUtils.calculate_profit_margin(10, 6)).toBe(40);
      expect(MathUtils.calculate_profit_margin(100, 80)).toBe(20);
      expect(MathUtils.calculate_profit_margin(50, 25)).toBe(50);
    });

    it('should handle zero price', () => {
      expect(MathUtils.calculate_profit_margin(0, 5)).toBe(0);
    });

    it('should handle zero cost', () => {
      expect(MathUtils.calculate_profit_margin(10, 0)).toBe(100);
    });

    it('should handle loss scenarios', () => {
      expect(MathUtils.calculate_profit_margin(10, 15)).toBe(-50);
    });
  });

  describe('calculate_market_share', () => {
    it('should calculate market shares correctly', () => {
      const restaurants = [
        { customerCount: 100 },
        { customerCount: 50 },
        { customerCount: 50 }
      ];
      const shares = MathUtils.calculate_market_share(restaurants);
      expect(shares).toEqual([50, 25, 25]);
    });

    it('should handle zero customers', () => {
      const restaurants = [
        { customerCount: 0 },
        { customerCount: 0 },
        { customerCount: 0 }
      ];
      const shares = MathUtils.calculate_market_share(restaurants);
      expect(shares).toEqual([33.333333333333336, 33.333333333333336, 33.333333333333336]);
    });

    it('should handle single restaurant', () => {
      const restaurants = [{ customerCount: 100 }];
      const shares = MathUtils.calculate_market_share(restaurants);
      expect(shares).toEqual([100]);
    });

    it('should handle mixed scenarios', () => {
      const restaurants = [
        { customerCount: 200 },
        { customerCount: 0 },
        { customerCount: 100 }
      ];
      const shares = MathUtils.calculate_market_share(restaurants);
      expect(shares[0]).toBeCloseTo(66.67, 1);
      expect(shares[1]).toBe(0);
      expect(shares[2]).toBeCloseTo(33.33, 1);
    });
  });

  describe('weighted_random', () => {
    it('should select items based on weights', () => {
      const items = ['A', 'B', 'C'];
      const weights = [100, 0, 0]; // Only A should be selected
      
      for (let i = 0; i < 100; i++) {
        const result = MathUtils.weighted_random(items, weights);
        expect(result).toBe('A');
      }
    });

    it('should handle equal weights', () => {
      const items = ['A', 'B'];
      const weights = [1, 1];
      const results = new Set();
      
      for (let i = 0; i < 1000; i++) {
        results.add(MathUtils.weighted_random(items, weights));
      }
      
      expect(results.has('A')).toBe(true);
      expect(results.has('B')).toBe(true);
    });

    it('should return last item when random exceeds total weight', () => {
      const items = ['A', 'B', 'C'];
      const weights = [0, 0, 0];
      const result = MathUtils.weighted_random(items, weights);
      expect(result).toBe('C');
    });
  });

  describe('smooth_step', () => {
    it('should return smooth interpolation', () => {
      expect(MathUtils.smooth_step(0, 10, 0)).toBe(0);
      expect(MathUtils.smooth_step(0, 10, 5)).toBe(0.5);
      expect(MathUtils.smooth_step(0, 10, 10)).toBe(1);
    });

    it('should clamp values outside range', () => {
      expect(MathUtils.smooth_step(0, 10, -5)).toBe(0);
      expect(MathUtils.smooth_step(0, 10, 15)).toBe(1);
    });

    it('should provide smooth curve', () => {
      const result1 = MathUtils.smooth_step(0, 10, 2.5);
      const result2 = MathUtils.smooth_step(0, 10, 5);
      const result3 = MathUtils.smooth_step(0, 10, 7.5);
      
      // Smooth step should be non-linear
      expect(result1).toBeLessThan(0.25);
      expect(result2).toBe(0.5);
      expect(result3).toBeGreaterThan(0.75);
    });
  });
});