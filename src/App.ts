import type { SoundEffect } from './audio/AudioManager';
import { TRACKS } from './audio/tracks';
import { SupportAI } from './ai/SupportAI';
import { GameEngine } from './game/GameEngine';
import { kitchen_level } from './game/Simulation';
import { LocalizationManager, localization } from './localization/Localization';
import type { FrameRect } from './three/SceneLayout';
import type { SceneOptions, SceneShopInfo } from './three/SceneRenderer';
import type {
  CampaignType,
  Difficulty,
  GameEvent,
  GameState,
  PlayerAction,
  Restaurant,
  StaffType,
} from './types/GameTypes';
import type { DockTab, GraphicsQuality, Language, Settings, ToastKind } from './types/UITypes';
import { ActionDock } from './ui/ActionDock';
import { AdvisorPanel } from './ui/AdvisorPanel';
import { DishModal } from './ui/DishModal';
import { by_id } from './ui/dom';
import { GameOverModal } from './ui/GameOverModal';
import { Hud } from './ui/Hud';
import { ADVICE_NAMING, restaurant_name } from './ui/naming';
import { RankingPanel } from './ui/RankingPanel';
import { RevenueChart } from './ui/RevenueChart';
import { SettingsModal } from './ui/SettingsModal';
import { TitleScreen } from './ui/TitleScreen';
import { Toasts } from './ui/Toasts';
import { CAMPAIGNS, GAME_CONSTANTS, STRATEGY_TYPES } from './utils/Constants';
import { MathUtils, type Rng } from './utils/MathUtils';
import { SafeStorage } from './utils/Storage';

export const SETTINGS_KEY = 'ai-restaurant-battle:settings';
export const SAVE_KEY = 'ai-restaurant-battle:save';

/** The subset of the 3D renderer the app relies on (fakeable in tests). */
export interface SceneLike {
  set_restaurants(list: SceneShopInfo[]): void;
  set_names(names: Record<string, string>): void;
  sync(state: GameState, progress: number): void;
  add_traffic(traffic: Array<{ served: number; lost: number }>): void;
  burst(id: string): void;
  set_mode(mode: 'title' | 'game'): void;
  set_paused(paused: boolean): void;
  select(id: string | null): void;
  set_quality(quality: GraphicsQuality): void;
  set_free_area(rect: FrameRect | null): void;
}

/** The subset of the audio manager the app relies on. */
export interface AudioLike {
  unlock(): boolean;
  set_track(id: string): void;
  set_music_volume(volume: number): void;
  set_sfx_volume(volume: number): void;
  set_muted(muted: boolean): void;
  play_sfx(effect: SoundEffect): void;
  suspend(): void;
  resume(): void;
}

export interface AppDeps {
  audio: AudioLike;
  createScene: (container: HTMLElement, options: SceneOptions) => SceneLike | null;
  storage?: SafeStorage;
  rng?: Rng;
  reducedMotion?: boolean;
  requestFrame?: (callback: (time: number) => void) => number;
}

/**
 * Default settings, using the browser language when it is Japanese.
 * @param browserLanguage - `navigator.language`.
 */
export function default_settings(browserLanguage = ''): Settings {
  return {
    language: browserLanguage.toLowerCase().startsWith('ja') ? 'ja' : 'en',
    musicTrack: TRACKS[0].id,
    musicVolume: 0.6,
    sfxVolume: 0.7,
    muted: false,
    quality: 'high',
    difficulty: 'normal',
    restaurantName: '',
  };
}

/**
 * Merges stored settings over defaults, discarding invalid values.
 * @param stored - Raw stored object.
 * @param defaults - Fallback values.
 */
