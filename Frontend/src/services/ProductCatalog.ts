import type { IProductRepository } from '../contracts/IProductRepository';
import type { Product } from '../models/Product';

/**
 * Katalog produk: memuat produk SEKALI dari repository lalu menyimpannya.
 * Bergantung pada interface IProductRepository, bukan kelas tertentu
 * (Dependency Inversion), jadi bisa memakai Mock maupun API.
 */
export class ProductCatalog {
  private products: Product[] = [];
  private loaded = false;
  private pending: Promise<Product[]> | null = null;

  constructor(private readonly repository: IProductRepository) {}

  get isLoaded(): boolean {
    return this.loaded;
  }

  get all(): readonly Product[] {
    return this.products;
  }

  /** Aman dipanggil berkali-kali: permintaan ke server hanya terjadi sekali. */
  load(): Promise<Product[]> {
    if (this.loaded) return Promise.resolve(this.products);
    if (this.pending) return this.pending;

    this.pending = this.repository
      .getAll()
      .then((products) => {
        this.products = products;
        this.loaded = true;
        return products;
      })
      .finally(() => {
        this.pending = null;
      });

    return this.pending;
  }

  find(id: string): Product | undefined {
    return this.products.find((product) => product.id === id);
  }

  search(query: string, limit = 6): Product[] {
    return this.products.filter((product) => product.matches(query)).slice(0, limit);
  }
}
