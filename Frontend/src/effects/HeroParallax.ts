import { $$ } from '../core/dom';
import { Motion } from '../core/Motion';
import { lerp } from '../core/utils';
import { ScrollEffect, type ScrollState } from './ScrollEffect';

interface ParallaxLayer {
  element: HTMLElement;
  speed: number;
}

/** Lapisan hero bergerak dengan kecepatan berbeda saat digulir & ikut kursor sedikit. */
export class HeroParallax extends ScrollEffect {
  private readonly layers: ParallaxLayer[];
  private readonly pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
  private frame = 0;

  constructor(private readonly hero: HTMLElement) {
    super();
    this.layers = $$('[data-parallax]', hero).map((element) => ({
      element,
      speed: parseFloat(element.dataset.parallax ?? '0') || 0,
    }));
    if (Motion.finePointer) this.listenToPointer();
  }

  update({ y }: ScrollState): void {
    this.apply(y);
  }

  private apply(y: number): void {
    if (y > window.innerHeight * 1.3) return;
    // layar kecil: visual lebih kecil, jadi parallax diperhalus agar kartu tidak bertumpuk
    const strength = Motion.isDesktop ? 1 : 0.35;
    for (const { element, speed } of this.layers) {
      const depth = speed * 140;
      const tx = this.pointer.x * depth;
      const ty = -y * speed * strength + this.pointer.y * depth;
      element.style.transform = `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0)`;
    }
  }

  private listenToPointer(): void {
    this.hero.addEventListener('pointermove', (event) => {
      if (Motion.reduced) return;
      const rect = this.hero.getBoundingClientRect();
      this.pointer.targetX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      this.pointer.targetY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
      this.startLoop();
    });
    this.hero.addEventListener('pointerleave', () => {
      this.pointer.targetX = 0;
      this.pointer.targetY = 0;
      this.startLoop();
    });
  }

  private startLoop(): void {
    if (!this.frame) this.frame = requestAnimationFrame(this.loop);
  }

  /** Arrow function supaya `this` tetap menunjuk ke objek ini. */
  private readonly loop = (): void => {
    const p = this.pointer;
    p.x = lerp(p.x, p.targetX, 0.08);
    p.y = lerp(p.y, p.targetY, 0.08);
    this.apply(window.scrollY);
    const settled = Math.abs(p.x - p.targetX) < 0.001 && Math.abs(p.y - p.targetY) < 0.001;
    this.frame = settled ? 0 : requestAnimationFrame(this.loop);
  };
}
