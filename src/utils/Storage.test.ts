import { describe, expect, it, vi } from 'vitest';
import { SafeStorage } from './Storage';

describe('SafeStorage', () => {
  it('round-trips JSON values through localStorage', () => {
    const storage = new SafeStorage();
    expect(storage.write('k', { a: 1 })).toBe(true);
    expect(storage.read('k')).toEqual({ a: 1 });
    storage.remove('k');
    expect(storage.read('k')).toBeNull();
  });

  it('returns null for invalid JSON', () => {
    window.localStorage.setItem('bad', '{');
    expect(new SafeStorage().read('bad')).toBeNull();
  });

  it('never throws when storage is unavailable', () => {
    const missing = new SafeStorage(() => null);
    expect(missing.write('k', 1)).toBe(false);
    expect(missing.read('k')).toBeNull();
    expect(() => missing.remove('k')).not.toThrow();

    const throwing = new SafeStorage(() => {
      throw new Error('denied');
    });
    expect(throwing.write('k', 1)).toBe(false);
    expect(throwing.read('k')).toBeNull();
    expect(() => throwing.remove('k')).not.toThrow();
  });

  it('reports quota errors as failed writes', () => {
    const backend = {
      setItem: vi.fn(() => {
        throw new Error('quota');
      }),
    } as unknown as Storage;
    expect(new SafeStorage(() => backend).write('k', 1)).toBe(false);
  });
});
