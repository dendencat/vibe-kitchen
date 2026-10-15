import { kitchen_level, restaurant_capacity } from '../game/Simulation';
import { localization } from '../localization/Localization';
import type { CampaignType, MenuItem, Restaurant, StaffType } from '../types/GameTypes';
import type { DockTab } from '../types/UITypes';
import { CAMPAIGNS, GAME_CONSTANTS, STAFF_SPECS, upgrade_cost } from '../utils/Constants';
import { MathUtils } from '../utils/MathUtils';
import { h, set_text } from './dom';
import { format_money, format_percent, format_price } from './format';

export interface DockCallbacks {
  onPriceChange(itemId: string, price: number): void;
  onRemove(itemId: string): void;
  onAddDish(): void;
  onCampaign(type: CampaignType): void;
  onHire(type: StaffType): void;
  onUpgrade(): void;
}

interface MenuCard {
  root: HTMLElement;
  price: HTMLElement;
  popularity: HTMLElement;
  popularityFill: HTMLElement;
  margin: HTMLElement;
  rating: HTMLElement;
  remove: HTMLButtonElement;
}

const TABS: DockTab[] = ['menu', 'marketing', 'operations'];

/**
 * Bottom control dock with Menu / Marketing / Operations tabs.
 * Replaces the old `prompt()`/`confirm()` dialogs with inline controls.
 */
export class ActionDock {
  private readonly tabButtons = new Map<DockTab, HTMLButtonElement>();
  private readonly panels = new Map<DockTab, HTMLElement>();
  private readonly menuList: HTMLElement;
  private readonly addCard: HTMLButtonElement;
  private menuCards = new Map<string, MenuCard>();
  private menuSignature = '';
  /** Latest known prices (cards may outlive the item objects after a reload). */
  private readonly prices = new Map<string, number>();
  private readonly campaignButtons = new Map<CampaignType, HTMLButtonElement>();
  private readonly buzzFill: HTMLElement;
  private readonly buzzValue: HTMLElement;
  private readonly hireButtons = new Map<StaffType, HTMLButtonElement>();
  private readonly staffCounts = new Map<StaffType, HTMLElement>();
  private readonly upgradeButton: HTMLButtonElement;
  private readonly kitchenPips: HTMLElement[] = [];
  private readonly upgradeCost: HTMLElement;
  private readonly loadFill: HTMLElement;
  private readonly loadText: HTMLElement;
  private active: DockTab = 'menu';

