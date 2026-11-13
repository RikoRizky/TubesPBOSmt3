import type { Product } from '../models/Product';

/**
 * INTERFACE: sumber data produk.
 * Implementasi: MockProductRepository (data contoh) dan ApiProductRepository
 * (backend C#). Kode lain tidak perlu tahu mana yang sedang dipakai.
 */
export interface IProductRepository {
  getAll(): Promise<Product[]>;
}
