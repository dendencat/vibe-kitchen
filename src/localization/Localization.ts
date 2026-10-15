import type { Language } from '../types/UITypes';
import { en, ja, type Strings } from './strings';

const TABLES: Record<Language, Strings> = { en, ja };

type Listener = (language: Language) => void;

/**
 * Resolves UI strings for the active language and notifies subscribers on change.
 */
export class LocalizationManager {
  private language: Language = 'en';
  private readonly listeners = new Set<Listener>();

  /**
   * Switches the active language and notifies subscribers.
   * @param language - Requested language; unknown values are ignored.
   */
  set_language(language: string): void {
    if (!LocalizationManager.is_language(language) || language === this.language) return;
    this.language = language;
    this.listeners.forEach(listener => listener(language));
  }

  /** Currently active language. */
  get_language(): Language {
    return this.language;
  }

  /** All supported languages. */
  get_available_languages(): Language[] {
    return Object.keys(TABLES) as Language[];
  }

  /**
   * Looks up a dotted key (e.g. `aiRestaurants.speed`) and fills `{placeholders}`.
   * Falls back to English, then to the key itself.
   * @param key - Dotted path into the string table.
   * @param vars - Placeholder values.
   */
  t(key: string, vars: Record<string, string | number> = {}): string {
    const template = this.resolve(TABLES[this.language], key) ?? this.resolve(en, key) ?? key;
    return template.replace(/\{(\w+)\}/g, (match, name: string) =>
      name in vars ? String(vars[name]) : match
    );
  }

  /**
   * Registers a language-change listener.
   * @returns Unsubscribe function.
   */
  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Applies translations to elements carrying `data-i18n*` attributes.
   * @param root - Subtree to translate.
   */
  apply_to_dom(root: ParentNode): void {
    root.querySelectorAll<HTMLElement>('[data-i18n]').forEach(element => {
      element.textContent = this.t(element.dataset.i18n as string);
    });
    root.querySelectorAll<HTMLElement>('[data-i18n-aria]').forEach(element => {
      element.setAttribute('aria-label', this.t(element.dataset.i18nAria as string));
    });
    root.querySelectorAll<HTMLElement>('[data-i18n-title]').forEach(element => {
      element.title = this.t(element.dataset.i18nTitle as string);
    });
    root.querySelectorAll<HTMLInputElement>('[data-i18n-placeholder]').forEach(element => {
      element.placeholder = this.t(element.dataset.i18nPlaceholder as string);
    });
    if (root instanceof Document) {
      root.documentElement.lang = this.language;
      root.title = this.t('gameTitle');
    }
  }

  /** Type guard for supported languages. */
  static is_language(value: unknown): value is Language {
    return typeof value === 'string' && value in TABLES;
  }

  private resolve(table: unknown, key: string): string | null {
    let value: unknown = table;
    for (const part of key.split('.')) {
      if (value === null || typeof value !== 'object') return null;
      value = (value as Record<string, unknown>)[part];
    }
    return typeof value === 'string' ? value : null;
  }
}

/** Shared instance used by the UI. */
export const localization = new LocalizationManager();
