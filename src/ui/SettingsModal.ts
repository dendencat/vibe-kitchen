import type { GraphicsQuality, Language, Settings } from '../types/UITypes';
import { h } from './dom';
import { Modal } from './Modal';
import { TrackPicker } from './TrackPicker';

export interface SettingsCallbacks {
  onTrack(id: string): void;
  onMusicVolume(volume: number): void;
  onSfxVolume(volume: number): void;
  onMute(muted: boolean): void;
  onQuality(quality: GraphicsQuality): void;
  onLanguage(language: Language): void;
  onResume(): void;
  onQuit(): void;
}

/**
 * Pause menu doubling as the settings screen (audio, graphics, language, shortcuts).
 */
export class SettingsModal {
  readonly modal: Modal;
  private readonly picker: TrackPicker;
  private readonly musicSlider: HTMLInputElement;
  private readonly sfxSlider: HTMLInputElement;
  private readonly muteBox: HTMLInputElement;
  private readonly qualityInputs = new Map<GraphicsQuality, HTMLInputElement>();
  private readonly languageButtons = new Map<Language, HTMLButtonElement>();
  private readonly quitButton: HTMLButtonElement;

  constructor(callbacks: SettingsCallbacks) {
    this.modal = new Modal('paused', 'settings-modal');
    this.modal.on_close(() => callbacks.onResume());
    this.picker = new TrackPicker(callbacks.onTrack);

    const slider = (id: string, onInput: (value: number) => void) =>
      h('input', {
        id,
        attrs: { type: 'range', min: '0', max: '100', step: '1' },
        on: { input: event => onInput(Number((event.target as HTMLInputElement).value) / 100) },
      });
    this.musicSlider = slider('music-volume', callbacks.onMusicVolume);
    this.sfxSlider = slider('sfx-volume', callbacks.onSfxVolume);
    this.muteBox = h('input', {
      id: 'mute-toggle',
      attrs: { type: 'checkbox' },
      on: { change: event => callbacks.onMute((event.target as HTMLInputElement).checked) },
    });

    const qualityRow = h('div', { className: 'segmented', attrs: { role: 'radiogroup' } });
    (['high', 'low'] as GraphicsQuality[]).forEach(quality => {
      const input = h('input', {
        className: 'visually-hidden',
        attrs: { type: 'radio', name: 'quality', value: quality },
        on: { change: () => callbacks.onQuality(quality) },
      });
      this.qualityInputs.set(quality, input);
      qualityRow.append(
        h('label', { className: 'segment' }, input, h('span', { i18n: `quality.${quality}` }))
      );
    });

    const languageRow = h('div', { className: 'segmented' });
    (
      [
        ['en', 'English'],
        ['ja', '日本語'],
      ] as Array<[Language, string]>
    ).forEach(([language, label]) => {
      const button = h('button', {
        className: 'segment-btn',
        text: label,
        attrs: { type: 'button', lang: language },
        on: { click: () => callbacks.onLanguage(language) },
      });
      this.languageButtons.set(language, button);
      languageRow.append(button);
    });

    const shortcuts = h(
      'dl',
      { className: 'shortcut-list' },
      ...(
        [
          ['Space / P', 'shortcuts.pause'],
          ['1 · 2 · 3', 'shortcuts.tabs'],
          ['M', 'shortcuts.mute'],
          ['Esc', 'shortcuts.close'],
        ] as const
      ).flatMap(([keys, label]) => [
        h('dt', {}, h('kbd', { text: keys })),
        h('dd', { i18n: label }),
      ])
    );

    this.quitButton = h('button', {
      className: 'btn btn-ghost',
      id: 'quit-button',
      i18n: 'quitToTitle',
      attrs: { type: 'button' },
      on: { click: () => callbacks.onQuit() },
    });

    const section = (titleKey: string, ...children: HTMLElement[]) =>
      h('section', { className: 'settings-section' }, h('h3', { i18n: titleKey }), ...children);

    this.modal.body.append(
      h(
        'div',
        { className: 'settings-grid' },
        section('music', this.picker.root),
        section(
          'settings',
          h('label', { className: 'field' }, h('span', { i18n: 'musicVolume' }), this.musicSlider),
          h('label', { className: 'field' }, h('span', { i18n: 'sfxVolume' }), this.sfxSlider),
          h('label', { className: 'check' }, this.muteBox, h('span', { i18n: 'mute' })),
          h('div', { className: 'field' }, h('span', { i18n: 'graphics' }), qualityRow),
          h('div', { className: 'field' }, h('span', { i18n: 'languageLabel' }), languageRow),
          h('div', { className: 'field' }, h('span', { i18n: 'shortcutsTitle' }), shortcuts)
        )
      ),
      h(
        'div',
        { className: 'modal-actions' },
        this.quitButton,
        h('button', {
          className: 'btn btn-primary',
          id: 'resume-button',
          i18n: 'resume',
          attrs: { type: 'button', autofocus: '' },
          on: { click: () => this.modal.close() },
        })
      )
    );
  }

  /**
   * Opens the menu reflecting current settings.
   * @param settings - Current settings.
   * @param inGame - Shows "quit to title" when true.
   */
  open(settings: Settings, inGame: boolean): void {
    this.sync(settings);
    this.quitButton.hidden = !inGame;
    this.modal.open();
  }

  /** Updates controls to match settings. */
  sync(settings: Settings): void {
    this.picker.set_value(settings.musicTrack);
    this.musicSlider.value = String(Math.round(settings.musicVolume * 100));
    this.sfxSlider.value = String(Math.round(settings.sfxVolume * 100));
    this.muteBox.checked = settings.muted;
    this.qualityInputs.forEach((input, quality) => {
      input.checked = quality === settings.quality;
      input.parentElement?.classList.toggle('active', input.checked);
    });
    this.languageButtons.forEach((button, language) => {
      button.setAttribute('aria-pressed', String(language === settings.language));
    });
  }
}
