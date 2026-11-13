import { ScrollEffect, type ScrollState } from './ScrollEffect';

/** Tombol kembali ke atas dengan cincin progres. */
export class BackToTop extends ScrollEffect {
  constructor(
    private readonly button: HTMLElement,
    private readonly ring: SVGElement,
  ) {
    super();
  }

  override get isDecorative(): boolean {
    return false;
  }

  update({ y, progress, viewportHeight }: ScrollState): void {
    this.ring.style.setProperty('--p', (1 - progress).toFixed(4));
    this.button.classList.toggle('is-visible', y > viewportHeight * 0.8);
  }
}
