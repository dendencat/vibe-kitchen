import { describe, expect, it, vi } from 'vitest';
import type { GameEvent, PlayerAction } from '../types/GameTypes';
import { GAME_CONSTANTS } from '../utils/Constants';
import { GameEngine } from './GameEngine';

const quiet = () => 0.99; // no random events, no random AI campaigns

const run = (engine: GameEngine, ticks: number) => {
  for (let i = 0; i < ticks; i++) engine.tick();
};

describe('GameEngine', () => {
  it('creates a game with options', () => {
    const engine = new GameEngine({
      playerName: 'Neko',
      difficulty: 'easy',
      rng: quiet,
      dishName: k => k,
    });
    expect(engine.get_player().name).toBe('Neko');
    expect(engine.get_state().difficulty).toBe('easy');
    expect(engine.get_player().menu[0].name).toBe('burger');
    expect(new GameEngine().get_state().difficulty).toBe('normal');
  });

  it('runs exactly seven 60-second days, then ends', () => {
    const engine = new GameEngine({ rng: quiet });
    const events: GameEvent[] = [];
    engine.subscribe(event => events.push(event));

    run(engine, 59);
    expect(engine.get_state().currentDay).toBe(1);
    engine.tick();
    expect(engine.get_state().currentDay).toBe(2);
    expect(events.filter(e => e.type === 'day-start')).toHaveLength(1);

    run(engine, GAME_CONSTANTS.GAME_DURATION_SECONDS - 60);
    expect(engine.is_over()).toBe(true);
    expect(engine.get_state().elapsedSeconds).toBe(GAME_CONSTANTS.GAME_DURATION_SECONDS);
    expect(engine.get_state().currentDay).toBe(7);
    const over = events.find(e => e.type === 'game-over');
    expect(over?.type === 'game-over' && over.results).toHaveLength(6);

    const before = engine.get_state().elapsedSeconds;
    engine.tick();
    expect(engine.get_state().elapsedSeconds).toBe(before);
    expect(engine.update(5000)).toBe(0);
  });

  it('simulates customers, revenue and market share', () => {
    const engine = new GameEngine({ rng: quiet });
    run(engine, 30);
    const shares = engine.get_state().restaurants.map(r => r.marketShare);
    expect(shares.reduce((a, b) => a + b, 0)).toBeCloseTo(100);
    const player = engine.get_player();
    expect(player.customerCount).toBeGreaterThan(0);
    expect(player.revenue).toBeGreaterThan(0);
    expect(player.lastServed).toBeGreaterThan(0);
  });

  it('turns guests away when over capacity', () => {
    const engine = new GameEngine({ rng: quiet });
    const player = engine.get_player();
    player.staff = [];
    player.buzz = 2.5;
    run(engine, 20);
    expect(player.lastLost).toBeGreaterThan(0);
    expect(player.utilization).toBeGreaterThan(1);
  });

  it('handles a rival with nothing to sell', () => {
    const engine = new GameEngine({ rng: quiet });
    const rival = engine.get_state().restaurants[1];
    rival.menu = [];
    engine.tick();
    expect(rival.lastServed).toBe(0);
    expect(rival.utilization).toBe(0);
  });

  it('accumulates frame time into ticks and caps long gaps', () => {
    const engine = new GameEngine({ rng: quiet });
    expect(engine.update(400)).toBe(0);
    expect(engine.get_day_progress()).toBeCloseTo(400 / 60000);
    expect(engine.update(700)).toBe(1);
    expect(engine.update(60_000)).toBe(1);
    expect(engine.get_state().elapsedSeconds).toBe(2);
  });

  it('pauses and resumes', () => {
    const engine = new GameEngine({ rng: quiet });
    engine.pause();
    expect(engine.is_paused()).toBe(true);
    expect(engine.update(1000)).toBe(0);
    engine.resume();
    expect(engine.update(1000)).toBe(1);
  });

  it('emits market events and applies them', () => {
    const engine = new GameEngine({ rng: () => 0 });
    const listener = vi.fn();
    engine.subscribe(listener);
    engine.tick();
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ type: 'market-event' }));
    expect(engine.get_state().marketEvents.length).toBeGreaterThan(0);
  });

  it('unsubscribes listeners', () => {
    const engine = new GameEngine({ rng: quiet });
    const listener = vi.fn();
    const off = engine.subscribe(listener);
    off();
    engine.tick();
    expect(listener).not.toHaveBeenCalled();
  });

  describe('actions', () => {
    const act = (engine: GameEngine, action: PlayerAction) =>
      engine.execute_action('player', action);

    it('adds, reprices and removes dishes', () => {
      const engine = new GameEngine({ rng: quiet });
      const player = engine.get_player();
      expect(
        act(engine, {
          type: 'menu',
          action: 'add_item',
          parameters: { name: 'Taco', price: 9, cost: 3, cookTime: 30 },
        })
      ).toEqual({ ok: true });
      const taco = player.menu[player.menu.length - 1];
      expect(taco.customerRating).toBeGreaterThan(4.5);
      expect(player.menuChanges).toBe(1);

      expect(
        act(engine, {
          type: 'menu',
          action: 'update_price',
          parameters: { itemId: taco.id, price: 11.111 },
        }).ok
      ).toBe(true);
      expect(taco.price).toBe(11.11);

      expect(
        act(engine, { type: 'menu', action: 'remove_item', parameters: { itemId: taco.id } }).ok
      ).toBe(true);
      expect(player.menu).toHaveLength(3);
      expect(player.menuChanges).toBe(2);
    });

    it('rejects invalid menu changes', () => {
      const engine = new GameEngine({ rng: quiet });
      const player = engine.get_player();
      expect(
        act(engine, { type: 'menu', action: 'remove_item', parameters: { itemId: 'nope' } })
      ).toEqual({ ok: false, reason: 'errors.notFound' });
      expect(
        act(engine, {
          type: 'menu',
          action: 'update_price',
          parameters: { itemId: player.menu[0].id, price: -1 },
        })
      ).toEqual({ ok: false, reason: 'errors.invalid' });
      expect(
        act(engine, {
          type: 'menu',
          action: 'add_item',
          parameters: { name: '', price: 9, cost: 3, cookTime: 5 },
        })
      ).toEqual({ ok: false, reason: 'errors.invalid' });

      player.menu = player.menu.slice(0, 1);
      expect(
        act(engine, {
          type: 'menu',
          action: 'remove_item',
          parameters: { itemId: player.menu[0].id },
        })
      ).toEqual({ ok: false, reason: 'errors.minMenu' });

      for (let i = 0; i < 9; i++) {
        act(engine, {
          type: 'menu',
          action: 'add_item',
          parameters: { name: `D${i}`, price: 9, cost: 3, cookTime: 5 },
        });
      }
      expect(
        act(engine, {
          type: 'menu',
          action: 'add_item',
          parameters: { name: 'X', price: 9, cost: 3, cookTime: 5 },
        })
      ).toEqual({ ok: false, reason: 'errors.menuFull' });
    });

    it('launches campaigns using the preset budget', () => {
      const engine = new GameEngine({ rng: quiet });
      const player = engine.get_player();
      expect(
        act(engine, {
          type: 'marketing',
          action: 'launch_campaign',
          parameters: { campaignType: 'tv', budget: 1 },
        }).ok
      ).toBe(true);
      expect(player.cash).toBe(50000 - 12000);
      expect(player.buzz).toBeGreaterThan(0.9);
      expect(player.satisfaction).toBe(78);
    });

    it('accepts custom AI budgets and rejects unaffordable campaigns', () => {
      const engine = new GameEngine({ rng: quiet });
      const player = engine.get_player();
      expect(
        act(engine, {
          type: 'marketing',
          action: 'launch_campaign',
          parameters: { campaignType: 'aggressive', budget: 4000 },
        }).ok
      ).toBe(true);
      expect(player.cash).toBe(46000);
      expect(player.satisfaction).toBe(76);
      player.cash = 100;
      expect(
        act(engine, {
          type: 'marketing',
          action: 'launch_campaign',
          parameters: { campaignType: 'social', budget: 0 },
        })
      ).toEqual({ ok: false, reason: 'errors.notEnoughCash' });
    });

    it('hires staff within limits', () => {
      const engine = new GameEngine({ rng: quiet });
      const player = engine.get_player();
      expect(
        act(engine, { type: 'operations', action: 'hire_staff', parameters: { staffType: 'chef' } })
          .ok
      ).toBe(true);
      expect(player.staff).toHaveLength(3);
      for (let i = 0; i < 3; i++)
        act(engine, {
          type: 'operations',
          action: 'hire_staff',
          parameters: { staffType: 'chef' },
        });
      expect(
        act(engine, { type: 'operations', action: 'hire_staff', parameters: { staffType: 'chef' } })
      ).toEqual({ ok: false, reason: 'errors.staffLimit' });
      player.cash = 0;
      expect(
        act(engine, {
          type: 'operations',
          action: 'hire_staff',
          parameters: { staffType: 'waiter' },
        })
      ).toEqual({ ok: false, reason: 'errors.notEnoughCash' });
      expect(
        act(engine, {
          type: 'operations',
          action: 'hire_staff',
          parameters: { staffType: 'manager' as 'chef' },
        })
      ).toEqual({ ok: false, reason: 'errors.invalid' });
    });

    it('upgrades the kitchen up to the max level', () => {
      const engine = new GameEngine({ rng: quiet });
      const player = engine.get_player();
      const upgrade: PlayerAction = {
        type: 'operations',
        action: 'upgrade_equipment',
        parameters: { equipmentType: 'kitchen' },
      };
      expect(act(engine, upgrade).ok).toBe(true);
      expect(player.equipment[0]).toMatchObject({ level: 2, maintenanceCost: 200 });
      expect(player.efficiency).toBeCloseTo(1.15);
      player.cash = 1e6;
      act(engine, upgrade);
      act(engine, upgrade);
      act(engine, upgrade);
      expect(act(engine, upgrade)).toEqual({ ok: false, reason: 'errors.maxLevel' });
      player.equipment[0].level = 1;
      player.cash = 0;
      expect(act(engine, upgrade)).toEqual({ ok: false, reason: 'errors.notEnoughCash' });
      player.equipment = [];
      expect(act(engine, upgrade)).toEqual({ ok: false, reason: 'errors.notFound' });
    });

    it('rejects actions for unknown restaurants or after the game', () => {
      const engine = new GameEngine({ rng: quiet });
      const hire: PlayerAction = {
        type: 'operations',
        action: 'hire_staff',
        parameters: { staffType: 'chef' },
      };
      expect(engine.execute_action('ghost', hire)).toEqual({
        ok: false,
        reason: 'errors.notFound',
      });
      run(engine, GAME_CONSTANTS.GAME_DURATION_SECONDS);
      expect(engine.execute_action('player', hire)).toEqual({
        ok: false,
        reason: 'errors.notFound',
      });
    });

    it('lets AI rivals act through the same rules', () => {
      const engine = new GameEngine({ rng: quiet });
      const listener = vi.fn();
      engine.subscribe(listener);
      run(engine, 10);
      const aiActions = listener.mock.calls
        .map(([event]) => event as GameEvent)
        .filter(event => event.type === 'action' && event.restaurantId !== 'player');
      expect(aiActions.length).toBeGreaterThan(0);
    });
  });

  describe('results', () => {
    it('ranks by score and picks award winners', () => {
      const engine = new GameEngine({ rng: quiet });
      const [player, rival] = engine.get_state().restaurants;
      player.marketShare = 90;
      player.revenue = 100;
      rival.revenue = 9999;
      rival.expenses = 10000;
      rival.satisfaction = 100;
      rival.menuChanges = 5;
      const results = engine.get_final_results();
      expect(results[0].id).toBe('player');
      const awards = engine.get_awards();
      expect(awards.revenue).toBe(rival.id);
      expect(awards.satisfaction).toBe(rival.id);
      expect(awards.innovation).toBe(rival.id);
      expect(typeof awards.efficiency).toBe('string');
    });
  });

  describe('snapshots', () => {
    it('round-trips through restore', () => {
      const engine = new GameEngine({ rng: quiet, playerName: 'Saved', difficulty: 'hard' });
      run(engine, 75);
      const snapshot = JSON.parse(JSON.stringify(engine.snapshot()));
      const restored = GameEngine.restore(snapshot, { rng: quiet });
      expect(restored?.get_player().name).toBe('Saved');
      expect(restored?.get_state().currentDay).toBe(2);
      expect(restored?.get_state().difficulty).toBe('hard');
      restored?.tick();
      expect(restored?.get_state().elapsedSeconds).toBe(76);
      expect(engine.get_state().elapsedSeconds).toBe(75);
    });

    it.each([
      null,
      'x',
      {},
      { version: 1, state: {} },
      { version: 2 },
      { version: 2, state: { restaurants: [], currentDay: 1 } },
      { version: 2, state: { restaurants: [1, 2, 3, 4, 5, 6], currentDay: 9 } },
      { version: 2, state: { restaurants: [1, 2, 3, 4, 5, 6], currentDay: '1' } },
      { version: 2, state: { restaurants: [1, 2, 3, 4, 5, 6], currentDay: 0 } },
    ])('rejects invalid snapshot %#', value => {
      expect(GameEngine.restore(value)).toBeNull();
    });
  });
});
