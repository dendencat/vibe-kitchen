import { describe, expect, it, vi } from 'vitest';
import { make_item, make_state } from '../../test/factories';
import type { PlayerAction } from '../types/GameTypes';
import { AI_DECISION_INTERVAL, AIController } from './AIController';

describe('AIController', () => {
  it('waits for its initial offset and then throttles decisions', () => {
    const controller = new AIController('ai-balanced', 'balanced', 3, () => 0.5);
    const state = make_state({ currentDay: 2 });
    state.restaurants[5].menu = [make_item({ price: 50 })];
    expect(controller.make_decisions({ ...state, elapsedSeconds: 2 })).toEqual([]);
    expect(controller.make_decisions({ ...state, elapsedSeconds: 3 }).length).toBeGreaterThan(0);
    expect(controller.make_decisions({ ...state, elapsedSeconds: 4 })).toEqual([]);
    expect(
      controller.make_decisions({ ...state, elapsedSeconds: 3 + AI_DECISION_INTERVAL }).length
    ).toBeGreaterThan(0);
    expect(controller.get_restaurant_id()).toBe('ai-balanced');
    expect(controller.get_strategy().name).toBe('Harmony Restaurant');
  });

  it('returns nothing when its restaurant is missing', () => {
    expect(new AIController('ghost', 'speed').make_decisions(make_state())).toEqual([]);
  });

  it('filters unaffordable or impossible actions', () => {
    const controller = new AIController('ai-speed', 'speed');
    const state = make_state();
    const restaurant = state.restaurants[4];
    const actions: PlayerAction[] = [
      {
        type: 'marketing',
        action: 'launch_campaign',
        parameters: { campaignType: 'x', budget: 1e9 },
      },
      {
        type: 'marketing',
        action: 'launch_campaign',
        parameters: { campaignType: 'x', budget: 10 },
      },
      {
        type: 'menu',
        action: 'add_item',
        parameters: { name: 'a', price: 2, cost: 1, cookTime: 1 },
      },
      { type: 'operations', action: 'hire_staff', parameters: { staffType: 'chef' } },
      { type: 'operations', action: 'upgrade_equipment', parameters: { equipmentType: 'kitchen' } },
    ];
    vi.spyOn(controller.get_strategy(), 'execute_strategy').mockReturnValue(actions);
    expect(controller.make_decisions(state)).toEqual(actions.slice(1));

    restaurant.menu = Array.from({ length: 10 }, () => make_item());
    restaurant.staff = Array.from({ length: 5 }, () => ({
      ...restaurant.staff[0],
      type: 'chef' as const,
    }));
    const later = { ...state, elapsedSeconds: 100 };
    expect(controller.make_decisions(later)).toEqual([actions[1], actions[4]]);

    restaurant.staff = [];
    restaurant.cash = 0;
    expect(controller.make_decisions({ ...state, elapsedSeconds: 200 })).toEqual([actions[4]]);
  });

  it('survives strategy errors', () => {
    const controller = new AIController('ai-speed', 'speed');
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(controller.get_strategy(), 'execute_strategy').mockImplementation(() => {
      throw new Error('boom');
    });
    expect(controller.make_decisions(make_state())).toEqual([]);
    expect(console.error).toHaveBeenCalled();
  });
});
