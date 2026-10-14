import type { GameState, PlayerAction, Restaurant } from './GameTypes';

export interface AIStrategy {
  name: string;
  description: string;
  riskLevel: 'low' | 'medium' | 'high';
  execute_strategy(gameState: GameState, restaurant: Restaurant): PlayerAction[];
}

/** Which control tab an advice message relates to (drives the advisor "Go" button). */
export type AdviceTarget = 'menu' | 'marketing' | 'operations' | null;

export interface SupportAIAdvice {
  id: string;
  type: 'warning' | 'opportunity' | 'tip' | 'analysis';
  priority: 'low' | 'medium' | 'high';
  category: string;
  message: string;
  target: AdviceTarget;
  timestamp: number;
}
