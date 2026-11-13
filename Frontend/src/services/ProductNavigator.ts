import type { IProductNavigator } from '../contracts/IProductNavigator';

/** Dipakai di halaman selain toko: pindah ke index.html. */
export class RedirectNavigator implements IProductNavigator {
  showProduct(productId: string): void {
    location.href = `index.html?produk=${encodeURIComponent(productId)}`;
  }

  showFavorites(): void {
    location.href = 'index.html?kategori=favorit#belanja';
  }
}

/**
 * POLA PROXY: komponen bersama (pencarian, ikon favorit) selalu memanggil
 * objek ini. Halaman toko lalu "memasang" ProductGrid sebagai tujuan,
 * sedangkan halaman lain tetap memakai RedirectNavigator.
 */
export class ProductNavigator implements IProductNavigator {
  private target: IProductNavigator;

  constructor(fallback: IProductNavigator) {
    this.target = fallback;
  }

  use(target: IProductNavigator): void {
    this.target = target;
  }

  showProduct(productId: string): void {
    this.target.showProduct(productId);
  }

  showFavorites(): void {
    this.target.showFavorites();
  }
}
