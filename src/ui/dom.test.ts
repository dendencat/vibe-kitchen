import { describe, expect, it, vi } from 'vitest';
import { localization } from '../localization/Localization';
import { by_id, h, set_text } from './dom';
import { format_clock, format_delta, format_money, format_percent, format_price } from './format';
import { ADVICE_NAMING, restaurant_name, strategy_name } from './naming';
import { make_restaurant } from '../../test/factories';

describe('h()', () => {
  it('builds elements with text, attributes, data and listeners', () => {
    const onClick = vi.fn();
    const el = h(
      'button',
      {
        className: 'c',
        id: 'b',
        text: '<b>x</b>',
        attrs: { type: 'button' },
        dataset: { k: 'v' },
        on: { click: onClick },
      },
      'tail',
      3,
      null,
      undefined,
      false,
      h('i')
    );
    expect(el.innerHTML).toBe('&lt;b&gt;x&lt;/b&gt;tail3<i></i>');
    expect(el.className).toBe('c');
    expect(el.id).toBe('b');
    expect(el.getAttribute('type')).toBe('button');
    expect(el.dataset.k).toBe('v');
    el.click();
    expect(onClick).toHaveBeenCalled();
  });

  it('localizes text and aria labels', () => {
    localization.set_language('ja');
    const el = h('span', { i18n: 'cash', i18nAria: 'pause' });
    expect(el.textContent).toBe('現金');
    expect(el.dataset.i18n).toBe('cash');
    expect(el.getAttribute('aria-label')).toBe('一時停止');
    expect(h('div').textContent).toBe('');
  });

  it('sets text only when changed', () => {
    const el = h('span', { text: 'a' });
    const spy = vi.spyOn(el, 'textContent', 'set');
    set_text(el, 'a');
    expect(spy).not.toHaveBeenCalled();
    set_text(el, 'b');
    expect(spy).toHaveBeenCalledWith('b');
  });

  it('finds required elements', () => {
    document.body.append(h('div', { id: 'here' }));
    expect(by_id('here').id).toBe('here');
    expect(() => by_id('missing')).toThrow('Missing element #missing');
  });
});

describe('format', () => {
  it('formats money, prices, percentages, clocks and deltas', () => {
    expect(format_money(12345.6)).toBe('$12,346');
    expect(format_money(-300)).toBe('-$300');
    expect(format_price(9.5)).toBe('$9.50');
    expect(format_percent(16.666)).toBe('16.7%');
    expect(format_percent(72.4, 0)).toBe('72%');
    expect(format_clock(61)).toBe('1:01');
    expect(format_clock(-5)).toBe('0:00');
    expect(format_clock(59.2)).toBe('1:00');
    expect(format_delta(120.4)).toBe('+$120');
    expect(format_delta(-40)).toBe('-$40');
  });
});

describe('naming', () => {
  it('localizes AI names but keeps the player name', () => {
    localization.set_language('ja');
    expect(restaurant_name(make_restaurant({ name: 'Mine' }))).toBe('Mine');
    const rival = make_restaurant({}, 4);
    expect(restaurant_name(rival)).toBe('ライトニングキッチン');
    expect(strategy_name(rival)).toBe('スピード型');
    expect(strategy_name(make_restaurant())).toBe('');
    expect(ADVICE_NAMING.rivalName(rival)).toBe('ライトニングキッチン');
  });
});
