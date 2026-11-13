import type { IProductNavigator } from '../contracts/IProductNavigator';
import { restartAnimation } from '../core/dom';
import type { Cart } from '../services/Cart';
import type { Wishlist } from '../services/Wishlist';
import { Component } from './Component';

/** Tombol di kanan header: angka favorit & keranjang. */
export class HeaderActions extends Component {
  private readonly wishButton: HTMLElement;
  private readonly wishCount: HTMLElement;
  private readonly cartCount: HTMLElement;
  readonly cartButton: HTMLElement;

  constructor(
    root: HTMLElement,
    private readonly cart: Cart,
    private readonly wishlist: Wishlist,
    private readonly navigator: IProductNavigator,
  ) {
    super(root);
    this.wishButton = this.require('[data-wish-open]');
    this.wishCount = this.require('[data-wish-count]');
    this.cartButton = this.require('[data-cart-open]');
    this.cartCount = this.require('[data-cart-count]');
  }

  mount(): void {
    this.wishButton.addEventListener('click', () => this.navigator.showFavorites());
    this.cart.subscribe(() => this.renderCart());
    this.wishlist.subscribe(() => {
      this.renderWishlist();
      restartAnimation(this.wishCount, 'is-bump');
    });
    this.renderCart();
    this.renderWishlist();
  }

  /** Dipanggil saat animasi produk "mendarat" di ikon keranjang. */
  bumpCart(): void {
    restartAnimation(this.cartCount, 'is-bump');
  }

  private renderCart(): void {
    const qty = this.cart.totalQuantity;
    this.cartCount.textContent = String(qty);
    this.cartCount.hidden = qty === 0;
    this.cartButton.setAttribute('aria-label', qty ? `Buka keranjang, ${qty} barang` : 'Buka keranjang');
  }

  private renderWishlist(): void {
    this.wishCount.textContent = String(this.wishlist.size);
    this.wishCount.hidden = this.wishlist.size === 0;
  }
}
