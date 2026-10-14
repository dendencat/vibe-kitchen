import { describe, expect, it } from 'vitest';
import { seeded_rng } from '../../test/factories';
import type { Difficulty, PlayerAction } from '../types/GameTypes';
import { DISH_PRESETS, GAME_CONSTANTS } from '../utils/Constants';
import { GameEngine } from './GameEngine';
import { market_average_price } from './Simulation';

/**
 * Balance regression: plays whole games headlessly with a scripted player.
 * Guards the tuning documented in docs/ARCHITECTURE.md ("Balance").
 */
function play(
  difficulty: Difficulty,
  seed: number,
  smart: boolean
): { rank: number; engine: GameEngine } {
  const engine = new GameEngine({ difficulty, rng: seeded_rng(seed) });
  const act = (action: PlayerAction) => engine.execute_action('player', action);
  for (let second = 0; second < GAME_CONSTANTS.GAME_DURATION_SECONDS; second++) {
    const player = engine.get_player();
    if (smart) {
      if (second === 1) {
        DISH_PRESETS.slice(0, 3).forEach(preset =>
          act({ type: 'menu', action: 'add_item', parameters: preset })
        );
      }
      if (second % 10 === 2) {
        const avg = market_average_price(engine.get_state().restaurants);
        player.menu.forEach(item =>
          act({
            type: 'menu',
            action: 'update_price',
            parameters: { itemId: item.id, price: Math.max(item.cost * 1.8, avg * 0.92) },
          })
        );
      }
      if (player.lastLost > 0.3 && player.cash > 8000) {
        const chefs = player.staff.filter(s => s.type === 'chef').length;
        const waiters = player.staff.length - chefs;
        act({
          type: 'operations',
          action: 'hire_staff',
          parameters: { staffType: chefs <= waiters ? 'chef' : 'waiter' },
        });
      }
      if (player.buzz < 0.2 && player.cash > 12000) {
        act({
          type: 'marketing',
          action: 'launch_campaign',
          parameters: { campaignType: 'social', budget: 0 },
        });
      }
    }
    engine.tick();
  }
  const rank = engine.get_final_results().findIndex(r => r.type === 'player') + 1;
  return { rank, engine };
}

describe('game balance', () => {
  it('lets an active player win on easy', () => {
    [1, 2, 3].forEach(seed => expect(play('easy', seed, true).rank).toBe(1));
  });

  it('keeps hard harder than easy for the same strategy', () => {
    const easy = [1, 2, 3].map(seed => play('easy', seed, true).rank);
    const hard = [1, 2, 3].map(seed => play('hard', seed, true).rank);
    expect(hard.reduce((a, b) => a + b)).toBeGreaterThan(easy.reduce((a, b) => a + b));
  });

  it('does not reward doing nothing', () => {
    [1, 2].forEach(seed => expect(play('normal', seed, false).rank).toBeGreaterThan(3));
  });

  it('keeps an idle restaurant solvent', () => {
    expect(play('normal', 4, false).engine.get_player().cash).toBeGreaterThan(30000);
  });
});
