import { Category } from './enums';
import type { ArtSpec, ProductDTO } from './dto';

export type BadgeVariant = 'sale' | 'new' | 'hot';

export interface Badge {
  label: string;
  variant: BadgeVariant;
}

/**
 * ABSTRACTION + ENCAPSULATION
 *
 * Kelas dasar semua produk. Bersifat abstract: tidak bisa dibuat langsung
 * dengan `new Product()`, harus lewat turunannya (FoodProduct, ToyProduct, ...).
 * Data harga disimpan private dan hanya bisa dibaca lewat getter.
 */
export abstract class Product {
  readonly id: string;
  readonly name: string;
  readonly rating: number;
  readonly reviews: number;
  readonly art: ArtSpec;
  readonly tint: string;

  private readonly _price: number;
  private readonly _oldPrice: number | null;
  protected readonly badgeText: string | null;

  constructor(dto: ProductDTO) {
    if (dto.price < 0) throw new Error(`Harga produk ${dto.id} tidak boleh negatif.`);

    this.id = dto.id;
    this.name = dto.name;
    this.rating = dto.rating;
    this.reviews = dto.reviews;
    this.art = dto.art;
    this.tint = dto.tint;
    this._price = dto.price;
    this._oldPrice = dto.oldPrice ?? null;
    this.badgeText = dto.badge ?? null;
  }

  /* ---------- abstract: WAJIB diisi oleh setiap turunan (POLYMORPHISM) ---------- */

  abstract get category(): Category;
  abstract get categoryLabel(): string;
  /** Batas hari pengembalian, beda untuk tiap jenis produk */
  abstract get returnWindowDays(): number;

  /* ---------- getter (ENCAPSULATION) ---------- */

  get price(): number {
    return this._price;
  }

  get oldPrice(): number | null {
    return this._oldPrice;
  }

  get isOnSale(): boolean {
    return this._oldPrice !== null && this._oldPrice > this._price;
  }

  get discountPercent(): number {
    if (!this.isOnSale || this._oldPrice === null) return 0;
    return Math.round((1 - this._price / this._oldPrice) * 100);
  }

  /* ---------- perilaku bersama ---------- */

  /** Badge di kartu produk: diskon diutamakan, lalu label dari backend. */
  getBadge(): Badge | null {
    if (this.isOnSale) return { label: `-${this.discountPercent}%`, variant: 'sale' };
    if (this.badgeText === 'Baru') return { label: 'Baru', variant: 'new' };
    if (this.badgeText) return { label: this.badgeText, variant: 'hot' };
    return null;
  }

  /** Dipakai fitur pencarian: cocokkan dengan nama & label kategori. */
  matches(query: string): boolean {
    const q = query.trim().toLowerCase();
    return q.length > 0 && `${this.name} ${this.categoryLabel}`.toLowerCase().includes(q);
  }
}

/* ======================================================================
 * INHERITANCE: turunan Product. Masing-masing menimpa (override)
 * anggota abstract sesuai jenisnya.
 * ==================================================================== */

/** Makanan kering & basah. Dapat Garansi Lahap 14 hari. */
export class FoodProduct extends Product {
  override get category(): Category {
    return Category.Makanan;
  }

  override get categoryLabel(): string {
    return 'Makanan';
  }

  override get returnWindowDays(): number {
    return 14;
  }
}

/** Camilan juga makanan -> pewarisan bertingkat (multilevel inheritance). */
export class TreatProduct extends FoodProduct {
  override get category(): Category {
    return Category.Camilan;
  }

  override get categoryLabel(): string {
    return 'Camilan';
  }
}

/** Mainan. Retur 30 hari. */
export class ToyProduct extends Product {
  override get category(): Category {
    return Category.Mainan;
  }

  override get categoryLabel(): string {
    return 'Mainan';
  }

  override get returnWindowDays(): number {
    return 30;
  }
}

/** Perlengkapan: kasur, pasir, tempat minum, dll. Retur 30 hari. */
export class SupplyProduct extends Product {
  override get category(): Category {
    return Category.Perlengkapan;
  }

  override get categoryLabel(): string {
    return 'Perlengkapan';
  }

  override get returnWindowDays(): number {
    return 30;
  }
}
