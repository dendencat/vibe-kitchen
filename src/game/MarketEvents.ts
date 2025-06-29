import { MarketEvent } from '../types/GameTypes';
import { GAME_CONFIG } from '../utils/Constants';
import { MathUtils } from '../utils/MathUtils';

export class MarketEventManager {
  private activeEvents: Set<string> = new Set();
  
  generate_random_event(): MarketEvent | null {
    // Filter events that aren't already active
    const availableEvents = GAME_CONFIG.events.filter(
      event => !this.activeEvents.has(event.id)
    );
    
    if (availableEvents.length === 0) return null;
    
    // Check probabilities
    for (const event of availableEvents) {
      if (Math.random() < event.probability) {
        this.activeEvents.add(event.id);
        
        // Remove from active events when duration expires
        setTimeout(() => {
          this.activeEvents.delete(event.id);
        }, event.duration * 60 * 1000); // Convert days to milliseconds
        
        return { ...event };
      }
    }
    
    return null;
  }
  
  create_custom_event(
    name: string,
    description: string,
    effect: Partial<MarketEvent['effect']>,
    duration: number
  ): MarketEvent {
    return {
      id: `custom-${Date.now()}`,
      name,
      description,
      effect,
      duration,
      probability: 1.0 // Custom events always trigger
    };
  }
  
  get_weather_event(weather: 'sunny' | 'rainy' | 'cloudy'): MarketEvent | null {
    switch (weather) {
      case 'rainy':
        return this.create_custom_event(
          'Rainy Weather',
          'The rain is keeping some customers away',
          { customerMultiplier: 0.8 },
          1
        );
      case 'sunny':
        return this.create_custom_event(
          'Beautiful Weather',
          'The nice weather is bringing more customers out',
          { customerMultiplier: 1.2 },
          1
        );
      default:
        return null;
    }
  }
  
  get_competitor_event(competitorAction: string): MarketEvent | null {
    switch (competitorAction) {
      case 'price_war':
        return this.create_custom_event(
          'Price War',
          'Competitors are slashing prices!',
          { customerMultiplier: 0.9, costMultiplier: 0.9 },
          2
        );
      case 'new_competitor':
        return this.create_custom_event(
          'New Competitor',
          'A new restaurant has opened nearby',
          { customerMultiplier: 0.85 },
          3
        );
      default:
        return null;
    }
  }
  
  clear_events(): void {
    this.activeEvents.clear();
  }
}