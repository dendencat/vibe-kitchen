import type { AdviceNaming } from '../ai/SupportAI';
import { localization } from '../localization/Localization';
import type { Restaurant } from '../types/GameTypes';

/**
 * Display name of a restaurant in the active language (AI names are localized,
 * the player's name is whatever they typed).
 * @param restaurant - Restaurant to name.
 */
export function restaurant_name(
  restaurant: Pick<Restaurant, 'type' | 'name' | 'strategyType'>
): string {
  if (restaurant.type === 'player' || !restaurant.strategyType) return restaurant.name;
  return localization.t(`aiRestaurants.${restaurant.strategyType}`);
}

/**
 * Short localized strategy label.
 * @param restaurant - Restaurant to describe.
 */
export function strategy_name(restaurant: Pick<Restaurant, 'strategyType'>): string {
  return restaurant.strategyType ? localization.t(`strategyShort.${restaurant.strategyType}`) : '';
}

/** Naming adapter for the advisor. */
export const ADVICE_NAMING: AdviceNaming = {
  rivalName: restaurant_name,
  strategyName: strategy_name,
};
