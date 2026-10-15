import { describe, expect, it } from 'vitest';
import { make_item, make_state } from '../../test/factories';
import type { GameState, PlayerAction, Restaurant } from '../types/GameTypes';
import {
  AggressiveAI,
  BalancedAI,
  create_ai_strategy,
  EmotionalAI,
  SpeedAI,
  StrategicAI,
} from './AIStrategies';

const of_type = (actions: PlayerAction[], type: string, action?: string) =>
  actions.filter(a => a.type === type && (!action || a.action === action));

function setup(index: number, overrides: Partial<Restaurant> = {}, state: Partial<GameState> = {}) {
  const gameState = make_state(state);
  const restaurant = Object.assign(gameState.restaurants[index], overrides);
  return { gameState, restaurant };
}

describe('AggressiveAI', () => {
  it('undercuts rivals by 20% but never below cost × 1.3', () => {
    const { gameState, restaurant } = setup(1);
    const actions = new AggressiveAI(() => 0.99).execute_strategy(gameState, restaurant);
    const prices = of_type(actions, 'menu', 'update_price');
    expect(prices.length).toBeGreaterThan(0);
    prices.forEach(action => {
      if (action.action !== 'update_price') return;
      const item = restaurant.menu.find(i => i.id === action.parameters.itemId)!;
      expect(action.parameters.price).toBeGreaterThanOrEqual(item.cost * 1.3 - 0.01);
      expect(action.parameters.price).toBeLessThan(item.price);
    });
  });

  it('spends 30% of cash on ads and adds specials on even days', () => {
    const { gameState, restaurant } = setup(1, {}, { currentDay: 2 });
    const actions = new AggressiveAI(() => 0.1).execute_strategy(gameState, restaurant);
    const [campaign] = of_type(actions, 'marketing');
    expect(campaign.action === 'launch_campaign' && campaign.parameters.budget).toBe(15000);
    expect(of_type(actions, 'menu', 'add_item')).toHaveLength(1);
  });

  it('holds back when broke or on odd days', () => {
    const { gameState, restaurant } = setup(1, {
      cash: 1000,
      menu: [make_item({ price: 1, cost: 1 })],
    });
    const actions = new AggressiveAI(() => 0.1).execute_strategy(gameState, restaurant);
    expect(of_type(actions, 'marketing')).toHaveLength(0);
    expect(of_type(actions, 'menu', 'add_item')).toHaveLength(0);
    expect(of_type(actions, 'menu', 'update_price')).toHaveLength(0);
    expect(new AggressiveAI().name).toBe('Fire Grill');
  });
});

describe('StrategicAI', () => {
  it('prices within ±15% of the market', () => {
    const ai = new StrategicAI();
    expect(ai.calculate_optimal_price(make_item({ cost: 4, popularity: 50 }), 12)).toBeCloseTo(
      10.4
    );
    expect(ai.calculate_optimal_price(make_item({ cost: 1, popularity: 50 }), 12)).toBeCloseTo(
      10.2
    );
    expect(ai.calculate_optimal_price(make_item({ cost: 10, popularity: 50 }), 12)).toBeCloseTo(
      13.8
    );
    expect(ai.calculate_optimal_price(make_item({ cost: 4, popularity: 50 }), 0)).toBeCloseTo(10.4);
  });

  it('markets when buzz is low, hires when turning guests away, prunes weak dishes', () => {
    const menu = [
      make_item({ id: 'a', popularity: 10 }),
      make_item({ id: 'b' }),
      make_item({ id: 'c' }),
      make_item({ id: 'd' }),
    ];
    const { gameState, restaurant } = setup(2, { lastLost: 1, menu });
    const actions = new StrategicAI().execute_strategy(gameState, restaurant);
    expect(of_type(actions, 'marketing')).toHaveLength(1);
    expect(of_type(actions, 'operations', 'hire_staff')).toHaveLength(1);
    expect(of_type(actions, 'menu', 'remove_item')).toEqual([
      { type: 'menu', action: 'remove_item', parameters: { itemId: 'a' } },
    ]);
  });

  it('keeps small or healthy menus', () => {
    const { gameState, restaurant } = setup(2, { cash: 100, buzz: 1 });
    const actions = new StrategicAI().execute_strategy(gameState, restaurant);
    expect(of_type(actions, 'menu', 'remove_item')).toHaveLength(0);
    expect(of_type(actions, 'marketing')).toHaveLength(0);
    const healthy = setup(2, {
      menu: [
        make_item({ id: 'a' }),
        make_item({ id: 'b' }),
        make_item({ id: 'c' }),
        make_item({ id: 'd', popularity: 40 }),
      ],
    });
    expect(
      of_type(
        new StrategicAI().execute_strategy(healthy.gameState, healthy.restaurant),
        'menu',
        'remove_item'
      )
    ).toHaveLength(0);
  });
});

