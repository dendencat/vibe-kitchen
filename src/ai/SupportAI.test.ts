import { describe, expect, it } from 'vitest';
import { make_item, make_state } from '../../test/factories';
import type { GameState, Restaurant } from '../types/GameTypes';
import { ADVICE_CATEGORIES, ADVICE_TABLES, advice_message } from './AdviceTemplates';
import { SupportAI, type AdviceNaming } from './SupportAI';

const naming: AdviceNaming = {
  rivalName: r => `Rival(${r.strategyType})`,
  strategyName: r => `Plan(${r.strategyType})`,
};

/** State where the player is "average" so no special category triggers. */
function calm_state(player: Partial<Restaurant> = {}, state: Partial<GameState> = {}): GameState {
  const gameState = make_state(state);
  gameState.restaurants.forEach(r => {
    r.marketShare = 100 / 6;
    r.menu = Array.from({ length: 5 }, (_, i) => make_item({ id: `m${i}`, price: 10 }));
  });
  Object.assign(
    gameState.restaurants[0],
    { marketShare: 18, cash: 20000, satisfaction: 70 },
    player
  );
  return gameState;
}

const diagnose = (state: GameState) =>
  new SupportAI().diagnose(state, state.restaurants[0], naming);

describe('SupportAI.diagnose', () => {
  it.each<[string, Partial<Restaurant>, Partial<GameState>]>([
    ['lowCash', { cash: 100 }, {}],
    ['capacityOverflow', { lastLost: 1 }, {}],
    ['lowSatisfaction', { satisfaction: 30 }, {}],
    ['finalPush', {}, { currentDay: 7 }],
    ['smallMenu', { menu: [make_item({ price: 10 })] }, {}],
    ['fallingBehind', { marketShare: 12 }, {}],
    ['highCash', { cash: 40000 }, {}],
    ['weatherAdvice', {}, { weatherCondition: 'rainy' }],
    ['highSatisfaction', { satisfaction: 90 }, {}],
    ['marketingTiming', {}, {}],
  ])('detects %s', (category, player, state) => {
    expect(diagnose(calm_state(player, state)).category).toBe(category);
  });

  it('detects a dominant competitor with names', () => {
    const state = calm_state();
    state.restaurants[3].marketShare = 40;
    expect(diagnose(state)).toEqual({
      category: 'dominantCompetitor',
      variables: { competitor: 'Rival(emotional)', share: '40.0', strategy: 'Plan(emotional)' },
    });
  });

  it('detects high prices with a percentage', () => {
    const state = calm_state({ menu: Array.from({ length: 5 }, () => make_item({ price: 20 })) });
    expect(diagnose(state)).toEqual({ category: 'priceTooHigh', variables: { percent: '71' } });
  });

  it('names the weakest dish', () => {
    const menu = Array.from({ length: 5 }, (_, i) =>
      make_item({ id: `m${i}`, name: `D${i}`, popularity: i === 2 ? 10 : 60 })
    );
    expect(diagnose(calm_state({ menu }))).toEqual({
      category: 'menuOptimization',
      variables: { dish: 'D2' },
    });
  });

  it('celebrates leading the market', () => {
    const state = calm_state({ marketShare: 30 });
    expect(diagnose(state).category).toBe('leadingMarket');
  });
});

describe('SupportAI.generate_advice', () => {
  it('returns null without a player', () => {
    const state = calm_state();
    state.restaurants = state.restaurants.slice(1);
    expect(new SupportAI().generate_advice(state, 'en', naming)).toBeNull();
  });

  it('respects the cooldown but lets new urgent warnings through', () => {
    const ai = new SupportAI(10, () => 0);
    const state = calm_state();
    const first = ai.generate_advice(state, 'en', naming);
    expect(first).toMatchObject({
      category: 'marketingTiming',
      type: 'tip',
      target: 'marketing',
      id: 'advice-1',
    });
    expect(ai.generate_advice({ ...state, elapsedSeconds: 5 }, 'en', naming)).toBeNull();

    state.restaurants[0].cash = 100;
    const urgent = ai.generate_advice({ ...state, elapsedSeconds: 6 }, 'ja', naming);
    expect(urgent).toMatchObject({ category: 'lowCash', priority: 'high' });
    expect(urgent?.message).toBe(ADVICE_TABLES.ja.lowCash[0]);
    expect(ai.generate_advice({ ...state, elapsedSeconds: 7 }, 'en', naming)).toBeNull();
    expect(ai.generate_advice({ ...state, elapsedSeconds: 30 }, 'en', naming)).toBeNull();
    const again = ai.generate_advice({ ...state, elapsedSeconds: 36 }, 'ja', naming);
    expect(again?.message).toBe(ADVICE_TABLES.ja.lowCash[1]);
  });

  it('starts at a random variant', () => {
    const ai = new SupportAI(10, () => 0.15);
    expect(ai.generate_advice(calm_state(), 'en', naming)?.message).toBe(
      ADVICE_TABLES.en.marketingTiming[1]
    );
    expect(new SupportAI().generate_advice(calm_state(), 'en', naming)).not.toBeNull();
  });
});

describe('AdviceTemplates', () => {
  it('has messages for every category in both languages', () => {
    Object.keys(ADVICE_CATEGORIES).forEach(category => {
      expect(ADVICE_TABLES.en[category as keyof typeof ADVICE_CATEGORIES].length).toBeGreaterThan(
        0
      );
      expect(ADVICE_TABLES.ja[category as keyof typeof ADVICE_CATEGORIES].length).toBeGreaterThan(
        0
      );
    });
  });

  it('fills placeholders and keeps unknown ones', () => {
    expect(advice_message('en', 'priceTooHigh', { percent: '12' })).toContain('12%');
    expect(advice_message('en', 'priceTooHigh')).toContain('{percent}');
    expect(advice_message('ja', 'smallMenu', {}, 3)).toBe(ADVICE_TABLES.ja.smallMenu[1]);
  });
});
