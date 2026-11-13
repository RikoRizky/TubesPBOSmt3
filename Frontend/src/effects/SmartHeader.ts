import type { LayerManager } from '../ui/layers/LayerManager';
import { ScrollEffect, type ScrollState } from './ScrollEffect';

/**
 * Header pintar: transparan di atas, jadi "kaca buram" setelah digulir,
 * sembunyi saat gulir ke bawah dan muncul lagi saat gulir ke atas.
 */
export class SmartHeader extends ScrollEffect {
  private static readonly THRESHOLD = 48;

  private directionTotal = 0;
  private holdUntil = 0;

  constructor(
    private readonly header: HTMLElement,
    private readonly layers: LayerManager,
  ) {
    super();
    header.addEventListener('focusin', () => this.show());
    // saat panel apa pun dibuka, header harus terlihat
    layers.subscribe((layer) => {
      if (layer) this.show();
    });
  }

  override get isDecorative(): boolean {
    return false;
  }

  get element(): HTMLElement {
    return this.header;
  }

  update({ y, dy, viewportHeight }: ScrollState): void {
    this.header.classList.toggle('is-scrolled', y > 24);

    // jumlahkan gerakan searah; reset bila arah berubah
    this.directionTotal = Math.sign(dy) === Math.sign(this.directionTotal) ? this.directionTotal + dy : dy;
    if (this.layers.current || performance.now() < this.holdUntil) return;

    if (y < viewportHeight * 0.5 || this.directionTotal < -SmartHeader.THRESHOLD) this.show();
    else if (this.directionTotal > SmartHeader.THRESHOLD) this.hide();
  }

  /** Tampilkan header dan tahan agar tidak langsung tersembunyi lagi. */
  reveal(holdMs = 0): void {
    this.show();
    this.holdUntil = performance.now() + holdMs;
  }

  private show(): void {
    this.header.classList.remove('is-hidden');
  }

  private hide(): void {
    this.header.classList.add('is-hidden');
  }
}
