import type { IStorage } from '../contracts/IStorage';
import { Observable } from '../core/Observable';
import type { Product } from '../models/Product';
import type { ProductCatalog } from './ProductCatalog';

/** Satu baris di keranjang: produk + jumlahnya. */
export class CartLine {
  constructor(
    readonly product: Product,
    readonly quantity: number,
  ) {}

  get total(): number {
    return this.product.price * this.quantity;
  }
}

/**
 * ENCAPSULATION + INHERITANCE (dari Observable)
 *
 * Isi keranjang disimpan private. Kode lain hanya bisa mengubahnya lewat
 * method add / setQuantity / remove, sehingga aturan (jumlah minimal 1,
 * otomatis tersimpan, otomatis memberi tahu UI) selalu dijalankan.
 */
export class Cart extends Observable<Cart> {
  static readonly FREE_SHIPPING_MIN = 150_000;
  private static readonly STORAGE_KEY = 'cart';

  private readonly quantities: Map<string, number>;

  constructor(
    private readonly storage: IStorage,
    private readonly catalog: ProductCatalog,
  ) {
    super();
    this.quantities = new Map(storage.read<[string, number][]>(Cart.STORAGE_KEY, []));
  }

  /* ---------- perintah ---------- */

  add(productId: string, quantity = 1): void {
    if (quantity <= 0) throw new Error('Jumlah yang ditambahkan harus lebih dari 0.');
    this.quantities.set(productId, this.quantityOf(productId) + quantity);
    this.commit();
  }

  setQuantity(productId: string, quantity: number): void {
    if (quantity <= 0) {
      this.remove(productId);
      return;
    }
    this.quantities.set(productId, Math.floor(quantity));
    this.commit();
  }

  remove(productId: string): void {
    if (this.quantities.delete(productId)) this.commit();
  }

  /* ---------- pertanyaan ---------- */

  quantityOf(productId: string): number {
    return this.quantities.get(productId) ?? 0;
  }

  get totalQuantity(): number {
    let total = 0;
    this.quantities.forEach((quantity) => (total += quantity));
    return total;
  }

  /** Baris keranjang beserta datanya (butuh katalog sudah dimuat). */
  get lines(): CartLine[] {
    const lines: CartLine[] = [];
    this.quantities.forEach((quantity, id) => {
      const product = this.catalog.find(id);
      if (product) lines.push(new CartLine(product, quantity));
    });
    return lines;
  }

  get subtotal(): number {
    return this.lines.reduce((sum, line) => sum + line.total, 0);
  }

  get remainingForFreeShipping(): number {
    return Math.max(0, Cart.FREE_SHIPPING_MIN - this.subtotal);
  }

  /** 0..1 untuk progress bar gratis ongkir */
  get freeShippingProgress(): number {
    return Math.min(1, this.subtotal / Cart.FREE_SHIPPING_MIN);
  }

  /* ---------- internal ---------- */

  private commit(): void {
    this.storage.write(Cart.STORAGE_KEY, [...this.quantities.entries()]);
    this.notify(this);
  }
}
