import type { IStorage } from '../../contracts/IStorage';

/** Implementasi IStorage di localStorage browser (data tetap ada setelah refresh). */
export class LocalStorageService implements IStorage {
  constructor(private readonly prefix = 'meow:') {}

  static isAvailable(): boolean {
    try {
      const key = '__meow_test__';
      localStorage.setItem(key, '1');
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }

  read<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(this.prefix + key);
      return raw === null ? fallback : (JSON.parse(raw) as T);
    } catch {
      return fallback;
    }
  }

  write<T>(key: string, value: T): void {
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(value));
    } catch {
      /* penyimpanan penuh / diblokir: abaikan */
    }
  }
}
