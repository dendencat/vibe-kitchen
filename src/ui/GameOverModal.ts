import { localization } from '../localization/Localization';
import type { Awards, FinalResult } from '../types/GameTypes';
import { brand_color, to_css_color } from '../three/SceneLayout';
import { h } from './dom';
import { format_money, format_percent } from './format';
import { Modal } from './Modal';
import { restaurant_name } from './naming';

const AWARD_ICONS: Record<keyof Awards, string> = {
  revenue: '💴',
  satisfaction: '💖',
  efficiency: '⚙️',
  innovation: '💡',
};

/**
 * Final results: podium, full ranking and secondary awards.
 */
export class GameOverModal {
  readonly modal: Modal;
  private readonly content: HTMLElement;

  constructor(
    private readonly onReplay: () => void,
    private readonly onTitle: () => void
  ) {
    this.modal = new Modal('gameOver', 'gameover-modal', false);
    this.content = h('div', { className: 'gameover-content' });
    this.modal.body.append(this.content);
  }

  /**
   * Renders and opens the results.
   * @param results - Ranked results.
   * @param awards - Award winners by id.
   */
  show(results: FinalResult[], awards: Awards): void {
    const playerRank = results.findIndex(r => r.type === 'player') + 1;
    const nameOf = (id: string): string => {
      const result = results.find(r => r.id === id) as FinalResult;
      return restaurant_name(result);
    };
    const color = (result: FinalResult) =>
      to_css_color(brand_color(result.type, result.strategyType));

    const podiumOrder = [results[1], results[0], results[2]].filter(Boolean);
    const podium = h(
      'div',
      { className: 'podium', attrs: { 'aria-hidden': 'true' } },
      ...podiumOrder.map(result => {
        const place = results.indexOf(result) + 1;
        const step = h(
          'div',
          {
            className: `podium-step place-${place}${result.type === 'player' ? ' is-player' : ''}`,
          },
          h('span', { className: 'podium-medal', text: ['🥇', '🥈', '🥉'][place - 1] }),
          h('span', { className: 'podium-name', text: restaurant_name(result) }),
          h('span', { className: 'podium-block', text: String(place) })
        );
        step.style.setProperty('--brand', color(result));
        return step;
      })
    );

    const table = h(
      'ol',
      { className: 'results-list' },
      ...results.map((result, index) => {
        const row = h(
          'li',
          { className: `result-row${result.type === 'player' ? ' is-player' : ''}` },
          h('span', { className: 'rank', text: String(index + 1) }),
          h('span', { className: 'name', text: restaurant_name(result) }),
          h('span', { className: 'metric', text: format_percent(result.marketShare) }),
          h('span', { className: 'metric', text: format_money(result.revenue) }),
          h('span', { className: 'metric', text: format_percent(result.satisfaction, 0) }),
          h('strong', { className: 'score', text: result.score.toLocaleString('en-US') })
        );
        row.style.setProperty('--brand', color(result));
        return row;
      })
    );

    const awardList = h(
      'ul',
      { className: 'award-list' },
      ...(Object.keys(awards) as Array<keyof Awards>).map(key =>
        h(
          'li',
          { className: `award${awards[key] === 'player' ? ' is-player' : ''}` },
          h('span', {
            className: 'award-icon',
            text: AWARD_ICONS[key],
            attrs: { 'aria-hidden': 'true' },
          }),
          h('small', { i18n: `awards.${key}` }),
          h('strong', { text: nameOf(awards[key]) })
        )
      )
    );

    this.content.replaceChildren(
      h(
        'p',
        { className: `placement place-${Math.min(playerRank, 4)}` },
        localization.t('youPlaced', { rank: playerRank })
      ),
      ...(playerRank === 1 ? [h('p', { className: 'victory', i18n: 'victory' })] : []),
      podium,
      h(
        'div',
        { className: 'results-head', attrs: { 'aria-hidden': 'true' } },
        h('span', { text: '#' }),
        h('span', { text: '' }),
        h('span', { i18n: 'marketShare' }),
        h('span', { i18n: 'revenue' }),
        h('span', { i18n: 'satisfaction' }),
        h('span', { i18n: 'score' })
      ),
      table,
      h('h3', { className: 'panel-title', i18n: 'awardsTitle' }),
      awardList,
      h(
        'div',
        { className: 'modal-actions' },
        h('button', {
          className: 'btn btn-ghost',
          id: 'title-button',
          i18n: 'backToTitle',
          attrs: { type: 'button' },
          on: {
            click: () => {
              this.modal.close();
              this.onTitle();
            },
          },
        }),
        h('button', {
          className: 'btn btn-primary',
          id: 'replay-button',
          i18n: 'playAgain',
          attrs: { type: 'button', autofocus: '' },
          on: {
            click: () => {
              this.modal.close();
              this.onReplay();
            },
          },
        })
      )
    );
    this.modal.open();
  }
}