  constructor(
    root: HTMLElement,
    private readonly callbacks: DockCallbacks
  ) {
    const tablist = h('div', { className: 'dock-tabs', attrs: { role: 'tablist' } });
    TABS.forEach((tab, index) => {
      const button = h(
        'button',
        {
          className: 'dock-tab',
          id: `tab-${tab}`,
          attrs: {
            type: 'button',
            role: 'tab',
            'aria-controls': `panel-${tab}`,
            title: `${localization.t(`tabs.${tab}`)} (${index + 1})`,
          },
          on: {
            click: () => this.select_tab(tab),
            keydown: event => this.on_tab_key(event, index),
          },
        },
        h('span', {
          className: 'tab-key',
          text: String(index + 1),
          attrs: { 'aria-hidden': 'true' },
        }),
        h('span', { i18n: `tabs.${tab}` })
      );
      this.tabButtons.set(tab, button);
      tablist.append(button);
    });

    // Menu tab
    this.menuList = h('div', { className: 'menu-list' });
    this.addCard = h(
      'button',
      {
        className: 'card add-card',
        id: 'add-dish-button',
        attrs: { type: 'button' },
        on: { click: () => callbacks.onAddDish() },
      },
      h('span', { className: 'add-plus', text: '+', attrs: { 'aria-hidden': 'true' } }),
      h('span', { i18n: 'addDish' })
    );
    const menuPanel = h('div', { className: 'menu-scroller' }, this.menuList, this.addCard);

    // Marketing tab
    this.buzzFill = h('span', { className: 'meter-fill' });
    this.buzzValue = h('span', { className: 'meter-value' });
    const campaigns = (Object.keys(CAMPAIGNS) as CampaignType[]).map(type => {
      const spec = CAMPAIGNS[type];
      const button = h(
        'button',
        {
          className: 'btn btn-primary btn-sm',
          id: `campaign-${type}`,
          attrs: { type: 'button' },
          on: { click: () => callbacks.onCampaign(type) },
        },
        h('span', { i18n: 'launch' }),
        h('span', { className: 'btn-cost', text: format_money(spec.budget) })
      );
      this.campaignButtons.set(type, button);
      return h(
        'div',
        { className: `card action-card campaign-${type}` },
        h('span', { className: 'card-icon', text: spec.icon, attrs: { 'aria-hidden': 'true' } }),
        h('strong', { i18n: `campaign.${type}.name` }),
        h('small', { i18n: `campaign.${type}.desc` }),
        button
      );
    });
    const marketingPanel = h(
      'div',
      { className: 'card-row' },
      ...campaigns,
      h(
        'div',
        { className: 'card meter-card' },
        h('strong', { i18n: 'buzz' }),
        h('div', { className: 'meter' }, this.buzzFill),
        this.buzzValue
      )
    );

    // Operations tab
    const staffCards = (Object.keys(STAFF_SPECS) as StaffType[]).map(type => {
      const spec = STAFF_SPECS[type];
      const count = h('span', { className: 'count-badge' });
      this.staffCounts.set(type, count);
      const button = h(
        'button',
        {
          className: 'btn btn-primary btn-sm',
          id: `hire-${type}`,
          attrs: { type: 'button' },
          on: { click: () => callbacks.onHire(type) },
        },
        h('span', { i18n: 'hire' }),
        h('span', { className: 'btn-cost', text: format_money(spec.hireCost) })
      );
      this.hireButtons.set(type, button);
      return h(
        'div',
        { className: 'card action-card' },
        h(
          'span',
          { className: 'card-icon', text: spec.icon, attrs: { 'aria-hidden': 'true' } },
          count
        ),
        h('strong', { i18n: `staffTitles.${type}` }),
        h('small', {
          className: 'staff-desc',
          dataset: { staff: type },
        }),
        h('small', { className: 'staff-salary', dataset: { staff: type } }),
        button
      );
    });
    this.upgradeCost = h('span', { className: 'btn-cost' });
    this.upgradeButton = h(
      'button',
      {
        className: 'btn btn-primary btn-sm',
        id: 'upgrade-kitchen',
        attrs: { type: 'button' },
        on: { click: () => callbacks.onUpgrade() },
      },
      h('span', { i18n: 'upgrade' }),
      this.upgradeCost
    );
    const pipRow = h('div', { className: 'level-pips', attrs: { 'aria-hidden': 'true' } });
    for (let i = 0; i < GAME_CONSTANTS.MAX_EQUIPMENT_LEVEL; i++) {
      const pip = h('span', { className: 'level-pip' });
      this.kitchenPips.push(pip);
      pipRow.append(pip);
    }
    this.loadFill = h('span', { className: 'meter-fill' });
    this.loadText = h('span', { className: 'meter-value' });
    const operationsPanel = h(
      'div',
      { className: 'card-row' },
      ...staffCards,
      h(
        'div',
        { className: 'card action-card' },
        h('span', { className: 'card-icon', text: '🔥', attrs: { 'aria-hidden': 'true' } }),
        h('strong', { i18n: 'kitchenUpgrade' }),
        pipRow,
        h('small', { i18n: 'upgradeDesc' }),
        this.upgradeButton
      ),
      h(
        'div',
        { className: 'card meter-card' },
        h('strong', { i18n: 'load' }),
        h('div', { className: 'meter load-meter' }, this.loadFill),
        this.loadText
      )
    );

    const panelEntries: Array<[DockTab, HTMLElement]> = [
      ['menu', menuPanel],
      ['marketing', marketingPanel],
      ['operations', operationsPanel],
    ];
    const panelWrap = h('div', { className: 'dock-panels' });
    panelEntries.forEach(([tab, content]) => {
      const panel = h(
        'section',
        {
          className: 'dock-panel',
          id: `panel-${tab}`,
          attrs: { role: 'tabpanel', 'aria-labelledby': `tab-${tab}` },
        },
        content
      );
      this.panels.set(tab, panel);
      panelWrap.append(panel);
    });

    root.append(tablist, panelWrap);
    this.select_tab('menu');
  }

  /** Active tab. */
  get_tab(): DockTab {
    return this.active;
  }

  /**
   * Switches the visible tab.
   * @param tab - Tab to show.
   * @param focus - Move keyboard focus to the tab button.
   */
  select_tab(tab: DockTab, focus = false): void {
    this.active = tab;
    TABS.forEach(name => {
      const selected = name === tab;
      const button = this.tabButtons.get(name) as HTMLButtonElement;
      button.setAttribute('aria-selected', String(selected));
      button.tabIndex = selected ? 0 : -1;
      (this.panels.get(name) as HTMLElement).hidden = !selected;
    });
    if (focus) this.tabButtons.get(tab)?.focus();
  }

