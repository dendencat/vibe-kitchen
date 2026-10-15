import { h } from './dom';

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

let modalCounter = 0;

/**
 * Accessible modal dialog: focus trap, Escape to close, focus restore.
 */
export class Modal {
  readonly overlay: HTMLElement;
  readonly dialog: HTMLElement;
  readonly body: HTMLElement;
  private readonly title: HTMLElement;
  private returnFocus: HTMLElement | null = null;
  private closeListeners: Array<() => void> = [];

  /**
   * @param titleKey - Localization key of the heading.
   * @param className - Extra class for styling.
   * @param dismissible - Whether Escape / backdrop click closes it.
   */
  constructor(
    titleKey: string,
    className = '',
    private readonly dismissible = true
  ) {
    modalCounter += 1;
    const titleId = `modal-title-${modalCounter}`;
    this.title = h('h2', { className: 'modal-title', id: titleId, i18n: titleKey });
    this.body = h('div', { className: 'modal-body' });
    this.dialog = h(
      'div',
      {
        className: `modal glass ${className}`.trim(),
        attrs: { role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': titleId },
      },
      this.title,
      this.body
    );
    this.overlay = h(
      'div',
      {
        className: 'modal-backdrop',
        attrs: { hidden: '' },
        on: {
          mousedown: event => {
            if (event.target === this.overlay && this.dismissible) this.close();
          },
          keydown: event => this.on_key(event),
        },
      },
      this.dialog
    );
    document.body.append(this.overlay);
  }

  /** Whether the dialog is visible. */
  is_open(): boolean {
    return !this.overlay.hidden;
  }

  /** Shows the dialog and focuses its first control. */
  open(): void {
    if (this.is_open()) return;
    this.returnFocus = document.activeElement as HTMLElement | null;
    this.overlay.hidden = false;
    const first = this.dialog.querySelector<HTMLElement>('[autofocus]') ?? this.focusables()[0];
    first?.focus({ preventScroll: true });
  }

  /** Hides the dialog and restores focus. */
  close(): void {
    if (!this.is_open()) return;
    this.overlay.hidden = true;
    this.returnFocus?.focus();
    this.closeListeners.forEach(listener => listener());
  }

  /**
   * Registers a close listener.
   * @param listener - Called after the dialog closes.
   */
  on_close(listener: () => void): void {
    this.closeListeners.push(listener);
  }

  private focusables(): HTMLElement[] {
    return [...this.dialog.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(el => !el.hidden);
  }

  private on_key(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.dismissible) {
      event.stopPropagation();
      this.close();
      return;
    }
    if (event.key !== 'Tab') return;
    const items = this.focusables();
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
}
