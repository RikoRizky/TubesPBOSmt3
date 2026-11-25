import { Category, PetType } from './enums';
import { Pet } from './Pet';
import type { Product } from './Product';

export type PetFilter = 'semua' | 'favorit' | PetType;
export type CategoryFilter = 'semua' | Category;

const CATEGORIES: readonly string[] = Object.values(Category);

/**
 * IMMUTABLE OBJECT
 *
 * Menyimpan pilihan filter (jenis hewan + kategori). Objek ini tidak pernah
 * diubah; setiap perubahan membuat objek baru lewat withPet()/withCategory().
 * Dengan begitu filter lama bisa dibandingkan dengan yang baru secara aman.
 */
export class ProductFilter {
  static readonly ALL = new ProductFilter();

  constructor(
    readonly pet: PetFilter = 'semua',
    readonly category: CategoryFilter = 'semua',
  ) {}

  static isPetFilter(value: string): value is PetFilter {
    return value === 'semua' || value === 'favorit' || Pet.isPetType(value);
  }

  static isCategoryFilter(value: string): value is CategoryFilter {
    return value === 'semua' || CATEGORIES.includes(value);
  }

  withPet(pet: PetFilter): ProductFilter {
    return new ProductFilter(pet, this.category);
  }

  withCategory(category: CategoryFilter): ProductFilter {
    return new ProductFilter(this.pet, category);
  }

  equals(other: ProductFilter): boolean {
    return this.pet === other.pet && this.category === other.category;
  }

  /** Apakah produk lolos filter ini? `isFavorite` dipakai untuk filter "favorit". */
  matches(product: Product, isFavorite: (productId: string) => boolean): boolean {
    if (this.pet === 'favorit' && !isFavorite(product.id)) return false;
    if (this.pet !== 'semua' && this.pet !== 'favorit' && product.pet.type !== this.pet) return false;
    if (this.category !== 'semua' && product.category !== this.category) return false;
    return true;
  }
}
