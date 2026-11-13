import type { IStorage } from '../../contracts/IStorage';

/** Implementasi IStorage di memori (hilang saat refresh). Cadangan bila localStorage diblokir. */
export class MemoryStorage implements IStorage {
  private readonly data = new Map<string, string>();

  read<T>(key: string, fallback: T): T {
    const raw = this.data.get(key);
    return raw === undefined ? fallback : (JSON.parse(raw) as T);
  }

  write<T>(key: string, value: T): void {
    this.data.set(key, JSON.stringify(value));
  }
}
