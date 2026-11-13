import { Category } from './enums';
import type { ProductDTO } from './dto';
import { FoodProduct, Product, SupplyProduct, ToyProduct, TreatProduct } from './Product';

/**
 * POLA FACTORY
 * Mengubah data mentah (DTO) menjadi objek turunan Product yang tepat
 * berdasarkan kategorinya. Bagian lain aplikasi cukup tahu tipe `Product`.
 */
export class ProductFactory {
  private constructor() {}

  static create(dto: ProductDTO): Product {
    switch (dto.category) {
      case Category.Makanan:
        return new FoodProduct(dto);
      case Category.Camilan:
        return new TreatProduct(dto);
      case Category.Mainan:
        return new ToyProduct(dto);
      case Category.Perlengkapan:
        return new SupplyProduct(dto);
      default:
        throw new Error(`Kategori produk tidak dikenal: "${dto.category}"`);
    }
  }

  static createMany(dtos: readonly ProductDTO[]): Product[] {
    return dtos.map((dto) => ProductFactory.create(dto));
  }
}
