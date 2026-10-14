import { describe, expect, it, vi } from 'vitest';
import { LocalizationManager } from './Localization';
import { en, ja } from './strings';

/** Collects dotted keys of a nested string table. */
function keys(table: object, prefix = ''): string[] {
  return Object.entries(table).flatMap(([key, value]) =>
    typeof value === 'string' ? [`${prefix}${key}`] : keys(value as object, `${prefix}${key}.`)
  );
}

describe('LocalizationManager', () => {
  it('has a Japanese string for every English key', () => {
    expect(keys(ja).sort()).toEqual(keys(en).sort());
  });

  it('translates dotted keys and fills placeholders', () => {
    const l10n = new LocalizationManager();
    expect(l10n.t('aiRestaurants.speed')).toBe('Lightning Kitchen');
    expect(l10n.t('dayLabel', { day: 2, total: 7 })).toBe('Day 2 / 7');
    expect(l10n.t('dayLabel')).toBe('Day {day} / {total}');
    l10n.set_language('ja');
    expect(l10n.t('dayLabel', { day: 2, total: 7 })).toBe('2日目 / 7');
  });

  it('falls back to the key for unknown or non-leaf paths', () => {
    const l10n = new LocalizationManager();
    expect(l10n.t('nope.missing')).toBe('nope.missing');
    expect(l10n.t('aiRestaurants')).toBe('aiRestaurants');
    expect(l10n.t('gameTitle.deeper')).toBe('gameTitle.deeper');
  });

  it('notifies subscribers only on real changes', () => {
    const l10n = new LocalizationManager();
    const listener = vi.fn();
    const unsubscribe = l10n.subscribe(listener);
    l10n.set_language('en');
    l10n.set_language('xx');
    l10n.set_language('ja');
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith('ja');
    unsubscribe();
    l10n.set_language('en');
    expect(listener).toHaveBeenCalledTimes(1);
    expect(l10n.get_language()).toBe('en');
    expect(l10n.get_available_languages()).toEqual(['en', 'ja']);
  });

  it('applies translations to data attributes', () => {
    const l10n = new LocalizationManager();
    l10n.set_language('ja');
    document.body.innerHTML = `
      <span data-i18n="cash"></span>
      <button data-i18n-aria="pause"></button>
      <i data-i18n-title="help"></i>
      <input data-i18n-placeholder="dishName">`;
    l10n.apply_to_dom(document);
    expect(document.querySelector('span')?.textContent).toBe('現金');
    expect(document.querySelector('button')?.getAttribute('aria-label')).toBe('一時停止');
    expect((document.querySelector('i') as HTMLElement).title).toBe('ヘルプ');
    expect((document.querySelector('input') as HTMLInputElement).placeholder).toBe('料理名');
    expect(document.documentElement.lang).toBe('ja');
    expect(document.title).toBe('AI レストランバトル');

    const fragment = document.createElement('div');
    fragment.innerHTML = '<b data-i18n="cash"></b>';
    l10n.apply_to_dom(fragment);
    expect(fragment.textContent).toBe('現金');
  });

  it('recognises supported languages', () => {
    expect(LocalizationManager.is_language('ja')).toBe(true);
    expect(LocalizationManager.is_language('fr')).toBe(false);
    expect(LocalizationManager.is_language(3)).toBe(false);
  });
});