  /**
   * Refreshes values and enabled states from the player's restaurant.
   * @param player - Player restaurant.
   */
  update(player: Restaurant): void {
    this.update_menu(player);

    (Object.keys(CAMPAIGNS) as CampaignType[]).forEach(type => {
      (this.campaignButtons.get(type) as HTMLButtonElement).disabled =
        player.cash < CAMPAIGNS[type].budget;
    });
    const buzz = player.buzz / GAME_CONSTANTS.MAX_BUZZ;
    this.buzzFill.style.transform = `scaleX(${MathUtils.clamp(buzz, 0, 1)})`;
    set_text(this.buzzValue, `${Math.round(player.buzz * 100)}`);

    (Object.keys(STAFF_SPECS) as StaffType[]).forEach(type => {
      const spec = STAFF_SPECS[type];
      const count = player.staff.filter(s => s.type === type).length;
      set_text(this.staffCounts.get(type) as HTMLElement, `×${count}`);
      const button = this.hireButtons.get(type) as HTMLButtonElement;
      button.disabled = count >= GAME_CONSTANTS.MAX_STAFF_PER_TYPE || player.cash < spec.hireCost;
      const card = button.parentElement as HTMLElement;
      set_text(
        card.querySelector('.staff-desc') as HTMLElement,
        localization.t(type === 'chef' ? 'chefDesc' : 'waiterDesc', { capacity: spec.capacity })
      );
      set_text(
        card.querySelector('.staff-salary') as HTMLElement,
        localization.t('salaryPerDay', { amount: format_money(spec.salary) })
      );
    });

    const level = kitchen_level(player);
    const maxed = level >= GAME_CONSTANTS.MAX_EQUIPMENT_LEVEL;
    this.kitchenPips.forEach((pip, i) => pip.classList.toggle('on', i < level));
    set_text(
      this.upgradeCost,
      maxed ? localization.t('maxLevel') : format_money(upgrade_cost(level))
    );
    this.upgradeButton.disabled = maxed || player.cash < upgrade_cost(level);

    const load = MathUtils.clamp(player.utilization, 0, 1.5);
    this.loadFill.style.transform = `scaleX(${Math.min(1, load)})`;
    this.loadFill.classList.toggle('hot', load > 0.9);
    set_text(
      this.loadText,
      `${Math.round(load * 100)}% · ${localization.t('capacity')} ${restaurant_capacity(player).toFixed(1)}/s`
    );
  }

  private update_menu(player: Restaurant): void {
    const signature = `${localization.get_language()}|${player.menu.map(item => item.id).join(',')}`;
    if (signature !== this.menuSignature) {
      this.menuSignature = signature;
      this.menuCards = new Map(player.menu.map(item => [item.id, this.create_menu_card(item)]));
      this.menuList.replaceChildren(...[...this.menuCards.values()].map(card => card.root));
    }
    this.addCard.disabled = player.menu.length >= GAME_CONSTANTS.MAX_MENU_ITEMS;
    player.menu.forEach(item => {
      this.prices.set(item.id, item.price);
      const card = this.menuCards.get(item.id) as MenuCard;
      set_text(card.price, format_price(item.price));
      set_text(card.popularity, `${Math.round(item.popularity)}`);
      card.popularityFill.style.transform = `scaleX(${item.popularity / 100})`;
      set_text(card.margin, format_percent(item.profitMargin, 0));
      card.margin.classList.toggle('negative', item.profitMargin < 20);
      set_text(card.rating, `★ ${item.customerRating.toFixed(1)}`);
      card.remove.disabled = player.menu.length <= GAME_CONSTANTS.MIN_MENU_ITEMS;
    });
  }

  private create_menu_card(item: MenuItem): MenuCard {
    const price = h('span', { className: 'price-value' });
    const popularity = h('span', { className: 'mini-value' });
    const popularityFill = h('span', { className: 'meter-fill' });
    const margin = h('span', { className: 'mini-value' });
    const rating = h('span', { className: 'rating' });
    const step = (direction: number) => () => {
      const current = this.prices.get(item.id) as number;
      const next = MathUtils.clamp(
        MathUtils.round_money(current + direction * GAME_CONSTANTS.PRICE_STEP),
        GAME_CONSTANTS.MIN_PRICE,
        GAME_CONSTANTS.MAX_PRICE
      );
      if (next !== current) this.callbacks.onPriceChange(item.id, next);
    };
    const remove = h('button', {
      className: 'icon-btn small remove-dish',
      text: '✕',
      attrs: {
        type: 'button',
        'aria-label': localization.t('removeDish', { name: item.name }),
      },
      on: { click: () => this.callbacks.onRemove(item.id) },
    });
    const root = h(
      'article',
      { className: 'card menu-card', dataset: { itemId: item.id } },
      h(
        'header',
        { className: 'menu-card-head' },
        h('strong', { className: 'dish-name', text: item.name }),
        remove
      ),
      h(
        'div',
        { className: 'price-stepper' },
        h('button', {
          className: 'step-btn',
          text: '−',
          attrs: { type: 'button', 'aria-label': localization.t('priceDown', { name: item.name }) },
          on: { click: step(-1) },
        }),
        price,
        h('button', {
          className: 'step-btn',
          text: '+',
          attrs: { type: 'button', 'aria-label': localization.t('priceUp', { name: item.name }) },
          on: { click: step(1) },
        })
      ),
      h(
        'div',
        { className: 'mini-stats' },
        h('span', { className: 'mini' }, h('small', { i18n: 'popularity' }), popularity),
        h('span', { className: 'mini' }, h('small', { i18n: 'margin' }), margin),
        rating
      ),
      h('div', { className: 'meter thin' }, popularityFill)
    );
    return { root, price, popularity, popularityFill, margin, rating, remove };
  }

  private on_tab_key(event: KeyboardEvent, index: number): void {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const offset = event.key === 'ArrowRight' ? 1 : -1;
    this.select_tab(TABS[(index + offset + TABS.length) % TABS.length], true);
  }
}
