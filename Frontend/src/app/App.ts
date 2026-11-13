import type { INewsletterService } from '../contracts/INewsletterService';
import type { IOrderService } from '../contracts/IOrderService';
import type { IProductRepository } from '../contracts/IProductRepository';
import type { IStorage } from '../contracts/IStorage';
import { $, required } from '../core/dom';
import { BackToTop } from '../effects/BackToTop';
import { ProgressBar } from '../effects/ProgressBar';
import { ScrollEngine } from '../effects/ScrollEngine';
import { SmartHeader } from '../effects/SmartHeader';
import type { Page } from '../pages/Page';
import { Cart } from '../services/Cart';
import { ProductCatalog } from '../services/ProductCatalog';
import { ProductNavigator, RedirectNavigator } from '../services/ProductNavigator';
import { Wishlist } from '../services/Wishlist';
import { CountUp } from '../ui/CountUp';
import { FlyToCart } from '../ui/FlyToCart';
import { NewsletterForm } from '../ui/forms/NewsletterForm';
import { HeaderActions } from '../ui/HeaderActions';
import { CartDrawer } from '../ui/layers/CartDrawer';
import { LayerManager } from '../ui/layers/LayerManager';
import { MobileNav } from '../ui/layers/MobileNav';
import { SearchPanel } from '../ui/layers/SearchPanel';
import { PrimaryNav } from '../ui/PrimaryNav';
import { ProductArt } from '../ui/ProductArt';
import { RevealOnScroll } from '../ui/RevealOnScroll';
import { ToastNotifier } from '../ui/ToastNotifier';

/** Service yang "disuntikkan" ke App. Bisa versi Mock atau versi API. */
export interface AppServices {
  products: IProductRepository;
  orders: IOrderService;
  newsletter: INewsletterService;
  storage: IStorage;
}

/**
 * Merakit semua objek yang dipakai bersama oleh setiap halaman
 * (header, keranjang, pencarian, newsletter, animasi gulir).
 *
 * DEPENDENCY INJECTION: App tidak membuat service sendiri, tetapi
 * menerimanya lewat constructor. Jadi pindah dari data contoh ke
 * backend C# cukup dengan mengganti service yang dikirim di main.ts.
 */
export class App {
  readonly catalog: ProductCatalog;
  readonly cart: Cart;
  readonly wishlist: Wishlist;
  readonly orders: IOrderService;
  readonly notifier: ToastNotifier;
  readonly layers: LayerManager;
  readonly engine = new ScrollEngine();
  readonly navigator = new ProductNavigator(new RedirectNavigator());
  readonly header: SmartHeader;
  readonly headerActions: HeaderActions;
  readonly cartDrawer: CartDrawer;
  readonly fly: FlyToCart;

  private readonly newsletterService: INewsletterService;

  constructor(services: AppServices) {
    this.catalog = new ProductCatalog(services.products);
    this.cart = new Cart(services.storage, this.catalog);
    this.wishlist = new Wishlist(services.storage);
    this.orders = services.orders;
    this.newsletterService = services.newsletter;

    this.notifier = new ToastNotifier(required('[data-toasts]'));
    this.layers = new LayerManager(required('[data-overlay]'));
    this.header = new SmartHeader(required('[data-header]'), this.layers);
    this.headerActions = new HeaderActions(required('.header-actions'), this.cart, this.wishlist, this.navigator);
    this.cartDrawer = new CartDrawer(required('[data-cart]'), this.layers, {
      cart: this.cart,
      catalog: this.catalog,
      notifier: this.notifier,
      trigger: this.headerActions.cartButton,
    });
    this.fly = new FlyToCart(this.headerActions.cartButton, this.header, () => this.headerActions.bumpCart());
  }

  /** Jalankan komponen bersama, lalu komponen khusus halaman. */
  start(page: Page): void {
    ProductArt.hydrate();
    const year = $('[data-year]');
    if (year) year.textContent = String(new Date().getFullYear());

    this.mountSharedComponents();
    this.engine.add(
      new ProgressBar(required('[data-progress-bar]')),
      new BackToTop(required('[data-back-top]'), required<SVGElement>('[data-back-top-ring]')),
      this.header,
    );

    page.init();

    new RevealOnScroll().start();
    new CountUp().start();
    this.engine.start();

    // bila keranjang berisi, siapkan data produk lebih awal
    if (this.cart.totalQuantity > 0) this.catalog.load().catch(() => undefined);
  }

  private mountSharedComponents(): void {
    this.layers.mount();
    this.headerActions.mount();
    this.cartDrawer.mount();

    new MobileNav(
      required('[data-navbar]'),
      this.layers,
      required('[data-header]'),
      required<HTMLButtonElement>('[data-nav-open]'),
    ).mount();

    new SearchPanel(
      required('[data-search]'),
      this.layers,
      this.catalog,
      this.navigator,
      $('[data-search-open]'),
    ).mount();

    const primaryNav = new PrimaryNav(required('[data-nav-list]'));
    primaryNav.mount();
    this.engine.watch(primaryNav);

    const newsletter = $<HTMLFormElement>('[data-newsletter]');
    if (newsletter) new NewsletterForm(newsletter, this.newsletterService).mount();
  }
}
