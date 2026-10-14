import { afterEach, vi } from 'vitest';
import { localization } from '../src/localization/Localization';

/**
 * Minimal 2D canvas context for jsdom (which does not implement canvas).
 * Every method is a spy; `measureText` approximates width from length.
 */
function create_fake_2d_context(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const base: Record<string, unknown> = {
    canvas,
    font: '',
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    globalAlpha: 1,
    textAlign: 'left',
    textBaseline: 'alphabetic',
    measureText: vi.fn((text: string) => ({ width: text.length * 10 })),
    createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
  };
  return new Proxy(base, {
    get(target, key: string) {
      if (!(key in target)) target[key] = vi.fn();
      return target[key];
    },
    set(target, key: string, value) {
      target[key] = value;
      return true;
    },
  }) as unknown as CanvasRenderingContext2D;
}

const contexts = new WeakMap<HTMLCanvasElement, CanvasRenderingContext2D>();
HTMLCanvasElement.prototype.getContext = function getContext(
  this: HTMLCanvasElement,
  type: string
) {
  if (type !== '2d') return null;
  if (!contexts.has(this)) contexts.set(this, create_fake_2d_context(this));
  return contexts.get(this) as CanvasRenderingContext2D;
} as typeof HTMLCanvasElement.prototype.getContext;

afterEach(() => {
  localization.set_language('en');
  document.body.replaceChildren();
  window.localStorage.clear();
  vi.useRealTimers();
  vi.restoreAllMocks();
});
