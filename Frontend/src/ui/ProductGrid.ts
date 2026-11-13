import type { IMeasurable } from '../contracts/IMeasurable';
import type { INotifier } from '../contracts/INotifier';
import type { IProductNavigator } from '../contracts/IProductNavigator';
import { $, $$, restartAnimation } from '../core/dom';
import { Motion } from '../core/Motion';
import { Category } from '../models/enums';
import type { Product } from '../models/Product';
import type { Cart } from '../services/Cart';
import type { ProductCatalog } from '../services/ProductCatalog';
import type { Wishlist } from '../services/Wishlist';
import { Component } from './Component';
import type { FlyToCart } from './FlyToCart';
import { ProductArt } from './ProductArt';
import { ProductCardView } from './ProductCardView';

type Filter = 'semua' | 'favorit' | Category;

const FILTERS: readonly string[] = ['semua', 'favorit', ...Object.values(Category)];

export interface ProductGridDeps {
  catalog: ProductCatalog;
  cart: Cart;
  wishlist: Wishlist;
  notifier: INotifier;
  fly: FlyToCart;
  openCart: () => void;
}

/**
 * Daftar produk "Paling laris": filter kategori, skeleton loading,
 * empty/error state, tombol favorit & tambah ke keranjang.
 *
 * Mengimplementasikan DUA interface sekaligus:
 *  - IProductNavigator: bisa menampilkan produk tertentu / daftar favorit
 *  - IMeasurable: menghitung ulang posisi indikator tab saat layar berubah
 */
export class ProductGrid extends Component implements IProductNavigator, IMeasurable {
  private static readonly PAGE_SIZE = 8;

  private filter: Filter = 'semua';
  private visible = ProductGrid.PAGE_SIZE;
  private rendered = false;
  private loading: Promise<void> | null = null;
  private readonly resetTimers = new WeakMap<HTMLElement, number>();

  private readonly section: HTMLElement | null;
  private readonly tabsWrap: HTMLElement | null;
  private readonly tabs: HTMLButtonElement[];
  private readonly indicator: HTMLElement | null;
  private readonly loadMoreButton: HTMLButtonElement | null;
  private readonly loadMoreCount: HTMLElement | null;

  constructor(
    root: HTMLElement,
    private readonly deps: ProductGridDeps,
  ) {
    super(root);
    this.section = root.closest('section');
    this.tabsWrap = $('[data-filter-tabs]');
    this.tabs = this.tabsWrap ? $$<HTMLButtonElement>('[data-filter]', this.tabsWrap) : [];
    this.indicator = $('[data-filter-indicator]');
    this.loadMoreButton = $<HTMLButtonElement>('[data-load-more]');
    this.loadMoreCount = $('[data-load-more-count]');
  }

  /* ==================== siklus hidup ==================== */

  mount(): void {
    this.root.id = 'produk-grid';

    this.tabs.forEach((tab, i) => {
      tab.setAttribute('aria-controls', this.root.id);
      tab.addEventListener('click', () => this.setFilter(tab.dataset.filter as Filter));
      tab.addEventListener('keydown', (event) => {
        if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
        event.preventDefault();
        const next = this.tabs[(i + (event.key === 'ArrowRight' ? 1 : -1) + this.tabs.length) % this.tabs.length];
        next.focus();
        this.setFilter(next.dataset.filter as Filter);
      });
    });

    // tautan kategori di mana pun (kartu kategori, promo, footer)
    $$('[data-filter-link]').forEach((link) =>
      link.addEventListener('click', () => {
        this.setFilter(link.dataset.filterLink as Filter);
        void this.load();
      }),
    );

    this.loadMoreButton?.addEventListener('click', () => this.loadMore());
    this.root.addEventListener('click', (event) => this.handleClick(event));
    this.root.addEventListener('animationend', (event) => {
      const target = event.target as HTMLElement;
      target.classList.remove('is-entering', 'is-flash');
    });

    // muat produk saat section mulai terlihat (lazy-load dari API)
    new IntersectionObserver(([entry], observer) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      void this.load();
    }, { rootMargin: '0px 0px -10% 0px' }).observe(this.root);

