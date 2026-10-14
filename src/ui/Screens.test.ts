import { describe, expect, it, vi } from 'vitest';
import { localization } from '../localization/Localization';
import type { Awards, FinalResult } from '../types/GameTypes';
import type { Settings } from '../types/UITypes';
import { GameOverModal } from './GameOverModal';
import { SettingsModal, type SettingsCallbacks } from './SettingsModal';
import { TitleScreen, type TitleCallbacks } from './TitleScreen';
import { TrackPicker } from './TrackPicker';

const settings: Settings = {
  language: 'en',
  musicTrack: 'neonDiner',
  musicVolume: 0.4,
  sfxVolume: 0.3,
  muted: true,
  quality: 'low',
  difficulty: 'hard',
  restaurantName: 'Bistro',
};

describe('TrackPicker', () => {
  it('lists tracks plus off and reports changes', () => {
    const onChange = vi.fn();
    const picker = new TrackPicker(onChange);
    document.body.append(picker.root);
    const options = picker.root.querySelectorAll('.track-option');
    expect(options.length).toBe(5);
    picker.set_value('lunchRush');
    expect(picker.root.querySelector('.track-option.active')?.getAttribute('data-track')).toBe(
      'lunchRush'
    );
    const off = picker.root.querySelector<HTMLInputElement>(
      'input[value="off"]'
    ) as HTMLInputElement;
    off.click();
    expect(onChange).toHaveBeenCalledWith('off');
  });
});

describe('SettingsModal', () => {
  function setup() {
    const callbacks: SettingsCallbacks = {
      onTrack: vi.fn(),
      onMusicVolume: vi.fn(),
      onSfxVolume: vi.fn(),
      onMute: vi.fn(),
      onQuality: vi.fn(),
      onLanguage: vi.fn(),
      onResume: vi.fn(),
      onQuit: vi.fn(),
    };
    return { callbacks, modal: new SettingsModal(callbacks) };
  }

  it('reflects settings and hides quit outside the game', () => {
    const { modal } = setup();
    modal.open(settings, false);
    expect((document.getElementById('music-volume') as HTMLInputElement).value).toBe('40');
    expect((document.getElementById('sfx-volume') as HTMLInputElement).value).toBe('30');
    expect((document.getElementById('mute-toggle') as HTMLInputElement).checked).toBe(true);
    expect((document.querySelector('input[value="low"]') as HTMLInputElement).checked).toBe(true);
    expect(document.querySelector('[lang="en"]')?.getAttribute('aria-pressed')).toBe('true');
    expect((document.getElementById('quit-button') as HTMLButtonElement).hidden).toBe(true);
  });

  it('forwards every control', () => {
    const { callbacks, modal } = setup();
    modal.open(settings, true);
    const music = document.getElementById('music-volume') as HTMLInputElement;
    music.value = '80';
    music.dispatchEvent(new Event('input'));
    const sfx = document.getElementById('sfx-volume') as HTMLInputElement;
    sfx.value = '10';
    sfx.dispatchEvent(new Event('input'));
    (document.getElementById('mute-toggle') as HTMLInputElement).click();
    (document.querySelector('input[value="high"]') as HTMLInputElement).click();
    (document.querySelector('button[lang="ja"]') as HTMLButtonElement).click();
    (
      document.querySelector('.settings-modal input[value="sakuraPop"]') as HTMLInputElement
    ).click();
    (document.getElementById('quit-button') as HTMLButtonElement).click();
    expect(callbacks.onMusicVolume).toHaveBeenCalledWith(0.8);
    expect(callbacks.onSfxVolume).toHaveBeenCalledWith(0.1);
    expect(callbacks.onMute).toHaveBeenCalledWith(false);
    expect(callbacks.onQuality).toHaveBeenCalledWith('high');
    expect(callbacks.onLanguage).toHaveBeenCalledWith('ja');
    expect(callbacks.onTrack).toHaveBeenCalledWith('sakuraPop');
    expect(callbacks.onQuit).toHaveBeenCalled();
    (document.getElementById('resume-button') as HTMLButtonElement).click();
    expect(callbacks.onResume).toHaveBeenCalled();
  });
});

