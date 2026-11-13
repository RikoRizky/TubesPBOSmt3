import { $$ } from '../core/dom';
import { Formatter } from '../core/Formatter';
import { Motion } from '../core/Motion';
import { clamp } from '../core/utils';

/** Angka berjalan dari 0 ke nilai [data-count] saat terlihat. */
export class CountUp {
  private static readonly DURATION_MS = 1600;

  start(): void {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        window.setTimeout(() => this.animate(entry.target as HTMLElement), 500);
      });
    }, { threshold: 0.6 });

    $$('[data-count]').forEach((element) => observer.observe(element));
  }

  private animate(element: HTMLElement): void {
    const target = parseFloat(element.dataset.count ?? '0');
    const digits = parseInt(element.dataset.decimals ?? '0', 10);

    if (Motion.reduced) {
      element.textContent = Formatter.decimal(target, digits);
      return;
    }

    const start = performance.now();
    const tick = (now: number): void => {
      const t = clamp((now - start) / CountUp.DURATION_MS, 0, 1);
      const eased = 1 - Math.pow(1 - t, 4);
      element.textContent = Formatter.decimal(target * eased, digits);
      if (t < 1) requestAnimationFrame(tick);
    };
    element.textContent = Formatter.decimal(0, digits);
    requestAnimationFrame(tick);
  }
}
