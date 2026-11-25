import type { IMeasurable } from '../contracts/IMeasurable';
import type { INotifier } from '../contracts/INotifier';
import type { IProductNavigator } from '../contracts/IProductNavigator';
import { $, $$, restartAnimation } from '../core/dom';
import { Motion } from '../core/Motion';
import type { Product } from '../models/Product';
import { type CategoryFilter, type PetFilter, ProductFilter } from '../models/ProductFilter';
import type { Cart } from '../services/Cart';
import type { ProductCatalog } from '../services/ProductCatalog';
import type { Wishlist } from '../services/Wishlist';
import { Component } from './Component';
import type { FlyToCart } from './FlyToCart';
import { ProductCardView } from './ProductCardView';

export interface ProductGridDeps {
  catalog: ProductCatalog;
  cart: Cart;
  wishlist: Wishlist;
  notifier: INotifier;
  fly: FlyToCart;
  openCart: () => void;
}

/**
 * Daftar produk "Paling laris": filter jenis hewan + kategori, skeleton
 * loading, empty/error state, tombol favorit & tambah ke keranjang.
 *
 * Mengimplementasikan DUA interface sekaligus:
 *  - IProductNavigator: bisa menampilkan produk tertentu / daftar favorit
 *  - IMeasurable: menghitung ulang posisi indikator tab saat layar berubah
 */
export class ProductGrid extends Component implements IProductNavigator, IMeasurable {
  private static readonly PAGE_SIZE = 8;

  private filter = ProductFilter.ALL;
  private visible = ProductGrid.PAGE_SIZE;
  private rendered = false;
  private loading: Promise<void> | null = null;
  private readonly resetTimers = new WeakMap<HTMLElement, number>();

  private readonly section: HTMLElement | null;
  private readonly tabsWrap: HTMLElement | null;
  private readonly tabs: HTMLButtonElement[];
  private readonly chips: HTMLButtonElement[];
  private readonly indicator: HTMLElement | null;
  private readonly loadMoreButton: HTMLButtonElement | null;
  private readonly loadMoreCount: HTMLElement | null;

  constructor(
    root: HTMLElement,
    private readonly deps: ProductGridDeps,
  ) {
    super(root);
    this.section = root.closest('section');
    this.tabsWrap = $('[data-pet-tabs]');
    this.tabs = this.tabsWrap ? $$<HTMLButtonElement>('[data-pet]', this.tabsWrap) : [];
    this.chips = $$<HTMLButtonElement>('[data-category-chips] [data-category]');
    this.indicator = $('[data-filter-indicator]');
    this.loadMoreButton = $<HTMLButtonElement>('[data-load-more]');
    this.loadMoreCount = $('[data-load-more-count]');
  }

  /* ==================== siklus hidup ==================== */

  mount(): void {
    this.root.id = 'produk-grid';

    this.tabs.forEach((tab, i) => {
      tab.setAttribute('aria-controls', this.root.id);
      tab.addEventListener('click', () => this.selectPet(tab.dataset.pet as PetFilter));
      tab.addEventListener('keydown', (event) => {
        if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
        event.preventDefault();
        const next = this.tabs[(i + (event.key === 'ArrowRight' ? 1 : -1) + this.tabs.length) % this.tabs.length];
        next.focus();
        this.selectPet(next.dataset.pet as PetFilter);
      });
    });

    this.chips.forEach((chip) =>
      chip.addEventListener('click', () => this.setFilter(this.filter.withCategory(chip.dataset.category as CategoryFilter))),
    );

    // tautan jenis hewan / kategori di mana pun (kartu hewan, promo, footer)
    $$('[data-filter-link]').forEach((link) =>
      link.addEventListener('click', () => {
        this.applyLink(link.dataset.filterLink ?? '');
        void this.load();
      }),
    );

    this.loadMoreButton?.addEventListener('click', () => this.loadMore());
    this.root.addEventListener('click', (event) => this.handleClick(event));
    this.root.addEventListener('animationend', (event) => {
      (event.target as HTMLElement).classList.remove('is-entering', 'is-flash');
    });

    // jumlah di chip "Favorit" ikut berubah saat favorit berubah
    this.deps.wishlist.subscribe(() => this.syncControls(false));

    // muat produk saat section mulai terlihat (lazy-load dari API)
    new IntersectionObserver(([entry], observer) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      void this.load();
    }, { rootMargin: '0px 0px -10% 0px' }).observe(this.root);

