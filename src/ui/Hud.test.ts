import { describe, expect, it, vi } from 'vitest';
import { make_state } from '../../test/factories';
import { localization } from '../localization/Localization';
import { Hud } from './Hud';

function setup() {
  const root = document.createElement('header');
  document.body.append(root);
  const callbacks = { onPause: vi.fn(), onSettings: vi.fn(), onToggleMute: vi.fn() };
  return { root, callbacks, hud: new Hud(root, callbacks) };
}

describe('Hud', () => {
  it('shows day, clock, phase, weather and stats', () => {
    const { root, hud } = setup();
    const state = make_state({ currentDay: 3, timeRemaining: 42, weatherCondition: 'rainy' });
    const player = state.restaurants[0];
    player.dailyProfit = -50;
    hud.update(state, player, 0.3);
    expect(root.querySelector('.day-label')?.textContent).toBe('Day 3 / 7');
    expect(root.querySelectorAll('.pip.done')).toHaveLength(2);
    expect(root.querySelector('.pip.current')).not.toBeNull();
    expect(root.querySelector('.clock')?.textContent).toBe('0:42');
    expect(root.querySelector('.phase')?.textContent).toBe('Lunch rush');
    expect(root.querySelector('.weather')?.textContent).toContain('Rainy');
    expect(root.querySelector('.stat-cash .stat-value')?.textContent).toBe('$50,000');
    expect(root.querySelector('.stat-cash .stat-sub')?.classList.contains('negative')).toBe(true);
    expect(root.querySelector('.day-progress')?.getAttribute('aria-valuenow')).toBe('30');
  });

  it('flashes stats only on meaningful changes and warns about lost guests', () => {
    const { root, hud } = setup();
    const state = make_state();
    const player = state.restaurants[0];
    hud.update(state, player, 0);
    player.cash += 100;
    hud.update(state, player, 0);
    expect(root.querySelector('.stat-cash')?.classList.contains('flash-up')).toBe(false);
    player.cash -= 5000;
    player.satisfaction = 40;
    player.lastLost = 2;
    hud.update(state, player, 0);
    expect(root.querySelector('.stat-cash')?.classList.contains('flash-down')).toBe(true);
    expect(root.querySelector('.stat-satisfaction')?.classList.contains('warn')).toBe(true);
    expect(root.querySelector('.stat-customers .stat-sub')?.textContent).toContain('2.0');
    hud.reset();
    hud.update(state, player, 0);
  });

  it('wires buttons and reflects mute/pause', () => {
    const { root, callbacks, hud } = setup();
    (root.querySelector('#mute-button') as HTMLButtonElement).click();
    (root.querySelector('#pause-button') as HTMLButtonElement).click();
    (root.querySelector('#settings-button') as HTMLButtonElement).click();
    expect(callbacks.onToggleMute).toHaveBeenCalled();
    expect(callbacks.onPause).toHaveBeenCalled();
    expect(callbacks.onSettings).toHaveBeenCalled();

    localization.set_language('ja');
    hud.set_muted(true);
    hud.set_paused(true);
    expect(root.querySelector('#mute-button')?.textContent).toBe('🔇');
    expect(root.querySelector('#mute-button')?.getAttribute('aria-label')).toBe('ミュート解除');
    expect(root.querySelector('#pause-button')?.getAttribute('aria-label')).toBe('再開');
    hud.set_muted(false);
    hud.set_paused(false);
    expect(root.querySelector('#pause-button')?.textContent).toBe('⏸');
  });
});
