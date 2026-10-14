import type { Difficulty } from './GameTypes';

export type Language = 'en' | 'ja';

export type DockTab = 'menu' | 'marketing' | 'operations';

export type GraphicsQuality = 'high' | 'low';

export interface Settings {
  language: Language;
  musicTrack: string;
  musicVolume: number;
  sfxVolume: number;
  muted: boolean;
  quality: GraphicsQuality;
  difficulty: Difficulty;
  restaurantName: string;
}

export type ToastKind = 'success' | 'warning' | 'error' | 'info';