    this.syncTabs(false);
  }

  measure(): void {
    this.syncTabs(false);
  }

  /** Tautan dari halaman lain: ?kategori=mainan atau ?produk=p01 */
  applyUrlParams(params: URLSearchParams): void {
    const kategori = params.get('kategori');
    const produk = params.get('produk');
    if (kategori && ProductGrid.isFilter(kategori)) {
      this.filter = kategori;
      this.syncTabs(false);
    }
    if (produk) window.setTimeout(() => this.showProduct(produk), 300);
    if (kategori || produk) history.replaceState(null, '', location.pathname + location.hash);
  }

  /* ==================== IProductNavigator ==================== */

  showProduct(productId: string): void {
    void this.revealProduct(productId);
  }

  showFavorites(): void {
    this.setFilter('favorit');
    void this.load();
    this.section?.scrollIntoView({ behavior: Motion.scrollBehavior });
  }

  /* ==================== filter & render ==================== */

  setFilter(filter: Filter): void {
    if (filter === this.filter && this.rendered) return;
    this.filter = filter;
    this.visible = ProductGrid.PAGE_SIZE;
    this.syncTabs(true);
    if (!this.rendered) return; // dirender saat data selesai dimuat

    if (Motion.reduced) {
      this.render();
      return;
    }
    this.root.classList.add('is-swapping');
    window.setTimeout(() => {
      this.render();
      this.root.classList.remove('is-swapping');
    }, 180);
  }

  private load(): Promise<void> {
    if (this.rendered) return Promise.resolve();
    if (this.loading) return this.loading;

    if (!this.deps.catalog.isLoaded) {
      this.root.innerHTML = ProductCardView.skeleton().repeat(ProductGrid.PAGE_SIZE);
      this.root.setAttribute('aria-busy', 'true');
    }

    this.loading = this.deps.catalog
      .load()
      .then(() => {
        this.rendered = true;
        this.render();
      })
      .catch(() => {
        this.root.innerHTML = ProductGrid.errorHTML();
        this.root.setAttribute('aria-busy', 'false');
      })
      .finally(() => {
        this.loading = null;
      });

    return this.loading;
  }

  /** Produk yang lolos filter aktif. Memakai getter `category` milik tiap objek. */
  private filtered(): Product[] {
    const all = this.deps.catalog.all;
    if (this.filter === 'semua') return [...all];
    if (this.filter === 'favorit') return all.filter((product) => this.deps.wishlist.has(product.id));
    return all.filter((product) => product.category === this.filter);
  }

  private render(animate = true): void {
    const list = this.filtered();
    this.root.innerHTML = list.length
      ? list
          .slice(0, this.visible)
          .map((product, index) => ProductCardView.render(product, { wished: this.deps.wishlist.has(product.id), index }))
          .join('')
      : this.emptyHTML();

    if (!animate) this.root.querySelectorAll('.product-card').forEach((card) => card.classList.remove('is-entering'));
    this.root.setAttribute('aria-busy', 'false');
    this.updateLoadMore(list);
  }

  private loadMore(): void {
    const list = this.filtered();
    const start = this.visible;
    this.visible += ProductGrid.PAGE_SIZE;
    const html = list
      .slice(start, this.visible)
      .map((product, index) => ProductCardView.render(product, { wished: this.deps.wishlist.has(product.id), index }))
      .join('');
    this.root.insertAdjacentHTML('beforeend', html);
    this.updateLoadMore(list);
  }

  private updateLoadMore(list: readonly Product[]): void {
    if (!this.loadMoreButton || !this.loadMoreCount) return;
    const remaining = list.length - Math.min(list.length, this.visible);
    this.loadMoreButton.hidden = remaining <= 0;
    this.loadMoreCount.textContent = remaining > 0 ? `(${remaining} lagi)` : '';
  }

  private async revealProduct(productId: string): Promise<void> {
    await this.load();
    let index = this.filtered().findIndex((product) => product.id === productId);
    if (index === -1) {
      this.filter = 'semua';
      this.syncTabs(true);
      index = this.deps.catalog.all.findIndex((product) => product.id === productId);
    }
    if (index === -1) return;

    const size = ProductGrid.PAGE_SIZE;
    this.visible = Math.max(size, Math.ceil((index + 1) / size) * size);
    this.render(false);

    const card = this.find(`[data-id="${productId}"]`);
    if (!card) return;
    card.scrollIntoView({ behavior: Motion.scrollBehavior, block: 'center' });
    restartAnimation(card, 'is-flash');
  }

  /* ==================== tab filter ==================== */

  private syncTabs(scrollTab: boolean): void {
    this.tabs.forEach((tab) => {
      const on = tab.dataset.filter === this.filter;
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
    });
    const active = this.tabs.find((tab) => tab.dataset.filter === this.filter);
    if (!active || !this.indicator || !this.tabsWrap) return;

    this.indicator.style.setProperty('--x', `${active.offsetLeft}px`);
    this.indicator.style.setProperty('--w', `${active.offsetWidth}px`);

    // di HP daftar tab bisa digeser: pastikan tab aktif terlihat
    if (scrollTab && this.tabsWrap.scrollWidth > this.tabsWrap.clientWidth) {
      const left = active.offsetLeft - (this.tabsWrap.clientWidth - active.offsetWidth) / 2;
      this.tabsWrap.scrollTo({ left, behavior: Motion.scrollBehavior });
    }
  }

  /* ==================== aksi pada kartu ==================== */

  private handleClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const wishButton = target.closest<HTMLButtonElement>('[data-wish]');
    const addButton = target.closest<HTMLButtonElement>('[data-add]');

    if (wishButton?.dataset.wish) this.toggleWish(wishButton.dataset.wish, wishButton);
    else if (addButton?.dataset.add) this.addToCart(addButton.dataset.add, addButton);
    else if (target.closest('[data-retry]')) void this.load();
    else if (target.closest('[data-go-all]')) this.setFilter('semua');
  }

  private toggleWish(productId: string, button: HTMLButtonElement): void {
    const product = this.deps.catalog.find(productId);
    if (!product) return;

    const added = this.deps.wishlist.toggle(productId);
    button.setAttribute('aria-pressed', String(added));
    button.setAttribute('aria-label', `${added ? 'Hapus dari' : 'Simpan ke'} favorit: ${product.name}`);
    restartAnimation(button, 'is-pop');

    if (added) {
      this.deps.notifier.notify(`${product.name} disimpan ke favorit`, { action: 'Lihat', onAction: () => this.showFavorites() });
    } else if (this.filter === 'favorit') {
      window.setTimeout(() => this.render(false), 300);
    }
  }

  private addToCart(productId: string, button: HTMLButtonElement): void {
    const product = this.deps.catalog.find(productId);
    if (!product) return;

    this.deps.cart.add(productId);

    button.classList.add('is-added');
    button.innerHTML = '<svg class="icon"><use href="#i-check"/></svg>';
    window.clearTimeout(this.resetTimers.get(button));
    this.resetTimers.set(button, window.setTimeout(() => {
      button.classList.remove('is-added');
      button.innerHTML = '<svg class="icon"><use href="#i-bag-plus"/></svg>';
    }, 1400));

    this.deps.fly.launch(button, product);
    this.deps.notifier.notify(`${product.name} masuk keranjang`, {
      type: 'success',
      action: 'Lihat',
      onAction: this.deps.openCart,
    });
  }

  /* ==================== state kosong / galat ==================== */

  private emptyHTML(): string {
    if (this.filter === 'favorit') {
      return `
        <div class="grid-state">
          <div class="grid-state-art">${ProductArt.render({ type: 'bed', palette: 'cream' })}</div>
          <h3>Belum ada favorit</h3>
          <p>Ketuk ikon hati di produk mana pun untuk menyimpannya di sini.</p>
          <button class="btn btn-ghost btn-sm" type="button" data-go-all>Lihat semua produk</button>
        </div>`;
    }
    return `
      <div class="grid-state">
        <div class="grid-state-art">${ProductArt.render({ type: 'yarn', palette: 'orange' })}</div>
        <h3>Stok sedang diisi ulang</h3>
        <p>Kategori ini belum punya produk. Cek lagi nanti, ya.</p>
        <button class="btn btn-ghost btn-sm" type="button" data-go-all>Lihat semua produk</button>
      </div>`;
  }

  private static errorHTML(): string {
    return `
      <div class="grid-state" role="alert">
        <div class="grid-state-art">${ProductArt.render({ type: 'mouse', palette: 'brown' })}</div>
        <h3>Gagal memuat produk</h3>
        <p>Sepertinya koneksi sedang bermasalah. Coba muat ulang.</p>
        <button class="btn btn-primary btn-sm" type="button" data-retry>Coba lagi</button>
      </div>`;
  }

  private static isFilter(value: string): value is Filter {
    return FILTERS.includes(value);
  }
}
