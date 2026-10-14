import { describe, expect, it } from 'vitest';
import { make_item, make_restaurant } from '../../test/factories';
import {
  attractiveness,
  average_food_cost,
  average_order_value,
  average_price,
  buzz_gain,
  calculate_final_score,
  daily_fixed_costs,
  day_phase,
  demand_curve,
  distribute_demand,
  kitchen_level,
  market_average_price,
  rating_for_cook_time,
  restaurant_capacity,
  target_popularity,
  target_satisfaction,
  weather_multiplier,
} from './Simulation';

describe('Simulation formulas', () => {
  it('peaks demand at lunch and dinner', () => {
    expect(demand_curve(0.35)).toBeGreaterThan(demand_curve(0.1));
    expect(demand_curve(0.75)).toBeGreaterThan(demand_curve(0.55));
    expect(demand_curve(0.75)).toBeGreaterThan(demand_curve(0.35));
  });

  it.each([
    [0.1, 'morning'],
    [0.3, 'lunch'],
    [0.5, 'afternoon'],
    [0.8, 'dinner'],
    [0.95, 'night'],
  ])('names phase at %s as %s', (progress, phase) => {
    expect(day_phase(progress)).toBe(phase);
  });

  it('scales traffic with weather', () => {
    expect(weather_multiplier('sunny')).toBeGreaterThan(weather_multiplier('cloudy'));
    expect(weather_multiplier('rainy')).toBeLessThan(weather_multiplier('cloudy'));
  });

  it('averages prices and costs', () => {
    const menu = [
      make_item({ price: 10, cost: 2, popularity: 100 }),
      make_item({ price: 20, cost: 8, popularity: 0 }),
    ];
    expect(average_price(menu)).toBe(15);
    expect(average_price([])).toBe(0);
    expect(average_order_value(menu)).toBe(10);
    expect(average_food_cost(menu)).toBe(2);
    expect(average_order_value([make_item({ popularity: 0 })])).toBe(0);
    expect(average_food_cost([])).toBe(0);
  });

  it('computes the market average over non-empty menus', () => {
    const a = make_restaurant({ menu: [make_item({ price: 10 })] });
    const b = make_restaurant({ menu: [make_item({ price: 20 })] });
    const empty = make_restaurant({ menu: [] });
    expect(market_average_price([a, b, empty])).toBe(15);
    expect(market_average_price([empty])).toBe(0);
  });

  it('derives capacity from staff, kitchen and cook time', () => {
    const base = make_restaurant();
    const extraChef = make_restaurant({ staff: [...base.staff, { ...base.staff[0] }] });
    const upgraded = make_restaurant({ equipment: [{ ...base.equipment[0], level: 3 }] });
    const fast = make_restaurant({ menu: [make_item({ cookTime: 2 })] });
    const empty = make_restaurant({ menu: [], equipment: [] });
    expect(restaurant_capacity(extraChef)).toBeGreaterThan(restaurant_capacity(base));
    expect(restaurant_capacity(upgraded)).toBeGreaterThan(restaurant_capacity(base));
    expect(restaurant_capacity(fast)).toBeGreaterThan(restaurant_capacity(base));
    expect(restaurant_capacity(empty)).toBeGreaterThan(0);
    expect(kitchen_level(empty)).toBe(1);
  });

  it('rewards cheaper, happier, buzzier restaurants', () => {
    const base = make_restaurant();
    const avg = average_price(base.menu);
    const value = attractiveness(base, avg);
    expect(attractiveness(make_restaurant({ satisfaction: 95 }), avg)).toBeGreaterThan(value);
    expect(attractiveness(make_restaurant({ buzz: 1 }), avg)).toBeGreaterThan(value);
    expect(attractiveness(base, avg * 1.5)).toBeGreaterThan(value);
    expect(attractiveness(base, avg, 1.2)).toBeCloseTo(value * 1.2);
    expect(attractiveness(make_restaurant({ menu: [] }), avg)).toBe(0);
  });

  it('distributes demand proportionally', () => {
    expect(distribute_demand(10, [1, 3])).toEqual([2.5, 7.5]);
    expect(distribute_demand(10, [0, 0])).toEqual([0, 0]);
  });

  it('gives diminishing buzz for bigger budgets', () => {
    expect(buzz_gain(0)).toBe(0);
    expect(buzz_gain(-100)).toBe(0);
    expect(buzz_gain(2000)).toBeCloseTo(0.35);
    expect(buzz_gain(12000) / 6).toBeLessThan(buzz_gain(2000));
  });

  it('targets satisfaction from value, service and overload', () => {
    const base = make_restaurant();
    const avg = average_price(base.menu);
    const normal = target_satisfaction(base, avg, 0);
    expect(target_satisfaction(base, avg, 0.5)).toBeLessThan(normal);
    expect(target_satisfaction(base, avg * 2, 0)).toBeGreaterThan(normal);
    expect(target_satisfaction(make_restaurant({ menu: [] }), 0, 0)).toBeGreaterThanOrEqual(0);
    expect(target_satisfaction(base, avg, 10)).toBe(0);
  });

  it('targets popularity from value and rating', () => {
    expect(target_popularity(make_item({ price: 8 }), 10)).toBeGreaterThan(
      target_popularity(make_item({ price: 12 }), 10)
    );
    expect(target_popularity(make_item({ customerRating: 5 }), 0)).toBeGreaterThan(50);
    expect(target_popularity(make_item({ price: 1000 }), 10)).toBe(5);
  });

  it('rates slow dishes higher', () => {
    expect(rating_for_cook_time(30)).toBeGreaterThan(rating_for_cook_time(5));
    expect(rating_for_cook_time(60)).toBe(rating_for_cook_time(30));
  });

  it('sums fixed daily costs', () => {
    const r = make_restaurant();
    expect(daily_fixed_costs(r, 1000, 200)).toBe(600 + 450 + 1000 + 200 + 100);
  });

  it('scores per the specification', () => {
    const r = make_restaurant({
      marketShare: 20,
      revenue: 10000,
      satisfaction: 80,
      expenses: 5000,
    });
    expect(calculate_final_score(r)).toBe(20000 + 1000 + 8000 + 100);
    expect(
      calculate_final_score(
        make_restaurant({ marketShare: 0, revenue: 0, satisfaction: 0, expenses: 0 })
      )
    ).toBe(0);
  });
});
