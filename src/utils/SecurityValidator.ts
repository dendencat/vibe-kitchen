import type { MenuItemDraft } from '../types/GameTypes';

export class SecurityValidator {
  /**
   * Strips HTML-significant characters and control characters, trims and limits length.
   * @param input - Raw user text.
   * @param maxLength - Maximum length after sanitizing.
   */
  static sanitize_input(input: unknown, maxLength = 100): string {
    if (typeof input !== 'string') return '';
    return (
      input
        .replace(/[<>"'&`]/g, '')
        // eslint-disable-next-line no-control-regex
        .replace(/[\u0000-\u001f\u007f]/g, '')
        .trim()
        .substring(0, maxLength)
    );
  }

  /**
   * Parses a number and checks it is finite and inside [min, max].
   * @throws Error when the value is not a valid number in range.
   */
  static validate_number(value: unknown, min: number, max: number): number {
    if (value === null || value === '' || typeof value === 'boolean') {
      throw new Error(`Invalid number: ${String(value)}. Must be between ${min} and ${max}.`);
    }
    const num = Number(value);
    if (!Number.isFinite(num) || num < min || num > max) {
      throw new Error(`Invalid number: ${String(value)}. Must be between ${min} and ${max}.`);
    }
    return num;
  }

  /**
   * Validates a menu item submitted by the player.
   * @throws Error when the name is empty or any number is out of range.
   */
  static validate_menu_item_input(
    item: Partial<Record<keyof MenuItemDraft, unknown>>
  ): MenuItemDraft {
    const name = this.sanitize_input(item.name, 40);
    if (name.length === 0) {
      throw new Error('Dish name is required.');
    }
    const price = this.validate_number(item.price, 1, 1000);
    const cost = this.validate_number(item.cost, 0.1, 500);
    const cookTime = this.validate_number(item.cookTime, 1, 60);
    if (cost >= price) {
      throw new Error('Cost must be lower than price.');
    }
    return { name, price, cost, cookTime };
  }

  /**
   * Rejects strings longer than `maxLength`.
   * @throws Error when too long.
   */
  static validate_string_length(input: string, maxLength: number): string {
    if (input.length > maxLength) {
      throw new Error(`String too long. Maximum length: ${maxLength}`);
    }
    return input;
  }

  /**
   * Heuristic check for script-injection patterns.
   * @param content - Text to inspect.
   */
  static is_safe_html_content(content: string): boolean {
    const dangerousPatterns = [
      /<script/i,
      /<iframe/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<embed/i,
      /<object/i,
    ];

    return !dangerousPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Escapes text for safe interpolation into HTML.
   * @param text - Raw text.
   */
  static escape_html(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
