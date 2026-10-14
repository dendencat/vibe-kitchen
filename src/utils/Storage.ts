/**
 * localStorage wrapper that never throws (private mode, quota, disabled storage).
 */
export class SafeStorage {
  /**
   * @param backend - Storage implementation; resolved lazily so access errors are caught.
   */
  constructor(private readonly backend: () => Storage | null = () => window.localStorage) {}

  /**
   * Reads and JSON-parses a value.
   * @param key - Storage key.
   * @returns Parsed value or null when missing/invalid.
   */
  read<T>(key: string): T | null {
    try {
      const raw = this.backend()?.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  /**
   * JSON-serializes and writes a value.
   * @returns true on success.
   */
  write(key: string, value: unknown): boolean {
    try {
      const storage = this.backend();
      if (!storage) return false;
      storage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Removes a key.
   * @param key - Storage key.
   */
  remove(key: string): void {
    try {
      this.backend()?.removeItem(key);
    } catch {
      // ignore
    }
  }
}
