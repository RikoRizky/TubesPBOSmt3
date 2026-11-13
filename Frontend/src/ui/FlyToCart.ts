import { Motion } from '../core/Motion';
import type { SmartHeader } from '../effects/SmartHeader';
import type { Product } from '../models/Product';
import { ProductArt } from './ProductArt';

/** Animasi gambar produk "terbang" dari tombol ke ikon keranjang. */
export class FlyToCart {
  private static readonly SIZE = 44;

  constructor(
    private readonly target: HTMLElement,
    private readonly header: SmartHeader,
    private readonly onArrive: () => void,
  ) {}

  launch(from: HTMLElement, product: Product): void {
    if (Motion.reduced) {
      this.onArrive();
      return;
    }

    // pastikan header terlihat, lalu hitung posisi tujuan tanpa geseran header
    this.header.reveal(1400);
    const half = FlyToCart.SIZE / 2;
    const a = from.getBoundingClientRect();
    const b = this.target.getBoundingClientRect();
    const headerOffset = this.header.element.getBoundingClientRect().top;

    const x0 = a.left + a.width / 2 - half;
    const y0 = a.top + a.height / 2 - half;
    const x1 = b.left + b.width / 2 - half;
    const y1 = b.top - headerOffset + b.height / 2 - half;
    const xm = (x0 + x1) / 2;
    const ym = Math.min(y0, y1) - 120;

    const dot = document.createElement('div');
    dot.className = 'fly-dot';
    dot.style.left = '0px';
    dot.style.top = '0px';
    dot.innerHTML = ProductArt.render(product.art);
    document.body.append(dot);

    const animation = dot.animate(
      [
        { transform: `translate(${x0}px, ${y0}px) scale(.6)`, opacity: 0 },
        { transform: `translate(${x0}px, ${y0 - 24}px) scale(1)`, opacity: 1, offset: 0.15 },
        { transform: `translate(${xm}px, ${ym}px) scale(.85)`, offset: 0.55 },
        { transform: `translate(${x1}px, ${y1}px) scale(.3)`, opacity: 0.5 },
      ],
      { duration: 820, easing: 'cubic-bezier(.45, 0, .25, 1)' },
    );

    animation.onfinish = () => {
      dot.remove();
      this.onArrive();
    };
  }
}
