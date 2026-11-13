import { $$ } from '../core/dom';
import { clamp } from '../core/utils';
import { ScrollEffect, type ScrollState } from './ScrollEffect';

/** Dua baris polaroid testimoni bergerak berlawanan arah mengikuti gulir. */
export class GalleryScroll extends ScrollEffect {
  private readonly rows: HTMLElement[];
  private shifts: number[] = [];

  constructor(private readonly section: HTMLElement) {
    super();
    this.rows = $$('[data-gallery-row]', section);
    this.buildSecondRow();
  }

  override measure(): void {
    this.shifts = this.rows.map((row) => Math.max(0, row.offsetWidth - window.innerWidth));
  }

  update({ viewportHeight: vh }: ScrollState): void {
    const rect = this.section.getBoundingClientRect();
    if (rect.bottom < -100 || rect.top > vh + 100) return;
    const p = clamp((vh - rect.top) / (vh + rect.height), 0, 1);
    const [first, second] = this.rows;
    if (first) first.style.transform = `translate3d(${(-p * (this.shifts[0] ?? 0)).toFixed(1)}px, 0, 0)`;
    if (second) second.style.transform = `translate3d(${(-(1 - p) * (this.shifts[1] ?? 0)).toFixed(1)}px, 0, 0)`;
  }

  /** Baris kedua = salinan dekoratif baris pertama dengan urutan berbeda. */
  private buildSecondRow(): void {
    const [first, second] = this.rows;
    if (!first || !second || second.children.length) return;
    const items = Array.from(first.children) as HTMLElement[];
    const half = Math.ceil(items.length / 2);
    [...items.slice(half), ...items.slice(0, half)].forEach((item, i) => {
      const copy = item.cloneNode(true) as HTMLElement;
      copy.style.setProperty('--r', `${i % 2 ? 1.5 : -1.5}deg`);
      copy.querySelector('img')?.setAttribute('alt', '');
      second.append(copy);
    });
  }
}
