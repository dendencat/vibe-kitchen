export class SecurityValidator {
  static sanitize_input(input){
    return input
      .replace(/[\"'&<>]/g, '')
      .trim()
      .substring(0, 100);
  }
  
  static validate_number(value, min, max){
    const num = Number(value);
    if (isNaN(num) || num < min || num > max) {
      throw new Error(`Invalid number: ${value}. Must be between ${min} and ${max}.`);
    }
    return num;
  }
  
  static validate_menu_item_input(item){
    return {
      name: this.sanitize_input(item.name),
      price: this.validate_number(item.price, 1, 1000),
      cost: this.validate_number(item.cost, 0.1, 500),
      cookTime: this.validate_number(item.cookTime, 1, 60)
    };
  }
  
  static validate_string_length(input, maxLength){
    if (input.length > maxLength) {
      throw new Error(`String too long. Maximum length: ${maxLength}`);
    }
    return input;
  }
  
  static is_safe_html_content(content){
    const dangerousPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
      /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
      /<embed\b[^<]*>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi
    ];
    
    return !dangerousPatterns.some(pattern => pattern.test(content));
  }
  
  static escape_html(text){
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  static validate_campaign_budget(budget, maxBudget){
    return this.validate_number(budget, 1000, maxBudget);
  }
  
  static validate_staff_type(staffType){
    const validTypes = ['chef', 'waiter', 'manager'];
    if (!validTypes.includes(staffType)) {
      throw new Error(`Invalid staff type: ${staffType}. Must be one of: ${validTypes.join(', ')}`);
    }
    return staffType;
  }
  
  static validate_equipment_type(equipmentType){
    const validTypes = ['kitchen', 'oven', 'grill', 'fryer', 'dishwasher'];
    if (!validTypes.includes(equipmentType)) {
      throw new Error(`Invalid equipment type: ${equipmentType}. Must be one of: ${validTypes.join(', ')}`);
    }
    return equipmentType;
  }
}