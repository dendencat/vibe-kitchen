import { localization } from '../localization/Localization';
import type { GameState, Restaurant } from '../types/GameTypes';
import { brand_color, to_css_color } from '../three/SceneLayout';
import { h, set_text } from './dom';
import { format_percent } from './format';
import { restaurant_name } from './naming';

interface Row {
  root: HTMLButtonElement;
  you: HTMLElement | null;
  rank: HTMLElement;
  name: HTMLElement;
  bar: HTMLElement;
  share: HTMLElement;
}

const ROW_HEIGHT = 40;

/**
 * Live market-share ranking. Rows keep their DOM node and slide to their new
 * position (CSS transform transition) when the order changes.
 */
export class RankingPanel {
  private readonly list: HTMLElement;
  private readonly rows = new Map<string, Row>();

  /**
   * @param root - Container element.
   * @param onSelect - Called with a restaurant id when a row is clicked.
   */
  constructor(
    root: HTMLElement,
    private readonly onSelect: (id: string) => void
  ) {
    this.list = h('ol', { className: 'ranking-list', attrs: { 'aria-live': 'off' } });
    root.append(h('h2', { className: 'panel-title', i18n: 'rankingTitle' }), this.list);
  }

  /**
   * Re-sorts and refreshes rows.
   * @param state - Game state.
   * @param selectedId - Currently highlighted restaurant.
   */
  update(state: GameState, selectedId: string | null): void {
    const sorted = [...state.restaurants].sort((a, b) => b.marketShare - a.marketShare);
    const top = Math.max(1, sorted[0].marketShare);
    this.list.style.height = `${sorted.length * ROW_HEIGHT}px`;
    sorted.forEach((restaurant, index) => {
      const row = this.rows.get(restaurant.id) ?? this.create_row(restaurant);
      row.root.style.transform = `translateY(${index * ROW_HEIGHT}px)`;
      set_text(row.rank, String(index + 1));
      const name = restaurant_name(restaurant);
      set_text(row.name, name);
      row.root.title = name;
      if (row.you) set_text(row.you, localization.t('you'));
      set_text(row.share, format_percent(restaurant.marketShare));
      row.bar.style.transform = `scaleX(${restaurant.marketShare / top})`;
      row.root.classList.toggle('leader', index === 0);
      row.root.classList.toggle('selected', restaurant.id === selectedId);
      row.root.setAttribute(
        'aria-label',
        `${index + 1}. ${name} ${format_percent(restaurant.marketShare)}`
      );
    });
  }

  private create_row(restaurant: Restaurant): Row {
    const color = to_css_color(brand_color(restaurant.type, restaurant.strategyType));
    const rank = h('span', { className: 'rank' });
    const name = h('span', { className: 'name' });
    const share = h('span', { className: 'share' });
    const you = restaurant.type === 'player' ? h('span', { className: 'you-badge' }) : null;
    const bar = h('span', { className: 'bar', attrs: { 'aria-hidden': 'true' } });
    bar.style.background = color;
    const root = h(
      'button',
      {
        className: `ranking-row${restaurant.type === 'player' ? ' is-player' : ''}`,
        attrs: { type: 'button' },
        on: { click: () => this.onSelect(restaurant.id) },
      },
      rank,
      h('span', { className: 'swatch', attrs: { 'aria-hidden': 'true' } }),
      name,
      you ?? h('span'),
      share,
      bar
    );
    (root.querySelector('.swatch') as HTMLElement).style.background = color;
    const item = h('li', {}, root);
    this.list.append(item);
    const row = { root, you, rank, name, bar, share };
    this.rows.set(restaurant.id, row);
    return row;
  }

  /** Removes all rows (new game). */
  reset(): void {
    this.rows.clear();
    this.list.replaceChildren();
  }
}
