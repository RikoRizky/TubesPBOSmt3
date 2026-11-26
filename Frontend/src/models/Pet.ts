import { PetType } from './enums';

/**
 * VALUE OBJECT + "TYPE-SAFE ENUM"
 *
 * Satu objek untuk setiap jenis hewan, lengkap dengan label & ikonnya.
 * Constructor private: objeknya hanya ada 4 (Pet.Kucing, Pet.Anjing, ...),
 * jadi bisa dibandingkan langsung dengan ===.
 */
export class Pet {
  private static readonly registry = new Map<PetType, Pet>();

  static readonly Kucing = Pet.register(PetType.Kucing, 'Kucing', 'i-cat');
  static readonly Anjing = Pet.register(PetType.Anjing, 'Anjing', 'i-dog');
  static readonly Burung = Pet.register(PetType.Burung, 'Burung', 'i-bird');
  static readonly Ikan = Pet.register(PetType.Ikan, 'Ikan', 'i-fish');

  private constructor(
    readonly type: PetType,
    readonly label: string,
    /** id ikon di SVG sprite */
    readonly icon: string,
  ) {}

  private static register(type: PetType, label: string, icon: string): Pet {
    const pet = new Pet(type, label, icon);
    Pet.registry.set(type, pet);
    return pet;
  }

  static isPetType(value: string): value is PetType {
    return Pet.registry.has(value as PetType);
  }

  /** Ubah teks dari backend ("Anjing", "anjing") menjadi objek Pet. */
  static from(value: string | null | undefined, fallback: Pet = Pet.Kucing): Pet {
    const key = String(value ?? '').trim().toLowerCase();
    return Pet.isPetType(key) ? (Pet.registry.get(key) ?? fallback) : fallback;
  }

  /** Foto cadangan bila produk belum punya foto sendiri. */
  get photo(): string {
    return `assets/images/pets/${this.type}.jpg`;
  }
}
