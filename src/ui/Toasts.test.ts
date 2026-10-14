import { describe, expect, it, vi } from 'vitest';
import { Toasts } from './Toasts';

describe('Toasts', () => {
  it('shows typed toasts and auto-dismisses them', () => {
    vi.useFakeTimers();
    const container = document.createElement('div');
    document.body.append(container);
    const toasts = new Toasts(container);
    const toast = toasts.show('<b>hi</b>', 'error');
    expect(toast.getAttribute('role')).toBe('alert');
    expect(toast.querySelector('.toast-text')?.textContent).toBe('<b>hi</b>');
    expect(toasts.show('ok').getAttribute('role')).toBe('status');
    vi.advanceTimersByTime(3200);
    expect(toast.classList.contains('leaving')).toBe(true);
    vi.advanceTimersByTime(300);
    expect(container.children).toHaveLength(0);
  });

  it('runs the action and caps the stack', () => {
    const container = document.createElement('div');
    document.body.append(container);
    const toasts = new Toasts(container);
    const onAction = vi.fn();
    const toast = toasts.show('removed', 'info', { actionLabel: 'Undo', onAction });
    (toast.querySelector('.toast-action') as HTMLButtonElement).click();
    expect(onAction).toHaveBeenCalled();
    expect(toast.classList.contains('leaving')).toBe(true);
    for (let i = 0; i < 6; i++) toasts.show(`t${i}`, 'success');
    expect(container.children.length).toBeLessThanOrEqual(4);
    const detached = document.createElement('div');
    toasts.dismiss(detached);
    expect(detached.classList.contains('leaving')).toBe(false);
  });
});
