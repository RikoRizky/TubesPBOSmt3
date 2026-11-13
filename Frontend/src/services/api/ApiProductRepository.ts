import type { IProductRepository } from '../../contracts/IProductRepository';
import type { ProductDTO } from '../../models/dto';
import type { Product } from '../../models/Product';
import { ProductFactory } from '../../models/ProductFactory';
import type { HttpClient } from './HttpClient';

/** Implementasi IProductRepository yang mengambil data dari backend C#: GET /products */
export class ApiProductRepository implements IProductRepository {
  constructor(private readonly http: HttpClient) {}

  async getAll(): Promise<Product[]> {
    const dtos = await this.http.get<ProductDTO[]>('/products');
    return ProductFactory.createMany(dtos);
  }
}
