import type { StrategyType, Weather } from '../types/GameTypes';
import { MathUtils } from '../utils/MathUtils';

/**
 * Pure layout, palette and lighting helpers for the 3D plaza.
 * Kept free of three.js so it can be unit tested.
 */

export const SHOP_RADIUS = 13;
export const SPAWN_RADIUS = 24;
export const INNER_RADIUS = 7.5;
export const DOOR_OFFSET = 2.6;
/** The player's shop sits at the front of the plaza, facing the camera. */
export const PLAYER_ANGLE = Math.PI / 2;

export interface ShopSlot {
  index: number;
  angle: number;
  x: number;
  z: number;
  /** Y rotation so the shop's front (+z in local space) faces the plaza center. */
  rotation: number;
  doorX: number;
  doorZ: number;
}

/**
 * Evenly spaced shop slots on a circle, starting with the player at the front.
 * @param count - Number of shops.
 * @param radius - Circle radius.
 */
export function shop_slots(count: number, radius = SHOP_RADIUS): ShopSlot[] {
  return Array.from({ length: count }, (_, index) => {
    const angle = PLAYER_ANGLE + (index * Math.PI * 2) / count;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const doorRadius = radius - DOOR_OFFSET;
    return {
      index,
      angle,
      x,
      z,
      rotation: Math.atan2(-x, -z),
      doorX: Math.cos(angle) * doorRadius,
      doorZ: Math.sin(angle) * doorRadius,
    };
  });
}

/** Signature colors per restaurant. */
export const BRAND_COLORS: Record<'player' | StrategyType, number> = {
  player: 0xff5d8f,
  aggressive: 0xff6b35,
  strategic: 0x4f6df5,
  emotional: 0xb07cff,
  speed: 0xffc300,
  balanced: 0x22c3a6,
};

/**
 * Brand color for a restaurant.
 * @param type - Player or AI.
 * @param strategy - AI archetype.
 */
export function brand_color(type: 'player' | 'ai', strategy?: StrategyType): number {
  return type === 'player' ? BRAND_COLORS.player : BRAND_COLORS[strategy ?? 'balanced'];
}

/** Hex number to `#rrggbb`. */
export function to_css_color(color: number): string {
  return `#${color.toString(16).padStart(6, '0')}`;
}

/**
 * Linear blend between two 0xRRGGBB colors.
 * @param t - 0 returns `a`, 1 returns `b`.
 */
export function mix_color(a: number, b: number, t: number): number {
  const k = MathUtils.clamp(t, 0, 1);
  const channel = (shift: number) =>
    Math.round(MathUtils.lerp((a >> shift) & 0xff, (b >> shift) & 0xff, k)) << shift;
  return channel(16) | channel(8) | channel(0);
}

export interface Lighting {
  sky: number;
  ground: number;
  sun: number;
  sunIntensity: number;
  ambientIntensity: number;
  /** Sun elevation in radians. */
  sunElevation: number;
  /** 0 by day, 1 at night — drives window glow and lamps. */
  night: number;
}

interface LightingKey {
  at: number;
  sky: number;
  sun: number;
  sunIntensity: number;
  ambient: number;
  night: number;
}

const LIGHTING_KEYS: LightingKey[] = [
  { at: 0, sky: 0xffd6b0, sun: 0xffc48a, sunIntensity: 1.6, ambient: 0.9, night: 0.2 },
  { at: 0.3, sky: 0xbfe6ff, sun: 0xfff6e8, sunIntensity: 2.6, ambient: 1.1, night: 0 },
  { at: 0.62, sky: 0xc8e4ff, sun: 0xfff1dc, sunIntensity: 2.4, ambient: 1.05, night: 0 },
  { at: 0.8, sky: 0xffa98a, sun: 0xff9a6b, sunIntensity: 1.7, ambient: 0.85, night: 0.45 },
  { at: 0.92, sky: 0x6c5ba8, sun: 0xb8a4ff, sunIntensity: 0.8, ambient: 0.6, night: 0.85 },
  { at: 1, sky: 0x3b3a78, sun: 0x9ea6ff, sunIntensity: 0.6, ambient: 0.55, night: 1 },
];

