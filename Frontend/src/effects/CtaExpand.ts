import { clamp } from '../core/utils';
import { ScrollEffect, type ScrollState } from './ScrollEffect';

/** Kartu Garansi Lahap "mengembang" saat masuk layar, stikernya berputar. */
export class CtaExpand extends ScrollEffect {
  constructor(
    private readonly section: HTMLElement,
    private readonly card: HTMLElement,
    private readonly sticker: SVGElement | null,
  ) {
    super();
  }

  update({ y, viewportHeight: vh }: ScrollState): void {
    const rect = this.section.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > vh) return;

    const p = clamp((vh - rect.top) / (vh * 0.7), 0, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    this.card.style.setProperty('--cta-scale', (0.9 + 0.1 * eased).toFixed(4));
    this.card.style.setProperty('--cta-radius', `${(64 - 32 * eased).toFixed(1)}px`);
    if (this.sticker) this.sticker.style.transform = `rotate(${((y * 0.12) % 360).toFixed(2)}deg)`;
  }
}
