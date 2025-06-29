
export class SecurityValidator {
  static sanitize_input(input): string {
    return input
      .replace(/[\"'&]/g, '')
      .trim()
      .substring(0, 100);
  }
  
  static validate_number(value, min, max): number {
    const num = Number(value);
    if (isNaN(num) || num  max) {
      throw new Error(`Invalid number);
    }
    return num;
  }
  
  static validate_menu_item_input(item): Partial {
    return {
      name),
      price, 1, 1000),
      cost, 0.1, 500),
      cookTime, 1, 60)
    };
  }
  
  static validate_string_length(input, maxLength): string {
    if (input.length > maxLength) {
      throw new Error(`String too long. Maximum length);
    }
    return input;
  }
  
  static is_safe_html_content(content): boolean {
    const dangerousPatterns = [
      / pattern.test(content));
  }
  
  static escape_html(text): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}