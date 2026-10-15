import type { ToastKind } from '../types/UITypes';
import { h } from './dom';

export interface ToastOptions {
  actionLabel?: string;
  onAction?: () => void;
  duration?: number;
}

const ICONS: Record<ToastKind, string> = { success: '✓', warning: '!', error: '✕', info: 'i' };

/**
 * Stack of transient notifications in an `aria-live` region.
 */
export class Toasts {
  private readonly max = 4;

  constructor(private readonly container: HTMLElement) {}

  /**
   * Shows a toast.
   * @param message - Text (rendered as text, never HTML).
   * @param kind - Visual style.
   * @param options - Optional action button and duration.
   * @returns The toast element.
   */
  show(message: string, kind: ToastKind = 'info', options: ToastOptions = {}): HTMLElement {
    const { actionLabel, onAction, duration = 3200 } = options;
    const toast = h(
      'div',
      { className: `toast toast-${kind}`, attrs: { role: kind === 'error' ? 'alert' : 'status' } },
      h('span', { className: 'toast-icon', text: ICONS[kind], attrs: { 'aria-hidden': 'true' } }),
      h('span', { className: 'toast-text', text: message })
    );
    if (actionLabel && onAction) {
      toast.append(
        h('button', {
          className: 'toast-action',
          text: actionLabel,
          attrs: { type: 'button' },
          on: {
            click: () => {
              onAction();
              this.dismiss(toast);
            },
          },
        })
      );
    }
    this.container.append(toast);
    while (this.container.children.length > this.max) {
      this.container.firstElementChild?.remove();
    }
    window.setTimeout(() => this.dismiss(toast), duration);
    return toast;
  }

  /** Removes a toast with an exit animation. */
  dismiss(toast: HTMLElement): void {
    if (!toast.isConnected) return;
    toast.classList.add('leaving');
    window.setTimeout(() => toast.remove(), 250);
  }
}
