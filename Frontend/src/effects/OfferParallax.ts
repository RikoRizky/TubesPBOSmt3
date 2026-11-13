import { ScrollEffect, type ScrollState } from './ScrollEffect';

/** Foto di kartu promo bergeser pelan di dalam bingkainya. */
export class OfferParallax extends ScrollEffect {
  constructor(private readonly images: HTMLElement[]) {
    super();
  }

  update({ viewportHeight: vh }: ScrollState): void {
    for (const image of this.images) {
      const frame = image.parentElement;
      if (!frame) continue;
      const rect = frame.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > vh) continue;
      const p = (rect.top + rect.height / 2 - vh / 2) / (vh / 2 + rect.height / 2);
      image.style.setProperty('--py', `${(p * rect.height * 0.06).toFixed(1)}px`);
    }
  }
}
