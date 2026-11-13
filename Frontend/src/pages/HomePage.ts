import { $, $$ } from '../core/dom';
import { CtaExpand } from '../effects/CtaExpand';
import { GalleryScroll } from '../effects/GalleryScroll';
import { HeroParallax } from '../effects/HeroParallax';
import { Marquee } from '../effects/Marquee';
import { OfferParallax } from '../effects/OfferParallax';
import { PawTrail } from '../effects/PawTrail';
import { ProductGrid } from '../ui/ProductGrid';
import { Page } from './Page';

/** Halaman toko (index.html). */
export class HomePage extends Page {
  init(): void {
    this.initShop();
    this.initEffects();
  }

  private initShop(): void {
    const gridElement = $('[data-product-grid]');
    if (!gridElement) return;

    const { app } = this;
    const grid = new ProductGrid(gridElement, {
      catalog: app.catalog,
      cart: app.cart,
      wishlist: app.wishlist,
      notifier: app.notifier,
      fly: app.fly,
      openCart: () => app.cartDrawer.openDrawer(),
    });
    grid.mount();
    grid.applyUrlParams(new URLSearchParams(location.search));

    // pencarian & ikon favorit sekarang menggulir ke grid, bukan pindah halaman
    app.navigator.use(grid);
    app.engine.watch(grid);
  }

  private initEffects(): void {
    const { engine } = this.app;

    const hero = $('.hero');
    if (hero) engine.add(new HeroParallax(hero));

    const marquee = $('[data-marquee]');
    const track = $('[data-marquee-track]');
    if (marquee && track) engine.add(new Marquee(marquee, track));

    const offers = $$('[data-parallax-img]');
    if (offers.length) engine.add(new OfferParallax(offers));

    const gallery = $('[data-gallery]');
    if (gallery) engine.add(new GalleryScroll(gallery));

    const cta = $('[data-cta]');
    const card = $('[data-cta-card]');
    if (cta && card) engine.add(new CtaExpand(cta, card, $<SVGElement>('[data-sticker] > svg')));

    const trail = $('[data-paw-trail]');
    if (trail) engine.add(new PawTrail(trail));
  }
}
