export type Listener<T> = (value: T) => void;

/**
 * POLA OBSERVER + GENERICS
 * Kelas dasar untuk objek yang perubahannya bisa "dilanggani" objek lain.
 * Contoh: Cart extends Observable<Cart> -> ikon keranjang & drawer ikut
 * diperbarui otomatis setiap isi keranjang berubah.
 */
export abstract class Observable<T> {
  private readonly listeners = new Set<Listener<T>>();

  /** Daftarkan listener. Mengembalikan fungsi untuk berhenti berlangganan. */
  subscribe(listener: Listener<T>): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Hanya kelas turunan yang boleh mengumumkan perubahan. */
  protected notify(value: T): void {
    this.listeners.forEach((listener) => listener(value));
  }
}