const WEATHER_TINT: Record<Weather, { sky: number; amount: number; sun: number }> = {
  sunny: { sky: 0xffffff, amount: 0, sun: 1 },
  cloudy: { sky: 0xb9c2d0, amount: 0.45, sun: 0.7 },
  rainy: { sky: 0x7d8899, amount: 0.65, sun: 0.45 },
};

/**
 * Sky and light parameters for a moment of the day.
 * @param progress - Day progress 0..1.
 * @param weather - Current weather.
 */
export function lighting_for(progress: number, weather: Weather): Lighting {
  const p = MathUtils.clamp(progress, 0, 1);
  let index = LIGHTING_KEYS.findIndex(key => key.at >= p);
  index = Math.max(1, index);
  const from = LIGHTING_KEYS[index - 1];
  const to = LIGHTING_KEYS[index];
  const t = (p - from.at) / (to.at - from.at);
  const tint = WEATHER_TINT[weather];
  const sky = mix_color(mix_color(from.sky, to.sky, t), tint.sky, tint.amount);
  return {
    sky,
    ground: mix_color(sky, 0x6f8f5a, 0.6),
    sun: mix_color(from.sun, to.sun, t),
    sunIntensity: MathUtils.lerp(from.sunIntensity, to.sunIntensity, t) * tint.sun,
    ambientIntensity: MathUtils.lerp(from.ambient, to.ambient, t),
    sunElevation: 0.25 + Math.sin(p * Math.PI) * 0.95,
    night: MathUtils.lerp(from.night, to.night, t),
  };
}

/**
 * Height of the market-share pillar beside a shop.
 * @param share - Market share in percent.
 */
export function pillar_height(share: number): number {
  return 0.3 + (MathUtils.clamp(share, 0, 100) / 100) * 12;
}

/**
 * Exponential smoothing factor for a frame, independent of frame rate.
 * @param rate - Approach speed per second.
 * @param dt - Frame time in seconds.
 */
export function damp_factor(rate: number, dt: number): number {
  return 1 - Math.exp(-rate * dt);
}

/**
 * Camera distance that keeps the plaza (radius `fit`) in view horizontally.
 * @param aspect - Viewport aspect ratio.
 * @param fovDegrees - Vertical field of view.
 * @param fit - Radius to keep visible.
 */
export function camera_distance(aspect: number, fovDegrees: number, fit = 17.5): number {
  const vertical = (fovDegrees * Math.PI) / 180;
  const horizontal = 2 * Math.atan(Math.tan(vertical / 2) * aspect);
  const byWidth = fit / Math.tan(horizontal / 2);
  const byHeight = (fit * 0.75) / Math.tan(vertical / 2);
  return MathUtils.clamp(Math.max(byWidth, byHeight), 24, 90);
}

export interface FrameRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CameraFraming {
  /** Pixel offset passed to `camera.setViewOffset` so the plaza centers in the free area. */
  offsetX: number;
  offsetY: number;
  distance: number;
}

/**
 * Frames the plaza inside the part of the viewport not covered by UI panels.
 * @param viewport - Full canvas size in CSS pixels.
 * @param free - Unobstructed rectangle (CSS pixels, canvas coordinates).
 * @param fovDegrees - Camera vertical field of view.
 */
export function frame_camera(
  viewport: { width: number; height: number },
  free: FrameRect | null,
  fovDegrees: number
): CameraFraming {
  if (!free || free.width < 80 || free.height < 80) {
    return {
      offsetX: 0,
      offsetY: 0,
      distance: camera_distance(viewport.width / Math.max(1, viewport.height), fovDegrees),
    };
  }
  const offsetX = viewport.width / 2 - (free.x + free.width / 2);
  const offsetY = viewport.height / 2 - (free.y + free.height / 2);
  const vertical = (fovDegrees * Math.PI) / 180;
  const effectiveFov =
    (2 * Math.atan(Math.tan(vertical / 2) * (free.height / Math.max(1, viewport.height))) * 180) /
    Math.PI;
  return {
    offsetX,
    offsetY,
    distance: camera_distance(free.width / free.height, effectiveFov),
  };
}
