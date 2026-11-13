import type { IMeasurable } from '../contracts/IMeasurable';
import { Motion } from '../core/Motion';
import { clamp } from '../core/utils';
import type { ScrollEffect, ScrollState } from './ScrollEffect';

/**
 * Mesin animasi gulir: satu listener scroll + requestAnimationFrame,
 * lalu meneruskan ScrollState ke setiap ScrollEffect (polymorphism).
 */
export class ScrollEngine {
  private readonly effects: ScrollEffect[] = [];
  private readonly measurables: IMeasurable[] = [];
  private lastY = 0;
  private ticking = false;
  private started = false;
  private resizeTimer = 0;

  /** Tambah efek gulir (otomatis juga diukur ulang saat resize). */
  add(...effects: ScrollEffect[]): this {
    this.effects.push(...effects);
    return this.watch(...effects);
  }

  /** Daftarkan objek yang hanya perlu diukur ulang saat resize. */
  watch(...items: IMeasurable[]): this {
    this.measurables.push(...items);
    if (this.started) {
      items.forEach((item) => item.measure());
      this.requestUpdate();
    }
    return this;
  }

  start(): void {
    if (this.started) return;
    this.started = true;
    this.lastY = window.scrollY;
    this.measureAll();

    window.addEventListener('scroll', () => this.requestUpdate(), { passive: true });
    window.addEventListener('resize', () => {
      window.clearTimeout(this.resizeTimer);
      this.resizeTimer = window.setTimeout(() => this.relayout(), 150);
    });
    window.addEventListener('load', () => this.relayout());
    // lebar teks berubah setelah font selesai dimuat
    document.fonts?.ready.then(() => this.relayout());

    this.update();
  }

  relayout(): void {
    this.measureAll();
    this.requestUpdate();
  }

  requestUpdate(): void {
    if (this.ticking) return;
    this.ticking = true;
    requestAnimationFrame(() => this.update());
  }

  private measureAll(): void {
    this.measurables.forEach((item) => item.measure());
  }

  private update(): void {
    this.ticking = false;
    const y = window.scrollY;
    const viewportHeight = window.innerHeight;
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - viewportHeight);

    const state: ScrollState = {
      y,
      dy: y - this.lastY,
      viewportHeight,
      progress: clamp(y / maxScroll, 0, 1),
    };

    const reduced = Motion.reduced;
    for (const effect of this.effects) {
      if (reduced && effect.isDecorative) continue;
      effect.update(state);
    }
    this.lastY = y;
  }
}
