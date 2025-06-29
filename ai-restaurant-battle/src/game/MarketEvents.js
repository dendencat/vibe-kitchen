import { GAME_CONFIG } from '../utils/Constants.js';
import { MathUtils } from '../utils/MathUtils.js';

export class MarketEventManager {
  activeEvents= new Set();
  
  generate_random_event(): MarketEvent | null {
    // Filter events that aren't already active
    const availableEvents = GAME_CONFIG.events.filter(
      event => !this.activeEvents.has(event.id)
    );
    
    if (availableEvents.length === 0) return null;
    
    // Check probabilities
    for (const event of availableEvents) {
      if (Math.random()  {
          this.activeEvents.delete(event.id);
        }, event.duration * 60 * 1000); // Convert days to milliseconds
        
        return { ...event };
      }
    }
    
    return null;
  }
  
  create_custom_event(
    name,
    description,
    effect,
    duration): MarketEvent {
    return {
      id)}`,
      name,
      description,
      effect,
      duration,
      probability;
  }
  
  get_weather_event(weather): MarketEvent | null {
    switch (weather) {
      case 'rainy':
        return this.create_custom_event(
          'Rainy Weather',
          'The rain is keeping some customers away',
          { customerMultiplier,
          1
        );
      case 'sunny':
        return this.create_custom_event(
          'Beautiful Weather',
          'The nice weather is bringing more customers out',
          { customerMultiplier,
          1
        );
      default;
    }
  }
  
  get_competitor_event(competitorAction): MarketEvent | null {
    switch (competitorAction) {
      case 'price_war':
        return this.create_custom_event(
          'Price War',
          'Competitors are slashing prices!',
          { customerMultiplier, costMultiplier,
          2
        );
      case 'new_competitor':
        return this.create_custom_event(
          'New Competitor',
          'A new restaurant h nearby',
          { customerMultiplier,
          3
        );
      default;
    }
  }
  
  clear_events(): void {
    this.activeEvents.clear();
  }
}