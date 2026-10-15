import { day_phase } from '../game/Simulation';
import { localization } from '../localization/Localization';
import type { GameState, Restaurant } from '../types/GameTypes';
import { GAME_CONSTANTS } from '../utils/Constants';
import { h, set_text } from './dom';
import { format_clock, format_delta, format_money, format_percent } from './format';

export const WEATHER_ICONS = { sunny: '☀️', cloudy: '⛅', rainy: '🌧️' } as const;

export interface HudCallbacks {
  onPause(): void;
  onSettings(): void;
  onToggleMute(): void;
}

interface StatChip {
  root: HTMLElement;
  value: HTMLElement;
  sub: HTMLElement;
  last: number;
}

/**
 * Top bar: day/clock, weather, key stats and quick actions.
 */
export class Hud {
  private readonly dayLabel: HTMLElement;
  private readonly pips: HTMLElement[] = [];
  private readonly progress: HTMLElement;
  private readonly progressFill: HTMLElement;
  private readonly phase: HTMLElement;
  private readonly clock: HTMLElement;
  private readonly weather: HTMLElement;
  private readonly stats: Record<'cash' | 'customers' | 'satisfaction' | 'share', StatChip>;
  private readonly muteButton: HTMLButtonElement;
  private readonly pauseButton: HTMLButtonElement;

  constructor(root: HTMLElement, callbacks: HudCallbacks) {
    this.dayLabel = h('div', { className: 'day-label' });
    const pipRow = h('div', { className: 'day-pips', attrs: { 'aria-hidden': 'true' } });
    for (let day = 1; day <= GAME_CONSTANTS.DAYS_PER_GAME; day++) {
      const pip = h('span', { className: 'pip' });
      this.pips.push(pip);
      pipRow.append(pip);
    }

    this.progressFill = h('div', { className: 'day-progress-fill' });
    this.progress = h(
      'div',
      {
        className: 'day-progress',
        attrs: { role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '100' },
      },
      this.progressFill,
      h('span', { className: 'peak peak-lunch', attrs: { 'aria-hidden': 'true' } }),
      h('span', { className: 'peak peak-dinner', attrs: { 'aria-hidden': 'true' } })
    );
    this.phase = h('span', { className: 'phase' });
    this.clock = h('span', { className: 'clock', attrs: { 'aria-live': 'off' } });
    this.weather = h('span', { className: 'weather' });

    const chip = (key: string, icon: string): StatChip => {
      const value = h('span', { className: 'stat-value' });
      const sub = h('span', { className: 'stat-sub' });
      const chipRoot = h(
        'div',
        { className: `stat stat-${key}` },
        h('span', { className: 'stat-icon', text: icon, attrs: { 'aria-hidden': 'true' } }),
        h(
          'span',
          { className: 'stat-body' },
          h('span', { className: 'stat-label', i18n: key }),
          value,
          sub
        )
      );
      return { root: chipRoot, value, sub, last: Number.NaN };
    };
    this.stats = {
      cash: chip('cash', '💰'),
      customers: chip('customers', '🙋'),
      satisfaction: chip('satisfaction', '😊'),
      share: chip('marketShare', '🏆'),
    };

    const iconButton = (icon: string, aria: string, onClick: () => void, id: string) =>
      h('button', {
        className: 'icon-btn',
        id,
        text: icon,
        i18nAria: aria,
        attrs: { type: 'button', title: localization.t(aria) },
        on: { click: onClick },
      });
    this.muteButton = iconButton('🎵', 'mute', callbacks.onToggleMute, 'mute-button');
    this.pauseButton = iconButton('⏸', 'pause', callbacks.onPause, 'pause-button');

    root.append(
      h(
        'div',
        { className: 'hud-day' },
        h('span', { className: 'hud-logo', text: '🌸', attrs: { 'aria-hidden': 'true' } }),
        h('div', {}, this.dayLabel, pipRow)
      ),
      h(
        'div',
        { className: 'hud-clock' },
        this.progress,
        h('div', { className: 'clock-meta' }, this.phase, this.clock, this.weather)
      ),
      h(
        'div',
        { className: 'hud-stats' },
        this.stats.cash.root,
        this.stats.customers.root,
        this.stats.satisfaction.root,
        this.stats.share.root
      ),
      h(
        'div',
        { className: 'hud-actions' },
        this.muteButton,
        this.pauseButton,
        iconButton('⚙', 'settings', callbacks.onSettings, 'settings-button')
      )
    );
  }

