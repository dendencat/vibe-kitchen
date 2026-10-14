import { describe, expect, it, vi, type Mock } from 'vitest';
import {
  App,
  default_settings,
  sanitize_settings,
  SAVE_KEY,
  SETTINGS_KEY,
  type AudioLike,
  type SceneLike,
} from './App';
import { GameEngine } from './game/GameEngine';
import { localization } from './localization/Localization';
import { SafeStorage } from './utils/Storage';

const SKELETON = `
  <div id="scene"></div>
  <p id="scene-fallback" hidden></p>
  <main id="title-screen"></main>
  <div id="game-ui" hidden>
    <header id="hud"></header>
    <div id="stage"></div>
    <aside id="left-panel"></aside>
    <aside id="right-panel"></aside>
    <section id="dock"></section>
  </div>
  <div id="toasts"></div>`;

type Fake<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => infer R ? Mock<(...args: A) => R> : T[K];
};

function fake_scene(): Fake<SceneLike> {
  return {
    set_restaurants: vi.fn(),
    set_names: vi.fn(),
    sync: vi.fn(),
    add_traffic: vi.fn(),
    burst: vi.fn(),
    set_mode: vi.fn(),
    set_paused: vi.fn(),
    select: vi.fn(),
    set_quality: vi.fn(),
    set_free_area: vi.fn(),
  };
}

function fake_audio(): Fake<AudioLike> {
  return {
    unlock: vi.fn(() => true),
    set_track: vi.fn(),
    set_music_volume: vi.fn(),
    set_sfx_volume: vi.fn(),
    set_muted: vi.fn(),
    play_sfx: vi.fn(),
    suspend: vi.fn(),
    resume: vi.fn(),
  };
}

function boot(options: { scene?: SceneLike | null; rng?: () => number; settings?: object } = {}) {
  document.body.innerHTML = SKELETON;
  if (options.settings) window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(options.settings));
  const scene = options.scene === undefined ? fake_scene() : options.scene;
  const audio = fake_audio();
  const frames: Array<(time: number) => void> = [];
  const app = new App({
    audio,
    createScene: () => scene,
    rng: options.rng ?? (() => 0.99),
    requestFrame: callback => frames.push(callback),
  });
  return { app, scene: scene as Fake<SceneLike>, audio, frames };
}

const $ = <T extends HTMLElement = HTMLElement>(selector: string) =>
  document.querySelector(selector) as T;
const click = (selector: string) => $<HTMLButtonElement>(selector).click();
const key = (k: string, init: KeyboardEventInit = {}, target: EventTarget = document.body) =>
  target.dispatchEvent(
    new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...init })
  );
const start = () =>
  ($('.title-form') as HTMLFormElement).dispatchEvent(new Event('submit', { cancelable: true }));

/** Runs simulated seconds through the app's frame loop. */
function play(app: App, seconds: number, from = 0) {
  app.frame(from);
  for (let i = 1; i <= seconds; i++) app.frame(from + i * 1000);
  return from + seconds * 1000;
}

describe('settings helpers', () => {
  it('defaults to Japanese for Japanese browsers', () => {
    expect(default_settings('ja-JP').language).toBe('ja');
    expect(default_settings('en-US').language).toBe('en');
    expect(default_settings().musicTrack).toBe('sakuraPop');
  });

  it('sanitizes stored settings', () => {
    const defaults = default_settings();
    expect(sanitize_settings(null, defaults)).toBe(defaults);
    expect(
      sanitize_settings(
        {
          language: 'xx',
          musicTrack: 'nope',
          musicVolume: 5,
          sfxVolume: 'x',
          muted: 'yes',
          quality: 'ultra',
          difficulty: 'insane',
          restaurantName: 42,
        },
        defaults
      )
    ).toEqual({ ...defaults, musicVolume: 1 });
    expect(
      sanitize_settings(
        {
          language: 'ja',
          musicTrack: 'off',
          musicVolume: 0.2,
          sfxVolume: 0.1,
          muted: true,
          quality: 'low',
          difficulty: 'easy',
          restaurantName: 'x'.repeat(40),
        },
        defaults
      )
    ).toEqual({
      language: 'ja',
      musicTrack: 'off',
      musicVolume: 0.2,
      sfxVolume: 0.1,
      muted: true,
      quality: 'low',
      difficulty: 'easy',
      restaurantName: 'x'.repeat(24),
    });
  });
});

