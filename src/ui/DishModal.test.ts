import { describe, expect, it, vi } from 'vitest';
import { localization } from '../localization/Localization';
import { DishModal } from './DishModal';

const input = (id: string) => document.getElementById(id) as HTMLInputElement;
const submit = () =>
  (document.querySelector('.dish-form') as HTMLFormElement).dispatchEvent(
    new Event('submit', { cancelable: true })
  );

describe('DishModal', () => {
  it('opens with a preset filled and an empty name', () => {
    const modal = new DishModal(() => true);
    modal.open();
    expect(modal.modal.is_open()).toBe(true);
    expect(input('dish-name').value).toBe('');
    expect(input('dish-price').value).toBe('11.50');
    expect(document.querySelector('.margin-preview')?.textContent).toBe('Margin 67%');
  });

  it('fills presets from chips in the active language', () => {
    localization.set_language('ja');
    const modal = new DishModal(() => true);
    modal.open();
    document.querySelectorAll<HTMLButtonElement>('.chip')[3].click();
    expect(input('dish-name').value).toBe('桜パフェ');
    expect(document.querySelector('.range-value')?.textContent).toBe('4s');
  });

  it('submits a validated draft and closes', () => {
    const onSubmit = vi.fn(() => true);
    const modal = new DishModal(onSubmit);
    modal.open();
    input('dish-name').value = 'Udon';
    submit();
    expect(onSubmit).toHaveBeenCalledWith({ name: 'Udon', price: 11.5, cost: 3.8, cookTime: 12 });
    expect(modal.modal.is_open()).toBe(false);
  });

  it('stays open when the game rejects the dish', () => {
    const modal = new DishModal(() => false);
    modal.open();
    input('dish-name').value = 'Udon';
    submit();
    expect(modal.modal.is_open()).toBe(true);
  });

  it('shows localized validation errors', () => {
    const modal = new DishModal(() => true);
    modal.open();
    submit();
    const error = () => document.querySelector('.form-error')?.textContent;
    expect(error()).toBe('Dish name is required');
    input('dish-name').value = 'X';
    input('dish-cost').value = '20';
    input('dish-name').dispatchEvent(new Event('input', { bubbles: true }));
    expect(input('dish-cost').getAttribute('aria-invalid')).toBe('true');
    expect(document.querySelector('.margin-preview')?.classList.contains('negative')).toBe(true);
    submit();
    expect(error()).toBe('Cost must be lower than price');
    input('dish-price').value = '';
    input('dish-name').dispatchEvent(new Event('input', { bubbles: true }));
    expect(document.querySelector('.margin-preview')?.textContent).toBe('');
    submit();
    expect(error()).toBe('Please check the values');
  });

  it('cancels', () => {
    const modal = new DishModal(() => true);
    modal.open();
    document.querySelector<HTMLButtonElement>('.dish-form .btn-ghost')?.click();
    expect(modal.modal.is_open()).toBe(false);
  });
});
