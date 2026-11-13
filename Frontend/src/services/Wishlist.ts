import type { IStorage } from '../contracts/IStorage';
import { Observable } from '../core/Observable';

/** Daftar produk favorit. Isinya private, diubah lewat toggle(). */
export class Wishlist extends Observable<Wishlist> {
  private static readonly STORAGE_KEY = 'wishlist';
  private readonly ids: Set<string>;

  constructor(private readonly storage: IStorage) {
    super();
    this.ids = new Set(storage.read<string[]>(Wishlist.STORAGE_KEY, []));
  }

  has(productId: string): boolean {
    return this.ids.has(productId);
  }

  get size(): number {
    return this.ids.size;
  }

  /** Tambah bila belum ada, hapus bila sudah ada. Mengembalikan status baru. */
  toggle(productId: string): boolean {
    const added = !this.ids.has(productId);
    if (added) this.ids.add(productId);
    else this.ids.delete(productId);
    this.storage.write(Wishlist.STORAGE_KEY, [...this.ids]);
    this.notify(this);
    return added;
  }
}
