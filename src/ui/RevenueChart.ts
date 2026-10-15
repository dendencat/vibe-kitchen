import type { GameState } from '../types/GameTypes';
import { brand_color, to_css_color } from '../three/SceneLayout';
import { h } from './dom';

/** Samples kept per restaurant (one per simulated second → full game). */
export const HISTORY_LIMIT = 420;

/**
 * Cumulative revenue chart drawn on a 2D canvas (no chart library needed).
 */
export class RevenueChart {
  readonly canvas: HTMLCanvasElement;
  private readonly history = new Map<string, number[]>();
  private readonly colors = new Map<string, { color: string; player: boolean }>();

  constructor(root: HTMLElement) {
    this.canvas = h('canvas', {
      className: 'revenue-chart',
      attrs: { role: 'img', 'aria-label': 'Revenue chart' },
    });
    root.append(h('h2', { className: 'panel-title', i18n: 'revenueTitle' }), this.canvas);
  }

  /**
   * Appends one sample per restaurant.
   * @param state - Game state after a tick.
   */
  record(state: GameState): void {
    state.restaurants.forEach(restaurant => {
      const series = this.history.get(restaurant.id) ?? [];
      series.push(restaurant.revenue);
      if (series.length > HISTORY_LIMIT) series.shift();
      this.history.set(restaurant.id, series);
      this.colors.set(restaurant.id, {
        color: to_css_color(brand_color(restaurant.type, restaurant.strategyType)),
        player: restaurant.type === 'player',
      });
    });
  }

  /** Series for a restaurant (for tests/tooling). */
  get_series(id: string): readonly number[] {
    return this.history.get(id) ?? [];
  }

  /** Clears history (new game). */
  reset(): void {
    this.history.clear();
    this.colors.clear();
  }

  /** Redraws the chart at the canvas' CSS size. */
  draw(): void {
    const ctx = this.canvas.getContext('2d');
    if (!ctx) return;
    const ratio = window.devicePixelRatio || 1;
    const width = Math.max(1, this.canvas.clientWidth);
    const height = Math.max(1, this.canvas.clientHeight);
    if (this.canvas.width !== Math.round(width * ratio))
      this.canvas.width = Math.round(width * ratio);
    if (this.canvas.height !== Math.round(height * ratio))
      this.canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const all = [...this.history.values()];
    const max = Math.max(1, ...all.flat());
    const length = Math.max(2, ...all.map(series => series.length));

    ctx.strokeStyle = 'rgba(120, 110, 140, 0.18)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      const y = (height * i) / 4;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw rivals first so the player's line stays on top
    const entries = [...this.history.entries()].sort(
      ([a], [b]) => Number(this.colors.get(a)?.player) - Number(this.colors.get(b)?.player)
    );
    entries.forEach(([id, series]) => {
      const style = this.colors.get(id);
      if (!style || series.length < 2) return;
      ctx.strokeStyle = style.color;
      ctx.lineWidth = style.player ? 3 : 1.5;
      ctx.globalAlpha = style.player ? 1 : 0.75;
      ctx.beginPath();
      series.forEach((value, i) => {
        const x = (i / (length - 1)) * width;
        const y = height - 4 - (value / max) * (height - 8);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    });
    ctx.globalAlpha = 1;
  }
}
