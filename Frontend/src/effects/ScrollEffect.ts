import type { IMeasurable } from '../contracts/IMeasurable';

/** Keadaan gulir yang dibagikan ke semua efek setiap frame. */
export interface ScrollState {
  /** posisi gulir (px) */
  readonly y: number;
  /** perubahan sejak frame sebelumnya (positif = ke bawah) */
  readonly dy: number;
  readonly viewportHeight: number;
  /** 0..1 dari atas sampai bawah halaman */
  readonly progress: number;
}

/**
 * ABSTRACTION + POLYMORPHISM
 *
 * Kelas dasar semua animasi yang mengikuti gulir. ScrollEngine cukup
 * memanggil effect.update(state) untuk setiap efek, tanpa perlu tahu
 * apakah itu progress bar, parallax, galeri, atau jejak kaki.
 */
export abstract class ScrollEffect implements IMeasurable {
  /**
   * Efek dekoratif dimatikan saat pengguna memilih "kurangi gerakan".
   * Efek fungsional (progress bar, header) meng-override menjadi false.
   */
  get isDecorative(): boolean {
    return true;
  }

  /** Hitung ulang ukuran saat layar berubah. Default: tidak melakukan apa-apa. */
  measure(): void {}

  /** Dipanggil sekali per frame saat halaman digulir. */
  abstract update(state: ScrollState): void;
}