describe('App', () => {
  it('boots to the title screen with a 3D preview', () => {
    const { app, scene, audio, frames } = boot({ settings: { language: 'ja', muted: true } });
    expect($('#title-screen').hidden).toBe(false);
    expect($('#game-ui').hidden).toBe(true);
    expect($('#scene-fallback').hidden).toBe(true);
    expect(scene.set_restaurants).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ id: 'player' })])
    );
    expect(scene.set_mode).toHaveBeenLastCalledWith('title');
    expect(scene.set_free_area).toHaveBeenCalled();
    expect(audio.set_muted).toHaveBeenCalledWith(true);
    expect(document.documentElement.lang).toBe('ja');
    expect(app.get_engine()).toBeNull();
    expect(app.get_settings().language).toBe('ja');
    expect(frames).toHaveLength(1);
    frames[0](16);
    expect(frames).toHaveLength(2);
    frames[1](32);
    expect(frames).toHaveLength(3);
    app.select('ai-speed');
    expect($('.rival-intel').hidden).toBe(true);
  });

  it('uses requestAnimationFrame by default', () => {
    document.body.innerHTML = SKELETON;
    const raf = vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(1);
    new App({ audio: fake_audio(), createScene: () => null });
    expect(raf).toHaveBeenCalled();
  });

  it('ignores control callbacks once back on the title screen', () => {
    const { app } = boot();
    start();
    const dish = app.get_engine()!.get_player().menu[0].id;
    click('#settings-button');
    click('#quit-button');
    click('#hire-chef');
    $<HTMLButtonElement>(`[data-item-id="${dish}"] .remove-dish`).click();
    expect(app.get_engine()).toBeNull();
  });

  it('shows a fallback when 3D is unavailable', () => {
    const { app } = boot({ scene: null });
    expect($('#scene-fallback').hidden).toBe(false);
    start();
    play(app, 2);
    app.update_free_area();
    expect(app.get_engine()?.get_state().elapsedSeconds).toBe(2);
  });

  it('starts a game from the title form', () => {
    const { app, scene, audio } = boot();
    ($('#restaurant-name') as HTMLInputElement).value = 'Neko Diner';
    start();
    const engine = app.get_engine() as GameEngine;
    expect(engine.get_player().name).toBe('Neko Diner');
    expect($('#game-ui').hidden).toBe(false);
    expect($('#title-screen').hidden).toBe(true);
    expect(scene.set_mode).toHaveBeenLastCalledWith('game');
    expect(audio.unlock).toHaveBeenCalled();
    expect(audio.set_track).toHaveBeenCalledWith('sakuraPop');
    expect(app.get_settings().restaurantName).toBe('Neko Diner');
    expect($('#toasts').textContent).toContain('Day 1');
  });

  it('runs the loop: ticks, HUD, chart, crowd and advice', () => {
    const { app, scene } = boot();
    start();
    play(app, 13);
    expect(app.get_engine()?.get_state().elapsedSeconds).toBe(13);
    expect(scene.sync).toHaveBeenCalled();
    expect(scene.add_traffic).toHaveBeenCalledTimes(13);
    expect($('.day-label').textContent).toBe('Day 1 / 7');
    expect(document.querySelectorAll('.bubble').length).toBeGreaterThan(1);
    expect(document.querySelectorAll('.ranking-row')).toHaveLength(6);
  });

  it('performs player actions with feedback', () => {
    const { app, audio, scene } = boot();
    start();
    click('#tab-marketing');
    click('#campaign-tv');
    expect(audio.play_sfx).toHaveBeenCalledWith('coin');
    expect(scene.burst).toHaveBeenCalledWith('player');
    expect($('#toasts').textContent).toContain('TV commercial launched!');
    click('#hire-chef');
    click('#hire-waiter');
    expect(app.get_engine()?.get_player().staff).toHaveLength(4);
    click('#upgrade-kitchen');
    expect($('#toasts').textContent).toContain('Kitchen upgraded to Lv 2!');

    const player = app.get_engine()!.get_player();
    player.cash = 0;
    $<HTMLButtonElement>('#campaign-social').disabled = false;
    click('#campaign-social');
    expect(audio.play_sfx).toHaveBeenCalledWith('error');
    expect($('#toasts').textContent).toContain('Not enough cash');
    $<HTMLButtonElement>('#upgrade-kitchen').disabled = false;
    click('#upgrade-kitchen');
    expect(player.equipment[0].level).toBe(2);
  });

  it('edits the menu: price, add, remove and undo', () => {
    const { app } = boot();
    start();
    const player = app.get_engine()!.get_player();
    const first = player.menu[0];
    $<HTMLButtonElement>(`[data-item-id="${first.id}"] .step-btn:last-child`).click();
    expect(first.price).toBe(13.49);

    click('#add-dish-button');
    ($('#dish-name') as HTMLInputElement).value = 'Gyoza';
    ($('.dish-form') as HTMLFormElement).dispatchEvent(new Event('submit', { cancelable: true }));
    expect(player.menu.map(i => i.name)).toContain('Gyoza');
    expect($('#toasts').textContent).toContain('Gyoza is on the menu!');

    const gyoza = player.menu.find(i => i.name === 'Gyoza')!;
    $<HTMLButtonElement>(`[data-item-id="${gyoza.id}"] .remove-dish`).click();
    expect(player.menu.map(i => i.name)).not.toContain('Gyoza');
    click('.toast-action');
    expect(player.menu.map(i => i.name)).toContain('Gyoza');

    player.menu.splice(1);
    const last = player.menu[0];
    $<HTMLButtonElement>(`[data-item-id="${last.id}"] .remove-dish`)?.click();
    expect(player.menu).toHaveLength(1);
  });

  it('handles keyboard shortcuts', () => {
    const { app, audio } = boot();
    start();
    key('2');
    expect($('#tab-marketing').getAttribute('aria-selected')).toBe('true');
    key('p');
    expect(app.get_engine()?.is_paused()).toBe(true);
    expect($('.settings-modal').closest('.modal-backdrop')?.hasAttribute('hidden')).toBe(false);
    key('3');
    expect($('#tab-marketing').getAttribute('aria-selected')).toBe('true');
    key(' ');
    expect(app.get_engine()?.is_paused()).toBe(false);
    key('m');
    expect(audio.set_muted).toHaveBeenLastCalledWith(true);
    expect($('#mute-button').textContent).toBe('🔇');
    key('M');
    expect(audio.set_muted).toHaveBeenLastCalledWith(false);
    key('p', { ctrlKey: true });
    key('p', {}, $('#restaurant-name'));
    key('p', {}, $('#tab-menu'));
    key('x');
    expect(app.get_engine()?.is_paused()).toBe(false);

    click('#add-dish-button');
    key('1');
    key('P');
    expect(app.get_engine()?.is_paused()).toBe(false);
  });

  it('ignores game shortcuts on the title screen', () => {
    const { app } = boot();
    key('p');
    key('1');
    app.toggle_pause();
    app.open_settings();
    expect($('.settings-modal').closest('.modal-backdrop')?.hasAttribute('hidden')).toBe(true);
  });

  it('opens settings from the HUD and applies changes', () => {
    const { app, audio, scene } = boot();
    start();
    click('#settings-button');
    expect(app.get_engine()?.is_paused()).toBe(true);
    expect(scene.set_paused).toHaveBeenLastCalledWith(true);
    const music = $('#music-volume') as HTMLInputElement;
    music.value = '20';
    music.dispatchEvent(new Event('input'));
    expect(audio.set_music_volume).toHaveBeenLastCalledWith(0.2);
    const sfx = $('#sfx-volume') as HTMLInputElement;
    sfx.value = '30';
    sfx.dispatchEvent(new Event('input'));
    expect(audio.set_sfx_volume).toHaveBeenLastCalledWith(0.3);
    ($('#mute-toggle') as HTMLInputElement).click();
    expect(audio.set_muted).toHaveBeenLastCalledWith(true);
    ($('input[value="low"]') as HTMLInputElement).click();
    expect(scene.set_quality).toHaveBeenCalledWith('low');
    ($('.settings-modal input[value="lunchRush"]') as HTMLInputElement).click();
    expect(audio.set_track).toHaveBeenLastCalledWith('lunchRush');
    expect(JSON.parse(window.localStorage.getItem(SETTINGS_KEY)!).musicTrack).toBe('lunchRush');
    click('#pause-button');
    expect(app.get_engine()?.is_paused()).toBe(false);
  });

  it('switches language everywhere', () => {
    const { app, scene } = boot();
    click('#title-screen button[lang="ja"]');
    expect($('#start-button').textContent).toBe('お店をオープン');
    expect(scene.set_names).toHaveBeenCalledWith(
      expect.objectContaining({ 'ai-speed': 'ライトニングキッチン' })
    );
    start();
    click('#settings-button');
    click('.settings-modal button[lang="en"]');
    expect($('#resume-button').textContent).toBe('Resume');
    expect(scene.set_names).toHaveBeenLastCalledWith(
      expect.objectContaining({ 'ai-speed': 'Lightning Kitchen' })
    );
    expect(app.get_settings().language).toBe('en');
  });

  it('selects shops clicked in the 3D scene and toggles mute from the HUD', () => {
    document.body.innerHTML = SKELETON;
    const scene = fake_scene();
    const audio = fake_audio();
    let onSelect: (id: string | null) => void = () => undefined;
    const app = new App({
      audio,
      createScene: (_container, options) => {
        onSelect = options.onSelect;
        return scene;
      },
      requestFrame: () => 0,
    });
    start();
    onSelect('ai-speed');
    expect(scene.select).toHaveBeenLastCalledWith('ai-speed');
    click('#mute-button');
    expect(audio.set_muted).toHaveBeenLastCalledWith(true);
    expect(app.get_settings().muted).toBe(true);
  });

  it('previews music from the title screen', () => {
    const { audio } = boot();
    ($('#title-screen input[value="neonDiner"]') as HTMLInputElement).click();
    expect(audio.set_track).toHaveBeenLastCalledWith('neonDiner');
  });

  it('selects rivals from the ranking and the scene', () => {
    const { app, scene } = boot();
    start();
    play(app, 1);
    const row = [...document.querySelectorAll<HTMLButtonElement>('.ranking-row')].find(r =>
      r.textContent?.includes('Fire Grill')
    )!;
    row.click();
    expect(scene.select).toHaveBeenLastCalledWith('ai-aggressive');
    expect($('.rival-intel').hidden).toBe(false);
    row.click();
    expect(scene.select).toHaveBeenLastCalledWith(null);
    app.select('ai-speed');
    click('.intel-header button');
    expect($('.rival-intel').hidden).toBe(true);
  });

  it('follows advisor suggestions to a tab', () => {
    const { app } = boot();
    start();
    play(app, 1);
    app.go_to_tab('operations');
    expect($('#tab-operations').getAttribute('aria-selected')).toBe('true');
    const go = document.querySelector<HTMLButtonElement>('.bubble-go');
    go?.click();
  });

  it('autosaves, quits to title and continues', () => {
    const { app } = boot();
    start();
    play(app, 30);
    expect(GameEngine.is_snapshot(new SafeStorage().read(SAVE_KEY))).toBe(true);
    play(app, 5, 31000);
    click('#settings-button');
    click('#quit-button');
    expect(app.get_engine()).toBeNull();
    expect($('#title-screen').hidden).toBe(false);
    expect($('#continue-button').hidden).toBe(false);
    click('#continue-button');
    expect(app.get_engine()?.get_state().elapsedSeconds).toBe(36);
    app.update_free_area();
  });

  it('discards a corrupt save on continue', () => {
    const { app } = boot();
    window.localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({ version: 2, state: { restaurants: [] } })
    );
    app.continue_game();
    expect(app.get_engine()).toBeNull();
    expect(window.localStorage.getItem(SAVE_KEY)).toBeNull();
    expect($('#continue-button').hidden).toBe(true);
  });

  it('announces days and market events, and celebrates the end', () => {
    const { app, audio, scene } = boot({ rng: () => 0 });
    start();
    play(app, 61);
    expect(audio.play_sfx).toHaveBeenCalledWith('event');
    expect(audio.play_sfx).toHaveBeenCalledWith('day');
    expect($('#toasts').textContent).toMatch(/Day 2|Rainy day|Local festival/);
    expect(scene.burst).toHaveBeenCalled();

    const engine = app.get_engine()!;
    while (!engine.is_over()) engine.tick();
    expect(audio.play_sfx).toHaveBeenCalledWith('fanfare');
    expect($('.gameover-modal').closest('.modal-backdrop')?.hasAttribute('hidden')).toBe(false);
    expect(window.localStorage.getItem(SAVE_KEY)).toBeNull();
    app.open_settings();
    click('#replay-button');
    expect(app.get_engine()).not.toBe(engine);
    expect(app.get_engine()?.get_state().elapsedSeconds).toBe(0);
  });

  it('returns to the title after the game', () => {
    const { app } = boot();
    start();
    const engine = app.get_engine()!;
    while (!engine.is_over()) engine.tick();
    click('#title-button');
    expect(app.get_engine()).toBeNull();
    expect($('#title-screen').hidden).toBe(false);
  });

  it('frames the scene beside the title card on narrow screens', () => {
    const { app, scene } = boot();
    const width = window.innerWidth;
    Object.defineProperty(window, 'innerWidth', { value: 600, configurable: true });
    app.update_free_area();
    window.dispatchEvent(new Event('resize'));
    expect(scene.set_free_area).toHaveBeenLastCalledWith(
      expect.objectContaining({ x: 0, y: 0, width: 600 })
    );
    Object.defineProperty(window, 'innerWidth', { value: width, configurable: true });
  });

  it('suspends audio when the tab is hidden', () => {
    const { audio } = boot();
    Object.defineProperty(document, 'hidden', { value: true, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    expect(audio.suspend).toHaveBeenCalled();
    Object.defineProperty(document, 'hidden', { value: false, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    expect(audio.resume).toHaveBeenCalled();
  });

  it('keeps music silent when audio cannot unlock', () => {
    const { audio } = boot();
    audio.unlock.mockReturnValue(false);
    audio.set_track.mockClear();
    $('#title-screen').dispatchEvent(new Event('pointerdown'));
    expect(audio.set_track).not.toHaveBeenCalled();
    localization.set_language('en');
  });
});
