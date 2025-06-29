import { describe, it, expect } from 'vitest';
import { SecurityValidator } from './SecurityValidator';

describe('SecurityValidator', () => {
  describe('sanitize_input', () => {
    it('should remove dangerous characters', () => {
      expect(SecurityValidator.sanitize_input('<script>alert("xss")</script>'))
        .toBe('scriptalert(xss)/script');
      expect(SecurityValidator.sanitize_input('test"value\'here&amp;'))
        .toBe('testvaluehereampl');
    });

    it('should preserve safe characters', () => {
      expect(SecurityValidator.sanitize_input('Hello World 123'))
        .toBe('Hello World 123');
      expect(SecurityValidator.sanitize_input('Restaurant Menu Item'))
        .toBe('Restaurant Menu Item');
    });

    it('should trim whitespace', () => {
      expect(SecurityValidator.sanitize_input('  spaced  '))
        .toBe('spaced');
    });

    it('should limit length to 100 characters', () => {
      const longString = 'a'.repeat(150);
      const result = SecurityValidator.sanitize_input(longString);
      expect(result.length).toBe(100);
    });

    it('should handle empty strings', () => {
      expect(SecurityValidator.sanitize_input('')).toBe('');
      expect(SecurityValidator.sanitize_input('   ')).toBe('');
    });
  });

  describe('validate_number', () => {
    it('should validate numbers within range', () => {
      expect(SecurityValidator.validate_number(5, 0, 10)).toBe(5);
      expect(SecurityValidator.validate_number('5', 0, 10)).toBe(5);
      expect(SecurityValidator.validate_number(0, 0, 10)).toBe(0);
      expect(SecurityValidator.validate_number(10, 0, 10)).toBe(10);
    });

    it('should throw error for invalid numbers', () => {
      expect(() => SecurityValidator.validate_number('abc', 0, 10))
        .toThrow('Invalid number: abc. Must be between 0 and 10.');
      expect(() => SecurityValidator.validate_number(null, 0, 10))
        .toThrow('Invalid number: null. Must be between 0 and 10.');
      expect(() => SecurityValidator.validate_number(undefined, 0, 10))
        .toThrow('Invalid number: undefined. Must be between 0 and 10.');
    });

    it('should throw error for numbers outside range', () => {
      expect(() => SecurityValidator.validate_number(-5, 0, 10))
        .toThrow('Invalid number: -5. Must be between 0 and 10.');
      expect(() => SecurityValidator.validate_number(15, 0, 10))
        .toThrow('Invalid number: 15. Must be between 0 and 10.');
    });

    it('should handle decimal numbers', () => {
      expect(SecurityValidator.validate_number(5.5, 0, 10)).toBe(5.5);
      expect(SecurityValidator.validate_number('5.5', 0, 10)).toBe(5.5);
    });
  });

  describe('validate_menu_item_input', () => {
    it('should validate correct menu item input', () => {
      const input = {
        name: 'Burger',
        price: 12.99,
        cost: 5.50,
        cookTime: 15
      };
      
      const result = SecurityValidator.validate_menu_item_input(input);
      expect(result).toEqual({
        name: 'Burger',
        price: 12.99,
        cost: 5.50,
        cookTime: 15
      });
    });

    it('should sanitize name input', () => {
      const input = {
        name: '<script>Evil Burger</script>',
        price: 12.99,
        cost: 5.50,
        cookTime: 15
      };
      
      const result = SecurityValidator.validate_menu_item_input(input);
      expect(result.name).toBe('scriptEvil Burger/script');
    });

    it('should validate numeric ranges', () => {
      const invalidInput = {
        name: 'Burger',
        price: 2000, // Outside range
        cost: 5.50,
        cookTime: 15
      };
      
      expect(() => SecurityValidator.validate_menu_item_input(invalidInput))
        .toThrow('Invalid number: 2000. Must be between 1 and 1000.');
    });

    it('should handle string numbers', () => {
      const input = {
        name: 'Burger',
        price: '12.99',
        cost: '5.50',
        cookTime: '15'
      };
      
      const result = SecurityValidator.validate_menu_item_input(input);
      expect(result.price).toBe(12.99);
      expect(result.cost).toBe(5.50);
      expect(result.cookTime).toBe(15);
    });
  });

  describe('validate_string_length', () => {
    it('should pass strings within length limit', () => {
      expect(SecurityValidator.validate_string_length('Hello', 10))
        .toBe('Hello');
      expect(SecurityValidator.validate_string_length('', 10))
        .toBe('');
    });

    it('should throw error for strings exceeding length', () => {
      expect(() => SecurityValidator.validate_string_length('Hello World', 5))
        .toThrow('String too long. Maximum length: 5');
    });

    it('should handle edge cases', () => {
      expect(SecurityValidator.validate_string_length('12345', 5))
        .toBe('12345');
      expect(() => SecurityValidator.validate_string_length('123456', 5))
        .toThrow();
    });
  });

  describe('is_safe_html_content', () => {
    it('should detect dangerous patterns', () => {
      expect(SecurityValidator.is_safe_html_content('<script>alert("xss")</script>'))
        .toBe(false);
      expect(SecurityValidator.is_safe_html_content('<iframe src="evil.com"></iframe>'))
        .toBe(false);
      expect(SecurityValidator.is_safe_html_content('javascript:alert("xss")'))
        .toBe(false);
      expect(SecurityValidator.is_safe_html_content('<div onclick="evil()">'))
        .toBe(false);
      expect(SecurityValidator.is_safe_html_content('<embed src="evil">'))
        .toBe(false);
      expect(SecurityValidator.is_safe_html_content('<object data="evil">'))
        .toBe(false);
    });

    it('should allow safe content', () => {
      expect(SecurityValidator.is_safe_html_content('Hello World'))
        .toBe(true);
      expect(SecurityValidator.is_safe_html_content('<p>Safe paragraph</p>'))
        .toBe(true);
      expect(SecurityValidator.is_safe_html_content('<div>Safe div</div>'))
        .toBe(true);
      expect(SecurityValidator.is_safe_html_content('Numbers: 123'))
        .toBe(true);
    });

    it('should be case insensitive', () => {
      expect(SecurityValidator.is_safe_html_content('<SCRIPT>alert("xss")</SCRIPT>'))
        .toBe(false);
      expect(SecurityValidator.is_safe_html_content('<Script>alert("xss")</Script>'))
        .toBe(false);
      expect(SecurityValidator.is_safe_html_content('JAVASCRIPT:alert("xss")'))
        .toBe(false);
    });
  });

  describe('escape_html', () => {
    it('should escape HTML entities', () => {
      expect(SecurityValidator.escape_html('<div>Hello & "World"</div>'))
        .toBe('&lt;div&gt;Hello &amp; "World"&lt;/div&gt;');
    });

    it('should handle empty strings', () => {
      expect(SecurityValidator.escape_html('')).toBe('');
    });

    it('should handle strings without special characters', () => {
      expect(SecurityValidator.escape_html('Hello World'))
        .toBe('Hello World');
    });

    it('should handle multiple special characters', () => {
      expect(SecurityValidator.escape_html('<>&"'))
        .toBe('&lt;&gt;&amp;"');
    });
  });
});