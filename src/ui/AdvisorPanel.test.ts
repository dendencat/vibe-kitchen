import { describe, expect, it, vi } from 'vitest';
import { make_state } from '../../test/factories';
import { localization } from '../localization/Localization';
import type { SupportAIAdvice } from '../types/AITypes';
import { GAME_CONFIG } from '../utils/Constants';
import { AdvisorPanel } from './AdvisorPanel';

const advice = (overrides: Partial<SupportAIAdvice> = {}): SupportAIAdvice => ({
  id: 'a',
  type: 'tip',
  priority: 'low',
  category: 'smallMenu',
  message: 'Add dishes',
  target: 'menu',
  timestamp: 0,
  ...overrides,
});

function setup() {
  const root = document.createElement('div');
  const onGo = vi.fn();
  const onClose = vi.fn();
  return { root, onGo, onClose, panel: new AdvisorPanel(root, onGo, onClose) };
}

describe('AdvisorPanel', () => {
  it('starts with a welcome bubble and keeps the 3 latest tips', () => {
    const { root, onGo, panel } = setup();
    expect(root.querySelectorAll('.bubble')).toHaveLength(1);
    panel.push(advice({ message: 'one' }));
    panel.push(advice({ message: 'two', target: null, type: 'warning' }));
    panel.push(advice({ message: 'three' }));
    panel.push(advice({ message: 'four' }));
    const bubbles = [...root.querySelectorAll('.bubble')];
    expect(bubbles.map(b => b.querySelector('p')?.textContent)).toEqual(['four', 'three', 'two']);
    expect(bubbles[2].querySelector('.bubble-go')).toBeNull();
    (bubbles[0].querySelector('.bubble-go') as HTMLButtonElement).click();
    expect(onGo).toHaveBeenCalledWith('menu');
    panel.reset();
    expect(root.querySelectorAll('.bubble')).toHaveLength(1);
  });

  it('lists market events with timers and re-renders on language change', () => {
    const { root, panel } = setup();
    panel.update_events([]);
    expect(root.querySelector('.event-empty')?.textContent).toBe('Quiet market today.');
    const festival = { ...GAME_CONFIG.events[1], duration: 0.25 };
    const unknown = { ...GAME_CONFIG.events[0], id: 'mystery', duration: 5 };
    panel.update_events([festival, unknown]);
    expect(root.querySelectorAll('.event-item')).toHaveLength(2);
    expect(root.querySelector('.event-item strong')?.textContent).toBe('Local festival');
    const fill = root.querySelector('.event-timer-fill') as HTMLElement;
    expect(fill.style.transform).toBe('scaleX(0.5)');
    localization.set_language('ja');
    panel.update_events([festival]);
    expect(root.querySelector('.event-item strong')?.textContent).toBe('地元のお祭り');
  });

  it('shows rival intel for the selection', () => {
    const { root, onClose, panel } = setup();
    const state = make_state();
    const intel = root.querySelector('.rival-intel') as HTMLElement;
    panel.update_intel(null, state);
    expect(intel.hidden).toBe(true);
    panel.update_intel(state.restaurants[1], state);
    expect(intel.hidden).toBe(false);
    expect(root.querySelector('.intel-title')?.textContent).toBe('Fire Grill');
    expect(root.querySelector('.intel-desc')?.textContent).toContain('Aggressive');
    expect(root.querySelectorAll('.intel-stats dd')).toHaveLength(6);
    panel.update_intel(state.restaurants[0], state);
    expect(root.querySelector('.intel-desc')?.textContent).toBe('YOU');
    (root.querySelector('.intel-header button') as HTMLButtonElement).click();
    expect(onClose).toHaveBeenCalled();
  });
});
