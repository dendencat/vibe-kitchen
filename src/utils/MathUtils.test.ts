import { describe, expect, it } from 'vitest';
import { MathUtils } from './MathUtils';

describe('MathUtils', () => {
  it('clamps values into range', () => {
    expect(MathUtils.clamp(5, 0, 10)).toBe(5);
    expect(MathUtils.clamp(-1, 0, 10)).toBe(0);
    expect(MathUtils.clamp(11, 0, 10)).toBe(10);
  });

  it('interpolates linearly', () => {
    expect(MathUtils.lerp(0, 10, 0.25)).toBe(2.5);
  });

  it('draws random numbers from the injected source', () => {
    expect(MathUtils.random_range(2, 4, () => 0.5)).toBe(3);
    expect(MathUtils.random_int(1, 6, () => 0.999)).toBe(6);
    expect(MathUtils.random_int(1, 6, () => 0)).toBe(1);
    expect(MathUtils.random_range(0, 1)).toBeLessThan(1);
    expect(MathUtils.random_int(0, 0)).toBe(0);
  });

  it('computes profit margin and guards zero price', () => {
    expect(MathUtils.calculate_profit_margin(10, 4)).toBe(60);
    expect(MathUtils.calculate_profit_margin(0, 4)).toBe(0);
  });

  it('splits market share by customers or evenly when empty', () => {
    expect(MathUtils.calculate_market_share([{ customerCount: 0 }, { customerCount: 0 }])).toEqual([
      50, 50,
    ]);
    expect(MathUtils.calculate_market_share([{ customerCount: 1 }, { customerCount: 3 }])).toEqual([
      25, 75,
    ]);
  });

  it('picks weighted items', () => {
    expect(MathUtils.weighted_random(['a', 'b'], [1, 3], () => 0.2)).toBe('a');
    expect(MathUtils.weighted_random(['a', 'b'], [1, 3], () => 0.9)).toBe('b');
    expect(MathUtils.weighted_random(['a', 'b'], [0, 0], () => 0.5)).toBe('b');
    expect(['a', 'b']).toContain(MathUtils.weighted_random(['a', 'b'], [1, 1]));
  });

  it('smooth steps between edges', () => {
    expect(MathUtils.smooth_step(0, 1, -1)).toBe(0);
    expect(MathUtils.smooth_step(0, 1, 0.5)).toBe(0.5);
    expect(MathUtils.smooth_step(0, 1, 2)).toBe(1);
  });

  it('rounds money to cents', () => {
    expect(MathUtils.round_money(1.005 + 0.0001)).toBe(1.01);
    expect(MathUtils.round_money(12.3456)).toBe(12.35);
  });
});
