import { describe, expect, it, vi } from 'vitest';
import { h } from './dom';
import { Modal } from './Modal';

function setup(dismissible = true) {
  const opener = h('button', { text: 'open' });
  document.body.append(opener);
  opener.focus();
  const modal = new Modal('settings', 'x', dismissible);
  const a = h('button', { text: 'a' });
  const b = h('button', { text: 'b' });
  modal.body.append(a, b);
  return { opener, modal, a, b };
}

const key = (target: Element, init: KeyboardEventInit) =>
  target.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init }));

describe('Modal', () => {
  it('opens with focus inside and restores focus on close', () => {
    const { opener, modal, a } = setup();
    const onClose = vi.fn();
    modal.on_close(onClose);
    modal.open();
    modal.open();
    expect(modal.is_open()).toBe(true);
    expect(document.activeElement).toBe(a);
    expect(modal.dialog.getAttribute('aria-modal')).toBe('true');
    modal.close();
    modal.close();
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(opener);
  });

  it('prefers the autofocus element', () => {
    const { modal, b } = setup();
    b.setAttribute('autofocus', '');
    modal.open();
    expect(document.activeElement).toBe(b);
  });

  it('traps tab focus', () => {
    const { modal, a, b } = setup();
    modal.open();
    b.focus();
    key(b, { key: 'Tab' });
    expect(document.activeElement).toBe(a);
    key(a, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(b);
    a.focus();
    key(a, { key: 'Tab' });
    expect(document.activeElement).toBe(a);
    key(a, { key: 'Enter' });
    expect(modal.is_open()).toBe(true);
  });

  it('closes on Escape and backdrop click when dismissible', () => {
    const { modal, a } = setup();
    modal.open();
    key(a, { key: 'Escape' });
    expect(modal.is_open()).toBe(false);
    modal.open();
    modal.dialog.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(modal.is_open()).toBe(true);
    modal.overlay.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(modal.is_open()).toBe(false);
  });

  it('ignores Escape and backdrop when not dismissible', () => {
    const { modal, a } = setup(false);
    modal.open();
    key(a, { key: 'Escape' });
    modal.overlay.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(modal.is_open()).toBe(true);
  });

  it('handles dialogs without focusable content', () => {
    const modal = new Modal('help');
    (document.activeElement as HTMLElement | null)?.blur();
    modal.open();
    key(modal.dialog, { key: 'Tab' });
    expect(modal.is_open()).toBe(true);
    modal.close();
  });
});
