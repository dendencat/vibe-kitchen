import { localization } from '../localization/Localization';

type Child = Node | string | number | null | undefined | false;

export interface ElementProps {
  className?: string;
  id?: string;
  text?: string;
  /** Localization key; sets `data-i18n` and the translated text. */
  i18n?: string;
  /** Localization key for `aria-label`. */
  i18nAria?: string;
  attrs?: Record<string, string>;
  dataset?: Record<string, string>;
  on?: Partial<{ [K in keyof HTMLElementEventMap]: (event: HTMLElementEventMap[K]) => void }>;
}

/**
 * Creates an element. Text is always assigned via `textContent`, so user
 * strings can never be interpreted as HTML.
 * @param tag - Tag name.
 * @param props - Classes, attributes, text and listeners.
 * @param children - Child nodes or strings.
 */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: ElementProps = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  const { className, id, text, i18n, i18nAria, attrs, dataset, on } = props;
  if (className) element.className = className;
  if (id) element.id = id;
  if (i18n) {
    element.dataset.i18n = i18n;
    element.textContent = localization.t(i18n);
  } else if (text !== undefined) {
    element.textContent = text;
  }
  if (i18nAria) {
    element.dataset.i18nAria = i18nAria;
    element.setAttribute('aria-label', localization.t(i18nAria));
  }
  Object.entries(attrs ?? {}).forEach(([name, value]) => element.setAttribute(name, value));
  Object.entries(dataset ?? {}).forEach(([name, value]) => {
    element.dataset[name] = value;
  });
  Object.entries(on ?? {}).forEach(([type, listener]) =>
    element.addEventListener(type, listener as EventListener)
  );
  children.forEach(child => {
    if (child === null || child === undefined || child === false) return;
    element.append(child instanceof Node ? child : String(child));
  });
  return element;
}

/**
 * Sets text only when it changed (avoids layout churn on every tick).
 * @param element - Target element.
 * @param text - New text.
 */
export function set_text(element: Element, text: string): void {
  if (element.textContent !== text) element.textContent = text;
}

/**
 * Looks up a required element by id.
 * @throws Error when it is missing (a template bug).
 */
export function by_id<T extends HTMLElement = HTMLElement>(
  id: string,
  root: Document = document
): T {
  const element = root.getElementById(id);
  if (!element) throw new Error(`Missing element #${id}`);
  return element as T;
}
