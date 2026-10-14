import type { SupportAIAdvice } from '../types/AITypes';
import type { GameState, Restaurant } from '../types/GameTypes';
import type { Language } from '../types/UITypes';
import { GAME_CONSTANTS } from '../utils/Constants';
import { average_price, market_average_price } from '../game/Simulation';
import { ADVICE_CATEGORIES, advice_message, type AdviceCategory } from './AdviceTemplates';

/** Localizes a rival's name/strategy for advice text. */
export interface AdviceNaming {
  rivalName(restaurant: Restaurant): string;
  strategyName(restaurant: Restaurant): string;
}

interface Diagnosis {
  category: AdviceCategory;
  variables?: Record<string, string>;
}

/**
 * "Sakura", the player's advisor: diagnoses the player's situation and
 * produces one actionable message at a time.
 */
export class SupportAI {
  private lastAdviceAt = -Infinity;
  private lastCategory: AdviceCategory | null = null;
  private counter = 0;
  /** How many times each category was shown, to rotate through its variants. */
  private readonly shown = new Map<AdviceCategory, number>();

  private readonly offset: number;

  /**
   * @param cooldownSeconds - Minimum simulated seconds between routine messages.
   * @param rng - Random source choosing which variant each category starts with.
   */
  constructor(
    private readonly cooldownSeconds = 12,
    rng: () => number = Math.random
  ) {
    this.offset = Math.floor(rng() * 10);
  }

  /**
   * Returns new advice, or null while cooling down. High-priority warnings
   * bypass the cooldown when the category changes.
   * @param gameState - Current state.
   * @param language - Output language.
   * @param naming - Localized names for rivals.
   */
  generate_advice(
    gameState: GameState,
    language: Language,
    naming: AdviceNaming
  ): SupportAIAdvice | null {
    const player = gameState.restaurants.find(r => r.type === 'player');
    if (!player) return null;

    const diagnosis = this.diagnose(gameState, player, naming);
    const meta = ADVICE_CATEGORIES[diagnosis.category];
    const now = gameState.elapsedSeconds;
    const repeat = diagnosis.category === this.lastCategory;
    const urgent = meta.priority === 'high' && !repeat;
    // Repeating the same point needs a much longer gap than a fresh one.
    const cooldown = repeat ? this.cooldownSeconds * 3 : this.cooldownSeconds;
    if (!urgent && now - this.lastAdviceAt < cooldown) return null;

    this.lastAdviceAt = now;
    this.lastCategory = diagnosis.category;
    this.counter += 1;
    const times = this.shown.get(diagnosis.category) ?? 0;
    this.shown.set(diagnosis.category, times + 1);
    return {
      id: `advice-${this.counter}`,
      type: meta.type,
      priority: meta.priority,
      category: diagnosis.category,
      target: meta.target,
      message: advice_message(
        language,
        diagnosis.category,
        diagnosis.variables,
        times + this.offset
      ),
      timestamp: now,
    };
  }

  /**
   * Chooses the most relevant advice category, in priority order.
   * @param gameState - Current state.
   * @param player - The player's restaurant.
   * @param naming - Localized names for rivals.
   */
  diagnose(gameState: GameState, player: Restaurant, naming: AdviceNaming): Diagnosis {
    const rivals = gameState.restaurants.filter(r => r.type === 'ai');
    const leader = rivals.reduce(
      (top, r) => (r.marketShare > top.marketShare ? r : top),
      rivals[0]
    );
    const marketAvg = market_average_price(gameState.restaurants);
    const ownAvg = average_price(player.menu);
    const worstDish = player.menu.reduce<Restaurant['menu'][number] | null>(
      (worst, item) => (!worst || item.popularity < worst.popularity ? item : worst),
      null
    );

    if (player.cash < 5000) return { category: 'lowCash' };
    if (player.lastLost > 0.4) return { category: 'capacityOverflow' };
    if (player.satisfaction < 50) return { category: 'lowSatisfaction' };
    if (gameState.currentDay >= GAME_CONSTANTS.DAYS_PER_GAME) return { category: 'finalPush' };
    if (leader && leader.marketShare > player.marketShare + 8) {
      return {
        category: 'dominantCompetitor',
        variables: {
          competitor: naming.rivalName(leader),
          share: leader.marketShare.toFixed(1),
          strategy: naming.strategyName(leader),
        },
      };
    }
    if (marketAvg > 0 && ownAvg > marketAvg * 1.12) {
      return {
        category: 'priceTooHigh',
        variables: { percent: Math.round((ownAvg / marketAvg - 1) * 100).toString() },
      };
    }
    if (player.menu.length < 5) return { category: 'smallMenu' };
    if (worstDish && worstDish.popularity < 30) {
      return { category: 'menuOptimization', variables: { dish: worstDish.name } };
    }
    if (player.marketShare < 14) return { category: 'fallingBehind' };
    if (player.cash > 30000) return { category: 'highCash' };
    if (player.marketShare > 22) return { category: 'leadingMarket' };
    if (gameState.weatherCondition === 'rainy') return { category: 'weatherAdvice' };
    if (player.satisfaction > 82) return { category: 'highSatisfaction' };
    return { category: 'marketingTiming' };
  }
}