    this.syncControls(false);
  }

  measure(): void {
    this.syncControls(false);
  }

  /** Tautan dari halaman lain: ?hewan=anjing, ?kategori=mainan, ?produk=p01 */
  applyUrlParams(params: URLSearchParams): void {
    const hewan = params.get('hewan');
    const kategori = params.get('kategori');
    const produk = params.get('produk');

    let filter = ProductFilter.ALL;
    if (hewan && ProductFilter.isPetFilter(hewan)) filter = filter.withPet(hewan);
    if (kategori === 'favorit') filter = filter.withPet('favorit'); // tautan versi lama
    else if (kategori && ProductFilter.isCategoryFilter(kategori)) filter = filter.withCategory(kategori);
    this.filter = filter;
    this.syncControls(false);

    if (produk) window.setTimeout(() => this.showProduct(produk), 300);
    if (hewan || kategori || produk) history.replaceState(null, '', location.pathname + location.hash);
  }

  /* ==================== IProductNavigator ==================== */

  showProduct(productId: string): void {
    void this.revealProduct(productId);
  }

  showFavorites(): void {
    this.setFilter(new ProductFilter('favorit'));
    void this.load();
    this.section?.scrollIntoView({ behavior: Motion.scrollBehavior });
  }

  /* ==================== filter & render ==================== */

  /** "kucing" -> filter hewan, "mainan" -> filter kategori (dari semua hewan). */
  private applyLink(value: string): void {
    if (ProductFilter.isPetFilter(value)) this.setFilter(new ProductFilter(value));
    else if (ProductFilter.isCategoryFilter(value)) this.setFilter(new ProductFilter('semua', value));
  }

  /** Ganti hewan; bila kategori terpilih kosong untuk hewan itu, kembali ke semua kategori. */
  private selectPet(pet: PetFilter): void {
    let next = this.filter.withPet(pet);
    if (this.deps.catalog.isLoaded && next.category !== 'semua' && this.count(next) === 0) {
      next = next.withCategory('semua');
    }
    this.setFilter(next);
  }

  setFilter(filter: ProductFilter): void {
    if (filter.equals(this.filter) && this.rendered) return;
    this.filter = filter;
    this.visible = ProductGrid.PAGE_SIZE;
    this.syncControls(true);
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
        this.syncControls(false);
        this.render();
      })
      .catch(() => {
        this.root.innerHTML = ProductGrid.stateHTML('Gagal memuat produk', 'Sepertinya koneksi sedang bermasalah. Coba muat ulang.', 'i-alert', '<button class="btn btn-primary btn-sm" type="button" data-retry>Coba lagi</button>');
        this.root.setAttribute('aria-busy', 'false');
      })
      .finally(() => {
        this.loading = null;
      });

    return this.loading;
  }

  private isFavorite = (productId: string): boolean => this.deps.wishlist.has(productId);

  private filtered(filter = this.filter): Product[] {
    return this.deps.catalog.all.filter((product) => filter.matches(product, this.isFavorite));
  }

  private count(filter: ProductFilter): number {
    return this.filtered(filter).length;
  }

  private render(animate = true): void {
    const list = this.filtered();
    this.root.innerHTML = list.length
      ? list
          .slice(0, this.visible)
          .map((product, index) => ProductCardView.render(product, { wished: this.isFavorite(product.id), index }))
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
      .map((product, index) => ProductCardView.render(product, { wished: this.isFavorite(product.id), index }))
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
      this.filter = ProductFilter.ALL;
      this.syncControls(true);
      index = this.filtered().findIndex((product) => product.id === productId);
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

  /* ==================== tab hewan & chip kategori ==================== */

  private syncControls(scrollTab: boolean): void {
    this.tabs.forEach((tab) => {
      const on = tab.dataset.pet === this.filter.pet;
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
    });

    // chip kategori: tandai yang aktif & tampilkan jumlah produk untuk hewan terpilih
    const loaded = this.deps.catalog.isLoaded;
    this.chips.forEach((chip) => {
      const category = chip.dataset.category as CategoryFilter;
      const on = category === this.filter.category;
      chip.setAttribute('aria-pressed', String(on));
      const counter = chip.querySelector('.chip-count');
      if (!loaded || !counter) return;
      const total = this.count(this.filter.withCategory(category));
      counter.textContent = String(total);
      chip.disabled = total === 0 && !on;
    });

    const active = this.tabs.find((tab) => tab.dataset.pet === this.filter.pet);
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
    else if (target.closest('[data-go-all]')) this.setFilter(ProductFilter.ALL);
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
    } else if (this.filter.pet === 'favorit') {
      window.setTimeout(() => this.render(false), 300);
    }
  }

  private addToCart(productId: string, button: HTMLButtonElement): void {
    const product = this.deps.catalog.find(productId);
    if (!product) return;

    if (!this.deps.cart.add(productId)) {
      this.deps.notifier.notify(`${product.name} sedang habis. Coba lagi nanti, ya.`, { type: 'error' });
      return;
    }

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
    const allButton = '<button class="btn btn-ghost btn-sm" type="button" data-go-all>Lihat semua produk</button>';
    if (this.filter.pet === 'favorit') {
      return ProductGrid.stateHTML('Belum ada favorit', 'Ketuk ikon hati di produk mana pun untuk menyimpannya di sini.', 'i-heart', allButton);
    }
    return ProductGrid.stateHTML('Belum ada produk di sini', 'Kombinasi hewan dan kategori ini sedang kosong. Coba kategori lain, ya.', 'i-paw', allButton);
  }

  private static stateHTML(title: string, text: string, icon: string, action: string): string {
    return `
      <div class="grid-state" role="${icon === 'i-alert' ? 'alert' : 'status'}">
        <span class="grid-state-icon"><svg class="icon ${icon === 'i-paw' ? 'icon--fill' : ''}"><use href="#${icon}"/></svg></span>
        <h3>${title}</h3>
        <p>${text}</p>
        ${action}
      </div>`;
  }
}
