import { average_price } from '../game/Simulation';
import { localization } from '../localization/Localization';
import type { AdviceTarget, SupportAIAdvice } from '../types/AITypes';
import type { GameState, MarketEvent, Restaurant } from '../types/GameTypes';
import { brand_color, to_css_color } from '../three/SceneLayout';
import { GAME_CONFIG, GAME_CONSTANTS } from '../utils/Constants';
import { h, set_text } from './dom';
import { format_money, format_percent, format_price } from './format';
import { restaurant_name, strategy_name } from './naming';

const EVENT_ICONS: Record<string, string> = {
  'rainy-day': '🌧️',
  'local-festival': '🏮',
  'tv-feature': '📺',
  'price-spike': '📈',
};

const HISTORY = 3;

/**
 * Right-hand panel: Sakura's advice feed, active market events and rival intel.
 */
export class AdvisorPanel {
  private readonly feed: HTMLElement;
  private readonly events: HTMLElement;
  private readonly intel: HTMLElement;
  private readonly intelBody: HTMLElement;
  private readonly intelTitle: HTMLElement;
  private eventsSignature = '';

  /**
   * @param root - Container element.
   * @param onGo - Opens the control tab an advice refers to.
   * @param onCloseIntel - Clears the selected rival.
   */
  constructor(
    root: HTMLElement,
    private readonly onGo: (target: Exclude<AdviceTarget, null>) => void,
    onCloseIntel: () => void
  ) {
    this.feed = h('div', { className: 'advice-feed', attrs: { 'aria-live': 'polite' } });
    this.events = h('ul', { className: 'event-list' });
    this.intelTitle = h('h3', { className: 'intel-title' });
    this.intelBody = h('dl', { className: 'intel-stats' });
    this.intel = h(
      'section',
      { className: 'rival-intel', attrs: { hidden: '' } },
      h(
        'header',
        { className: 'intel-header' },
        h('span', { className: 'intel-kicker', i18n: 'rivalIntel' }),
        h('button', {
          className: 'icon-btn small',
          text: '✕',
          i18nAria: 'close',
          attrs: { type: 'button' },
          on: { click: onCloseIntel },
        })
      ),
      this.intelTitle,
      h('p', { className: 'intel-desc' }),
      this.intelBody
    );

    root.append(
      h(
        'header',
        { className: 'advisor-header' },
        h(
          'div',
          { className: 'avatar', attrs: { 'aria-hidden': 'true' } },
          h('span', { text: '🌸' })
        ),
        h(
          'div',
          {},
          h('div', { className: 'advisor-name', i18n: 'advisorName' }),
          h('div', { className: 'advisor-role', i18n: 'advisorRole' })
        )
      ),
      this.intel,
      this.feed,
      h('h2', { className: 'panel-title', i18n: 'marketEventsTitle' }),
      this.events
    );
    this.reset();
  }

  /** Clears the feed and shows the welcome line. */
  reset(): void {
    this.feed.replaceChildren(
      h('div', { className: 'bubble tip' }, h('p', { i18n: 'welcomeMessage' }))
    );
    this.eventsSignature = '';
  }

  /**
   * Prepends a new advice bubble (older ones fade, max 3 kept).
   * @param advice - Advice from the support AI.
   */
  push(advice: SupportAIAdvice): void {
    const bubble = h(
      'div',
      { className: `bubble ${advice.type} priority-${advice.priority}` },
      h('p', { text: advice.message })
    );
    const { target } = advice;
    if (target) {
      bubble.append(
        h('button', {
          className: 'bubble-go',
          i18n: 'advisorGo',
          attrs: { type: 'button' },
          on: { click: () => this.onGo(target) },
        })
      );
    }
    this.feed.prepend(bubble);
    while (this.feed.children.length > HISTORY) this.feed.lastElementChild?.remove();
  }

  /**
   * Refreshes the event list (only rebuilt when the set of events changes).
   * @param events - Active market events.
   */
  update_events(events: MarketEvent[]): void {
    const signature = `${localization.get_language()}|${events.map(e => e.id).join(',')}`;
    if (signature !== this.eventsSignature) {
      this.eventsSignature = signature;
      this.events.replaceChildren(
        ...(events.length === 0
          ? [h('li', { className: 'event-empty', i18n: 'noEvents' })]
          : events.map(event =>
              h(
                'li',
                { className: 'event-item', dataset: { eventId: event.id } },
                h('span', { className: 'event-icon', text: EVENT_ICONS[event.id] ?? '✨' }),
                h(
                  'span',
                  { className: 'event-text' },
                  h('strong', { text: localization.t(`events.${event.id}.name`) }),
                  h('small', { text: localization.t(`events.${event.id}.description`) })
                ),
                h(
                  'span',
                  { className: 'event-timer' },
                  h('span', { className: 'event-timer-fill' })
                )
              )
            ))
      );
    }
    events.forEach(event => {
      const fill = this.events.querySelector(
        `[data-event-id="${event.id}"] .event-timer-fill`
      ) as HTMLElement;
      const initial = GAME_CONFIG.events.find(e => e.id === event.id)?.duration ?? 1;
      fill.style.transform = `scaleX(${Math.min(1, Math.max(0, event.duration / initial))})`;
    });
  }

  /**
   * Shows or hides rival intel for the selected restaurant.
   * @param restaurant - Selected restaurant, or null.
   * @param state - Game state (for rank).
   */
  update_intel(restaurant: Restaurant | null, state: GameState): void {
    if (!restaurant) {
      this.intel.hidden = true;
      return;
    }
    this.intel.hidden = false;
    this.intel.style.setProperty(
      '--brand',
      to_css_color(brand_color(restaurant.type, restaurant.strategyType))
    );
    set_text(this.intelTitle, restaurant_name(restaurant));
    const desc = this.intel.querySelector('.intel-desc') as HTMLElement;
    set_text(
      desc,
      restaurant.strategyType
        ? `${strategy_name(restaurant)} — ${localization.t(`aiStrategies.${restaurant.strategyType}`)}`
        : localization.t('you')
    );
    const rank =
      [...state.restaurants].sort((a, b) => b.marketShare - a.marketShare).indexOf(restaurant) + 1;
    const rows: Array<[string, string]> = [
      ['marketShare', `#${rank} · ${format_percent(restaurant.marketShare)}`],
      ['revenue', format_money(restaurant.revenue)],
      ['satisfaction', format_percent(restaurant.satisfaction, 0)],
      ['avgPrice', format_price(average_price(restaurant.menu))],
      ['staff', `${restaurant.staff.length} / ${GAME_CONSTANTS.MAX_STAFF_PER_TYPE * 2}`],
      ['buzz', `${Math.round(restaurant.buzz * 100)}`],
    ];
    this.intelBody.replaceChildren(
      ...rows.flatMap(([key, value]) => [h('dt', { i18n: key }), h('dd', { text: value })])
    );
  }
}
