import { describe, expect, it, vi } from 'vitest';
import { make_state } from '../../test/factories';
import { RankingPanel } from './RankingPanel';
import { RevenueChart } from './RevenueChart';

describe('RankingPanel', () => {
  it('orders rows by share and marks leader, player and selection', () => {
    const root = document.createElement('div');
    const onSelect = vi.fn();
    const panel = new RankingPanel(root, onSelect);
    const state = make_state();
    state.restaurants.forEach((r, i) => {
      r.marketShare = i === 2 ? 40 : 12;
    });
    panel.update(state, 'player');
    const rows = [...root.querySelectorAll<HTMLButtonElement>('.ranking-row')];
    expect(rows).toHaveLength(6);
    const leader = root.querySelector('.ranking-row.leader') as HTMLButtonElement;
    expect(leader.style.transform).toBe('translateY(0px)');
    expect(leader.querySelector('.name')?.textContent).toBe('Wisdom Table');
    expect(root.querySelector('.is-player .you-badge')?.textContent).toBe('YOU');
    expect(root.querySelector('.is-player')?.classList.contains('selected')).toBe(true);
    leader.click();
    expect(onSelect).toHaveBeenCalledWith('ai-strategic');

    panel.update(state, null);
    expect(root.querySelectorAll('.ranking-row')).toHaveLength(6);
    panel.reset();
    expect(root.querySelectorAll('.ranking-row')).toHaveLength(0);
  });
});

describe('RevenueChart', () => {
  it('records bounded history and draws lines', () => {
    const root = document.createElement('div');
    const chart = new RevenueChart(root);
    const state = make_state();
    chart.draw();
    for (let i = 0; i < 430; i++) {
      state.restaurants[0].revenue = i;
      chart.record(state);
    }
    expect(chart.get_series('player')).toHaveLength(420);
    expect(chart.get_series('player')[0]).toBe(10);
    expect(chart.get_series('nope')).toEqual([]);
    chart.draw();
    const ctx = chart.canvas.getContext('2d') as unknown as { stroke: ReturnType<typeof vi.fn> };
    expect(ctx.stroke).toHaveBeenCalled();
    chart.reset();
    expect(chart.get_series('player')).toEqual([]);
  });

  it('falls back to a 1× pixel ratio', () => {
    const chart = new RevenueChart(document.createElement('div'));
    const ratio = window.devicePixelRatio;
    Object.defineProperty(window, 'devicePixelRatio', { value: 0, configurable: true });
    chart.draw();
    expect(chart.canvas.width).toBe(1);
    Object.defineProperty(window, 'devicePixelRatio', { value: ratio, configurable: true });
  });

  it('skips drawing without a context', () => {
    const chart = new RevenueChart(document.createElement('div'));
    vi.spyOn(chart.canvas, 'getContext').mockReturnValue(null);
    expect(() => chart.draw()).not.toThrow();
  });
});
