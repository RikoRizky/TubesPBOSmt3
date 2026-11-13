import { Motion } from '../core/Motion';
import { clamp } from '../core/utils';
import { ScrollEffect, type ScrollState } from './ScrollEffect';

/** Jejak kaki kucing yang muncul satu per satu mengikuti progres gulir. */
export class PawTrail extends ScrollEffect {
  private paws: SVGSVGElement[] = [];
  private visibleCount = 0;

  constructor(private readonly trail: HTMLElement) {
    super();
  }

  /** Jejak tetap tampil (tanpa animasi) saat gerakan dikurangi. */
  override get isDecorative(): boolean {
    return false;
  }

  override measure(): void {
    const width = this.trail.offsetWidth;
    const height = this.trail.offsetHeight;
    const parent = this.trail.parentElement;
    const pad = (parent && parseFloat(getComputedStyle(parent).paddingBottom)) || 64;
    const count = clamp(Math.round(width / 84), 6, 18);
    const baseY = height - pad / 2 - 13;

    this.trail.innerHTML = '';
    this.paws = [];
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      const side = i % 2 ? 1 : -1;
      const x = width * 0.04 + t * width * 0.9;
      const y = baseY - Math.sin(t * Math.PI) * pad * 0.18 + side * 9;

      const paw = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      paw.classList.add('paw');
      paw.innerHTML = '<use href="#i-paw"/>';
      paw.style.left = `${x.toFixed(1)}px`;
      paw.style.top = `${y.toFixed(1)}px`;
      paw.style.transform = `rotate(${90 + side * 8}deg)`;
      this.trail.append(paw);
      this.paws.push(paw);
    }
    this.visibleCount = 0;
  }

  update({ viewportHeight: vh }: ScrollState): void {
    if (!this.paws.length) return;
    if (Motion.reduced) {
      this.show(this.paws.length);
      return;
    }
    const rect = this.trail.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > vh) return;
    const p = clamp((vh * 0.95 - rect.top) / rect.height, 0, 1);
    this.show(Math.round(p * this.paws.length));
  }

  private show(count: number): void {
    if (count === this.visibleCount) return;
    this.paws.forEach((paw, i) => paw.classList.toggle('is-on', i < count));
    this.visibleCount = count;
  }
}
