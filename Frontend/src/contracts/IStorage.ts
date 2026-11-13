/**
 * INTERFACE + GENERICS: penyimpanan data sederhana (key -> value).
 * Implementasi: LocalStorageService (tersimpan di browser) dan
 * MemoryStorage (cadangan saat localStorage diblokir, mis. mode privat).
 */
export interface IStorage {
  read<T>(key: string, fallback: T): T;
  write<T>(key: string, value: T): void;
}