describe('GameOverModal', () => {
  const result = (id: string, type: 'player' | 'ai', score: number): FinalResult => ({
    id,
    name: id === 'player' ? 'Mine' : id,
    type,
    strategyType: type === 'ai' ? 'speed' : undefined,
    score,
    marketShare: 20,
    revenue: 1000,
    satisfaction: 70,
    efficiency: 1,
    menuChanges: 0,
  });
  const awards: Awards = {
    revenue: 'player',
    satisfaction: 'ai-speed',
    efficiency: 'player',
    innovation: 'ai-speed',
  };

  it('celebrates a win with podium, results and awards', () => {
    const onReplay = vi.fn();
    const onTitle = vi.fn();
    const modal = new GameOverModal(onReplay, onTitle);
    modal.show(
      [result('player', 'player', 300), result('ai-speed', 'ai', 200), result('ai-x', 'ai', 100)],
      awards
    );
    expect(document.querySelector('.placement')?.textContent).toBe('You placed #1');
    expect(document.querySelector('.victory')).not.toBeNull();
    expect(document.querySelectorAll('.podium-step')).toHaveLength(3);
    expect(document.querySelectorAll('.result-row')).toHaveLength(3);
    expect(document.querySelectorAll('.award.is-player')).toHaveLength(2);
    (document.getElementById('replay-button') as HTMLButtonElement).click();
    expect(onReplay).toHaveBeenCalled();
    expect(modal.modal.is_open()).toBe(false);
  });

  it('shows the placement when losing and returns to title', () => {
    localization.set_language('ja');
    const onTitle = vi.fn();
    const modal = new GameOverModal(vi.fn(), onTitle);
    modal.show([result('ai-speed', 'ai', 300), result('player', 'player', 200)], awards);
    expect(document.querySelector('.placement')?.textContent).toBe('あなたは 2 位！');
    expect(document.querySelector('.victory')).toBeNull();
    expect(document.querySelectorAll('.podium-step')).toHaveLength(2);
    (document.getElementById('title-button') as HTMLButtonElement).click();
    expect(onTitle).toHaveBeenCalled();
  });
});

describe('TitleScreen', () => {
  function setup() {
    const container = document.createElement('main');
    document.body.append(container);
    const callbacks: TitleCallbacks = {
      onStart: vi.fn(),
      onContinue: vi.fn(),
      onTrack: vi.fn(),
      onLanguage: vi.fn(),
      onInteract: vi.fn(),
    };
    return { container, callbacks, title: new TitleScreen(container, callbacks) };
  }

  it('syncs settings and starts with sanitized options', () => {
    const { container, callbacks, title } = setup();
    title.sync(settings, true);
    expect((document.getElementById('restaurant-name') as HTMLInputElement).value).toBe('Bistro');
    expect(title.get_difficulty()).toBe('hard');
    expect((document.getElementById('continue-button') as HTMLButtonElement).hidden).toBe(false);
    (document.getElementById('restaurant-name') as HTMLInputElement).value = ' <Neko> ';
    (container.querySelector('form') as HTMLFormElement).dispatchEvent(
      new Event('submit', { cancelable: true })
    );
    expect(callbacks.onStart).toHaveBeenCalledWith({ name: 'Neko', difficulty: 'hard' });
  });

  it('falls back to the default name and normal difficulty', () => {
    const { title } = setup();
    expect(title.get_name()).toBe('Sakura Bistro');
    expect(title.get_difficulty()).toBe('normal');
    (document.querySelector('input[value="easy"]') as HTMLInputElement).click();
    expect(document.querySelector('.segment.active')?.textContent).toBe('Easy');
  });

  it('forwards language, continue, music and first interaction', () => {
    const { container, callbacks, title } = setup();
    title.sync({ ...settings, restaurantName: '' }, false);
    (container.querySelector('button[lang="ja"]') as HTMLButtonElement).click();
    expect(callbacks.onLanguage).toHaveBeenCalledWith('ja');
    (document.getElementById('continue-button') as HTMLButtonElement).click();
    expect(callbacks.onContinue).toHaveBeenCalled();
    (container.querySelector('input[value="kitchenBounce"]') as HTMLInputElement).click();
    expect(callbacks.onTrack).toHaveBeenCalledWith('kitchenBounce');
    container.dispatchEvent(new Event('pointerdown'));
    container.dispatchEvent(new Event('pointerdown'));
    expect(callbacks.onInteract).toHaveBeenCalledTimes(1);
    container.dispatchEvent(new KeyboardEvent('keydown'));
    expect(callbacks.onInteract).toHaveBeenCalledTimes(2);
    title.focus();
    expect(document.activeElement?.id).toBe('start-button');
  });
});
