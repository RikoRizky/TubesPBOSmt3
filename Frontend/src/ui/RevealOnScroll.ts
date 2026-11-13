import { $$ } from '../core/dom';
import { Motion } from '../core/Motion';

/**
 * Memunculkan elemen [data-reveal] saat masuk layar.
 * Anak dari [data-stagger] muncul berjenjang 40ms per item (maks. 300ms).
 */
export class RevealOnScroll {
  private static readonly STAGGER_MS = 40;
  private static readonly MAX_DELAY_MS = 300;

  start(): void {
    $$('[data-stagger]').forEach((group) => {
      $$('[data-reveal]', group).forEach((element, i) => {
        const delay = Math.min(i * RevealOnScroll.STAGGER_MS, RevealOnScroll.MAX_DELAY_MS);
        element.style.setProperty('--d', `${delay}ms`);
      });
    });

    const items = $$('[data-reveal]');
    if (Motion.reduced || !('IntersectionObserver' in window)) {
      items.forEach((element) => element.classList.add('is-in'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const element = entry.target as HTMLElement;
        observer.unobserve(element);
        element.classList.add('is-in');

        // setelah selesai, lepas atribut agar transisi hover milik elemen tidak tertimpa
        const delay = parseFloat(element.style.getPropertyValue('--d')) || 0;
        window.setTimeout(() => {
          element.removeAttribute('data-reveal');
          element.style.removeProperty('--d');
        }, 1200 + delay);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

    items.forEach((element) => observer.observe(element));
  }
}
