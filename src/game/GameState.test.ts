import { describe, expect, it } from 'vitest';
import { make_item } from '../../test/factories';
import { create_id, create_menu_item, create_staff, GameStateManager } from './GameState';

describe('GameStateManager', () => {
  it('creates the player and five AI rivals', () => {
    const state = new GameStateManager({ playerName: 'Mine', difficulty: 'hard' }).get_state();
    expect(state.restaurants).toHaveLength(6);
    expect(state.restaurants[0]).toMatchObject({
      id: 'player',
      name: 'Mine',
      type: 'player',
      cash: 50000,
    });
    expect(state.restaurants.slice(1).map(r => r.strategyType)).toEqual([
      'aggressive',
      'strategic',
      'emotional',
      'speed',
      'balanced',
    ]);
    expect(state).toMatchObject({
      currentDay: 1,
      timeRemaining: 60,
      elapsedSeconds: 0,
      difficulty: 'hard',
    });
  });

  it('uses defaults when no options are given', () => {
    const manager = new GameStateManager();
    expect(manager.get_player().name).toBe('Your Restaurant');
    expect(manager.get_state().difficulty).toBe('normal');
    expect(manager.get_player().menu.map(i => i.name)).toEqual([
      'Classic Burger',
      'Caesar Salad',
      'Grilled Chicken',
    ]);
  });

  it('localizes starting dishes through the resolver', () => {
    const manager = new GameStateManager({ dishName: key => `dish:${key}` });
    expect(manager.get_player().menu.map(i => i.name)).toEqual([
      'dish:burger',
      'dish:salad',
      'dish:chicken',
    ]);
  });

  it('starts with a chef, a waiter and a level-1 kitchen', () => {
    const player = new GameStateManager().get_player();
    expect(player.staff.map(s => s.type)).toEqual(['chef', 'waiter']);
    expect(player.equipment[0]).toMatchObject({ type: 'kitchen', level: 1 });
  });

  it('updates state and restaurants', () => {
    const manager = new GameStateManager();
    manager.update_state({ currentDay: 3 });
    expect(manager.get_state().currentDay).toBe(3);
    const player = manager.get_player();
    manager.update_restaurant('player', { cash: 1 });
    expect(player.cash).toBe(1);
    manager.update_restaurant('missing', { cash: 2 });
    expect(manager.get_restaurant('missing')).toBeUndefined();
  });

  it('adds and expires market events', () => {
    const manager = new GameStateManager();
    const event = {
      id: 'e',
      name: 'E',
      description: '',
      effect: {},
      duration: 1,
      probability: 1,
      scope: 'market' as const,
    };
    manager.add_market_event(event);
    manager.add_market_event({ ...event, id: 'gone', duration: 0 });
    manager.remove_expired_events();
    expect(manager.get_state().marketEvents.map(e => e.id)).toEqual(['e']);
  });

  it('computes market shares from customers', () => {
    const manager = new GameStateManager();
    manager.get_state().restaurants.forEach((r, i) => {
      r.customerCount = i === 0 ? 50 : 10;
    });
    manager.calculate_market_shares();
    expect(manager.get_player().marketShare).toBe(50);
  });

  it('replaces the whole state', () => {
    const manager = new GameStateManager();
    const other = new GameStateManager({ playerName: 'Other' }).get_state();
    manager.set_state(other);
    expect(manager.get_player().name).toBe('Other');
  });
});

describe('factories', () => {
  it('creates unique ids', () => {
    expect(create_id('x')).not.toBe(create_id('x'));
  });

  it('creates staff with role economics', () => {
    expect(create_staff('chef')).toMatchObject({ type: 'chef', name: 'Chef', salary: 600 });
    expect(create_staff('waiter')).toMatchObject({ type: 'waiter', name: 'Waiter', salary: 450 });
  });

  it('creates menu items with margin and rounding', () => {
    const item = create_menu_item({ ...make_item(), price: 10.004 }, 4.5);
    expect(item).toMatchObject({ price: 10, customerRating: 4.5, popularity: 60 });
    expect(item.profitMargin).toBeCloseTo(60, 1);
    expect(create_menu_item(make_item()).customerRating).toBe(4);
  });
});
