/** Jenis hewan yang dilayani MeowPlace. */
export enum PetType {
  Kucing = 'kucing',
  Anjing = 'anjing',
  Burung = 'burung',
  Ikan = 'ikan',
}

/** Kategori produk. Nilainya sama dengan yang dikirim backend. */
export enum Category {
  Makanan = 'makanan',
  Camilan = 'camilan',
  Mainan = 'mainan',
  Perlengkapan = 'perlengkapan',
}

/** Tahapan status pesanan, berurutan dari awal sampai akhir. */
export enum OrderStatus {
  Dibuat = 'dibuat',
  Dibayar = 'dibayar',
  Dikemas = 'dikemas',
  Dikirim = 'dikirim',
  Sampai = 'sampai',
}

/** Alasan pengembalian barang. */
export enum ReturnReason {
  TidakDoyan = 'doyan',
  Rusak = 'rusak',
  SalahKirim = 'salah',
  Lainnya = 'lainnya',
}