export function sanitize_settings(stored: unknown, defaults: Settings): Settings {
  if (!stored || typeof stored !== 'object') return defaults;
  const raw = stored as Partial<Record<keyof Settings, unknown>>;
  const volume = (value: unknown, fallback: number) =>
    typeof value === 'number' && Number.isFinite(value) ? MathUtils.clamp(value, 0, 1) : fallback;
  const validTrack =
    typeof raw.musicTrack === 'string' &&
    (raw.musicTrack === 'off' || TRACKS.some(track => track.id === raw.musicTrack));
  return {
    language: LocalizationManager.is_language(raw.language) ? raw.language : defaults.language,
    musicTrack: validTrack ? (raw.musicTrack as string) : defaults.musicTrack,
    musicVolume: volume(raw.musicVolume, defaults.musicVolume),
    sfxVolume: volume(raw.sfxVolume, defaults.sfxVolume),
    muted: typeof raw.muted === 'boolean' ? raw.muted : defaults.muted,
    quality: raw.quality === 'low' || raw.quality === 'high' ? raw.quality : defaults.quality,
    difficulty: (['easy', 'normal', 'hard'] as const).includes(raw.difficulty as Difficulty)
      ? (raw.difficulty as Difficulty)
      : defaults.difficulty,
    restaurantName:
      typeof raw.restaurantName === 'string'
        ? raw.restaurantName.slice(0, 24)
        : defaults.restaurantName,
  };
}

/**
 * Wires the engine, 3D scene, UI components and audio together.
 */
export class App {
  private readonly storage: SafeStorage;
  private readonly settings: Settings;
  private readonly scene: SceneLike | null;
  private readonly title: TitleScreen;
  private readonly hud: Hud;
  private readonly ranking: RankingPanel;
  private readonly chart: RevenueChart;
  private readonly advisor: AdvisorPanel;
  private readonly dock: ActionDock;
  private readonly dishModal: DishModal;
  private readonly settingsModal: SettingsModal;
  private readonly gameOver: GameOverModal;
  private readonly toasts: Toasts;
  private readonly gameUi: HTMLElement;
  private readonly titleScreen: HTMLElement;
  private readonly requestFrame: (callback: (time: number) => void) => number;
  private engine: GameEngine | null = null;
  private unsubscribe: (() => void) | null = null;
  private supportAI = new SupportAI();
  private selectedId: string | null = null;
  private lastFrame: number | null = null;
  private lastOptions: { name: string; difficulty: Difficulty } | null = null;

