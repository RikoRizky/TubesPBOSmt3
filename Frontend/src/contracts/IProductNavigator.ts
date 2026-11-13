/**
 * INTERFACE: cara "membawa" pengguna ke sebuah produk atau daftar favorit.
 * - Di halaman toko: ProductGrid menggulir ke kartu produk.
 * - Di halaman lain: RedirectNavigator pindah ke index.html.
 */
export interface IProductNavigator {
  showProduct(productId: string): void;
  showFavorites(): void;
}
