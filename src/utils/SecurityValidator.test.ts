import { describe, expect, it } from 'vitest';
import { SecurityValidator } from './SecurityValidator';

describe('SecurityValidator', () => {
  describe('sanitize_input', () => {
    it('strips HTML-significant and control characters', () => {
      expect(SecurityValidator.sanitize_input('<script>alert("x")</script>')).toBe(
        'scriptalert(x)/script'
      );
      expect(SecurityValidator.sanitize_input("a'b`c&d")).toBe('abcd');
      expect(SecurityValidator.sanitize_input('a\u0000b\nc')).toBe('abc');
    });

    it('trims and limits length', () => {
      expect(SecurityValidator.sanitize_input('  hi  ')).toBe('hi');
      expect(SecurityValidator.sanitize_input('x'.repeat(200))).toHaveLength(100);
      expect(SecurityValidator.sanitize_input('abcdef', 3)).toBe('abc');
    });

    it('returns empty string for non-strings', () => {
      expect(SecurityValidator.sanitize_input(42)).toBe('');
      expect(SecurityValidator.sanitize_input(undefined)).toBe('');
    });
  });

  describe('validate_number', () => {
    it('accepts numbers and numeric strings in range', () => {
      expect(SecurityValidator.validate_number(5, 1, 10)).toBe(5);
      expect(SecurityValidator.validate_number('7.5', 1, 10)).toBe(7.5);
    });

    it.each([null, '', true, 'abc', Infinity, NaN, 0, 11])('rejects %s', value => {
      expect(() => SecurityValidator.validate_number(value, 1, 10)).toThrow(/Invalid number/);
    });
  });

  describe('validate_menu_item_input', () => {
    it('returns a clean draft', () => {
      expect(
        SecurityValidator.validate_menu_item_input({
          name: ' <b>Ramen</b> ',
          price: '12',
          cost: 4,
          cookTime: 10,
        })
      ).toEqual({ name: 'bRamen/b', price: 12, cost: 4, cookTime: 10 });
    });

    it('requires a name', () => {
      expect(() =>
        SecurityValidator.validate_menu_item_input({ name: '<>', price: 10, cost: 2, cookTime: 5 })
      ).toThrow('Dish name is required.');
    });

    it('requires cost below price', () => {
      expect(() =>
        SecurityValidator.validate_menu_item_input({ name: 'A', price: 5, cost: 5, cookTime: 5 })
      ).toThrow('Cost must be lower than price.');
    });

    it('validates numeric ranges', () => {
      expect(() =>
        SecurityValidator.validate_menu_item_input({ name: 'A', price: 5000, cost: 1, cookTime: 5 })
      ).toThrow(/Invalid number/);
    });
  });

  it('validates string length', () => {
    expect(SecurityValidator.validate_string_length('abc', 3)).toBe('abc');
    expect(() => SecurityValidator.validate_string_length('abcd', 3)).toThrow('String too long');
  });

  it('detects dangerous HTML', () => {
    expect(SecurityValidator.is_safe_html_content('hello')).toBe(true);
    expect(SecurityValidator.is_safe_html_content('<img onerror=alert(1)>')).toBe(false);
    expect(SecurityValidator.is_safe_html_content('javascript:void(0)')).toBe(false);
  });

  it('escapes HTML', () => {
    expect(SecurityValidator.escape_html(`<a href="x">'&'</a>`)).toBe(
      '&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;'
    );
  });
});
