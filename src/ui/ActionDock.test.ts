import { describe, expect, it, vi } from 'vitest';
import { make_item, make_restaurant } from '../../test/factories';
import { localization } from '../localization/Localization';
import { ActionDock, type DockCallbacks } from './ActionDock';

function setup() {
  const root = document.createElement('section');
  document.body.append(root);
  const callbacks: DockCallbacks = {
    onPriceChange: vi.fn(),
    onRemove: vi.fn(),
    onAddDish: vi.fn(),
    onCampaign: vi.fn(),
    onHire: vi.fn(),
    onUpgrade: vi.fn(),
  };
  return { root, callbacks, dock: new ActionDock(root, callbacks) };
}

const click = (root: ParentNode, selector: string) =>
  (root.querySelector(selector) as HTMLButtonElement).click();

describe('ActionDock', () => {
  it('switches tabs by click and arrow keys', () => {
    const { root, dock } = setup();
    expect(dock.get_tab()).toBe('menu');
    click(root, '#tab-marketing');
    expect(dock.get_tab()).toBe('marketing');
    expect((root.querySelector('#panel-menu') as HTMLElement).hidden).toBe(true);
    const tab = root.querySelector('#tab-marketing') as HTMLButtonElement;
    tab.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    expect(dock.get_tab()).toBe('operations');
    expect(document.activeElement?.id).toBe('tab-operations');
    (root.querySelector('#tab-menu') as HTMLButtonElement).dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowLeft' })
    );
    expect(dock.get_tab()).toBe('operations');
    tab.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(dock.get_tab()).toBe('operations');
  });

  it('renders menu cards and steps prices', () => {
    const { root, callbacks, dock } = setup();
    const player = make_restaurant({
      menu: [make_item({ id: 'a', name: 'Ramen', price: 10 }), make_item({ id: 'b', price: 1 })],
    });
    dock.update(player);
    expect(root.querySelectorAll('.menu-card')).toHaveLength(2);
    expect(root.querySelector('.price-value')?.textContent).toBe('$10.00');
    const [down, up] = root.querySelectorAll<HTMLButtonElement>('[data-item-id="a"] .step-btn');
    up.click();
    expect(callbacks.onPriceChange).toHaveBeenCalledWith('a', 10.5);
    down.click();
    expect(callbacks.onPriceChange).toHaveBeenCalledWith('a', 9.5);
    root.querySelector<HTMLButtonElement>('[data-item-id="b"] .step-btn')?.click();
    expect(callbacks.onPriceChange).toHaveBeenCalledTimes(2);
    click(root, '[data-item-id="a"] .remove-dish');
    expect(callbacks.onRemove).toHaveBeenCalledWith('a');
    click(root, '#add-dish-button');
    expect(callbacks.onAddDish).toHaveBeenCalled();
  });

  it('keeps cards when only values change and rebuilds on menu or language changes', () => {
    const { root, dock } = setup();
    const player = make_restaurant({ menu: [make_item({ id: 'a', profitMargin: 10 })] });
    dock.update(player);
    const card = root.querySelector('.menu-card');
    player.menu[0].price = 12;
    dock.update(player);
    expect(root.querySelector('.menu-card')).toBe(card);
    expect(root.querySelector('.mini-value.negative')).not.toBeNull();
    expect((root.querySelector('.remove-dish') as HTMLButtonElement).disabled).toBe(true);
    localization.set_language('ja');
    dock.update(player);
    expect(root.querySelector('.menu-card')).not.toBe(card);
    player.menu = Array.from({ length: 10 }, (_, i) => make_item({ id: `m${i}` }));
    dock.update(player);
    expect((root.querySelector('#add-dish-button') as HTMLButtonElement).disabled).toBe(true);
  });

  it('enables actions based on cash, limits and level', () => {
    const { root, callbacks, dock } = setup();
    const player = make_restaurant({ cash: 3000, utilization: 1.2 });
    dock.update(player);
    expect((root.querySelector('#campaign-social') as HTMLButtonElement).disabled).toBe(false);
    expect((root.querySelector('#campaign-tv') as HTMLButtonElement).disabled).toBe(true);
    expect((root.querySelector('#hire-chef') as HTMLButtonElement).disabled).toBe(false);
    expect((root.querySelector('#upgrade-kitchen') as HTMLButtonElement).disabled).toBe(true);
    expect(root.querySelector('.load-meter .meter-fill')?.classList.contains('hot')).toBe(true);
    expect(root.querySelector('.count-badge')?.textContent).toBe('×1');

    click(root, '#campaign-social');
    click(root, '#hire-waiter');
    expect(callbacks.onCampaign).toHaveBeenCalledWith('social');
    expect(callbacks.onHire).toHaveBeenCalledWith('waiter');

    player.cash = 1e6;
    player.equipment[0].level = 5;
    dock.update(player);
    expect((root.querySelector('#upgrade-kitchen') as HTMLButtonElement).disabled).toBe(true);
    expect(root.querySelector('#upgrade-kitchen .btn-cost')?.textContent).toBe('Max level');
    player.equipment[0].level = 2;
    dock.update(player);
    click(root, '#upgrade-kitchen');
    expect(callbacks.onUpgrade).toHaveBeenCalled();
  });
});
