import type { IStorage } from '../../contracts/IStorage';
import { LocalStorageService } from './LocalStorageService';
import { MemoryStorage } from './MemoryStorage';

/** Pilih implementasi IStorage yang bisa dipakai di browser saat ini. */
export class StorageFactory {
  private constructor() {}

  static create(): IStorage {
    return LocalStorageService.isAvailable() ? new LocalStorageService() : new MemoryStorage();
  }
}
