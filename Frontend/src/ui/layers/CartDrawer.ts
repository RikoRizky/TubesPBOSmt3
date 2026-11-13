import type { INotifier } from '../../contracts/INotifier';
import { escapeHtml } from '../../core/dom';
import { Formatter } from '../../core/Formatter';
import { Motion } from '../../core/Motion';
import type { Cart, CartLine } from '../../services/Cart';
import type { ProductCatalog } from '../../services/ProductCatalog';
import { ProductArt } from '../ProductArt';
import { Layer } from './Layer';
import type { LayerManager } from './LayerManager';

export interface CartDrawerDeps {
  cart: Cart;
  catalog: ProductCatalog;
  notifier: INotifier;
  /** Tombol keranjang di header */
  trigger: HTMLElement;
}

/** Drawer keranjang belanja. Selalu menampilkan isi terbaru dari objek Cart. */
export class CartDrawer extends Layer {
  private readonly list: HTMLElement;
  private readonly empty: HTMLElement;
  private readonly foot: HTMLElement;
  private readonly subtotal: HTMLElement;
  private readonly totalQty: HTMLElement;
  private readonly ship: HTMLElement;
  private readonly shipText: HTMLElement;
  private readonly shipBar: HTMLElement;

  constructor(
    root: HTMLElement,
    layers: LayerManager,
    private readonly deps: CartDrawerDeps,
  ) {
    super(root, layers);
    this.list = this.require('[data-cart-list]');
    this.empty = this.require('[data-cart-empty]');
    this.foot = this.require('[data-cart-foot]');
    this.subtotal = this.require('[data-cart-subtotal]');
    this.totalQty = this.require('[data-cart-total-qty]');
    this.ship = this.require('[data-ship]');
    this.shipText = this.require('[data-ship-text]');
    this.shipBar = this.require('[data-ship-bar]');
  }

  protected override get initialFocus(): HTMLElement | null {
    return this.find('[data-cart-close]');
  }

  mount(): void {
    this.deps.trigger.addEventListener('click', () => this.openDrawer());
    this.findAll('[data-cart-close]').forEach((button) =>
      button.addEventListener('click', () => this.hide({ restoreFocus: false })),
    );
    this.list.addEventListener('click', (event) => this.handleListClick(event));
    this.find('[data-checkout]')?.addEventListener('click', () =>
      this.deps.notifier.notify('Checkout akan aktif setelah backend terhubung. Sabar ya, meong!', { duration: 3600 }),
    );

    // OBSERVER: setiap isi keranjang berubah, tampilan ikut diperbarui
    this.deps.cart.subscribe(() => this.render());
    this.render();
  }

  openDrawer(): void {
    this.render();
    this.show();
    this.deps.catalog
      .load()
      .then(() => this.render())
      .catch(() => this.deps.notifier.notify('Gagal memuat keranjang.', { type: 'error' }));
  }

  /* ---------- tampilan ---------- */

  private render(): void {
    const { cart } = this.deps;
    const left = cart.remainingForFreeShipping;

    this.totalQty.textContent = cart.totalQuantity ? `(${cart.totalQuantity})` : '';
    this.subtotal.textContent = Formatter.rupiah(cart.subtotal);
    this.shipText.innerHTML = left
      ? `Tambah <strong>${Formatter.rupiah(left)}</strong> lagi untuk gratis ongkir`
      : 'Yeay! Pesananmu dapat <strong>gratis ongkir</strong>';
    this.shipBar.style.setProperty('--p', cart.freeShippingProgress.toFixed(3));
    this.ship.classList.toggle('is-free', left === 0);

    this.syncList();
  }

  /** Perbarui daftar per item (bukan dibuat ulang) supaya animasi tidak berulang. */
  private syncList(): void {
    const { cart, catalog } = this.deps;
    const lines = cart.lines;
    const ids = new Set(lines.map((line) => line.product.id));
    const loading = !catalog.isLoaded && cart.totalQuantity > 0;

    this.list.querySelectorAll<HTMLElement>('.cart-item').forEach((item) => {
      if (!ids.has(item.dataset.id ?? '') && !item.classList.contains('is-removing')) item.remove();
    });

    this.list.querySelector('.cart-loading')?.remove();
    if (loading) this.list.insertAdjacentHTML('afterbegin', '<li class="cart-loading">Memuat keranjang…</li>');

    for (const line of lines) {
      const existing = this.list.querySelector<HTMLElement>(`.cart-item[data-id="${line.product.id}"]`);
      if (existing) {
        existing.querySelector('[data-qty-value]')!.textContent = String(line.quantity);
        existing.querySelector('[data-line-total]')!.textContent = Formatter.rupiah(line.total);
      } else {
        const item = document.createElement('li');
        item.className = 'cart-item';
        item.dataset.id = line.product.id;
        item.innerHTML = CartDrawer.lineHTML(line);
        this.list.append(item);
      }
    }

    const isEmpty = lines.length === 0 && !loading;
    const animatingOut = this.list.querySelector('.is-removing') !== null;
    this.list.hidden = isEmpty && !animatingOut;
    this.empty.classList.toggle('is-visible', isEmpty && !animatingOut);
    this.foot.hidden = lines.length === 0;
    this.ship.hidden = lines.length === 0;
  }

  private static lineHTML(line: CartLine): string {
    const { product } = line;
    const name = escapeHtml(product.name);
    // POLYMORPHISM: returnWindowDays berbeda untuk makanan (14) dan lainnya (30)
    return `
      <div class="cart-thumb" style="--tint:${product.tint}">${ProductArt.render(product.art)}</div>
      <div>
        <p class="cart-name">${name}</p>
        <p class="cart-unit">${Formatter.rupiah(product.price)} · retur ${product.returnWindowDays} hari</p>
      </div>
      <div class="cart-side">
        <p class="cart-line-total" data-line-total>${Formatter.rupiah(line.total)}</p>
        <div class="qty" role="group" aria-label="Jumlah ${name}">
          <button type="button" data-qty="-1" aria-label="Kurangi jumlah ${name}"><svg class="icon"><use href="#i-minus"/></svg></button>
          <span class="qty-value" data-qty-value>${line.quantity}</span>
          <button type="button" data-qty="1" aria-label="Tambah jumlah ${name}"><svg class="icon"><use href="#i-plus"/></svg></button>
        </div>
        <button class="cart-remove" type="button" data-remove aria-label="Hapus ${name} dari keranjang">
          <svg class="icon"><use href="#i-trash"/></svg> Hapus
        </button>
      </div>`;
  }

  /* ---------- interaksi ---------- */

  private handleListClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const item = target.closest<HTMLElement>('.cart-item');
    const id = item?.dataset.id;
    if (!item || !id) return;

    const qtyButton = target.closest<HTMLElement>('[data-qty]');
    if (qtyButton) {
      const next = this.deps.cart.quantityOf(id) + Number(qtyButton.dataset.qty);
      if (next <= 0) this.removeLine(item, id);
      else this.deps.cart.setQuantity(id, next);
    } else if (target.closest('[data-remove]')) {
      this.removeLine(item, id);
    }
  }

  private removeLine(item: HTMLElement, id: string): void {
    if (!Motion.reduced) {
      // tandai dulu supaya syncList() tidak langsung menghapusnya
      item.classList.add('is-removing');
      item.addEventListener('animationend', () => {
        item.remove();
        this.syncList();
      }, { once: true });
    }
    this.deps.cart.remove(id);
  }
}
