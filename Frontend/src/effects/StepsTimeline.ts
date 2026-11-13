import { Motion } from '../core/Motion';
import { clamp } from '../core/utils';
import { ScrollEffect, type ScrollState } from './ScrollEffect';

/** Timeline "Cara belanja": garis terisi & langkah menyala sesuai posisi baca. */
export class StepsTimeline extends ScrollEffect {
  private readonly fill: HTMLElement;
  private readonly line: HTMLElement;
  private readonly steps: HTMLElement[];

  constructor(private readonly list: HTMLElement) {
    super();
    const fill = list.querySelector<HTMLElement>('[data-steps-fill]');
    if (!fill?.parentElement) throw new Error('Timeline membutuhkan [data-steps-fill].');
    this.fill = fill;
    this.line = fill.parentElement;
    this.steps = Array.from(list.querySelectorAll<HTMLElement>('.step'));
  }

  /** Bukan sekadar hiasan: saat gerakan dikurangi, timeline langsung penuh. */
  override get isDecorative(): boolean {
    return false;
  }

  update({ viewportHeight: vh }: ScrollState): void {
    const reduced = Motion.reduced;
    // titik "baca" berada di 60% tinggi layar
    const reader = vh * 0.6 - this.list.getBoundingClientRect().top;
    const p = reduced ? 1 : clamp((reader - this.line.offsetTop) / this.line.offsetHeight, 0, 1);
    this.fill.style.transform = `scaleY(${p.toFixed(4)})`;

    for (const step of this.steps) {
      const center = step.offsetTop + 36; // padding 12px + setengah bulatan 24px
      step.classList.toggle('is-done', reduced || reader >= center);
    }
  }
}