describe('EmotionalAI', () => {
  it('premium-prices beloved dishes, hires waiters, adds comfort food, uses word of mouth', () => {
    const { gameState, restaurant } = setup(
      3,
      { menu: [make_item({ customerRating: 4.8, price: 10, cost: 5 })], satisfaction: 90 },
      { currentDay: 3 }
    );
    const actions = new EmotionalAI().execute_strategy(gameState, restaurant);
    expect(of_type(actions, 'menu', 'update_price')).toHaveLength(1);
    expect(of_type(actions, 'operations', 'hire_staff')).toHaveLength(1);
    expect(of_type(actions, 'menu', 'add_item')).toHaveLength(1);
    expect(of_type(actions, 'marketing')).toHaveLength(1);
  });

  it('stays quiet when nothing applies', () => {
    const { gameState, restaurant } = setup(3, { cash: 100, satisfaction: 50 });
    expect(new EmotionalAI().execute_strategy(gameState, restaurant)).toEqual([]);
  });
});

describe('SpeedAI', () => {
  it('drops slow dishes, adds quick bites, upgrades and advertises', () => {
    const menu = [
      make_item({ id: 'slow', cookTime: 25 }),
      make_item(),
      make_item(),
      make_item(),
      make_item(),
    ];
    const { gameState, restaurant } = setup(4, { cash: 30000, menu });
    const actions = new SpeedAI(() => 0.1).execute_strategy(gameState, restaurant);
    expect(of_type(actions, 'menu', 'remove_item')).toHaveLength(1);
    expect(of_type(actions, 'menu', 'add_item')).toHaveLength(1);
    expect(of_type(actions, 'operations', 'upgrade_equipment')).toHaveLength(1);
    expect(of_type(actions, 'marketing')).toHaveLength(1);
  });

  it('does not upgrade a maxed kitchen', () => {
    const { gameState, restaurant } = setup(4, { cash: 1e6 });
    restaurant.equipment[0].level = 5;
    expect(
      of_type(new SpeedAI(() => 0.9).execute_strategy(gameState, restaurant), 'operations')
    ).toHaveLength(0);
  });
});

describe('BalancedAI', () => {
  it('converges to market-average pricing and invests steadily', () => {
    const { gameState, restaurant } = setup(
      5,
      { menu: [make_item({ price: 30 })] },
      { currentDay: 6 }
    );
    const actions = new BalancedAI(() => 0.1).execute_strategy(gameState, restaurant);
    expect(of_type(actions, 'menu', 'update_price')).toHaveLength(1);
    expect(of_type(actions, 'marketing')).toHaveLength(1);
    expect(of_type(actions, 'menu', 'add_item')).toHaveLength(1);
    const [hire] = of_type(actions, 'operations');
    expect(hire.action === 'hire_staff' && hire.parameters.staffType).toBe('chef');
    const waiter = of_type(
      new BalancedAI(() => 0.9).execute_strategy(gameState, restaurant),
      'operations'
    )[0];
    expect(waiter.action === 'hire_staff' && waiter.parameters.staffType).toBe('waiter');
  });
});

describe('create_ai_strategy', () => {
  it.each([
    ['aggressive', AggressiveAI],
    ['strategic', StrategicAI],
    ['emotional', EmotionalAI],
    ['speed', SpeedAI],
    ['balanced', BalancedAI],
    ['unknown', BalancedAI],
  ])('creates %s', (type, Ctor) => {
    expect(create_ai_strategy(type)).toBeInstanceOf(Ctor);
  });

  it('gives every strategy a distinct risk profile name', () => {
    const names = ['aggressive', 'strategic', 'emotional', 'speed', 'balanced'].map(
      t => create_ai_strategy(t).name
    );
    expect(new Set(names).size).toBe(5);
  });
});
