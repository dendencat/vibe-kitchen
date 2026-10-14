import { describe, expect, it } from 'vitest';
import { FakeAudioContext, FakeTimers } from '../../test/fakeAudio';
import { AudioManager, create_default_context, type SoundEffect } from './AudioManager';

function setup() {
  const ctx = new FakeAudioContext();
  const timers = new FakeTimers();
  const audio = new AudioManager(() => ctx as unknown as AudioContext, timers);
  return { ctx, timers, audio };
}

describe('AudioManager', () => {
  it('stays silent and harmless before unlock', () => {
    const { ctx, audio } = setup();
    audio.set_track('sakuraPop');
    audio.play_sfx('coin');
    audio.suspend();
    audio.resume();
    expect(ctx.created.oscillator).toBeUndefined();
    expect(audio.is_playing()).toBe(false);
    expect(audio.get_track()).toBe('sakuraPop');
  });

  it('unlocks, resumes the context and starts the selected track', async () => {
    const { ctx, timers, audio } = setup();
    audio.set_track('sakuraPop');
    expect(audio.unlock()).toBe(true);
    expect(ctx.resume).toHaveBeenCalled();
    expect(audio.is_playing()).toBe(true);
    ctx.currentTime = 1;
    timers.run();
    expect(ctx.created.oscillator).toBeGreaterThan(0);
    expect(ctx.created.noise).toBeGreaterThan(0);
    expect(audio.unlock()).toBe(true);
  });

  it('schedules every voice across a full loop of each track', () => {
    const { ctx, timers, audio } = setup();
    audio.unlock();
    ['sakuraPop', 'kitchenBounce', 'neonDiner', 'lunchRush'].forEach(id => {
      audio.set_track(id);
      ctx.currentTime += 40;
      timers.run();
    });
    const waves = new Set(ctx.oscillators.map(o => o.type));
    expect(waves).toEqual(new Set(['square', 'sawtooth', 'triangle', 'sine']));
  });

  it('switches tracks with a single active scheduler and can turn music off', () => {
    const { timers, audio } = setup();
    audio.unlock();
    audio.set_track('neonDiner');
    audio.set_track('lunchRush');
    expect(timers.handlers.size).toBe(1);
    audio.set_track('off');
    expect(timers.handlers.size).toBe(0);
    expect(audio.get_track()).toBe('off');
    audio.set_track('does-not-exist');
    expect(audio.get_track()).toBe('off');
  });

  it('applies volume and mute', () => {
    const { audio } = setup();
    audio.set_music_volume(2);
    audio.set_sfx_volume(-1);
    audio.set_muted(true);
    expect(audio.is_muted()).toBe(true);
    audio.unlock();
    audio.set_muted(false);
    audio.set_music_volume(0.5);
    audio.set_sfx_volume(0.5);
    expect(audio.is_muted()).toBe(false);
  });

  it.each<SoundEffect>(['click', 'coin', 'success', 'error', 'day', 'event', 'fanfare'])(
    'plays the %s effect',
    effect => {
      const { ctx, audio } = setup();
      audio.unlock();
      const before = ctx.created.oscillator ?? 0;
      audio.play_sfx(effect);
      expect(ctx.created.oscillator).toBeGreaterThan(before);
    }
  );

  it('skips effects when muted or silent', () => {
    const { ctx, audio } = setup();
    audio.unlock();
    audio.set_muted(true);
    audio.play_sfx('coin');
    audio.set_muted(false);
    audio.set_sfx_volume(0);
    audio.play_sfx('coin');
    expect(ctx.created.oscillator).toBeUndefined();
  });

  it('suspends and resumes the clock', async () => {
    const { ctx, audio } = setup();
    audio.unlock();
    await Promise.resolve();
    audio.suspend();
    expect(ctx.suspend).toHaveBeenCalled();
    await Promise.resolve();
    audio.resume();
    expect(ctx.resume).toHaveBeenCalledTimes(2);
  });

  it('disposes the context', () => {
    const { ctx, timers, audio } = setup();
    audio.unlock();
    audio.set_track('sakuraPop');
    audio.dispose();
    expect(ctx.close).toHaveBeenCalled();
    expect(timers.handlers.size).toBe(0);
    new AudioManager(() => null, new FakeTimers()).dispose();
  });

  it('reports unavailable audio', () => {
    const missing = new AudioManager(() => null, new FakeTimers());
    expect(missing.unlock()).toBe(false);
    expect(missing.unlock()).toBe(false);
    const throwing = new AudioManager(() => {
      throw new Error('blocked');
    }, new FakeTimers());
    expect(throwing.unlock()).toBe(false);
  });

  it('creates the browser context when available', () => {
    const original = window.AudioContext;
    class Ctor {}
    (window as unknown as { AudioContext: unknown }).AudioContext = Ctor;
    expect(create_default_context()).toBeInstanceOf(Ctor);
    (window as unknown as { AudioContext: unknown }).AudioContext = undefined;
    (window as unknown as { webkitAudioContext: unknown }).webkitAudioContext = Ctor;
    expect(create_default_context()).toBeInstanceOf(Ctor);
    (window as unknown as { webkitAudioContext: unknown }).webkitAudioContext = undefined;
    expect(create_default_context()).toBeNull();
    (window as unknown as { AudioContext: unknown }).AudioContext = original;
  });

  it('defaults to the window timers', () => {
    expect(() => new AudioManager(() => null)).not.toThrow();
  });
});
