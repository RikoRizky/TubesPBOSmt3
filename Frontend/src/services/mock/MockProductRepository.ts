import type { IProductRepository } from '../../contracts/IProductRepository';
import { delay } from '../../core/utils';
import type { Product } from '../../models/Product';
import { ProductFactory } from '../../models/ProductFactory';
import { MOCK_PRODUCTS } from './mockData';

/** Implementasi IProductRepository memakai data contoh + jeda seolah lewat jaringan. */
export class MockProductRepository implements IProductRepository {
  constructor(private readonly latencyMs = 450) {}

  async getAll(): Promise<Product[]> {
    await delay(this.latencyMs);
    return ProductFactory.createMany(MOCK_PRODUCTS);
  }
}
