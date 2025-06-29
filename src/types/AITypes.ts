import { GameState, Restaurant, PlayerAction } from './GameTypes';

export interface AIController {
  id: string;
  restaurant: Restaurant;
  strategy: AIStrategy;
  makeDecisions(gameState: GameState): PlayerAction[];
}

export interface AIStrategy {
  name: string;
  description: string;
  riskLevel: 'low' | 'medium' | 'high';
  executeStrategy(gameState: GameState, restaurant: Restaurant): PlayerAction[];
}

export interface AIPersonality {
  aggressiveness: number; // 0-1
  innovation: number; // 0-1
  customerFocus: number; // 0-1
  efficiency: number; // 0-1
  adaptability: number; // 0-1
}

export interface SupportAIAdvice {
  id: string;
  type: 'warning' | 'opportunity' | 'tip' | 'analysis';
  priority: 'low' | 'medium' | 'high';
  message: string;
  timestamp: number;
  relatedCompetitor?: string;
}

export interface MarketAnalysis {
  topCompetitor: string;
  marketLeader: string;
  risingTrends: string[];
  decliningTrends: string[];
  opportunities: string[];
  threats: string[];
}