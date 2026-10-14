import { describe, expect, it } from 'vitest';
import {
  BRAND_COLORS,
  brand_color,
  camera_distance,
  damp_factor,
  frame_camera,
  lighting_for,
  mix_color,
  pillar_height,
  PLAYER_ANGLE,
  SHOP_RADIUS,
  shop_slots,
  to_css_color,
} from './SceneLayout';

describe('SceneLayout', () => {
  it('places shops evenly with the player at the front facing the center', () => {
    const slots = shop_slots(6);
    expect(slots).toHaveLength(6);
    expect(slots[0].angle).toBe(PLAYER_ANGLE);
    expect(slots[0].x).toBeCloseTo(0);
    expect(slots[0].z).toBeCloseTo(SHOP_RADIUS);
    slots.forEach(slot => {
      expect(Math.hypot(slot.x, slot.z)).toBeCloseTo(SHOP_RADIUS);
      // local +z rotated by `rotation` must point at the origin
      const facing = [Math.sin(slot.rotation), Math.cos(slot.rotation)];
      expect(facing[0] * -slot.x + facing[1] * -slot.z).toBeCloseTo(SHOP_RADIUS);
      expect(Math.hypot(slot.doorX, slot.doorZ)).toBeLessThan(SHOP_RADIUS);
    });
  });

  it('maps brand colors', () => {
    expect(brand_color('player')).toBe(BRAND_COLORS.player);
    expect(brand_color('ai', 'speed')).toBe(BRAND_COLORS.speed);
    expect(brand_color('ai')).toBe(BRAND_COLORS.balanced);
    expect(to_css_color(0x00ff00)).toBe('#00ff00');
  });

  it('mixes colors per channel', () => {
    expect(mix_color(0x000000, 0xffffff, 0.5)).toBe(0x808080);
    expect(mix_color(0xff0000, 0x0000ff, 0)).toBe(0xff0000);
    expect(mix_color(0xff0000, 0x0000ff, 2)).toBe(0x0000ff);
  });

  it('brightens at noon and darkens at night', () => {
    const noon = lighting_for(0.45, 'sunny');
    const night = lighting_for(1, 'sunny');
    expect(noon.sunIntensity).toBeGreaterThan(night.sunIntensity);
    expect(night.night).toBe(1);
    expect(lighting_for(0, 'sunny').night).toBeCloseTo(0.2);
    expect(lighting_for(-1, 'sunny')).toEqual(lighting_for(0, 'sunny'));
  });

  it('dims the sun in bad weather', () => {
    expect(lighting_for(0.45, 'rainy').sunIntensity).toBeLessThan(
      lighting_for(0.45, 'cloudy').sunIntensity
    );
    expect(lighting_for(0.45, 'cloudy').sunIntensity).toBeLessThan(
      lighting_for(0.45, 'sunny').sunIntensity
    );
  });

  it('scales pillars by share', () => {
    expect(pillar_height(0)).toBeCloseTo(0.3);
    expect(pillar_height(50)).toBeCloseTo(6.3);
    expect(pillar_height(200)).toBe(pillar_height(100));
  });

  it('computes frame-rate independent damping', () => {
    expect(damp_factor(1, 0)).toBe(0);
    expect(damp_factor(2, 1)).toBeCloseTo(1 - Math.exp(-2));
  });

  it('pulls the camera back for narrow viewports', () => {
    expect(camera_distance(0.5, 38)).toBeGreaterThan(camera_distance(2, 38));
    expect(camera_distance(0.01, 38)).toBe(90);
    expect(camera_distance(1, 170)).toBe(24);
  });

  it('frames the plaza in the free area', () => {
    const viewport = { width: 1000, height: 800 };
    const full = frame_camera(viewport, null, 38);
    expect(full).toMatchObject({ offsetX: 0, offsetY: 0 });
    expect(frame_camera(viewport, { x: 0, y: 0, width: 50, height: 50 }, 38)).toEqual(full);

    const framed = frame_camera(viewport, { x: 200, y: 100, width: 600, height: 400 }, 38);
    expect(framed.offsetX).toBe(0);
    expect(framed.offsetY).toBe(100);
    expect(framed.distance).toBeGreaterThan(full.distance);
  });
});
