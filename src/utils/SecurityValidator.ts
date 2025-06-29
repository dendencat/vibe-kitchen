import { MenuItem } from '../types/GameTypes';

export class SecurityValidator {
  static sanitize_input(input: string): string {
    return input
      .replace(/[<>\"'&]/g, '')
      .trim()
      .substring(0, 100);
  }
  
  static validate_number(value: any, min: number, max: number): number {
    const num = Number(value);
    if (isNaN(num) || num < min || num > max) {
      throw new Error(`Invalid number: ${value}. Must be between ${min} and ${max}.`);
    }
    return num;
  }
  
  static validate_menu_item_input(item: any): Partial<MenuItem> {
    return {
      name: this.sanitize_input(item.name),
      price: this.validate_number(item.price, 1, 1000),
      cost: this.validate_number(item.cost, 0.1, 500),
      cookTime: this.validate_number(item.cookTime, 1, 60)
    };
  }
  
  static validate_string_length(input: string, maxLength: number): string {
    if (input.length > maxLength) {
      throw new Error(`String too long. Maximum length: ${maxLength}`);
    }
    return input;
  }
  
  static is_safe_html_content(content: string): boolean {
    const dangerousPatterns = [
      /<script/i,
      /<iframe/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<embed/i,
      /<object/i
    ];
    
    return !dangerousPatterns.some(pattern => pattern.test(content));
  }
  
  static escape_html(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}