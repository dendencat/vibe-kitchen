import type { Difficulty } from '../types/GameTypes';
import type { Language, Settings } from '../types/UITypes';
import { SecurityValidator } from '../utils/SecurityValidator';
import { localization } from '../localization/Localization';
import { h } from './dom';
import { TrackPicker } from './TrackPicker';

export interface TitleCallbacks {
  onStart(options: { name: string; difficulty: Difficulty }): void;
  onContinue(): void;
  onTrack(id: string): void;
  onLanguage(language: Language): void;
  /** First interaction anywhere on the title (unlocks audio). */
  onInteract(): void;
}

const DIFFICULTIES: Difficulty[] = ['easy', 'normal', 'hard'];

/**
 * Title screen: name your restaurant, pick difficulty and music, start.
 */
export class TitleScreen {
  readonly root: HTMLElement;
  private readonly nameInput: HTMLInputElement;
  private readonly difficultyInputs = new Map<Difficulty, HTMLInputElement>();
  private readonly continueButton: HTMLButtonElement;
  private readonly picker: TrackPicker;
  private readonly languageButtons = new Map<Language, HTMLButtonElement>();

  constructor(container: HTMLElement, callbacks: TitleCallbacks) {
    this.picker = new TrackPicker(callbacks.onTrack);
    this.nameInput = h('input', {
      id: 'restaurant-name',
      attrs: { type: 'text', maxlength: '24', autocomplete: 'off', spellcheck: 'false' },
    });

    const difficultyRow = h('div', { className: 'segmented', attrs: { role: 'radiogroup' } });
    DIFFICULTIES.forEach(difficulty => {
      const input = h('input', {
        className: 'visually-hidden',
        attrs: { type: 'radio', name: 'difficulty', value: difficulty },
        on: { change: () => this.sync_segments() },
      });
      this.difficultyInputs.set(difficulty, input);
      difficultyRow.append(
        h('label', { className: 'segment' }, input, h('span', { i18n: `difficulty.${difficulty}` }))
      );
    });

    const languageRow = h('div', { className: 'lang-toggle', attrs: { role: 'group' } });
    (
      [
        ['en', 'EN'],
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

    this.continueButton = h('button', {
      className: 'btn btn-ghost btn-lg',
      id: 'continue-button',
      i18n: 'continueGame',
      attrs: { type: 'button', hidden: '' },
      on: { click: () => callbacks.onContinue() },
    });

    const form = h(
      'form',
      {
        className: 'title-form',
        on: {
          submit: event => {
            event.preventDefault();
            callbacks.onStart({ name: this.get_name(), difficulty: this.get_difficulty() });
          },
        },
      },
      h(
        'label',
        { className: 'field' },
        h('span', { i18n: 'restaurantNameLabel' }),
        this.nameInput
      ),
      h('div', { className: 'field' }, h('span', { i18n: 'difficultyLabel' }), difficultyRow),
      h('div', { className: 'field' }, h('span', { i18n: 'bgmLabel' }), this.picker.root),
      h(
        'div',
        { className: 'title-actions' },
        h('button', {
          className: 'btn btn-primary btn-xl',
          id: 'start-button',
          i18n: 'startGame',
          attrs: { type: 'submit' },
        }),
        this.continueButton
      )
    );

    this.root = h(
      'section',
      { className: 'title-card glass', attrs: { 'aria-labelledby': 'title-heading' } },
      h(
        'header',
        { className: 'title-header' },
        h('span', { className: 'brand-mark', text: '🌸', attrs: { 'aria-hidden': 'true' } }),
        h(
          'div',
          {},
          h('h1', { id: 'title-heading', className: 'game-title', i18n: 'gameTitle' }),
          h('p', { className: 'tagline', i18n: 'tagline' })
        ),
        languageRow
      ),
      form,
      h(
        'details',
        { className: 'how-to' },
        h('summary', { i18n: 'howToPlay' }),
        h('p', { i18n: 'storyText' }),
        h(
          'ul',
          {},
          ...['goal', 'menu', 'marketing', 'operations'].map(key =>
            h('li', { i18n: `howTo.${key}` })
          )
        )
      )
    );
    container.append(this.root);
    container.addEventListener('pointerdown', () => callbacks.onInteract(), { once: true });
    container.addEventListener('keydown', () => callbacks.onInteract(), { once: true });
  }

  /**
   * Fills the form from saved settings.
   * @param settings - Persisted settings.
   * @param hasSave - Whether "continue" is available.
   */
  sync(settings: Settings, hasSave: boolean): void {
    if (!this.nameInput.value) this.nameInput.value = settings.restaurantName;
    this.nameInput.placeholder = localization.t('defaultRestaurantName');
    (this.difficultyInputs.get(settings.difficulty) as HTMLInputElement).checked = true;
    this.picker.set_value(settings.musicTrack);
    this.continueButton.hidden = !hasSave;
    this.languageButtons.forEach((button, language) =>
      button.setAttribute('aria-pressed', String(language === settings.language))
    );
    this.sync_segments();
  }

  /** Sanitized restaurant name (falls back to the localized default). */
  get_name(): string {
    return (
      SecurityValidator.sanitize_input(this.nameInput.value, 24) ||
      localization.t('defaultRestaurantName')
    );
  }

  /** Selected difficulty. */
  get_difficulty(): Difficulty {
    return DIFFICULTIES.find(d => this.difficultyInputs.get(d)?.checked) ?? 'normal';
  }

  /** Focuses the primary button. */
  focus(): void {
    this.root.querySelector<HTMLButtonElement>('#start-button')?.focus({ preventScroll: true });
  }

  private sync_segments(): void {
    this.difficultyInputs.forEach(input =>
      input.parentElement?.classList.toggle('active', input.checked)
    );
  }
}
