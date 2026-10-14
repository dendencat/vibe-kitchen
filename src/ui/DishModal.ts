import { localization } from '../localization/Localization';
import type { MenuItemDraft } from '../types/GameTypes';
import { DISH_PRESETS } from '../utils/Constants';
import { MathUtils } from '../utils/MathUtils';
import { SecurityValidator } from '../utils/SecurityValidator';
import { h, set_text } from './dom';
import { Modal } from './Modal';

/**
 * "Add dish" dialog with quick-pick presets, inline validation and a live margin preview.
 */
export class DishModal {
  readonly modal: Modal;
  private readonly form: HTMLFormElement;
  private readonly nameInput: HTMLInputElement;
  private readonly priceInput: HTMLInputElement;
  private readonly costInput: HTMLInputElement;
  private readonly cookInput: HTMLInputElement;
  private readonly cookValue: HTMLElement;
  private readonly preview: HTMLElement;
  private readonly error: HTMLElement;

  /**
   * @param onSubmit - Receives a validated draft; return false to keep the dialog open.
   */
  constructor(private readonly onSubmit: (draft: MenuItemDraft) => boolean) {
    this.modal = new Modal('addNewMenuItem', 'dish-modal');
    const input = (id: string, type: string, attrs: Record<string, string>) =>
      h('input', { id, attrs: { type, required: '', ...attrs } });

    this.nameInput = input('dish-name', 'text', {
      maxlength: '40',
      autocomplete: 'off',
      autofocus: '',
    });
    this.priceInput = input('dish-price', 'number', {
      min: '1',
      max: '1000',
      step: '0.01',
      inputmode: 'decimal',
    });
    this.costInput = input('dish-cost', 'number', {
      min: '0.1',
      max: '500',
      step: '0.01',
      inputmode: 'decimal',
    });
    this.cookInput = input('dish-cook', 'range', { min: '1', max: '60', step: '1' });
    this.cookValue = h('output', { className: 'range-value', attrs: { for: 'dish-cook' } });
    this.preview = h('div', { className: 'margin-preview', attrs: { 'aria-live': 'polite' } });
    this.error = h('p', { className: 'form-error', attrs: { role: 'alert' } });

    const presets = h(
      'div',
      { className: 'chip-row' },
      ...DISH_PRESETS.map(preset =>
        h('button', {
          className: 'chip',
          text: localization.t(`dishes.${preset.key}`),
          dataset: { i18n: `dishes.${preset.key}` },
          attrs: { type: 'button' },
          on: { click: () => this.fill(preset) },
        })
      )
    );

    const field = (labelKey: string, control: HTMLElement, extra?: HTMLElement) =>
      h('label', { className: 'field' }, h('span', { i18n: labelKey }), control, extra);

    this.form = h(
      'form',
      {
        className: 'dish-form',
        attrs: { novalidate: '' },
        on: {
          submit: event => {
            event.preventDefault();
            this.submit();
          },
          input: () => this.refresh(),
        },
      },
      h('div', { className: 'field' }, h('span', { i18n: 'presets' }), presets),
      field('dishName', this.nameInput),
      h(
        'div',
        { className: 'field-row' },
        field('price', this.priceInput),
        field('cost', this.costInput)
      ),
      field('cookTime', this.cookInput, this.cookValue),
      this.preview,
      this.error,
      h(
        'div',
        { className: 'modal-actions' },
        h('button', {
          className: 'btn btn-ghost',
          i18n: 'cancel',
          attrs: { type: 'button' },
          on: { click: () => this.modal.close() },
        }),
        h('button', {
          className: 'btn btn-primary',
          id: 'dish-submit',
          i18n: 'addItem',
          attrs: { type: 'submit' },
        })
      )
    );
    this.modal.body.append(this.form);
  }

  /** Opens the dialog with a fresh form. */
  open(): void {
    this.form.reset();
    this.fill(DISH_PRESETS[0]);
    this.nameInput.value = '';
    set_text(this.error, '');
    this.refresh();
    this.modal.open();
  }

  /**
   * Fills the form from a preset.
   * @param preset - Preset values.
   */
  fill(preset: { key: string; price: number; cost: number; cookTime: number }): void {
    this.nameInput.value = localization.t(`dishes.${preset.key}`);
    this.priceInput.value = preset.price.toFixed(2);
    this.costInput.value = preset.cost.toFixed(2);
    this.cookInput.value = String(preset.cookTime);
    this.refresh();
  }

  /** Validates and submits the form. */
  submit(): void {
    try {
      const draft = SecurityValidator.validate_menu_item_input({
        name: this.nameInput.value,
        price: this.priceInput.value,
        cost: this.costInput.value,
        cookTime: this.cookInput.value,
      });
      if (this.onSubmit(draft)) this.modal.close();
    } catch (error) {
      set_text(this.error, this.error_message(error));
      this.form.querySelector<HTMLInputElement>('[aria-invalid="true"]')?.focus();
    }
  }

  private refresh(): void {
    set_text(this.cookValue, `${this.cookInput.value}s`);
    const price = Number(this.priceInput.value);
    const cost = Number(this.costInput.value);
    const valid = price > 0 && cost > 0;
    const margin = valid ? MathUtils.calculate_profit_margin(price, cost) : 0;
    set_text(
      this.preview,
      valid ? localization.t('marginPreview', { margin: Math.round(margin) }) : ''
    );
    this.preview.classList.toggle('negative', valid && margin < 20);
    this.nameInput.setAttribute(
      'aria-invalid',
      String(SecurityValidator.sanitize_input(this.nameInput.value).length === 0)
    );
    this.costInput.setAttribute('aria-invalid', String(valid && cost >= price));
    set_text(this.error, '');
  }

  private error_message(error: unknown): string {
    const { message } = error as Error;
    if (message.startsWith('Dish name')) return localization.t('errors.nameRequired');
    if (message.startsWith('Cost must')) return localization.t('errors.costBelowPrice');
    return localization.t('errors.invalid');
  }
}