  /**
   * Refreshes the bar. Cheap enough to call every frame (text is diffed).
   * @param state - Game state.
   * @param player - Player restaurant.
   * @param progress - Day progress 0..1.
   */
  update(state: GameState, player: Restaurant, progress: number): void {
    set_text(
      this.dayLabel,
      localization.t('dayLabel', { day: state.currentDay, total: GAME_CONSTANTS.DAYS_PER_GAME })
    );
    this.pips.forEach((pip, index) => {
      const day = index + 1;
      pip.classList.toggle('done', day < state.currentDay);
      pip.classList.toggle('current', day === state.currentDay);
    });
    const percent = Math.round(progress * 100);
    this.progressFill.style.transform = `scaleX(${progress})`;
    this.progress.setAttribute('aria-valuenow', String(percent));
    this.progress.setAttribute('aria-label', localization.t('timeLeft'));
    set_text(this.phase, localization.t(`phase.${day_phase(progress)}`));
    set_text(this.clock, format_clock(state.timeRemaining));
    set_text(
      this.weather,
      `${WEATHER_ICONS[state.weatherCondition]} ${localization.t(`weather.${state.weatherCondition}`)}`
    );

    this.set_stat(this.stats.cash, player.cash, format_money(player.cash), 400);
    set_text(
      this.stats.cash.sub,
      `${localization.t('profitToday')} ${format_delta(player.dailyProfit)}`
    );
    this.stats.cash.sub.classList.toggle('negative', player.dailyProfit < 0);
    this.set_stat(
      this.stats.customers,
      player.customerCount,
      Math.floor(player.customerCount).toLocaleString('en-US'),
      Infinity
    );
    set_text(
      this.stats.customers.sub,
      player.lastLost > 0.3
        ? `⚠ ${localization.t('lostGuests', { count: player.lastLost.toFixed(1) })}`
        : ''
    );
    this.set_stat(
      this.stats.satisfaction,
      player.satisfaction,
      format_percent(player.satisfaction, 0),
      1.5
    );
    this.stats.satisfaction.root.classList.toggle('warn', player.satisfaction < 50);
    this.set_stat(this.stats.share, player.marketShare, format_percent(player.marketShare), 0.5);
  }

  /** Reflects mute state on the music button. */
  set_muted(muted: boolean): void {
    set_text(this.muteButton, muted ? '🔇' : '🎵');
    this.muteButton.setAttribute('aria-pressed', String(muted));
    this.muteButton.dataset.i18nAria = muted ? 'unmute' : 'mute';
    this.muteButton.setAttribute('aria-label', localization.t(muted ? 'unmute' : 'mute'));
  }

  /** Reflects pause state on the pause button. */
  set_paused(paused: boolean): void {
    set_text(this.pauseButton, paused ? '▶' : '⏸');
    this.pauseButton.dataset.i18nAria = paused ? 'resume' : 'pause';
    this.pauseButton.setAttribute('aria-label', localization.t(paused ? 'resume' : 'pause'));
  }

  /**
   * Updates a chip and flashes it when the value moved by at least `threshold`
   * since the last flash (so steady per-second drift does not blink constantly).
   */
  private set_stat(chip: StatChip, numeric: number, text: string, threshold: number): void {
    if (Number.isNaN(chip.last)) {
      chip.last = numeric;
    } else if (Math.abs(numeric - chip.last) >= threshold) {
      const direction = numeric > chip.last ? 'up' : 'down';
      chip.root.classList.remove('flash-up', 'flash-down');
      void chip.root.offsetWidth; // restart the CSS animation
      chip.root.classList.add(`flash-${direction}`);
      chip.last = numeric;
    }
    set_text(chip.value, text);
  }

  /** Forgets previous values (new game). */
  reset(): void {
    Object.values(this.stats).forEach(chip => {
      chip.last = Number.NaN;
    });
  }
}