  constructor(private readonly deps: AppDeps) {
    this.storage = deps.storage ?? new SafeStorage();
    this.requestFrame = deps.requestFrame ?? (callback => window.requestAnimationFrame(callback));
    this.settings = sanitize_settings(
      this.storage.read(SETTINGS_KEY),
      default_settings(navigator.language)
    );
    localization.set_language(this.settings.language);

    this.gameUi = by_id('game-ui');
    this.titleScreen = by_id('title-screen');
    this.toasts = new Toasts(by_id('toasts'));

    this.scene = deps.createScene(by_id('scene'), {
      quality: this.settings.quality,
      reducedMotion: !!deps.reducedMotion,
      onSelect: id => this.select(id),
    });
    by_id('scene-fallback').hidden = this.scene !== null;

    this.title = new TitleScreen(this.titleScreen, {
      onStart: options => this.start_game(options),
      onContinue: () => this.continue_game(),
      onTrack: id => this.change_track(id),
      onLanguage: language => this.change_language(language),
      onInteract: () => this.unlock_audio(),
    });
    this.hud = new Hud(by_id('hud'), {
      onPause: () => this.toggle_pause(),
      onSettings: () => this.open_settings(),
      onToggleMute: () => this.set_muted(!this.settings.muted),
    });
    const left = by_id('left-panel');
    this.ranking = new RankingPanel(left, id => this.select(id === this.selectedId ? null : id));
    this.chart = new RevenueChart(left);
    this.advisor = new AdvisorPanel(
      by_id('right-panel'),
      target => this.go_to_tab(target),
      () => this.select(null)
    );
    this.dock = new ActionDock(by_id('dock'), {
      onPriceChange: (itemId, price) =>
        this.perform(
          { type: 'menu', action: 'update_price', parameters: { itemId, price } },
          null,
          'click'
        ),
      onRemove: itemId => this.remove_dish(itemId),
      onAddDish: () => this.dishModal.open(),
      onCampaign: type => this.launch_campaign(type),
      onHire: type => this.hire(type),
      onUpgrade: () => this.upgrade(),
    });
    this.dishModal = new DishModal(draft =>
      this.perform(
        { type: 'menu', action: 'add_item', parameters: draft },
        localization.t('menuItemAdded', { name: draft.name }),
        'success'
      )
    );
    this.settingsModal = new SettingsModal({
      onTrack: id => this.change_track(id),
      onMusicVolume: volume => this.update_settings({ musicVolume: volume }),
      onSfxVolume: volume => this.update_settings({ sfxVolume: volume }),
      onMute: muted => this.set_muted(muted),
      onQuality: quality => this.update_settings({ quality }),
      onLanguage: language => this.change_language(language),
      onResume: () => this.resume(),
      onQuit: () => this.quit_to_title(),
    });
    this.gameOver = new GameOverModal(
      () => this.lastOptions && this.start_game(this.lastOptions),
      () => this.show_title()
    );

    localization.subscribe(() => this.on_language_changed());
    document.addEventListener('keydown', event => this.on_key(event));
    window.addEventListener('resize', () => this.update_free_area());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.deps.audio.suspend();
      else this.deps.audio.resume();
    });

    this.apply_audio_settings();
    this.hud.set_muted(this.settings.muted);
    this.scene?.set_restaurants(this.preview_restaurants());
    this.show_title();
    localization.apply_to_dom(document);
    this.requestFrame(time => this.frame(time));
  }

  /**
   * Tells the 3D scene which part of the screen is not covered by UI, so the
   * plaza is framed there (beside the title card / between the game panels).
   */
  update_free_area(): void {
    if (!this.scene) return;
    const width = window.innerWidth;
    const height = window.innerHeight;
    let rect: FrameRect | null = null;
    if (!this.titleScreen.hidden) {
      const card = this.title.root.getBoundingClientRect();
      rect =
        width > 900
          ? { x: card.right, y: 0, width: width - card.right, height }
          : { x: 0, y: 0, width, height: card.top };
    } else {
      const stage = by_id('stage').getBoundingClientRect();
      rect = { x: stage.left, y: stage.top, width: stage.width, height: stage.height };
    }
    this.scene.set_free_area(rect);
  }

  /** Current settings (copy). */
  get_settings(): Settings {
    return { ...this.settings };
  }

  /** Active engine (null on the title screen). */
  get_engine(): GameEngine | null {
    return this.engine;
  }

  /**
   * Starts a new game.
   * @param options - Restaurant name and difficulty.
   */
  start_game(options: { name: string; difficulty: Difficulty }): void {
    this.unlock_audio();
    this.lastOptions = options;
    this.update_settings({ restaurantName: options.name, difficulty: options.difficulty });
    this.storage.remove(SAVE_KEY);
    this.attach_engine(
      new GameEngine({
        playerName: options.name,
        difficulty: options.difficulty,
        rng: this.deps.rng,
        dishName: key => localization.t(`dishes.${key}`),
      })
    );
  }

  /** Resumes the autosaved game, if any. */
  continue_game(): void {
    this.unlock_audio();
    const engine = GameEngine.restore(this.storage.read(SAVE_KEY), { rng: this.deps.rng });
    if (!engine) {
      this.storage.remove(SAVE_KEY);
      this.title.sync(this.settings, false);
      return;
    }
    const player = engine.get_player();
    this.lastOptions = { name: player.name, difficulty: engine.get_state().difficulty };
    this.attach_engine(engine);
  }

  /** Pauses and opens the settings / pause menu. */
  open_settings(): void {
    const { engine } = this;
    if (!engine || engine.is_over()) return;
    this.pause(engine);
    this.settingsModal.open(this.settings, true);
  }

  /** Pause toggle (Space / P / HUD button). */
  toggle_pause(): void {
    if (!this.engine || this.engine.is_over()) return;
    if (this.settingsModal.modal.is_open()) {
      this.settingsModal.modal.close();
    } else {
      this.open_settings();
    }
  }

  /**
   * Opens a dock tab (used by advisor "Show me" and keyboard shortcuts).
   * @param tab - Tab to open.
   */
  go_to_tab(tab: DockTab): void {
    this.dock.select_tab(tab, true);
    this.deps.audio.play_sfx('click');
  }

  /**
   * Highlights a restaurant in the scene, ranking and intel card.
   * @param id - Restaurant id or null.
   */
  select(id: string | null): void {
    this.selectedId = id;
    this.scene?.select(id);
    if (this.engine) this.refresh_panels(this.engine.get_state());
  }

  /**
   * Advances one animation frame (public for tests).
   * @param time - High resolution timestamp in ms.
   */
  frame(time: number): void {
    const delta = this.lastFrame === null ? 0 : time - this.lastFrame;
    this.lastFrame = time;
    const { engine } = this;
    if (engine) {
      engine.update(delta);
      const state = engine.get_state();
      const progress = engine.get_day_progress();
      this.hud.update(state, engine.get_player(), progress);
      this.scene?.sync(state, progress);
    }
    this.requestFrame(next => this.frame(next));
  }

  private attach_engine(engine: GameEngine): void {
    this.unsubscribe?.();
    this.engine = engine;
    this.supportAI = new SupportAI(12, this.deps.rng);
    this.unsubscribe = engine.subscribe(event => this.on_game_event(event));
    this.selectedId = null;
    this.hud.reset();
    this.ranking.reset();
    this.chart.reset();
    this.advisor.reset();
    this.scene?.set_restaurants(
      engine.get_state().restaurants.map(r => ({
        id: r.id,
        name: restaurant_name(r),
        type: r.type,
        strategyType: r.strategyType,
      }))
    );
    this.scene?.set_mode('game');
    this.scene?.set_paused(false);
    this.scene?.select(null);
    this.titleScreen.hidden = true;
    this.gameUi.hidden = false;
    this.dock.select_tab('menu');
    this.hud.set_paused(false);
    this.refresh_panels(engine.get_state());
    this.update_free_area();
    this.chart.record(engine.get_state());
    this.chart.draw();
    this.toasts.show(
      localization.t('newDay', {
        day: engine.get_state().currentDay,
        weather: localization.t(`weather.${engine.get_state().weatherCondition}`),
      }),
      'info'
    );
    this.lastFrame = null;
  }

  private on_game_event(event: GameEvent): void {
    switch (event.type) {
      case 'tick':
        this.on_tick(event.state);
        break;
      case 'day-start':
        this.deps.audio.play_sfx('day');
        this.toasts.show(
          localization.t('newDay', {
            day: event.day,
            weather: localization.t(`weather.${event.weather}`),
          }),
          'info'
        );
        break;
      case 'market-event':
        this.deps.audio.play_sfx('event');
        this.toasts.show(
          `${localization.t(`events.${event.event.id}.name`)} — ${localization.t(
            `events.${event.event.id}.description`
          )}`,
          event.event.effect.customerMultiplier && event.event.effect.customerMultiplier < 1
            ? 'warning'
            : 'info',
          { duration: 4500 }
        );
        break;
      case 'action':
        if (event.result.ok && event.action.type !== 'menu') this.scene?.burst(event.restaurantId);
        break;
      default:
        this.storage.remove(SAVE_KEY);
        this.scene?.set_paused(true);
        this.deps.audio.play_sfx('fanfare');
        this.gameOver.show(event.results, event.awards);
    }
  }

  private on_tick(state: GameState): void {
    this.chart.record(state);
    this.chart.draw();
    this.scene?.add_traffic(
      state.restaurants.map(r => ({ served: r.lastServed, lost: r.lastLost }))
    );
    const advice = this.supportAI.generate_advice(
      state,
      localization.get_language(),
      ADVICE_NAMING
    );
    if (advice) this.advisor.push(advice);
    this.refresh_panels(state);
    if (
      state.elapsedSeconds % GAME_CONSTANTS.AUTOSAVE_INTERVAL_SECONDS === 0 &&
      this.engine &&
      !this.engine.is_over()
    ) {
      this.storage.write(SAVE_KEY, this.engine.snapshot());
    }
  }

  private refresh_panels(state: GameState): void {
    const player = state.restaurants.find(r => r.type === 'player') as Restaurant;
    this.ranking.update(state, this.selectedId);
    this.advisor.update_events(state.marketEvents);
    this.advisor.update_intel(state.restaurants.find(r => r.id === this.selectedId) ?? null, state);
    this.dock.update(player);
  }

  private perform(action: PlayerAction, successMessage: string | null, sfx: SoundEffect): boolean {
    const { engine } = this;
    if (!engine) return false;
    const result = engine.execute_action('player', action);
    if (result.ok) {
      this.deps.audio.play_sfx(sfx);
      if (successMessage) this.toast(successMessage, 'success');
      this.refresh_panels(engine.get_state());
    } else {
      this.deps.audio.play_sfx('error');
      this.toast(localization.t(result.reason as string), 'error');
    }
    return result.ok;
  }

  private remove_dish(itemId: string): void {
    const item = this.engine?.get_player().menu.find(i => i.id === itemId);
    if (!item) return;
    const draft = { name: item.name, price: item.price, cost: item.cost, cookTime: item.cookTime };
    const ok = this.perform(
      { type: 'menu', action: 'remove_item', parameters: { itemId } },
      null,
      'click'
    );
    if (ok) {
      this.toasts.show(localization.t('itemRemoved', { name: item.name }), 'info', {
        actionLabel: localization.t('undo'),
        onAction: () =>
          this.perform({ type: 'menu', action: 'add_item', parameters: draft }, null, 'success'),
        duration: 5000,
      });
    }
  }

  private launch_campaign(type: CampaignType): void {
    this.perform(
      {
        type: 'marketing',
        action: 'launch_campaign',
        parameters: { campaignType: type, budget: CAMPAIGNS[type].budget },
      },
      localization.t('campaignLaunched', { name: localization.t(`campaign.${type}.name`) }),
      'coin'
    );
  }

  private hire(type: StaffType): void {
    this.perform(
      { type: 'operations', action: 'hire_staff', parameters: { staffType: type } },
      localization.t('staffHired', { role: localization.t(`staffTypes.${type}`) }),
      'coin'
    );
  }

  private upgrade(): void {
    const ok = this.perform(
      { type: 'operations', action: 'upgrade_equipment', parameters: { equipmentType: 'kitchen' } },
      null,
      'success'
    );
    if (ok) {
      const level = kitchen_level((this.engine as GameEngine).get_player());
      this.toast(localization.t('equipmentUpgraded', { level }), 'success');
    }
  }

  private pause(engine: GameEngine): void {
    engine.pause();
    this.scene?.set_paused(true);
    this.hud.set_paused(true);
  }

  private resume(): void {
    if (!this.engine || this.engine.is_over()) return;
    this.engine.resume();
    this.scene?.set_paused(false);
    this.hud.set_paused(false);
    this.lastFrame = null;
  }

  private quit_to_title(): void {
    // Quit is only reachable from the in-game pause menu, so an engine exists.
    this.storage.write(SAVE_KEY, (this.engine as GameEngine).snapshot());
    this.unsubscribe?.();
    this.unsubscribe = null;
    this.engine = null;
    this.settingsModal.modal.close();
    this.show_title();
  }

  private show_title(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
    this.engine = null;
    this.gameUi.hidden = true;
    this.titleScreen.hidden = false;
    this.scene?.set_restaurants(this.preview_restaurants());
    this.scene?.set_mode('title');
    this.scene?.set_paused(false);
    this.scene?.select(null);
    this.title.sync(this.settings, GameEngine.is_snapshot(this.storage.read(SAVE_KEY)));
    this.title.focus();
    this.update_free_area();
  }

  private preview_restaurants(): SceneShopInfo[] {
    return [
      {
        id: 'player',
        name: this.settings.restaurantName || localization.t('defaultRestaurantName'),
        type: 'player',
      },
      ...STRATEGY_TYPES.map(type => ({
        id: `ai-${type}`,
        name: localization.t(`aiRestaurants.${type}`),
        type: 'ai' as const,
        strategyType: type,
      })),
    ];
  }

  private unlock_audio(): void {
    if (this.deps.audio.unlock()) this.deps.audio.set_track(this.settings.musicTrack);
  }

  private change_track(id: string): void {
    this.update_settings({ musicTrack: id });
    this.unlock_audio();
    this.deps.audio.set_track(id);
    this.title.sync(this.settings, GameEngine.is_snapshot(this.storage.read(SAVE_KEY)));
    this.settingsModal.sync(this.settings);
  }

  private change_language(language: Language): void {
    this.update_settings({ language });
    localization.set_language(language);
  }

  private set_muted(muted: boolean): void {
    this.update_settings({ muted });
    this.hud.set_muted(muted);
  }

  private update_settings(patch: Partial<Settings>): void {
    Object.assign(this.settings, patch);
    this.storage.write(SETTINGS_KEY, this.settings);
    this.apply_audio_settings();
    if (patch.quality) this.scene?.set_quality(patch.quality);
    this.settingsModal.sync(this.settings);
  }

  private apply_audio_settings(): void {
    this.deps.audio.set_music_volume(this.settings.musicVolume);
    this.deps.audio.set_sfx_volume(this.settings.sfxVolume);
    this.deps.audio.set_muted(this.settings.muted);
  }

  private on_language_changed(): void {
    localization.apply_to_dom(document);
    this.hud.set_muted(this.settings.muted);
    this.hud.set_paused(!!this.engine?.is_paused());
    const restaurants = this.engine?.get_state().restaurants;
    const names = Object.fromEntries(
      restaurants
        ? restaurants.map(r => [r.id, restaurant_name(r)])
        : this.preview_restaurants().map(r => [r.id, r.name])
    );
    this.scene?.set_names(names);
    this.title.sync(this.settings, GameEngine.is_snapshot(this.storage.read(SAVE_KEY)));
    if (this.engine) this.refresh_panels(this.engine.get_state());
  }

  private toast(message: string, kind: ToastKind): void {
    this.toasts.show(message, kind);
  }

  private on_key(event: KeyboardEvent): void {
    const target = event.target as HTMLElement | null;
    if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const playing = !!this.engine && !this.engine.is_over() && !this.gameOver.modal.is_open();
    const blockingModal = this.dishModal.modal.is_open();
    switch (event.key) {
      case ' ':
      case 'p':
      case 'P':
        if (!playing || blockingModal || target?.tagName === 'BUTTON') return;
        event.preventDefault();
        this.toggle_pause();
        break;
      case 'm':
      case 'M':
        this.set_muted(!this.settings.muted);
        break;
      case '1':
      case '2':
      case '3':
        if (!playing || blockingModal || this.settingsModal.modal.is_open()) return;
        this.go_to_tab((['menu', 'marketing', 'operations'] as DockTab[])[Number(event.key) - 1]);
        break;
      default:
    }
  }
}
